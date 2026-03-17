# TaskFlow 設計書

## 1. アーキテクチャ概要

```
┌─────────────────────────────────────────┐
│           ブラウザ (SPA)                  │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │         React 19 (SPA)            │  │
│  │   App.tsx → components/           │  │
│  └───────────────────────────────────┘  │
│                   │                     │
│  ┌───────────────────────────────────┐  │
│  │       storageService              │  │
│  │  services/storage.ts 経由         │  │
│  └───────────────────────────────────┘  │
│                   │                     │
│  ┌───────────────────────────────────┐  │
│  │         localStorage              │  │
│  │  users / tasks / session /        │  │
│  │  categories                       │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

- バックエンドなし。全データをブラウザの localStorage で管理する。
- React Router を使わずコンポーネント内の `view` state で画面を切り替える。
- ビルドツール: Vite 6 + TypeScript 5.8

---

## 2. 技術スタック

| レイヤー | 技術 | バージョン |
|---------|------|-----------|
| UI フレームワーク | React | 19.2.4 |
| 言語 | TypeScript | ~5.8.2 |
| ビルド | Vite | 6.x |
| スタイリング | Tailwind CSS | 3.x（PostCSS 経由） |
| アニメーション | tailwindcss-animate | 1.x（CSS クラスベース） |
| チャート | recharts | 3.x |
| アイコン | 自作 Icons.tsx（SVG） | - |

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
  username: string  // ログインID
  email?: string    // メールアドレス（任意）
  password?: string // パスワード（平文 ※要改善）
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

### 3.6 localStorage キー

| キー | 型 | 内容 |
|------|----|------|
| `taskflow_users` | `User[]` | ユーザー一覧 |
| `taskflow_tasks` | `Task[]` | タスク一覧 |
| `taskflow_session` | `User` | ログイン中ユーザー |
| `taskflow_categories` | `Category[]` | カテゴリ一覧 |

> テーマ設定は `taskflow_session` 内の `User.preferences.darkMode` として保存する。

---

## 4. ストレージ層（services/storage.ts）

`storageService` オブジェクトが localStorage へのアクセスを抽象化する。

| メソッド | 説明 |
|---------|------|
| `getTasks()` | タスク一覧を取得 |
| `saveTasks(tasks)` | タスク一覧を保存 |
| `getUsers()` | ユーザー一覧を取得（未初期化時は INITIAL_USERS をシード） |
| `saveUsers(users)` | ユーザー一覧を保存 |
| `getSession()` | ログイン中ユーザーを取得 |
| `setSession(user)` | セッションを保存（null でクリア） |
| `getCategories()` | カテゴリ一覧を取得（未初期化時は INITIAL_CATEGORIES をシード） |
| `saveCategories(categories)` | カテゴリ一覧を保存 |

---

## 5. ファイル構成

```
TaskFlow/
├── index.html          # エントリポイント HTML（CDN なし）
├── index.tsx           # React エントリポイント（index.css インポート）
├── index.css           # Tailwind @tailwind ディレクティブ + スクロールバースタイル
├── App.tsx             # メインコンポーネント（状態管理・ルーティング）
├── types.ts            # 型定義
├── constants.ts        # 定数（INITIAL_USERS, INITIAL_CATEGORIES, PRIORITY_CONFIG など）
├── tailwind.config.js  # Tailwind v3 設定（darkMode: 'class', content, plugins）
├── postcss.config.js   # PostCSS 設定（tailwindcss + autoprefixer）
├── vite.config.ts      # Vite 設定（recharts チャンク分離）
├── tsconfig.json       # TypeScript 設定
├── package.json        # 依存関係
│
├── components/
│   ├── Auth.tsx          # ログイン画面
│   ├── TaskBoard.tsx     # タスクボード（カレンダー + デイリービュー）
│   ├── Dashboard.tsx     # 管理者ダッシュボード（recharts グラフ）
│   ├── TaskModal.tsx     # タスク作成・編集モーダル
│   ├── SettingsModal.tsx # アカウント設定モーダル
│   ├── ConfirmModal.tsx  # 削除確認ダイアログ
│   └── Icons.tsx         # SVG アイコン群（自作）
│
└── services/
    └── storage.ts        # localStorage アクセス抽象化
```

---

## 6. コンポーネント設計

### 6.1 コンポーネントツリー

```
<App>
│
├── （未認証時）
│   └── <Auth>              # ログインフォーム
│
└── （認証済み）
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

### 6.2 主要コンポーネント仕様

