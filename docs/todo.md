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

- [ ] 🔴 管理者アカウント作成時の初期パスワード強制変更フロー
- [ ] 🟠 管理者によるメンバーアカウントの停止・削除機能

---

## バックエンド統合（Supabase 移行残作業）

- [ ] 🟠 タスクの CRUD を localStorage から Supabase API に完全移行
- [ ] 🟠 カテゴリの CRUD を Supabase API に移行
- [ ] 🟠 プロフィール更新を Supabase API（`profiles` テーブル）に接続
- [ ] 🟠 パスワード変更を Supabase Auth API（`supabase.auth.updateUser`）に接続

---

## ユーザー管理

- [ ] 🟡 管理者によるユーザー管理（ロール変更・一覧表示）
- [ ] 🟢 アバター画像のアップロード・表示（Supabase Storage）

---

## タスク機能

- [ ] 🟡 タスクの一括操作（複数選択・一括削除・一括ステータス変更）
- [ ] 🟡 繰り返しタスク機能（毎日・毎週・毎月）
- [ ] 🟡 タスクのコメント・メモ機能
- [ ] 🟡 タスクのサブタスク（チェックリスト）
- [ ] 🟡 タスクのソート順変更（手動ドラッグ）
- [ ] 🟡 タスクのコピー・複製機能
- [ ] 🟢 タスクへのファイル添付（Supabase Storage）
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
- [ ] 🟡 メール通知（Supabase Edge Functions 経由）
- [ ] 🟢 Slack / Discord Webhook 連携通知

---

## データ・同期

- [ ] 🟠 Supabase Realtime によるリアルタイム同期（他ユーザーのタスク更新を即時反映）
- [ ] 🟡 データのエクスポート機能（CSV / JSON）
- [ ] 🟡 データのインポート機能
- [ ] 🟡 オフライン対応（PWA + Service Worker）

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
  - Auth / AdminAuth（ログインフロー・role 検証）
  - TaskBoard
  - TaskModal
  - Dashboard
- [ ] 🟡 E2E テスト（Playwright / Cypress）
  - メンバーログイン〜タスク作成〜削除フロー（/login）
  - 管理者ログイン〜ダッシュボード閲覧フロー（/admin/login）
  - 非管理者が /admin/login でログイン拒否されるシナリオ

---

## インフラ・デプロイ

- [ ] 🟡 SPA の 404 対応（Vercel / Netlify の rewrite 設定でルーティングを `/index.html` に向ける）
- [ ] 🟡 Docker コンテナ化
- [ ] 🟡 CI/CD パイプライン構築（GitHub Actions）
- [ ] 🟡 本番環境デプロイ設定（Vercel / Netlify / Railway など）
- [ ] 🟢 環境変数の管理整備（`.env.development` / `.env.production`）

---

## ドキュメント

- [ ] 🟡 API ドキュメント（Supabase RLS・Edge Functions）
- [ ] 🟡 コンポーネントドキュメント（Storybook）
- [ ] 🟢 ユーザーマニュアル

---

## 完了済み

- [x] React 19 + TypeScript + Vite によるプロジェクトセットアップ
- [x] Tailwind CSS 3（PostCSS 経由）によるスタイリング（CDN から移行済み）
- [x] tailwindcss-animate による CSS アニメーション
- [x] 外部 CDN 依存の排除（全依存を npm パッケージで管理）
- [x] Vite の manualChunks による recharts チャンク分離（本番ビルド最適化）
- [x] App.tsx のコンポーネント分割（Auth / AdminAuth / TaskBoard / Dashboard / TaskModal / SettingsModal / ConfirmModal / Icons）
- [x] storageService による localStorage アクセス抽象化（services/storage.ts）
- [x] ダークモード / ライトモード切り替え（ユーザー preferences に保存）
- [x] Supabase Auth 統合（メール + パスワード認証・JWT セッション管理）
- [x] メンバー用ログイン画面（/login）：ログイン + 新規登録
- [x] 管理者専用ログイン画面（/admin/login）：ログインのみ・role 検証あり
- [x] React Router DOM 導入による URL ベースのルーティング
- [x] 認証済みユーザーのログイン画面へのリダイレクト防止
- [x] 未認証ユーザーの保護ルートへのアクセス防止（/login にリダイレクト）
- [x] ロールベースアクセス制御（admin / member）
- [x] Supabase RLS によるサーバーサイド権限制御
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
