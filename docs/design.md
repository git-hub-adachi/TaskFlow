# TaskFlow 設計書

## 1. アーキテクチャ概要

```
┌─────────────────────────────────────────┐
│           ブラウザ (SPA)                  │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │         React 19 (SPA)            │  │
│  │   App.tsx (単一コンポーネントツリー) │  │
│  └───────────────────────────────────┘  │
│                   │                     │
│  ┌───────────────────────────────────┐  │
│  │         localStorage              │  │
│  │  users / tasks / session /        │  │
│  │  theme / categories               │  │
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
| UI フレームワーク | React | 19.0.0 |
| 言語 | TypeScript | ~5.8.2 |
| ビルド | Vite | 6.2.0 |
| スタイリング | Tailwind CSS | 4.1.14 |
| アニメーション | Motion (Framer Motion) | 12.23.24 |
| アイコン | Lucide React | 0.546.0 |
| AI SDK (未使用) | @google/genai | 1.29.0 |
| バックエンド候補 | Express | 4.21.2 |
| DB候補 | better-sqlite3 | 12.4.1 |

---

## 3. データモデル

### 3.1 型定義

```typescript
type Priority = 'high' | 'medium' | 'low'
type Status   = 'todo' | 'inprogress' | 'done'
type Role     = 'admin' | 'member'
type Category = string
```

### 3.2 User

```typescript
interface User {
  id: string        // UUID
  username: string  // ログインID
  password?: string // パスワード（平文 ※要改善）
  role: Role        // 'admin' | 'member'
  name: string      // 表示名
}
```

### 3.3 Task

```typescript
interface Task {
  id: string         // UUID
  userId: string     // 担当ユーザーの User.id
  title: string      // タスクタイトル（必須）
  description: string // 説明（任意）
  priority: Priority  // 優先度
  intensity: number   // 作業強度 1〜5（炎アイコン）
  category: Category  // カテゴリ名
  status: Status      // 進捗ステータス
  date: string        // 'YYYY-MM-DD' 形式
  startTime: string   // 'HH:MM' 形式
  endTime: string     // 'HH:MM' 形式
  isAllDay: boolean   // 終日フラグ
  createdAt: number   // UNIX timestamp (ms)
  updatedAt: number   // UNIX timestamp (ms)
}
```

### 3.4 Toast

```typescript
interface Toast {
  id: number
  message: string
  type: 'success' | 'error' | 'info'
}
```

### 3.5 localStorage キー

| キー | 型 | 内容 |
|------|----|------|
| `taskflow_users` | `User[]` | ユーザー一覧 |
| `taskflow_tasks` | `Task[]` | タスク一覧 |
| `taskflow_session` | `User` | ログイン中ユーザー |
| `taskflow_theme` | `'light' \| 'dark'` | テーマ設定 |
| `taskflow_categories` | `string[]` | カテゴリ一覧 |

---

## 4. コンポーネント設計

### 4.1 ファイル構成

```
src/
├── App.tsx       # メインコンポーネント（全ロジックを集約、約1254行）
├── main.tsx      # エントリポイント（ReactDOM.createRoot）
└── index.css     # グローバルスタイル（Tailwind + カスタムテーマ変数）
```

### 4.2 コンポーネントツリー

```
<App>
├── <ToastContainer>          # トースト通知
│
├── （未認証時）
│   └── <LoginScreen>         # ログインフォーム
│
└── （認証済み）
    ├── <Sidebar>             # ナビゲーション（PC）
    │   └── <NavItem>         # サイドバーメニュー項目
    ├── <MobileNav>           # ボトムナビゲーション（モバイル）
    │   └── <MobileNavItem>   # モバイルナビ項目
    │
    ├── （view === 'day'）
    │   └── <DayView>         # デイビュー
    │       ├── <Header>      # ヘッダー（テーマ切替・検索・追加ボタン）
    │       ├── <DateNav>     # 日付ナビゲーション
    │       ├── <FilterBar>   # フィルター（優先度・カテゴリ・ステータス）
    │       │   └── <FilterSelect>  # セレクトボックス
    │       └── <TaskCard>[]  # タスクカード一覧
    │
    ├── （view === 'calendar'）
    │   └── <CalendarView>    # カレンダービュー
    │       └── <DayCell>[]   # 日付セル（ドラッグ&ドロップ対応）
    │           └── <TaskChip>[] # タスクチップ
    │
    ├── （view === 'admin'、admin のみ）
    │   └── <AdminView>       # 管理者ダッシュボード
    │       ├── <MemberCard>[] # メンバーステータスカード
    │       │   └── <StatBox>  # 統計ボックス
    │       └── <AllTasksTable> # 全タスクテーブル
    │           └── <PriorityBadge> # 優先度バッジ
    │
    └── <TaskModal>           # タスク作成・編集モーダル（共用）
