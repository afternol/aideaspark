# BizIdea 開発履歴

時系列の開発ログ。何をいつ・なぜ変えたかを記録する。

---

## Phase 1 実装（〜2026-03-31）

### 初期構築
- Next.js 16 + React 19 + TypeScript + Tailwind v4 + shadcn/ui (base-ui) でプロジェクト作成
- Prisma + SQLite（`dev.db`）でデータ層構築
- ポート 4001 で起動

### コアページ群
- **ランディングページ** (`/`): Hero、機能紹介6項目、人気アイデアTop3、使い方3ステップ、CTA
- **アイデアフィード** (`/feed`): カテゴリ・業界・顧客・スコアのフィルター、ソート6種、ページネーション、AI検索、週間ピック、パーソナルレコメンド
- **アイデア詳細** (`/ideas/[slug]`): 6軸レーダーチャート、スコアバー、コンセプト・ターゲット・課題・プロダクト・収益モデル・競合・優位性、関連トレンド
- **トレンドレーダー** (`/trends`): 上昇トレンドスポットライト、ヒートマップ、全領域スコアグリッド
- **ランキング** (`/rankings`): 総合・成長性・始めやすさ・独自性の4軸タブ、表彰台Top3 + カードグリッド
- **ブックマーク** (`/bookmarks`): localStorage ベースの保存機能
- **コレクション** (`/collections`): DB ベースのフォルダ管理、コレクション作成・削除・アイテム追加
- **比較** (`/compare`): 最大3件の横並び比較、SearchableSelect で選択
- **診断** (`/diagnosis`): アイデア診断
- **閲覧履歴** (`/history`)
- **マイページ** (`/mypage`)
- **オンボーディング** (`/onboarding`)
- **ユーザープロフィール** (`/users/[id]`)

### 認証
- NextAuth v5 (beta.30) + Prisma Adapter
- メール/パスワード認証（bcryptjs）
- Google OAuth 準備済み（環境変数未設定）

### データモデル
- Idea: 6軸スコア + スコアコメント + タグ + カテゴリ + 業界 + 顧客 + slug
- Engagement: Reaction (like/interested/helpful)、Comment（スレッド対応）、Declaration
- Collection / CollectionItem / Note
- ViewHistory / Notification / TrendCache
- User / Account / Session (NextAuth)

### API
- Claude API (`@anthropic-ai/sdk`) によるAI検索・レコメンド
- Google Trends API によるトレンドスコアリング
- 15本の API Route

---

## Phase 1.5 改善（2026-04-02）

### エンゲージメント強化
- **カードにリアクションボタン追加**: `IdeaSummaryCard` に「いいね」「気になる」「参考になった」の3ボタンを配置
- **API 拡張**: `/api/ideas` に種類別リアクションカウント (`reactionCounts`) + ユーザーリアクション状態 (`userReactions`) を追加。`sessionId` をクエリパラメータで受信
- **api-client 更新**: `ideas.list()` が自動で `sessionId` を送信

### 保存機能の統一
- **問題**: `useBookmarkStore`（localStorage）と `AddToCollection`（DB API）が別系統で動作
- **対応**: 全コンポーネント（IdeaSummaryCard, IdeaCard, IdeaDetailDialog）の保存ボタンを `AddToCollection` に統一
- `AddToCollection` に `compact` プロップ追加（アイコンのみ表示、カード内用）
- アイコンを `Bookmark` → `FolderHeart` に変更し、コレクション機能と視覚的に一致

### ランキングフィルター
- 領域（カテゴリ）・対象業界・対象顧客の3軸 `SearchableSelect` フィルターを追加
- フィルター適用時の件数表示、結果0件時の空状態表示
- `expandSelections` ヘルパーでグループ選択にも対応

### 比較ページ改善
- ドロップダウン式 `SearchableSelect` → カード型ピッカーに変更
- サービス名・カテゴリ・業界・顧客・タグでのキーワード検索
- 各候補にカテゴリ・業界バッジを表示
- 初期表示は最新12件

### UI 修正
- アイデア詳細タグ行から「難易度: 低/中/高」バッジを削除
- トレンドヒートマップのツールチップ z-index 修正（`hover:z-50` + `z-[100]` + `group/tile`）

---

## Phase 2: AI機能 + リテンション強化（2026-04-02）

### AI自然言語検索
- Claude Haiku 4.5採用（コスパ重視、1回約0.1-0.2円）
- アイデアDB全体をコンテキストに渡し自然言語を解釈
- AIの解釈文+選定理由+マッチしたアイデアリストを返却
- 既存キーワード検索とは独立して併用可能
- サジェスト例6つは万人向け（「一人で始められるスモールビジネス」等）

### 検索UIリニューアル
- 左サイドバーを画面端まで拡張（bg-muted/30 + border-r）
- `sticky top-14`でヘッダー直下に固定、`overflow-y-auto`で中身スクロール
- 親layoutの`overflow-auto`を削除しstickyを有効化
- キーワード検索にラベル変更（「検索」→「キーワード検索」）
- 表示件数をボタン並び→プルダウンに変更、「全件」を削除
- ページネーション追加（前後/ページ番号/省略記号/範囲表示）

