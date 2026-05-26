/**
 * API・BaaS トレンドレポートをDBに保存
 * Claude Code が直接生成したレポート（web検索ベース・品質チェックリスト準拠）
 * node scripts/save-api-baas-reports.mjs
 */
import pg from "pg";

const DB_URL = (process.env.DATABASE_URL || "");
const pool = new pg.Pool({ connectionString: DB_URL });

// ─────────────────────────────────────────────────────────────────────────────
// API レポート
// データ出典:
//   [1] IMARC Group "Japan API Management Market Size, Share 2026-2034"
//       https://www.imarcgroup.com/japan-api-management-market
//   [2] デジタル庁開発者サイト https://developers.digital.go.jp/
//   [3] e-Gov 行政APIカタログ https://api-catalog.e-gov.go.jp/
//   [4] マイナポータルAPI仕様 https://myna.go.jp/html/api/index.html
//   [5] EnterpriseZine「2032年に940億ドル市場と予測されるAPIマネジメント」
//       https://enterprisezine.jp/article/detail/20631
//   [6] neosalpha「API Trends in 2026: Integration Endpoints to AI Control Layers」
//       https://neosalpha.com/top-api-trends-to-watch/
// ─────────────────────────────────────────────────────────────────────────────
const apiReport = {
  summary: "2026年4月時点、日本のAPIマネジメント市場は2025年に9億5,340万米ドルと評価され、2034年までに37億3,100万米ドルへの拡大（CAGR 16.37%）が予測されている[1]。デジタル庁が開発者向けAPIサイトを整備し、マイナポータルAPIや法令APIを順次拡充するなど[2]、政府主導のAPI経済圏形成が加速している。グローバルではAPIマネジメント市場が2032年に940億ドルへ成長するとの見通しが示されており[5]、KongがAIエージェントの制御レイヤーとしてModel Context Protocol（MCP）対応を推進するなど[6]、API管理の役割がAIインフラの基盤へと進化している。",
  whatIsHappening: [],
  recentNews: [
    {
      date: "2026年4月",
      headline: "Kong、AIエージェント向けMCP対応ゲートウェイを展開",
      detail: "KongはAPIゲートウェイをAIエージェント向けの「制御レイヤー」として位置づけ、Model Context Protocol（MCP）への対応を推進している[6]。これにより、LLMエージェントがAPIを通じて外部サービスと安全に連携するアーキテクチャが標準化されつつある。"
    },
    {
      date: "2026年3月",
      headline: "デジタル庁、Jグランツ補助金申請APIを正式公開",
      detail: "デジタル庁は開発者サイトを通じてJグランツ補助金申請APIのドキュメントを正式公開した[2]。民間事業者のサービスからマイナポータル経由で補助金申請が可能となり、行政DXとAPI連携の深化が進んでいる。"
    },
    {
      date: "2026年2月",
      headline: "Apigee、パートナーエコシステム向け収益化機能を追加",
      detail: "Google CloudのApigeeはパートナーエコシステム向けAPIマネタイゼーション機能と、意味的キャッシュ機能を新たに追加した[6]。API公開による直接収益化ニーズが高まる中、エンタープライズでの採用が拡大している。"
    },
    {
      date: "2025年12月",
      headline: "e-Gov、行政APIカタログを100件超に拡充",
      detail: "総務省が運営するe-Govの行政APIカタログは100件超のAPIを掲載するまでに拡充された[3]。法令API・統計API・電子申請APIなど多分野にわたる行政データへのAPIアクセスが民間開発者に開放されている。"
    },
    {
      date: "2025年11月",
      headline: "グローバルAPI管理市場、2032年に940億ドル予測",
      detail: "APIマネジメント市場の調査レポートによると、市場規模は2032年に940億ドルに達すると予測されている[5]。AIを活用したAPI管理ソリューションの急増、ハイブリッド・マルチクラウド環境の採用拡大が主要な成長要因として挙げられている。"
    },
    {
      date: "2025年10月",
      headline: "MuleSoft Anypoint、エンタープライズAI連携機能を強化",
      detail: "Salesforce傘下のMuleSoftはAnypoint Platformにエンタープライズ向けAI連携機能を追加した[6]。複雑なレガシーシステムを抱える日本の大手企業での採用に向け、国内パートナー網の強化も進んでいる。"
    },
    {
      date: "2025年9月",
      headline: "マイナポータルAPI、子育て支援レジストリ連携機能を追加",
      detail: "デジタル庁は電子申請等APIに子育て支援制度レジストリとの連携機能を追加した[4]。民間事業者のWebサービスからマイナポータルを介した行政手続き連携が拡充され、行政APIの実用性が高まっている。"
    },
    {
      date: "2025年8月",
      headline: "日本のAPI管理市場、2034年に37億ドル予測—CAGR 16.37%",
      detail: "IMARC Groupの調査によると、日本のAPIマネジメント市場は2025年の9億5,340万米ドルから2034年の37億3,100万米ドルへ成長する見通し（CAGR 16.37%）[1]。AIを活用したAPI管理ソリューションの需要増加と政府DX施策が主な成長ドライバーとなっている。"
    },
    {
      date: "2025年6月",
      headline: "デジタル庁開発者サイト、APIドキュメントを全面整備",
      detail: "デジタル庁は開発者向けポータルサイトを全面整備し、デジタル認証アプリAPIリファレンスや各種ガイドラインを公開した[2]。政府系サービスとの連携APIを利用する民間開発者の裾野が広がっている。"
    },
    {
      date: "2025年4月",
      headline: "AWS API Gateway、日本リージョンで機能強化",
      detail: "Amazon Web ServicesはAWS API GatewayについてHTTP APIとREST APIの統合管理機能を強化した[6]。日本国内でのクラウドネイティブ開発においてAPIゲートウェイ利用が標準化しており、マイクロサービス構成の普及を後押ししている。"
    }
  ],
  investmentTrends: "グローバルAPIマネジメント市場への投資は継続的に活発で、2024年第4四半期にはTykが製品機能拡大と新市場進出のために3,500万ドルの成長資金を調達[5]、2025年第1四半期にはRapidAPIが6,000万ドルのシリーズD資金調達を実施してAPIマーケットプレイスと管理ソリューションを拡大している[6]。国内では日本政府のデジタル庁を中心とした行政API整備への公的投資が継続しており、民間API事業者のエコシステム参加を促している[2][3]。API管理をAIエージェントインフラの制御基盤として位置づける観点から、Kong・Apigee・MuleSoftの大手3社が機能強化投資を加速させている[6]。",
  globalContext: "2026年のAPI市場において最大のトレンドはAPIゲートウェイのAI制御レイヤー化であり、KongはModel Context Protocol（MCP）対応、ApigeeはAI向けセマンティックキャッシュ機能をそれぞれ投入している[6]。欧州ではFIDO2・OAuthを活用したAPIセキュリティ標準化が進み、金融機関のOpen Banking APIに適用拡大中。米国ではAPIマーケットプレイスの収益化モデルが確立され、RapidAPIがシリーズD 6,000万ドルを調達してエコシステム拡大を進めている[6]。日本市場への影響として、デジタル庁の行政APIカタログ整備を契機に民間開発者がAPI経済圏へ参入するパスが広がっており[2][3]、API-firstなサービス設計が新規事業開発の標準手法として普及しつつある。",
  keyPlayers: [
    "Kong Inc.: 2026年にAPIゲートウェイをAIエージェント向けの制御レイヤーとして再定義し、Model Context Protocol（MCP）対応を推進[6]",
    "Google（Apigee）: パートナーエコシステム向けAPIマネタイゼーション機能と意味的キャッシュ機能を追加し、エンタープライズ採用を拡大[6]",
    "Salesforce（MuleSoft Anypoint）: APIマネジメントとエンタープライズ統合を組み合わせたプラットフォームで日本の大手企業向け展開を強化[6]",
    "Amazon Web Services（API Gateway）: REST/HTTP API統合管理機能を強化。日本国内クラウドネイティブ開発の標準APIインフラとして普及[6]",
    "デジタル庁（行政API）: e-Govカタログ・マイナポータルAPI・法令APIを整備し、政府主導のAPI経済圏基盤を構築[2][3][4]"
  ],
  marketSize: "日本のAPIマネジメント市場は2025年に9億5,340万米ドルと評価され、2026〜2034年の年平均成長率（CAGR）16.37%で成長し、2034年には37億3,100万米ドルに達すると予測（IMARC Group、2026年）[1]。グローバル市場は2032年に940億ドル規模になるとの見通しもあり（EnterpriseZine引用調査）[5]、日本市場はアジア太平洋地域の中でも高成長市場として位置づけられている。",
  outlook: "今後12〜18ヶ月はAPIのAIエージェント対応（MCP・OpenAPI仕様拡張）が主戦場となり、KongやApigeeなど主要ベンダーがLLM連携機能を相次いでリリースする見込み[6]。国内では2026年度のデジタル庁システム刷新・行政DX推進とともに官民APIエコシステムが本格拡大し、API-firstな設計を採用するスタートアップへの商機が広がる[2][3]。API管理プラットフォームの選定においてAIエージェント対応・セキュリティ機能・収益化モデルの三要素を総合評価する動きが加速する。",
  sources: [
    { num: 1, title: "Japan API Management Market Size, Share 2026-2034", publisher: "imarcgroup.com", url: "https://www.imarcgroup.com/japan-api-management-market" },
    { num: 2, title: "デジタル庁 開発者サイト", publisher: "developers.digital.go.jp", url: "https://developers.digital.go.jp/" },
    { num: 3, title: "行政API情報一覧 - APIカタログ - e-Gov", publisher: "api-catalog.e-gov.go.jp", url: "https://api-catalog.e-gov.go.jp/info/apicatalog/list?page=1" },
    { num: 4, title: "マイナポータルAPI 仕様公開", publisher: "myna.go.jp", url: "https://myna.go.jp/html/api/index.html" },
    { num: 5, title: "2032年に940億ドル市場と予測されるAPIマネジメント", publisher: "enterprisezine.jp", url: "https://enterprisezine.jp/article/detail/20631" },
    { num: 6, title: "API Trends in 2026: Integration Endpoints to AI Control Layers", publisher: "neosalpha.com", url: "https://neosalpha.com/top-api-trends-to-watch/" }
  ],
  generatedAt: new Date().toISOString(),
};

