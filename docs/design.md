# TaskFlow 設計書

## 1. アーキテクチャ概要

```
┌─────────────────────────────────────────────┐
│             ブラウザ (SPA)                    │
│                                             │
│  ┌─────────────────────────────────────┐    │
│  │      React 19 + React Router v7     │    │
│  │                                     │    │
│  │  /login        → <Auth>             │    │
│  │  /admin/login  → <AdminAuth>        │    │
│  │  /*            → <MainApp>          │    │
│  │       App.tsx → components/         │    │
│  └─────────────────────────────────────┘    │
│                    │                        │
│  ┌─────────────────────────────────────┐    │
│  │         storageService              │    │
│  │    services/storage.ts 経由         │    │
│  └─────────────────────────────────────┘    │
│             │              │                │
│  ┌──────────────┐  ┌────────────────────┐   │
│  │ localStorage │  │  Supabase Client   │   │
│  │  (session)   │  │  @supabase/supabase│   │
│  └──────────────┘  └────────────────────┘   │
└───────────────────────────┬─────────────────┘
                            │ HTTPS
              ┌─────────────▼─────────────┐
              │        Supabase            │
              │  ┌─────────────────────┐  │
              │  │   Auth (JWT)        │  │
              │  │  ユーザー認証・セッション│  │
              │  └─────────────────────┘  │
              │  ┌─────────────────────┐  │
              │  │  PostgreSQL DB      │  │
              │  │  profiles / tasks / │  │
              │  │  categories         │  │
              │  └─────────────────────┘  │
              │  ┌─────────────────────┐  │
              │  │  Row Level Security │  │
              │  │  (RLS ポリシー)      │  │
              │  └─────────────────────┘  │
              └───────────────────────────┘
```

- **データ永続化**: Supabase PostgreSQL でユーザー・タスク・カテゴリを管理する。
- **認証**: Supabase Auth（JWT）を使用。セッション情報は Supabase Auth SDK が自動管理。
- **権限制御**: Row Level Security (RLS) により、member は自分のタスクのみ操作可能。
- **ルーティング**: React Router v7 で URL ベースのルーティングを実装。ログイン画面は URL で分離。
- ビルドツール: Vite 6 + TypeScript 5.8

---

## 2. 技術スタック

| レイヤー | 技術 | バージョン |
|---------|------|-----------|
| UI フレームワーク | React | 19.2.4 |
| 言語 | TypeScript | ~5.8.2 |
| ルーティング | React Router DOM | 7.x |
| ビルド | Vite | 6.x |
| スタイリング | Tailwind CSS | 3.x（PostCSS 経由） |
| アニメーション | tailwindcss-animate | 1.x（CSS クラスベース） |
| チャート | recharts | 3.x |
| アイコン | 自作 Icons.tsx（SVG） | - |
| データベース | Supabase (PostgreSQL) | 最新版 |
| 認証 | Supabase Auth (JWT) | 最新版 |
| DB クライアント | @supabase/supabase-js | 2.x |

> **注意**: CDN（cdn.tailwindcss.com / esm.sh）には依存しない。全ライブラリを npm パッケージとして管理する。

---

## 3. データモデル

### 3.1 型定義（types.ts）

```typescript
type Priority = 'high' | 'medium' | 'low'
type Status   = 'todo' | 'inprogress' | 'done'
type Role     = 'admin' | 'member'
```

### 3.2 Category

```typescript
interface Category {
  id: string    // 一意ID（例: 'work', 'cat_1234567890'）
  label: string // 表示名（例: '仕事'）
  color: string // カレンダー表示用 Hex カラー（例: '#3b82f6'）
}
```

### 3.3 User

```typescript
interface User {
  id: string        // UUID
  username: string  // ユーザー名
  email?: string    // メールアドレス（Supabase Auth が管理）
  role: Role        // 'admin' | 'member'
  name: string      // 表示名
  preferences?: {
    darkMode: boolean      // ダークモード
    notifications: boolean // 通知設定
    language: string       // 言語（'ja' | 'en'）
  }
}
```

### 3.4 Task