```

### 4.3 主要サブコンポーネント

| コンポーネント | 役割 |
|--------------|------|
| `NavItem` | サイドバーのメニュー項目（アイコン + ラベル + active 状態） |
| `MobileNavItem` | モバイル用ボトムナビ項目 |
| `TaskCard` | タスク情報の表示、ステータス切替、編集・削除操作 |
| `FilterSelect` | フィルター用セレクトボックス（汎用） |
| `CalendarView` | 月次カレンダーグリッド + ドラッグ&ドロップ |
| `MemberCard` | 管理者ダッシュボードのメンバー統計カード |
| `StatBox` | MemberCard 内の統計ボックス（ラベル + 数値） |
| `PriorityBadge` | 優先度を色付きバッジで表示 |
| `ToastContainer` | トースト通知のスタック表示 |

---

## 5. 状態管理

### 5.1 グローバル状態（App.tsx 内 useState）

| state | 型 | 説明 |
|-------|----|------|
| `users` | `User[]` | 全ユーザー一覧 |
| `tasks` | `Task[]` | 全タスク一覧 |
| `currentUser` | `User \| null` | ログイン中ユーザー |
| `view` | `'day' \| 'calendar' \| 'admin'` | 現在表示中のビュー |
| `selectedDate` | `string` | デイビューで選択中の日付 |
| `theme` | `'light' \| 'dark'` | 現在のテーマ |
| `categories` | `string[]` | カテゴリ一覧 |
| `toasts` | `Toast[]` | 表示中トーストの配列 |
| `isSidebarOpen` | `boolean` | サイドバーの開閉状態 |
| `isModalOpen` | `boolean` | タスクモーダルの開閉状態 |
| `editingTask` | `Task \| null` | 編集中タスク（null = 新規作成） |
| `filterPriority` | `Priority \| 'all'` | 優先度フィルター |
| `filterCategory` | `Category \| 'all'` | カテゴリフィルター |
| `filterStatus` | `Status \| 'all'` | ステータスフィルター |
| `searchQuery` | `string` | 検索テキスト |

### 5.2 モーダル専用状態

| state | 型 | 説明 |
|-------|----|------|
| `modalTitle` | `string` | タスクタイトル入力値 |
| `modalDescription` | `string` | 説明入力値 |
| `modalPriority` | `Priority` | 優先度選択値 |
| `modalCategory` | `Category` | カテゴリ選択値 |
| `modalDate` | `string` | 日付入力値 |
| `modalStartTime` | `string` | 開始時刻入力値 |
| `modalEndTime` | `string` | 終了時刻入力値 |
| `modalIsAllDay` | `boolean` | 終日フラグ |
| `modalStatus` | `Status` | ステータス選択値 |
| `modalIntensity` | `number` | 作業強度（1〜5）|
| `categoryInput` | `string` | カテゴリ新規入力値 |

### 5.3 派生データ（useMemo）

| 計算値 | 説明 |
|--------|------|
| `filteredTasks` | フィルター・検索・日付を適用したタスク一覧 |
| `memberStats` | 管理者ダッシュボード用の各メンバー統計データ |

### 5.4 副作用（useEffect）

| トリガー | 処理 |
|----------|------|
| 初回マウント | localStorage からデータ読み込み、初期ユーザー・カテゴリのシード |
| `tasks` 変化 | localStorage へ保存 |
| `users` 変化 | localStorage へ保存 |
| `theme` 変化 | localStorage へ保存、`<html>` クラスを更新 |
| `categories` 変化 | localStorage へ保存 |

---

## 6. 画面設計

### 6.1 ログイン画面

```
┌──────────────────────────────┐
│   TaskFlow ロゴ・タイトル       │
│                              │
│  ┌────────────────────────┐  │
│  │  ユーザー名 入力          │  │
│  └────────────────────────┘  │
│  ┌────────────────────────┐  │
│  │  パスワード 入力          │  │
│  └────────────────────────┘  │
│  [ログイン]                   │
│                              │
│  デモアカウント情報             │
└──────────────────────────────┘
```

### 6.2 デイビュー（PC）

```
┌──────────┬──────────────────────────────────────────┐
│          │  ヘッダー（タイトル・検索・テーマ・追加）      │
│ サイドバー  ├──────────────────────────────────────────┤
│          │  日付ナビゲーション（< 2024-01-01 >）       │
│  [デイ]   ├──────────────────────────────────────────┤
│  [カレ]   │  フィルター（優先度 / カテゴリ / ステータス）  │
│  [管理]   ├──────────────────────────────────────────┤
│          │  タスクカード × N                          │
│  ユーザー  │  ┌──────────────────────────────────┐   │
│  [ログアウ] │  │ ○ [high] 仕事  タイトル    10:00 │   │
│          │  │  説明テキスト（最大2行）   🔥🔥🔥   │   │
│          │  └──────────────────────────────────┘   │
└──────────┴──────────────────────────────────────────┘
```

### 6.3 カレンダービュー

```
┌──────────┬─────────────────────────────────────────────┐
│ サイドバー  │ 2024年1月  [< >] [今日]                      │
│          ├─────┬─────┬─────┬─────┬─────┬─────┬─────┤
│          │ 日   │ 月   │ 火   │ 水   │ 木   │ 金   │ 土  │
│          ├─────┼─────┼─────┼─────┼─────┼─────┼─────┤
│          │  1  │  2  │  3  │  4  │  5  │  6  │  7  │
│          │[タスク] │     │     │     │     │     │     │
│          │[タスク] │     │     │     │     │     │     │
│          │+1件... │     │     │     │     │     │     │
│          ├─────┼─────┼─────┼─────┼─────┼─────┼─────┤
│          │ ... │     │     │     │     │     │     │
└──────────┴─────┴─────┴─────┴─────┴─────┴─────┴─────┘
```

### 6.4 管理者ダッシュボード

```
┌──────────┬──────────────────────────────────────────┐
│ サイドバー  │  メンバーステータス                         │
│          │  ┌────────┐  ┌────────┐  ┌────────┐     │
│          │  │ Alice  │  │  Bob   │  │  ...   │     │
│          │  │ 完了率  │  │ 完了率  │  │        │     │
│          │  │ ■■■□□ │  │ ■■□□□ │  │        │     │
│          │  │ 統計... │  │ 統計... │  │        │     │
│          │  └────────┘  └────────┘  └────────┘     │
│          ├──────────────────────────────────────────┤
│          │  全タスク一覧                              │
│          │  担当者 | タイトル | 日付 | 優先度 | ステータス │
│          │  alice  | タスクA  | ... | [high] | 進行中 │
│          │  bob    | タスクB  | ... | [low]  | 完了   │
└──────────┴──────────────────────────────────────────┘
```

---

## 7. テーマ設計

### 7.1 CSS カスタムプロパティ（抜粋）

```css
/* ライトモード */
:root {
  --bg-primary: /* スレートベース */;
  --card-bg: /* 半透明白 */;
  --text-primary: /* ダーク */;
}

