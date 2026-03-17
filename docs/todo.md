# TaskFlow TODO リスト

現在の実装状況と今後の改善・追加機能を優先度別に整理する。

---

## 優先度凡例

| 記号 | 意味 |
|------|------|
| 🔴 | 必須（セキュリティ・重大な欠陥） |
| 🟠 | 高優先度（コア機能の改善） |
| 🟡 | 中優先度（UX 改善・機能追加） |
| 🟢 | 低優先度（Nice-to-have） |

---

## セキュリティ

- [ ] 🔴 パスワードのハッシュ化（現在は平文で localStorage に保存）
- [ ] 🔴 セッション管理の強化（JWT または httpOnly Cookie の使用）
- [ ] 🟠 ユーザー登録機能の追加（現在は初期データのデモアカウントのみ）
- [ ] 🟠 管理者画面への直接アクセス防止（クライアント側のみのガード）

---

## バックエンド統合

- [ ] 🟠 Express サーバーのエントリポイント作成（`server/index.ts` など）
- [ ] 🟠 データベースのスキーマ定義（SQLite 等）
  - `users` テーブル
  - `tasks` テーブル
  - `categories` テーブル
- [ ] 🟠 REST API エンドポイントの実装
  - `POST /api/auth/login`
  - `POST /api/auth/logout`
  - `GET /api/tasks` / `POST /api/tasks`
  - `PUT /api/tasks/:id` / `DELETE /api/tasks/:id`
  - `GET /api/users`
- [ ] 🟠 フロントエンドの API クライアント実装（fetch / axios）
- [ ] 🟠 localStorage からサーバーサイド DB へのデータ移行

---

## ユーザー管理

- [ ] 🟠 ユーザー登録フォームの実装
- [ ] 🟡 管理者によるユーザー管理（追加・削除・ロール変更）
- [ ] 🟢 アバター画像のアップロード・表示

---

## タスク機能

- [ ] 🟡 タスクの一括操作（複数選択・一括削除・一括ステータス変更）
- [ ] 🟡 繰り返しタスク機能（毎日・毎週・毎月）
- [ ] 🟡 タスクのコメント・メモ機能
- [ ] 🟡 タスクのサブタスク（チェックリスト）
- [ ] 🟡 タスクのソート順変更（手動ドラッグ）
- [ ] 🟡 タスクのコピー・複製機能
- [ ] 🟢 タスクへのファイル添付
- [ ] 🟢 タスクにタグ付け（カテゴリとは別の軸）
- [ ] 🟢 タスクの依存関係設定（前のタスクが完了するまでブロック）

---

## カレンダー機能

- [ ] 🟡 週表示モードの追加
- [ ] 🟡 日付範囲選択によるタスク作成
- [ ] 🟡 外部カレンダー連携（Google Calendar / iCal インポート）
- [ ] 🟢 祝日の表示（日本の祝日 API 連携）

---

## 通知・リマインダー

- [ ] 🟠 ブラウザ通知（Web Notifications API）でのタスクリマインダー（通知設定 UI は実装済み）
- [ ] 🟡 期限前アラート設定（1時間前・前日など）
- [ ] 🟡 メール通知（バックエンド実装後）
- [ ] 🟢 Slack / Discord Webhook 連携通知

---

## データ・同期

- [ ] 🟠 バックエンド実装後のクロスデバイス同期
- [ ] 🟡 データのエクスポート機能（CSV / JSON）
- [ ] 🟡 データのインポート機能
- [ ] 🟡 オフライン対応（PWA + Service Worker）
- [ ] 🟢 リアルタイム同期（WebSocket / Server-Sent Events）

---

## UI/UX 改善

- [ ] 🟡 操作の Undo / Redo 機能
- [ ] 🟡 タスクカードのカラーカスタマイズ
- [ ] 🟡 キーボードショートカットの整備
- [ ] 🟡 アクセシビリティ改善（ARIA 属性、キーボード操作）
- [ ] 🟡 言語切り替えの実装（現状は設定 UI のみで動作なし）
- [ ] 🟢 カスタムテーマカラーの設定
- [ ] 🟢 タスク一覧の表示密度切り替え（コンパクト / 標準 / 詳細）

---

## テスト

- [ ] 🟠 単体テストの追加（Vitest + React Testing Library）
  - データモデルのバリデーション
  - フィルタリングロジック
  - ステータス遷移
- [ ] 🟠 コンポーネントテスト
  - TaskBoard
  - TaskModal
  - Dashboard
- [ ] 🟡 E2E テスト（Playwright / Cypress）
  - ログイン〜タスク作成〜削除フロー
  - 管理者ダッシュボード閲覧フロー

---

## インフラ・デプロイ

- [ ] 🟡 Docker コンテナ化
- [ ] 🟡 CI/CD パイプライン構築（GitHub Actions）
- [ ] 🟡 本番環境デプロイ設定（Vercel / Netlify / Railway など）
- [ ] 🟢 環境変数の管理整備（`.env.development` / `.env.production`）

---

## ドキュメント

- [ ] 🟡 API ドキュメント（バックエンド実装後）
- [ ] 🟡 コンポーネントドキュメント（Storybook）
- [ ] 🟢 ユーザーマニュアル

---

## 完了済み

- [x] React 19 + TypeScript + Vite によるプロジェクトセットアップ
- [x] Tailwind CSS 3（PostCSS 経由）によるスタイリング（CDN から移行済み）
- [x] tailwindcss-animate による CSS アニメーション
- [x] 外部 CDN 依存の排除（全依存を npm パッケージで管理）
- [x] Vite の manualChunks による recharts チャンク分離（本番ビルド最適化）
- [x] App.tsx のコンポーネント分割（Auth / TaskBoard / Dashboard / TaskModal / SettingsModal / ConfirmModal / Icons）
- [x] storageService による localStorage アクセス抽象化（services/storage.ts）
- [x] ダークモード / ライトモード切り替え（ユーザー preferences に保存）
- [x] ログイン認証（localStorage ベース）
- [x] ロールベースアクセス制御（admin / member）
- [x] タスクの CRUD 操作
- [x] タスクのステータス管理（todo / inprogress / done）
- [x] ステータス・優先度のフィルタリング
- [x] テキスト検索
- [x] カレンダービュー（月次カレンダー + ドラッグ&ドロップ）
- [x] デイリービュー（タイムライン形式）
- [x] 期間タスク対応（endDate フィールド追加）
- [x] カテゴリのオブジェクト化（id / label / color）とカレンダー色分け
- [x] 管理者ダッシュボード（recharts BarChart + PieChart）
- [x] メンバー進捗カード（完了率・ワークロードスコア）
- [x] 削除確認ダイアログ（ConfirmModal）
- [x] 設定モーダル（プロフィール編集・パスワード変更・カテゴリ管理・通知設定）
- [x] トースト通知
- [x] レスポンシブデザイン（PC + モバイル）