```typescript
interface Task {
  id: string         // UUID
  userId: string     // 担当ユーザーの User.id
  title: string      // タスクタイトル（必須）
  description: string // 説明（任意）
  priority: Priority  // 優先度
  intensity: number   // 作業強度 1〜5（炎アイコン）
  category: string    // Category.id への参照
  status: Status      // 進捗ステータス
  date: string        // 開始日 'YYYY-MM-DD' 形式
  endDate: string     // 終了日 'YYYY-MM-DD' 形式（期間タスク対応）
  isAllDay: boolean   // 終日フラグ
  startTime: string   // 'HH:MM' 形式
  endTime: string     // 'HH:MM' 形式
  createdAt: number   // UNIX timestamp (ms)
  updatedAt: number   // UNIX timestamp (ms)
}
```

### 3.5 AppState

```typescript
interface AppState {
  currentUser: User | null
  tasks: Task[]
  users: User[]
  categories: Category[]
}
```

### 3.6 localStorage キー（セッションのみ残存）

| キー | 型 | 内容 |
|------|----|------|
| `taskflow_session` | `User` | ログイン中ユーザー（Supabase Auth セッションのキャッシュ） |

> ユーザー・タスク・カテゴリのデータは Supabase に移行済み。
> セッション情報は Supabase Auth SDK が自動管理する（`sb-<project>-auth-token`）。
> テーマ設定は `profiles.preferences.darkMode` として Supabase に保存する。

---

## 4. ストレージ層（services/storage.ts）

`storageService` オブジェクトが Supabase クライアントへのアクセスを抽象化する。

| メソッド | 説明 |
|---------|------|
| `getTasks(userId?)` | タスク一覧を取得（admin は全件、member は自分のみ） |
| `createTask(task)` | タスクを作成 |
| `updateTask(id, task)` | タスクを更新 |
| `deleteTask(id)` | タスクを削除 |
| `getUsers()` | ユーザー一覧（profiles）を取得（admin のみ） |
| `getSession()` | Supabase Auth の現在セッションを取得 |
| `signIn(email, password)` | メール＋パスワードでサインイン |
| `signOut()` | サインアウト |
| `getCategories()` | カテゴリ一覧を取得 |
| `createCategory(category)` | カテゴリを作成 |
| `updateCategory(id, category)` | カテゴリを更新 |
| `deleteCategory(id)` | カテゴリを削除 |
| `updateProfile(id, profile)` | プロフィール（表示名・preferences 等）を更新 |

---

## 5. ファイル構成

```
TaskFlow/
├── index.html          # エントリポイント HTML（CDN なし）
├── index.tsx           # React エントリポイント（BrowserRouter でラップ）
├── index.css           # Tailwind @tailwind ディレクティブ + スクロールバースタイル
├── App.tsx             # ルーティング定義・状態管理・メインアプリコンポーネント
├── types.ts            # 型定義
├── constants.ts        # 定数（INITIAL_CATEGORIES, PRIORITY_CONFIG など）
├── tailwind.config.js  # Tailwind v3 設定（darkMode: 'class', content, plugins）
├── postcss.config.js   # PostCSS 設定（tailwindcss + autoprefixer）
├── vite.config.ts      # Vite 設定（recharts チャンク分離）
├── tsconfig.json       # TypeScript 設定
├── package.json        # 依存関係
│
├── components/
│   ├── Auth.tsx          # メンバー用ログイン画面（/login）：ログイン + 新規登録
│   ├── AdminAuth.tsx     # 管理者用ログイン画面（/admin/login）：ログインのみ・role 検証あり
│   ├── TaskBoard.tsx     # タスクボード（カレンダー + デイリービュー）
│   ├── Dashboard.tsx     # 管理者ダッシュボード（recharts グラフ）
│   ├── TaskModal.tsx     # タスク作成・編集モーダル
│   ├── SettingsModal.tsx # アカウント設定モーダル
│   ├── ConfirmModal.tsx  # 削除確認ダイアログ
│   └── Icons.tsx         # SVG アイコン群（自作）
│
└── services/
    └── storage.ts        # localStorage / Supabase アクセス抽象化
```

---

## 6. コンポーネント設計

### 6.1 ルーティング構成