### フォロー機能の全削除
- Followモデル、APIルート、UI（フォローボタン・統計）を全て削除
- 理由: コミュニティ成熟前にソーシャル機能は時期尚早

### プロフィール公開/非公開
- Userに`profilePublic`フィールド追加（デフォルトtrue）
- マイページにトグルUI
- 非公開ユーザーのプロフィールページは名前のみ表示

### 保存機能の統一完了
- アイデア詳細ページの「保存」ボタンを削除
- コレクションボタンのみに統一

### AI機能の戦略的議論（未実装・計画）
- AIビジネスプラン生成: 最有力マネタイズ候補。アイデアDBの構造化データを活用し、汎用AIと差別化
- AIアイデア壁打ち: プラットフォームデータ+後続アクション（プラン生成・比較・コレクション）統合型でないと価値なし
- マネタイズ: Free月3回/Pro月額1,980円/Enterprise要相談の3段階を検討中

---

## Phase 2.5: マイアイデア強化・エクスポート機能（2026-04-04〜08）

### 文字化け修正
- `my-ideas/page.tsx` 内の日本語文字化け5箇所を修正
- `ビジネ���プラン`→`ビジネスプラン`、`エグゼクティブサマリ��`→`エグゼクティブサマリー`、`リーンキ��ンバス`→`リーンキャンバス`、`顧客セグメ��ト`→`顧客セグメント`、`競合分��`→`競合分析`

### マイアイデア再カスタマイズ改善
- **問題**: 「再カスタマイズ」ボタンが元アイデア詳細ページへのリンクで、選択中バージョンが無視されていた
- **対応**: マイアイデア画面内にインラインのカスタマイズフォームを実装。選択中のバージョン（`customIdeaId`）をベースにAPIへリクエスト。完了後は自動リロードで新バージョン表示

### カスタマイズ版PDF/Wordエクスポート
- **PDF**: `html2canvas` + `jsPDF` で実装。iframe隔離方式（後述の学び参照）
- **Word**: `docx` + `file-saver` でネイティブ`.docx`生成（テキスト編集可能）
- ボタンは「詳細」展開ボタンの右横に配置
- ファイル: `src/lib/export-pdf.ts`, `src/lib/export-docx.ts`

### ビジネスプランPDF/Wordエクスポート
- ビジネスプランタブにもPDF/Wordエクスポートを追加
- 全セクション対応: エグゼクティブサマリー、リーンキャンバス、市場分析（TAM/SAM/SOM）、競合分析、ビジネスモデル、ロードマップ、リスクと対策、ファクトチェック注記
- ファイル: `src/lib/export-plan-pdf.ts`, `src/lib/export-plan-docx.ts`

### 追加パッケージ
- `jspdf`, `html2canvas`, `docx`, `file-saver`, `@types/file-saver`

---

## Phase 3: PAINTプラットフォーム化（2026-04-19）

### プラットフォーム命名決定
- **PAINT = Platform for Augmented Innovation aNd Transformation**
- 検討経緯: AIP（3文字）→ 6文字拡張 → AI連続・意味ある英単語条件 → PAINT に決定
- "Augmented Innovation" の頭文字がAI → AIプラットフォームを自然に内包
- "aNd" のNを使う構造が独創的かつ自然な英語フレーズを形成

### ドメイン取得
- `paint-platform.com` を取得（2026-04-19）
- AideaSpark（旧BizIdea）は `paint-platform.com/aideaspark` に配置

### アーキテクチャ決定
- 単独ドメイン × サブディレクトリ構成を採用
- 理由: SEOオーソリティ集約・認証自動共有・開発効率・投資家向けプラットフォームストーリー
- Phase1: 単一Next.jsアプリ + basePath（現在の実装）
- Phase2: Next.js Multi-zones移行（サービス2〜3個目以降）

### 売却戦略決定
- プラットフォーム全体売却を目標（個別売却より20〜60億円高い試算）
- AIエージェント層がサービス横断データで価値を発揮するため分離不可
- 各サービスのDB境界は明確に設計し、ピボットオプションも残す

### コード変更（AideaSpark → paint-platform.com/aideaspark 移行）
- `next.config.ts`: `basePath: '/aideaspark'` 追加
- `src/lib/api-client.ts`: `NEXT_PUBLIC_BASE_PATH` 環境変数でAPIパスを補完
- `vercel.json`: ルート `/` → `/aideaspark` リダイレクト追加
- `prisma/schema.prisma`: `directUrl` 追加（Supabase対応）

### ネクストステップ
1. ローカル確認: `npm run dev` → `localhost:4001/aideaspark` の動作確認
2. Supabaseプロジェクト作成 → DBマイグレーション実行
3. Vercelプロジェクト作成 → 環境変数設定 → デプロイ
4. DNS設定（paint-platform.com → Vercel）
5. 本番動作確認チェックリスト実施