/* ダークモード */
.dark {
  --bg-primary: /* ネイビー系 */;
  --card-bg: /* 半透明ダーク */;
  --text-primary: /* ライト */;
}
```

### 7.2 優先度カラーコード

| 優先度 | バッジ色 | 説明 |
|--------|---------|------|
| high   | 赤 (red-500)    | 高優先度 |
| medium | 橙 (orange-400) | 中優先度 |
| low    | 緑 (green-500)  | 低優先度 |

### 7.3 ステータスカラーコード

| ステータス | 表示色 | 説明 |
|-----------|--------|------|
| todo | グレー | 未着手 |
| inprogress | 青 | 進行中 |
| done | 緑 + 打ち消し線 | 完了 |

---

## 8. ルーティング設計

React Router は使用せず、App.tsx 内の `view` state で画面を切り替える。

| view 値 | 表示コンポーネント | アクセス条件 |
|---------|----------------|------------|
| `'day'` | デイビュー | 全ロール |
| `'calendar'` | カレンダービュー | 全ロール |
| `'admin'` | 管理者ダッシュボード | admin のみ |
| （null） | ログイン画面 | 未認証 |

---

## 9. アニメーション設計

Motion ライブラリ（Framer Motion 互換）を使用。

| 対象 | アニメーション |
|------|--------------|
| タスクカード一覧 | stagger（順次フェードイン） |
| モーダル | スケール + フェードイン |
| トースト | スライドイン（右から） + フェードアウト |
| 管理ダッシュボード | プログレスバーのアニメーション |
| サイドバー | スライドイン/アウト |

---

## 10. レスポンシブ設計

| ブレークポイント | レイアウト |
|---------------|-----------|
| `< 768px`（モバイル） | サイドバー非表示、ボトムナビゲーション表示 |
| `768px〜`（タブレット以上） | 左サイドバー + メインコンテンツ |

---

## 11. 将来の拡張設計（未実装）

### 11.1 バックエンド API（Express + SQLite）

依存関係はすでに追加済み（`express`, `better-sqlite3`）。

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

### 11.2 AI 機能（Google Gemini）

`@google/genai` SDK がインストール済みで、`GEMINI_API_KEY` が環境変数として設定可能。

想定ユースケース:
- タスクの自動優先度提案
- タスク説明の自動生成
- チームの作業負荷最適化提案