```
<BrowserRouter>          ← index.tsx でラップ
  <App>
    <Routes>
      /login         → <Auth onSuccess onBack>          # メンバーログイン + 新規登録
      /admin/login   → <AdminAuth onSuccess onBack>     # 管理者ログイン・role 検証
      /*             → 未認証: <Navigate to="/login">
                       認証済: <MainApp>
    </Routes>
  </App>
</BrowserRouter>
```

### 6.2 コンポーネントツリー（認証済み）

```
<MainApp>
│
├── <aside>             # サイドバー（PC）
│   ├── TaskFlow ロゴ
│   ├── タスクボードボタン
│   ├── ダッシュボードボタン（admin のみ）
│   ├── ユーザー情報
│   └── 設定ボタン
│
├── <nav>               # ボトムナビゲーション（モバイル）
│
├── <main>
│   ├── （view === 'board'）
│   │   └── <TaskBoard>
│   │       ├── ビュー切り替えタブ（カレンダー/デイリー）
│   │       ├── 検索・フィルターバー
│   │       └── カレンダービュー or デイリービュー
│   │
│   └── （view === 'dashboard'、admin のみ）
│       └── <Dashboard>
│           ├── サマリーカード × 4
│           ├── <BarChart> メンバー別ワークロード
│           ├── <PieChart> 全体完了率
│           └── メンバー進捗カード
│
├── <TaskModal>         # タスク作成・編集（isTaskModalOpen）
├── <SettingsModal>     # 設定（isSettingsModalOpen）
├── <ConfirmModal>      # 削除確認（isConfirmModalOpen）
└── トースト通知スタック
```

### 6.3 主要コンポーネント仕様

| コンポーネント | 主な Props | 役割 |
|--------------|-----------|------|
| `Auth` | `onSuccess`, `onBack` | メンバー用認証フォーム（ログイン + 新規登録） |
| `AdminAuth` | `onSuccess`, `onBack` | 管理者用認証フォーム（ログインのみ・role 検証） |
| `TaskBoard` | `tasks`, `user`, `isAdminMode`, `onEditTask`, `onDeleteTask`, `onUpdateStatus`, `onDateChange`, `categories` | カレンダー／デイリービュー統合 |
| `Dashboard` | `users`, `tasks`, `onEditTask`, `onDeleteTask`, `isDarkMode` | グラフ分析 |
| `TaskModal` | `isOpen`, `onClose`, `onSave`, `initialTask`, `currentUserId`, `adminUsers`, `categories` | タスク CRUD フォーム |
| `SettingsModal` | `isOpen`, `onClose`, `user`, `onLogout`, `onUpdateUser`, `categories`, `onSaveCategories` | プロフィール・設定 |
| `ConfirmModal` | `isOpen`, `title`, `message`, `onConfirm`, `onCancel`, `isDarkMode` | 汎用確認ダイアログ |
| `Icons` | （個別エクスポート） | SVG アイコン群 |

---

## 7. 状態管理

### 7.1 グローバル状態（App.tsx 内 useState）

| state | 型 | 説明 |
|-------|----|------|
| `state` | `AppState` | currentUser / tasks / users / categories を統合 |
| `initializing` | `boolean` | Supabase セッション復元中フラグ（ローディング表示） |
| `toasts` | `{ id, message, type }[]` | 表示中トーストの配列 |

### 7.2 ローカル状態（MainApp 内 useState）

| state | 型 | 説明 |
|-------|----|------|
| `view` | `'board' \| 'dashboard'` | 現在表示中のビュー |
| `isTaskModalOpen` | `boolean` | タスクモーダルの開閉 |
| `isSettingsModalOpen` | `boolean` | 設定モーダルの開閉 |
| `isConfirmModalOpen` | `boolean` | 確認ダイアログの開閉 |
| `editingTask` | `Task \| null` | 編集中タスク（null = 新規作成） |
| `taskToDelete` | `string \| null` | 削除対象タスクID |

### 7.3 副作用（useEffect）

| トリガー | 処理 |
|----------|------|
| 初回マウント | Supabase Auth セッションを確認してユーザーを復元 |
| `state.currentUser?.preferences?.darkMode` 変化 | `<html>` クラスと body スタイルを更新 |

### 7.4 派生データ（MainApp）

