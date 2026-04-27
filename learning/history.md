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

---

## Phase 4: アイデアDB大規模ファクトチェック監査（2026-04-27）

### 監査概要
- **対象**: Supabase Ideaテーブル 全100件 × 全フィールド（concept/target/problem/product/revenueModel/competitors/competitiveEdge/whyNow/strengthNote）
- **手法**: 10エージェント並列 × WebSearch × Supabase直接UPDATE（node-postgres）
- **ラウンド数**: 13回（各回で全100件を検証）
- **累計修正件数**: 約344件

### 修正件数推移
| ラウンド | 修正件数 | 主な発見 |
|---------|---------|---------|
| 第1〜5回 | 累計〜120件 | 廃止サービス除去、義務化誤記、食材ロス率誤り |
| 第6〜8回 | 累計〜200件 | EU CSDDD日程誤り、金融リテラシー順位誤り、競合料金陳腐化 |
| 第9〜10回 | 累計〜276件 | 補助金件数、フリーランス人口、EC市場規模 |
| 第11回 | +16件 | 道路運送法条文誤り、農薬上昇率出典誤り、孤立対策法施行済み |
| 第12回 | +15件 | CSDDD日程再修正、教員数35%過大、農機シェア競合追加 |
| 第13回 | +12件 | 離職率比較逆転、らでぃっしゅぼーや統合日、HiPro名称誤り |

### 主要な発見・修正カテゴリ
1. **廃止済みサービス**: SEND/Quotta/LINEヘルスケア/FiNC/カメカリ/ぐるなび仕入モール等を競合から削除
2. **義務化誤用**: Scope3/人権DD/EAP投資/インボイス/サイバーセキュリティ等
3. **数値誤り**: 食材ロス率（15〜30%→3〜5%）、教員数（90万→66万）、有効求人倍率など
4. **企業名・サービス名**: HiPro Biz→Direct、スピーダ統合、GVA→OLGA、ELEMENTS表記
5. **EU CSDDD日程**: Omnibus I改正を反映（2028年7月転置・2029年7月適用が正確）
6. **競合料金陳腐化**: Design Pickle/Penji/ビザスクliteの料金体系更新
7. **統計の対象範囲誤り**: 介護離職率の全産業比較が古いデータとの比較で逆転

### 技術的実装
```javascript
// 標準UPDATEパターン
import pg from 'pg';
const pool = new pg.Pool({
  connectionString: 'postgresql://postgres:***@db.oszprtmhokcqajxvtfnt.supabase.co:5432/postgres'
});
await pool.query(
  'UPDATE "Idea" SET "フィールド名" = $1, "updatedAt" = NOW() WHERE number = $2',
  [新しい値, 番号]
);
await pool.end();
```

### 今後の対応方針
- competitors フィールドは最陳腐化リスクが高い → 6ヶ月ごとの定期再検証
- アイデア生成時にWebSearchを組み込み初期品質を担保
- 「義務化」「唯一」「急増」含むフィールドを優先監査対象に指定
- 詳細な学びは `learnings.md` の「アイデアDBファクトチェック監査」セクションを参照

---

## Phase 4.5: ideas.ts 静的データ ファクトチェック第2ラウンド（2026-04-27）

### 背景
Phase 4でSupabase Ideaテーブルを344件修正したが、フロントエンド静的データファイル
`src/data/mock/ideas.ts` はSupabase移行前の別データソースとして残存しており、
DB修正が未反映だった。本フェーズで静的ファイル側を独立して全件再検証した。

### 実施内容
- ideas.ts 全100件 × 全フィールドをWebSearch並列検証
- 照合項目: 20件以上（統計数値・競合情報・法令記述）
- 修正件数: 1件（全セッション通算5件）

### 修正内容
| ID | フィールド | 修正内容 |
|---|---|---|
| idea-064 | competitiveEdge | Design Pickle「旧固定月額プランとの並行運用中」→「従来の固定月額プランを廃止」（2025年6月3日完全移行を確認） |

### 確認済み項目（正確だったもの・主要20件）
| 統計・事実 | 確認結果 |
|---|---|
| 介護従事者212.6万人（2023年） | ○ 厚労省一致 |
| スキンケア市場1.2兆円（2024年） | ○ 矢野経済研究所一致 |
| フリーランス保護法2024年11月1日施行 | ○ 公正取引委員会一致 |
| クラフトビール醸造所800以上 | ○ ブルワーズ協会一致 |
| NPO法人4.93万件（2024年） | ○ 内閣府一致 |
| 飲食店55万店 | ○ 総務省経済センサス一致 |
| カーシェア市場900億円 | △ 確定ソース未発見・2023年700〜800億円から推計値として合理的 |
| Design Pickle新料金体系（2025年6月〜） | ○ 完全移行確認・誤記1件修正 |

