# BizIdea 開発方針

このプロジェクトで守るべき技術的な設計原則・実装ルール。
Claude Code や開発者が作業前に参照すること。

---

## 技術スタック（変更不可）

| レイヤー | 技術 | バージョン |
|---|---|---|
| フレームワーク | Next.js (App Router) | 16.2 |
| UI | React | 19.2 |
| 言語 | TypeScript | 5.x |
| CSS | Tailwind CSS | v4 |
| コンポーネント | shadcn/ui (base-ui ベース) | 最新 |
| DB | Prisma + SQLite | Prisma 7.6 |
| 状態管理 | Zustand | 5.x |
| チャート | Recharts | 3.x |
| AI | @anthropic-ai/sdk (Claude API) | 最新 |
| 認証 | NextAuth v5 (beta) | 5.0.0-beta.30 |
| ポート | 4001 | — |

## アーキテクチャ原則

### ルーティング
- App Router のレイアウトグループを使用: `(app)` は共通ヘッダー付き、`(auth)` は認証画面用
- 動的ルートは slug ベース (`/ideas/[slug]`)

### データ取得
- クライアントコンポーネントから `api-client.ts` の `api.*` メソッド経由で API Route を呼ぶ
- `sessionId` は `lib/session.ts` の `getSessionId()` で取得（localStorage の UUID）
- 一覧 API は集計情報（リアクション数、コメント数等）をバッチで含める。カード側で N+1 しない

### 永続化の方針
- **DB（Prisma）**: コレクション、リアクション、コメント、宣言、閲覧履歴、通知、トレンドキャッシュ
- **localStorage は最小限**: セッション ID のみ。保存・ブックマーク系は必ず DB を使う
- **Zustand**: クライアント側の一時的な UI 状態のみ（フィルター選択等）

### コンポーネント設計
- `src/components/ui/`: shadcn/ui ベースの汎用コンポーネント
- `src/components/ideas/`: アイデア表示系（カード、チャート、フィルター等）
- `src/components/engagement/`: エンゲージメント系（リアクション、コメント、コレクション追加等）
- `src/components/layout/`: ヘッダー等のレイアウト
- `src/components/shared/`: 横断ユーティリティ（PageHeader 等）

### API Route 設計
- `src/app/api/` 以下に REST 形式で配置
- エラーは `{ error: string }` 形式で返す
- `sessionId` はクエリパラメータまたは body で受け取る

## コーディング規約

### 命名
- コンポーネント: PascalCase (`IdeaSummaryCard`)
- ファイル名: kebab-case (`idea-summary-card.tsx`)
- API Route: REST 準拠 (`/api/ideas/[id]/reactions`)

### スタイリング
- Tailwind ユーティリティのみ。CSS モジュール・styled-components は使わない
- テーマカラー: `primary` (oklch hue 165, エメラルド/ティール系)
- `cn()` ユーティリティで条件付きクラス結合
- スコア色: 4以上=emerald, 3以上=yellow, 3未満=red

### エンゲージメント
- リアクション種別: `like`（いいね）, `interested`（気になる）, `helpful`（参考になった）
- 楽観的更新パターン: 即座に UI 反映 → API 送信 → 失敗時ロールバック
- コレクション保存: `AddToCollection` コンポーネントに統一。`compact` プロップでアイコンのみ表示

### フィルター
- `SearchableSelect` コンポーネントで統一（検索 + グループ対応）
- `expandSelections()` ヘルパーでグループ選択を個別値に展開
- フィルター軸: カテゴリ（領域）、対象業界、対象顧客

## やってはいけないこと

- localStorage でデータ永続化（sessionId 以外）
- 同じ機能の二重実装（ブックマーク + コレクション等）
- 一覧 API に必要な情報を含めず、カード側で個別 fetch
- ツールチップ・ポップオーバーで z-index を考慮しないレイアウト
- 表示項目の追加時に「ユーザーがその場で使うか」を検討しない
- 親要素に `overflow-auto` を設定して子の `sticky` を無効化してしまう

## AI機能の設計原則

### モデル選定
- **構造化データのマッチング・JSON出力**: Claude Haiku 4.5（最安・最速）
- **文章生成・分析レポート**: Claude Sonnet 4.6（品質重視）
- **複雑な推論・戦略立案**: Claude Opus 4.6（最高品質、コスト注意）

### プロンプト設計
- アイデアDBの構造化データをコンテキストに渡す（サービス名・概要・カテゴリ・スコア等）
- 出力はJSON形式を指定し、パース可能な形で返させる
- AIの解釈（interpretation）と理由（reason）を必ず含める

### 差別化の原則
- 「ChatGPTでもできること」は作らない
- BizIdea独自のデータ（トレンドスコア・6軸評価・構造化DB）を必ず活用する
- AI機能の出力はプラットフォーム内のアクション（比較・コレクション保存・プラン生成等）に接続する