| 計算値 | 説明 |
|--------|------|
| `userTasks` | admin は全タスク、member は自分のタスクのみ |
| `isAdmin` | `currentUser.role === 'admin'` |

---

## 8. 画面設計

### 8.1 メンバーログイン画面（/login）

```
┌──────────────────────────────┐
│   TaskFlow ロゴ・タイトル      │
│   サブタイトル                 │
│                              │
│  [ログイン] [新規登録]  ← タブ  │
│  ┌────────────────────────┐  │
│  │  メールアドレス 入力      │  │
│  └────────────────────────┘  │
│  ┌────────────────────────┐  │
│  │  パスワード 入力          │  │
│  └────────────────────────┘  │
│  [ログイン / アカウントを作成]  │
└──────────────────────────────┘
```

### 8.2 管理者ログイン画面（/admin/login）

```
← ログイン種別の選択に戻る（/login へ）

┌──────────────────────────────┐
│   シールドアイコン              │
│   管理者ログイン               │
│   TaskFlow 管理者専用          │
│                              │
│  ┌────────────────────────┐  │
│  │  メールアドレス 入力      │  │
│  └────────────────────────┘  │
│  ┌────────────────────────┐  │
│  │  パスワード 入力          │  │
│  └────────────────────────┘  │
│  [ログイン]                   │
│  管理者アカウントは...（注記）   │
└──────────────────────────────┘
```

### 8.3 タスクボード（PC）

```
┌──────────┬──────────────────────────────────────────┐
│          │  タスク管理                                 │
│ サイドバー  │  今日の予定と進捗をチェックしましょう           │
│          ├──────────────────────────────────────────┤
│  [ボード]  │  [カレンダー] [デイリー]   検索 ステータス 優先度 │
│  [分析]   ├──────────────────────────────────────────┤
│          │  カレンダービュー or デイリービュー             │
│  ユーザー  │                                          │
│  [設定]   │                                          │
└──────────┴──────────────────────────────────────────┘
```

### 8.4 管理者ダッシュボード

```
┌──────────┬──────────────────────────────────────────┐
│ サイドバー  │  総タスク数 | 完了率 | メンバー数 | 今週新規   │
│          ├──────────────────────────────────────────┤
│          │  BarChart（ワークロード）  PieChart（完了率） │
│          ├──────────────────────────────────────────┤
│          │  メンバー進捗カード × N（2カラム）            │
└──────────┴──────────────────────────────────────────┘
```

---

## 9. 認証フロー

### 9.1 メンバーログイン（/login）

```
1. メールアドレス + パスワードで Supabase Auth にサインイン
2. profiles テーブルから role・username・name・preferences を取得
3. currentUser をセットして / にリダイレクト
```

### 9.2 管理者ログイン（/admin/login）

```
1. メールアドレス + パスワードで Supabase Auth にサインイン
2. profiles テーブルから role を取得
3. role !== 'admin' の場合 → supabase.auth.signOut() してエラー表示
4. role === 'admin' の場合 → currentUser をセットして / にリダイレクト
```

### 9.3 セッション復元（初回アクセス時）

```
1. App マウント時に supabase.auth.getUser() でセッション確認
2. セッションあり → profiles 取得 → currentUser 復元
3. セッションなし → /login にリダイレクト
```

---

## 10. テーマ設計

### 10.1 ダークモード実装

- `<html>` に `dark` クラスを付与／除去することで Tailwind の `dark:` バリアントが適用される
- ユーザーの `preferences.darkMode` が変化するたびに `App.tsx` の useEffect で DOM を更新する
- デフォルトはダークモード ON

### 10.2 ログイン画面のテーマカラー

| 画面 | アクセントカラー | 説明 |
|------|--------------|------|
| `/login`（メンバー） | blue / violet | 標準ブルー系グラデーション |
| `/admin/login`（管理者） | teal / cyan | 管理者専用グリーン系グラデーション |

### 10.3 優先度カラーコード

| 優先度 | バッジ色 | 説明 |
|--------|---------|------|
| high   | 赤 (red-400 / red-900/40) | 高優先度 |
| medium | 橙 (orange-400 / orange-900/40) | 中優先度 |
| low    | 緑 (green-400 / green-900/40) | 低優先度 |