### 教訓
- DBと静的ファイル（ideas.ts）が並存する間は、修正を必ず両方に同時適用すること
- Phase 4の大規模監査（344件修正）後の残存ハルシネーションは1件のみで品質が担保されていた
- 詳細な学びは `learnings.md` の「ideas.ts 静的データ ファクトチェック第2ラウンド」セクションを参照

---

## Phase 4.6: ideas.ts 静的データ ファクトチェック R10〜R11（2026-04-27）

### 実施概要
Phase 4.5に引き続き、ideas.ts（全100件）のさらなるファクトチェックを2ラウンド追加実施。
4並列バックグラウンドエージェント × WebSearch を各ラウンドで展開。

### R10（4並列・11件修正）

**主な修正内容:**

| ID | フィールド | 修正内容 |
|---|---|---|
| idea-014 VoiceLab | scoreComments.growth | 「ITR調査16.9%」→「ITR発表（2024年9月）前年度比21.0%増・150億円規模」 |
| idea-033 PetFresh | scoreComments.marketSize | 「数千億円規模」→「約1.9兆円（2024年度・矢野経済研究所2025年8月発表）」 |
| idea-043 ケアブリッジ | competitiveEdge | カナミックの機能説明を正確化（家族連携機能あり・施設主導の情報共有に留まる点を差別化軸に） |
| idea-045 トラメシ | competitiveEdge | 「MELLOWは個人・零細に敷居が高い」→「3,630店超支援・都市/法人向けが主体」に修正 |
| idea-056 ケアモノ市場 | scoreComments.marketSize | 「約1,500〜1,600件規模」→「約1,570件規模（786+784の正確な合計）」 |
| idea-064 デザインし放題 | competitiveEdge | 「旧プランとの並行運用中」→「旧unlimited設計を廃止し新体系に完全移行」 |
| idea-070 DataGuard | problem | 「数百万円のコスト」→「数百万〜数千万円（重篤な場合は億単位）」に現実的な幅を付記 |
| idea-077 クローゼット回遊 | problem | 「70%以上が年1回以下」（出典未確認）→ 定性表現に修正 |
| idea-077 クローゼット回遊 | competitors | 「ラクサス」（バッグ専門・文脈不一致）→ 衣類シェアサービスに差し替え |
| idea-079 スペアハウス | competitors | 「WeShare（ウィーシェア）」（実在未確認）→ 削除 |
| idea-081 GrantFinder | problem | 「年間2,000件以上」（実態より大幅過小）→「数万件規模」に修正 |
| idea-091 NinjaVerify | problem/competitiveEdge | 「LIQUIDは大企業向け固定費モデル」→実際は月額30,000円+従量課金で中小対応可能 |
| idea-099 PropMatch | competitiveEdge | 「唯一のAPI」→「ほぼ前例のないアプローチ」（誇張排除） |
| idea-100 SendSmart | competitiveEdge | 「唯一のメール配信API」→「日本キャリア固有仕様に深く特化した」（誇張排除） |

### R11（4並列・4件修正）

**主な修正内容:**

| ID | フィールド | 修正内容 |
|---|---|---|
| idea-015 フリ申告 | scoreComments.marketSize | 「副業者約332万人」→「副業がある者約305万人（非農林業）」（総務省公式値に修正） |
| idea-043 ケアブリッジ | competitiveEdge | カナミック導入件数「40,500件超」→「52,700件超（2025年9月時点）」（最新値に更新） |
| idea-060 おしえるBank | scoreComments.marketSize | 「100万人超」（根拠未確認）→「学校教員約95万人、塾・習い事講師含め100万人規模」に出典明確化 |
| idea-070 DataGuard | problem | 「警察庁・JNSA調査では」→「警察庁調査（令和6年）では」（JNSAに50%数値の根拠なし） |

### 品質到達状況
- R11終了時点で全100件中ほぼ全件が「修正不要」と確認
- 残存リスクは競合サービスの導入実績の古さ（時点付き記載で管理）と、競合料金の陳腐化のみ
- 6ヶ月ごとの定期再検証を推奨（特に `competitors`・`competitiveEdge` フィールド）

### 教訓
- 繰り返しチェックは収穫逓減する。3〜5ラウンドで大半の誤りが除去され、以降は精度向上のみ
- 詳細な新発見パターン（K〜P）は `learnings.md` の「R10〜R11」セクションを参照