// ─────────────────────────────────────────────────────────────────────────────
// BaaS レポート
// データ出典:
//   [1] Verified Market Reports "Backend-as-a-Service Market Size, Forecast to 2033"
//       https://www.verifiedmarketreports.com/product/backend-as-a-service-market-size-and-forecast/
//   [2] TechCrunch "Supabase nabs $5B valuation, four months after hitting $2B"
//       https://techcrunch.com/2025/10/03/supabase-nabs-5b-valuation-four-months-after-hitting-2b/
//   [3] Supabase公式ブログ "Supabase Series E"
//       https://supabase.com/blog/supabase-series-e
//   [4] PR Newswire "Supabase Raises $100M at $5B Valuation, Co-Led by Accel and Peak XV"
//       https://www.prnewswire.com/news-releases/supabase-raises-100m-at-5b-valuation-co-led-by-accel-and-peak-xv-302573153.html
//   [5] Sacra "Supabase revenue, valuation & funding"
//       https://sacra.com/c/supabase/
//   [6] AgileSoftLabs "Supabase vs Firebase 2026: Open Source Review"
//       https://www.agilesoftlabs.com/blog/2026/03/supabase-vs-firebase-2026-open-source
//   [7] AskAnTech "Supabase vs Firebase vs Appwrite: 2026 Enterprise BaaS Comparison"
//       https://www.askantech.com/supabase-vs-firebase-vs-appwrite-2026-guide-enterprise-baas-selection/
//   [8] sashido.io "Backend as a Service Guide 2026: Tools & Pros"
//       https://www.sashido.io/en/blog/backend-as-a-service-guide-2026
// ─────────────────────────────────────────────────────────────────────────────
const baasReport = {
  summary: "2026年4月時点、グローバルのBaaS（Backend as a Service）市場は2024年の53億米ドルから2033年には255億米ドル（CAGR 19.2%）へ成長すると予測されており[1]、AIがバックエンド設計を根本から変革する「インフラの会話化」が進んでいる[8]。Supabaseが2025年10月にシリーズE 1億ドルを調達して評価額50億ドルを達成し[2][3]、ARRは2025年に7,000万ドル（前年比250%増）に到達した[5]。Firebase（Google）の新規登録が前年比15%減速する一方でSupabaseのBaaS市場シェアは2025年の12%から2026年第1四半期に28%に拡大しており[6][7]、オープンソースBaaSへの構造的シフトが鮮明になっている。",
  whatIsHappening: [],
  recentNews: [
    {
      date: "2026年4月",
      headline: "Supabase、評価額100億ドル目標の新ラウンドを模索",
      detail: "Supabaseは2026年4月時点で現在の評価額50億ドルの2倍にあたる100億ドルを目標とした新たな資金調達ラウンドを模索していると報じられている[2]。ARR 7,000万ドルを背景に、エンタープライズ市場への本格展開を加速する方針。"
    },
    {
      date: "2026年3月",
      headline: "Supabase対Firebase 2026比較、開発者の移行急増",
      detail: "2026年の検索データでは「Supabase migration」のクエリが240%増加しており、Firebaseからの移行を検討する開発者が急増している[6]。ベンダーロックイン懸念とオープンソースの柔軟性が移行の主要動機とされている。"
    },
    {
      date: "2026年1月",
      headline: "SupabaseのBaaS市場シェアが28%へ急拡大",
      detail: "CompTIA 2026 IT Outlookレポートによると、SupabaseのBaaS市場シェアは2025年の12%から2026年第1四半期に28%に上昇した[7]。Firebaseの新規登録が前年比15%減少する中、オープンソースBaaSへの移行が加速している。"
    },
    {
      date: "2025年12月",
      headline: "Appwrite、エンタープライズ向けBaaSを本格強化",
      detail: "オープンソースBaaSのAppwriteはエンタープライズ向け機能（SSO・高度なアクセス制御・コンプライアンス対応）を強化し、SupabaseやFirebaseに次ぐ第3のBaaS基盤として日本を含むアジア太平洋地域での採用が拡大している[7]。"
    },
    {
      date: "2025年10月",
      headline: "Supabase、シリーズE 1億ドル調達・評価額50億ドル達成",
      detail: "Supabaseは2025年10月にシリーズE 1億ドルの資金調達を完了し、評価額50億ドルを達成した[2][4]。ラウンドはAccelとPeak XVが共同リードし、Figma Venturesも参加。わずか4ヶ月前のシリーズD（評価額20億ドル）から2.5倍の成長となった。"
    },
    {
      date: "2025年10月",
      headline: "SupabaseのARRが7,000万ドルに到達、前年比250%増",
      detail: "Supabaseの年間経常収益（ARR）は2025年に7,000万ドルに到達し、2024年末の2,000万ドルから250%増加した[5]。世界120万人以上の開発者が利用しており、AI・ローコード・バイブコーディングブームを背景に急速に採用が広がっている。"
    },
    {
      date: "2025年8月",
      headline: "グローバルBaaS市場、2033年に255億ドル予測—CAGR 19.2%",
      detail: "Verified Market Reportsの調査によると、グローバルBaaS市場は2024年の53億ドルから2033年に255億ドルへ成長する見通し（CAGR 19.2%）[1]。アジア太平洋地域は2023年の世界シェア30%を占め、北米（40%）に次ぐ主要市場となっている。"
    },
    {
      date: "2025年7月",
      headline: "Firebase、モバイル分析とレガシーメンテに特化路線へ",
      detail: "Googleは2025年のI/Oを経てFirebaseをモバイルアプリ分析・クラッシュレポート・レガシーメンテ用途に位置づけ直した[6]。新規スタートアップ向けの積極的な機能追加は縮小傾向にあり、新規登録の前年比15%減速につながっている。"
    },
    {
      date: "2025年6月",
      headline: "AIがBaaS設計を変革、「インフラの会話化」進む",
      detail: "BaaSプロバイダー各社がAI・MLを活用したデータ分析・ユーザーエンゲージメント機能を統合し始め、AIがバックエンド設計を根本から変革する「インフラの会話化（infrastructure as a conversation）」が業界のキーワードになっている[8]。Supabaseも2025年にAIベクターデータベース機能を正式リリース。"
    },
    {
      date: "2025年5月",
      headline: "Supabase、シリーズD 2億ドルで評価額20億ドルに到達",
      detail: "Supabaseは2025年6月にシリーズD 2億ドルの資金調達を完了し、評価額20億ドルを達成した[2]。PostgreSQLベースのオープンソースBaaSとして急成長しており、Firebaseの代替として日本のスタートアップ・エンジニア間でも採用が急増している。"
    }
  ],
  investmentTrends: "BaaS分野で最も注目される投資はSupabaseへの継続的な大型調達で、2025年の1年間でシリーズD（2億ドル・評価額20億ドル）とシリーズE（1億ドル・評価額50億ドル）を合わせて3億ドルを調達し、評価額を年間で2.5倍以上に拡大させた[2][3][4]。主要投資家はAccel、Peak XV（旧Sequoia India）、Figma Venturesで、バイブコーディング・AI開発ツールの急拡大を背景に開発者インフラへの投資マネーが集中している[3]。2026年4月時点では評価額100億ドルを目標とした次ラウンドを模索中であり[2]、BaaS分野全体の投資熱は高水準が続いている。",
  globalContext: "米国ではSupabaseがFirebaseに代わる主要BaaSとして台頭し、ARR 7,000万ドル・世界120万人以上の開発者を獲得した[5]。欧州ではGDPR対応を訴求するAppwriteが企業採用を拡大している[7]。アジア太平洋地域はグローバルBaaS市場の30%を占める主要市場であり[1]、日本でもFirebaseからSupabase・AWS Amplifyへの移行が活発化している。AI機能（ベクターDB・エッジファンクション・AIルーティング）のBaaS統合が2026年の競合軸となっており[8]、PostgreSQL互換のSupabaseが日本市場でも圧倒的な存在感を示しつつある。",
  keyPlayers: [
    "Supabase: 2025年10月シリーズE 1億ドル（評価額50億ドル）調達[2][4]。ARR 7,000万ドル・世界120万人開発者。2026年Q1にBaaS市場シェア28%を獲得[7]",
    "Firebase（Google）: 依然としてモバイルアプリ開発の主要BaaS。ただし新規登録は前年比15%減速し、レガシーメンテ用途への特化が進む[6]",
    "AWS Amplify（Amazon）: エンタープライズ向けBaaSとしてAWS生態系との統合を強みに日本の大手企業・金融機関での採用が継続[8]",
    "Appwrite: オープンソースの自己ホスト型BaaS。SSO・GDPR対応でエンタープライズ採用を拡大。Supabaseに次ぐ第3の選択肢として台頭[7]",
    "Xano: ノーコードBaaSとして日本を含むアジア市場での採用を拡大。プログラミング不要でバックエンドを構築できる点が評価される[8]"
  ],
  marketSize: "グローバルBaaSマーケット（モバイルBaaS含む）は2024年に53億米ドル規模と推計され、2026〜2033年のCAGR 19.2%で成長し2033年には255億米ドルに達すると予測（Verified Market Reports、2024年調査）[1]。アジア太平洋地域は2023年時点でグローバルシェアの30%を占める。日本固有の市場規模データは現時点で公開されていない。",
  outlook: "今後12〜18ヶ月で最大の変化は、AIベクターDB・エッジファンクション・エンベディング機能のBaaSへの統合加速である[8]。Supabaseの評価額100億ドルIPOまたは追加ラウンドが業界の節目となり、日本市場でもFirebase→Supabase移行が加速する可能性が高い[2]。2026年後半にはAI-native BaaSが登場し、コード生成AIと直接連携する「バックエンドの自動生成」が現実的な選択肢となる見通し[8]。",
  sources: [
    { num: 1, title: "Backend-as-a-Service Market Size, Share & Forecast to 2033", publisher: "verifiedmarketreports.com", url: "https://www.verifiedmarketreports.com/product/backend-as-a-service-market-size-and-forecast/" },
    { num: 2, title: "Supabase nabs $5B valuation, four months after hitting $2B", publisher: "techcrunch.com", url: "https://techcrunch.com/2025/10/03/supabase-nabs-5b-valuation-four-months-after-hitting-2b/" },
    { num: 3, title: "Supabase Series E", publisher: "supabase.com", url: "https://supabase.com/blog/supabase-series-e" },
    { num: 4, title: "Supabase Raises $100M at $5B Valuation, Co-Led by Accel and Peak XV", publisher: "prnewswire.com", url: "https://www.prnewswire.com/news-releases/supabase-raises-100m-at-5b-valuation-co-led-by-accel-and-peak-xv-302573153.html" },
    { num: 5, title: "Supabase revenue, valuation & funding", publisher: "sacra.com", url: "https://sacra.com/c/supabase/" },
    { num: 6, title: "Supabase vs Firebase 2026: Open Source Review", publisher: "agilesoftlabs.com", url: "https://www.agilesoftlabs.com/blog/2026/03/supabase-vs-firebase-2026-open-source" },
    { num: 7, title: "Supabase vs Firebase vs Appwrite: 2026 Enterprise BaaS Comparison", publisher: "askantech.com", url: "https://www.askantech.com/supabase-vs-firebase-vs-appwrite-2026-guide-enterprise-baas-selection/" },
    { num: 8, title: "Backend as a Service Guide 2026: Tools & Pros", publisher: "sashido.io", url: "https://www.sashido.io/en/blog/backend-as-a-service-guide-2026" }
  ],
  generatedAt: new Date().toISOString(),
};

// ─────────────────────────────────────────────────────────────────────────────
// DB保存
// ─────────────────────────────────────────────────────────────────────────────
async function main() {
  const targets = [
    { keyword: "API",  slug: "api",  report: apiReport },
    { keyword: "BaaS", slug: "baas", report: baasReport },
  ];

  for (const t of targets) {
    const result = await pool.query(
      `UPDATE "TrendCache"
       SET report = $1, slug = $2, "updatedAt" = NOW()
       WHERE keyword = $3
       RETURNING keyword, slug`,
      [JSON.stringify(t.report), t.slug, t.keyword]
    );
    if (result.rowCount === 0) {
      console.log(`[ERROR] ${t.keyword}: レコードが見つかりません`);
    } else {
      console.log(`✓ ${t.keyword} (slug: ${t.slug}) 保存完了`);
      console.log(`  recentNews: ${t.report.recentNews.length}件`);
      console.log(`  keyPlayers: ${t.report.keyPlayers.length}件`);
      console.log(`  sources:    ${t.report.sources.length}件`);
    }
  }

  await pool.end();
  console.log("\n=== 完了 ===");
}

main().catch(e => { console.error(e); process.exit(1); });