### 10.4 ステータスカラーコード

| ステータス | 表示色 | 説明 |
|-----------|--------|------|
| todo | スレート | 未着手 |
| inprogress | 青 (blue-500) | 進行中 |
| done | teal + 打ち消し線 | 完了 |

---

## 11. アニメーション設計

`tailwindcss-animate` プラグインによる CSS クラスベースのアニメーションを使用。

| 対象 | クラス |
|------|--------|
| タスクボード切替 | `animate-in fade-in slide-in-from-right-4 duration-300` |
| ダッシュボード表示 | `animate-in fade-in slide-in-from-bottom-4 duration-500` |
| モーダル背景 | `animate-in fade-in duration-200` |
| モーダル本体 | `animate-in zoom-in duration-200` |
| トースト通知 | `animate-in fade-in slide-in-from-right-10 duration-300` |

---

## 12. ビルド設計

### 12.1 Vite チャンク分割

```typescript
// vite.config.ts
manualChunks: {
  charts: ['recharts'],  // recharts を別チャンクに分離（~380KB）
}
```

### 12.2 本番ビルド出力（参考）

| ファイル | サイズ（gzip） | 内容 |
|---------|--------------|------|
| `dist/assets/index-*.css` | ~6KB | Tailwind ユーティリティ |
| `dist/assets/index-*.js` | ~131KB | アプリコード + React + React Router |
| `dist/assets/charts-*.js` | ~113KB | recharts |

---

## 13. レスポンシブ設計

| ブレークポイント | レイアウト |
|---------------|-----------|
| `< 768px`（モバイル） | サイドバー非表示、ボトムナビゲーション表示（固定フッター） |
| `768px〜`（タブレット以上） | 左サイドバー（`w-64`）+ メインコンテンツ |

---

## 14. 将来の拡張設計

### 14.1 リアルタイム同期

Supabase Realtime を活用して、他のユーザーのタスク更新を即時反映できる：

```typescript
supabase
  .channel('tasks')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, handler)
  .subscribe()
```

### 14.2 ファイル添付

Supabase Storage を使ってタスクにファイルを添付できるよう拡張可能。

---

## 15. Supabase データベース設計

### 15.1 テーブル構成

| テーブル | 説明 |
|---------|------|
| `auth.users` | Supabase Auth が管理する認証ユーザー（メール・パスワード） |
| `public.profiles` | ユーザー拡張情報（username・role・preferences） |
| `public.categories` | タスクカテゴリ（チーム共有） |
| `public.tasks` | タスク情報 |

### 15.2 ER 図

```
auth.users (1) ──── (1) profiles
profiles   (1) ──── (N) tasks
profiles   (1) ──── (N) categories (created_by)
categories (1) ──── (N) tasks      (category_id)
```

### 15.3 SQL スキーマ定義