| コンポーネント | 主な Props | 役割 |
|--------------|-----------|------|
| `Auth` | `onLogin`, `users` | 認証フォーム |
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
| `view` | `'board' \| 'dashboard'` | 現在表示中のビュー |
| `isTaskModalOpen` | `boolean` | タスクモーダルの開閉 |
| `isSettingsModalOpen` | `boolean` | 設定モーダルの開閉 |
| `isConfirmModalOpen` | `boolean` | 確認ダイアログの開閉 |
| `editingTask` | `Task \| null` | 編集中タスク（null = 新規作成） |
| `taskToDelete` | `string \| null` | 削除対象タスクID |
| `toasts` | `{ id, message, type }[]` | 表示中トーストの配列 |

### 7.2 副作用（useEffect）

| トリガー | 処理 |
|----------|------|
| 初回マウント | `storageService` 経由でデータ読み込み |
| `state.currentUser?.preferences?.darkMode` 変化 | `<html>` クラスと body スタイルを更新 |

### 7.3 派生データ（App.tsx）

| 計算値 | 説明 |
|--------|------|
| `userTasks` | admin は全タスク、member は自分のタスクのみ |

---

## 8. 画面設計

### 8.1 ログイン画面

```
┌──────────────────────────────┐
│   TaskFlow ロゴ・タイトル       │
│   サブタイトル                  │
│                              │
│  ┌────────────────────────┐  │
│  │  ユーザー名 入力          │  │
│  └────────────────────────┘  │
│  ┌────────────────────────┐  │
│  │  パスワード 入力          │  │
│  └────────────────────────┘  │
│  [ログイン]                   │
│                              │
│  デモアカウント情報（2カラム）   │
└──────────────────────────────┘
```

### 8.2 タスクボード（PC）

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

### 8.3 管理者ダッシュボード

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

## 9. テーマ設計

### 9.1 ダークモード実装

- `<html>` に `dark` クラスを付与／除去することで Tailwind の `dark:` バリアントが適用される
- ユーザーの `preferences.darkMode` が変化するたびに `App.tsx` の useEffect で DOM を更新する
- デフォルトはダークモード ON

### 9.2 優先度カラーコード

| 優先度 | バッジ色 | 説明 |
|--------|---------|------|
| high   | 赤 (red-400 / red-900/40) | 高優先度 |
| medium | 橙 (orange-400 / orange-900/40) | 中優先度 |
| low    | 緑 (green-400 / green-900/40) | 低優先度 |

### 9.3 ステータスカラーコード

| ステータス | 表示色 | 説明 |
|-----------|--------|------|
| todo | スレート | 未着手 |
| inprogress | 青 (blue-500) | 進行中 |
| done | teal + 打ち消し線 | 完了 |

---

## 10. アニメーション設計

`tailwindcss-animate` プラグインによる CSS クラスベースのアニメーションを使用。

| 対象 | クラス |
|------|--------|
| タスクボード切替 | `animate-in fade-in slide-in-from-right-4 duration-300` |
| ダッシュボード表示 | `animate-in fade-in slide-in-from-bottom-4 duration-500` |
| モーダル背景 | `animate-in fade-in duration-200` |
| モーダル本体 | `animate-in zoom-in duration-200` |
| トースト通知 | `animate-in fade-in slide-in-from-right-10 duration-300` |

---

## 11. ビルド設計

### 11.1 Vite チャンク分割

```typescript
// vite.config.ts
manualChunks: {
  charts: ['recharts'],  // recharts を別チャンクに分離（~380KB）
}
```

### 11.2 本番ビルド出力（参考）

| ファイル | サイズ（gzip） | 内容 |
|---------|--------------|------|
| `dist/assets/index-*.css` | ~6KB | Tailwind ユーティリティ |
| `dist/assets/index-*.js` | ~69KB | アプリコード + React |
| `dist/assets/charts-*.js` | ~113KB | recharts |

---

## 12. レスポンシブ設計

| ブレークポイント | レイアウト |
|---------------|-----------|
| `< 768px`（モバイル） | サイドバー非表示、ボトムナビゲーション表示（固定フッター） |
| `768px〜`（タブレット以上） | 左サイドバー（`w-64`）+ メインコンテンツ |

---

## 13. 将来の拡張設計（未実装）

### 13.1 バックエンド API

想定エンドポイント:
```
POST   /api/auth/login
POST   /api/auth/logout
GET    /api/tasks
POST   /api/tasks
PUT    /api/tasks/:id
DELETE /api/tasks/:id
GET    /api/users
```

### 13.2 パスワードのセキュリティ強化

現状は平文保存。本番環境では bcrypt 等によるハッシュ化が必要。