```sql
-- ====================================
-- TaskFlow Supabase Schema
-- ====================================

-- UUID 拡張（Supabase ではデフォルトで有効）
create extension if not exists "pgcrypto";

-- ====================================
-- テーブル定義
-- ====================================

-- profiles: auth.users の拡張情報
create table public.profiles (
  id          uuid        primary key references auth.users(id) on delete cascade,
  username    text        not null unique,
  name        text        not null,
  role        text        not null default 'member'
                          check (role in ('admin', 'member')),
  preferences jsonb       not null default '{"darkMode":true,"notifications":true,"language":"ja"}'::jsonb,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- categories: タスクカテゴリ（チーム共有）
create table public.categories (
  id         uuid        primary key default gen_random_uuid(),
  label      text        not null,
  color      text        not null,                              -- Hex カラー例: '#3b82f6'
  created_by uuid        references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

-- tasks: タスク情報
create table public.tasks (
  id          uuid        primary key default gen_random_uuid(),
  user_id     uuid        not null references public.profiles(id) on delete cascade,
  title       text        not null,
  description text        not null default '',
  priority    text        not null default 'medium'
                          check (priority in ('high', 'medium', 'low')),
  intensity   integer     not null default 3
                          check (intensity between 1 and 5),
  category_id uuid        references public.categories(id) on delete set null,
  status      text        not null default 'todo'
                          check (status in ('todo', 'inprogress', 'done')),
  date        date        not null,
  end_date    date,
  is_all_day  boolean     not null default false,
  start_time  text,                                             -- 'HH:MM' 形式
  end_time    text,                                             -- 'HH:MM' 形式
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ====================================
-- インデックス
-- ====================================

create index tasks_user_id_idx on public.tasks (user_id);
create index tasks_date_idx    on public.tasks (date);
create index tasks_status_idx  on public.tasks (status);

-- ====================================
-- updated_at 自動更新トリガー
-- ====================================

create or replace function public.handle_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.handle_updated_at();

create trigger tasks_updated_at
  before update on public.tasks
  for each row execute function public.handle_updated_at();

-- ====================================
-- auth.users 登録時に profiles を自動作成
-- ====================================

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, username, name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'name',     split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'role',     'member')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ====================================
-- Row Level Security (RLS)
-- ====================================

alter table public.profiles   enable row level security;
alter table public.categories enable row level security;
alter table public.tasks      enable row level security;

-- ---------- profiles ----------
-- 自分のプロフィールは閲覧・更新可能
create policy "profiles: 自己閲覧"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles: 自己更新"
  on public.profiles for update
  using (auth.uid() = id);

-- admin は全プロフィールを閲覧可能
create policy "profiles: admin 全閲覧"
  on public.profiles for select
  using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- ---------- categories ----------
-- 認証済みユーザーは全カテゴリを閲覧可能
create policy "categories: 全ユーザー閲覧"
  on public.categories for select
  using (auth.uid() is not null);

-- 認証済みユーザーはカテゴリを作成可能
create policy "categories: 認証済み作成"
  on public.categories for insert
  with check (auth.uid() is not null);

-- 作成者 または admin は更新・削除可能
create policy "categories: 作成者・admin 更新"
  on public.categories for update
  using (
    created_by = auth.uid()
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

create policy "categories: 作成者・admin 削除"
  on public.categories for delete
  using (
    created_by = auth.uid()
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- ---------- tasks ----------
-- member は自分のタスクのみ閲覧
create policy "tasks: 自己閲覧"
  on public.tasks for select
  using (user_id = auth.uid());

-- admin は全タスクを閲覧
create policy "tasks: admin 全閲覧"
  on public.tasks for select
  using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- ユーザーは自分のタスクを作成（admin は任意ユーザー宛に作成可）
create policy "tasks: 自己・admin 作成"
  on public.tasks for insert
  with check (
    user_id = auth.uid()
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- 自分のタスクを更新（admin は全タスクを更新）
create policy "tasks: 自己・admin 更新"
  on public.tasks for update
  using (
    user_id = auth.uid()
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- 自分のタスクを削除（admin は全タスクを削除）
create policy "tasks: 自己・admin 削除"
  on public.tasks for delete
  using (
    user_id = auth.uid()
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- ====================================
-- 初期データ（デフォルトカテゴリ）
-- ====================================

insert into public.categories (id, label, color) values
  ('00000000-0000-0000-0000-000000000001', '仕事',   '#3b82f6'),
  ('00000000-0000-0000-0000-000000000002', '学習',   '#8b5cf6'),
  ('00000000-0000-0000-0000-000000000003', 'その他', '#6b7280');
```

### 15.4 管理者アカウントの作成手順

管理者は `/admin/login` からセルフ登録できないため、以下の手順でシステム管理者が手動作成する：

1. Supabase ダッシュボード → `Authentication` → `Users` → `Add user`
2. メール・パスワードを設定してユーザーを作成
3. 作成後、SQL エディタで role を更新：

```sql
UPDATE public.profiles
SET role = 'admin'
WHERE email = 'admin@yourcompany.com';
```

### 15.5 型マッピング（TypeScript ↔ Supabase）

| TypeScript 型 | Supabase テーブル | 主な変更点 |
|--------------|------------------|-----------|
| `User` | `profiles` | `password` 削除、`email` は `auth.users` が管理 |
| `Category` | `categories` | `id` が文字列 → UUID |
| `Task` | `tasks` | `category` (string) → `category_id` (UUID)、`userId` → `user_id` |
