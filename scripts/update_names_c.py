"""#38-#55: serviceName / slug / oneLiner / concept(冒頭)一括更新"""
import io, sys, os, psycopg2
if sys.stdout.encoding and sys.stdout.encoding.lower() != "utf-8":
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")
try:
    from dotenv import load_dotenv; load_dotenv()
except ImportError:
    pass

updates = [
    {
        "number": 38,
        "serviceName": "CyberShield",
        "slug": "cyber-shield-38",
        "oneLiner": "AI診断で脆弱性を優先度付きで可視化し即日対策を提示するセキュリティSaaS",
        "conceptLead": "【新規性】脆弱性診断結果を「リスク×コスト」でスコアリングし優先対策をロードマップ形式で提示する中小企業向けサイバーSaaSは初。",
    },
    {
        "number": 39,
        "serviceName": "ペットカルテAI",
        "slug": "pet-carte-ai-39",
        "oneLiner": "診察・カルテ・予約・会計をAIで一元管理する動物病院特化クラウドSaaS",
        "conceptLead": "【新規性】動物病院の診察記録・予約・会計・薬剤在庫をAIが横断管理し、電子カルテと予約システムの二重管理コストを解消する初の設計。",
    },
    {
        "number": 40,
        "serviceName": "法人保険ナビ",
        "slug": "hojin-hoken-navi-40",
        "oneLiner": "保険証券の一元管理と過不足のAI診断を自動化する法人経営者向けSaaS",
        "conceptLead": "【新規性】複数保険会社の証券をOCRで自動読み取りしリスクカバレッジの過不足をAIが可視化する法人保険管理SaaSは国内初。",
    },
    {
        "number": 41,
        "serviceName": "ブライダルAI",
        "slug": "bridal-ai-41",
        "oneLiner": "予約・接客・顧客管理をAIで一元化しブライダル業務の属人化を解消するSaaS",
        "conceptLead": "【新規性】見学予約・商談記録・プラン提案・顧客フォローをAIが一元化し式場スタッフの属人スキルに依存しない接客設計は国内初。",
    },
    {
        "number": 42,
        "serviceName": "産後ナビ",
        "slug": "sango-navi-42",
        "oneLiner": "産後うつリスクをAIが早期検知し自治体サービスにつなぐ育児支援アプリ",
        "conceptLead": "【新規性】産後うつのリスクスコアをAIが算出し、スコアに応じた自治体支援サービスへの自動案内まで完結するアプリは国内未存在。",
    },
    {
        "number": 43,
        "serviceName": "イベントAI",
        "slug": "event-ai-43",
        "oneLiner": "集客LP自動生成から申込・参加者管理・フォローまで一気通貫のイベントSaaS",
        "conceptLead": "【新規性】LP生成→申込フォーム→決済→参加者管理→事後フォローまでイベント全工程をAIが一気通貫する設計は中小向けイベントSaaSで初。",
    },
    {
        "number": 44,
        "serviceName": "採用ページAI",
        "slug": "saiyo-page-ai-44",
        "oneLiner": "質問に答えるだけで採用サイトをAIが即日作成する中小企業向けSaaS",
        "conceptLead": "【新規性】採用担当者が質問に答えるだけでSEO最適化済みの採用サイトをAIが即日生成する設計は中小企業向け採用SaaSで初。",
    },
    {
        "number": 45,
        "serviceName": "ペットサロンAI",
        "slug": "pet-salon-ai-45",
        "oneLiner": "予約・顧客管理・LINE連携を一元化するペットサロン・トリミング特化SaaS",
        "conceptLead": "【新規性】LINE予約・トリミング記録・ペット写真アルバム・リマインド通知をワンSaaSで完結するペットサロン特化設計は国内未確認。",
    },
    {
        "number": 46,
        "serviceName": "農場ナビAI",
        "slug": "nojo-navi-ai-46",
        "oneLiner": "収量予測と農薬最適化のAI一体提案は国内初。農業法人向けスマート農業SaaS",
        "conceptLead": "【新規性】収量予測AIと農薬投入量最適化AIを単一SaaSで同時提案するのは国内農業IoT市場で初の試み。",
    },
    {
        "number": 47,
        "serviceName": "補助金AI申請",
        "slug": "hojyokin-ai-sinsyou-47",
        "oneLiner": "マッチングから生成AI申請書作成・専門家連携まで採択を伴走するSaaS",
        "conceptLead": "【新規性】補助金マッチング・生成AIによる申請書自動ドラフト・採択事例分析・行政書士連携を一体化した「採択伴走型」SaaSは国内初。",
    },
    {
        "number": 48,
        "serviceName": "ケアルート",
        "slug": "care-route-48",
        "oneLiner": "ルート最適化とシフト自動作成で訪問看護ステーションの残業を削減するSaaS",
        "conceptLead": "【新規性】訪問ルート最適化とスタッフシフト自動生成を連動させ移動時間と残業を同時削減する訪問看護特化設計は国内で未確認。",
    },
    {
        "number": 49,
        "serviceName": "塾マネ",
        "slug": "juku-mane-49",
        "oneLiner": "LINE報告・月謝管理・シフトを5,000円から一元化する個別指導塾専用SaaS",
        "conceptLead": "【新規性】保護者へのLINE自動学習レポート・月謝請求・シフト管理を月額5,000円から提供する個別指導塾特化のオールインワンは初。",
    },
    {
        "number": 50,
        "serviceName": "衛生ログ",
        "slug": "eisei-log-50",
        "oneLiner": "1分入力＋温度センサー連携でHACCP記録を完全ペーパーレス化するアプリ",
        "conceptLead": "【新規性】IoT温度センサーとスマホ入力を連携させHACCP記録と保健所対応書類を同時自動生成する飲食店特化設計は国内未整備。",
    },
    {
        "number": 51,
        "serviceName": "宅建サイン",
        "slug": "takken-sign-51",
        "oneLiner": "IT重説から電子署名・書類保管まで宅建業法準拠で一気通貫完結するSaaS",
        "conceptLead": "【新規性】35条書面のIT重説確認フロー・37条書面の電子署名・書類保管を宅建業法準拠で一体管理するのは不動産特化SaaSで初。",
    },
    {
        "number": 52,
        "serviceName": "歯科経営AI",
        "slug": "shika-keiei-ai-52",
        "oneLiner": "AIリコールと予約最適化で来院率と自由診療比率を同時改善する歯科SaaS",
        "conceptLead": "【新規性】患者リコール予測・予約枠最適化・経営KPIダッシュボードを一体化し来院率と収益性を同時改善する歯科経営SaaSは初。",
    },
    {
        "number": 53,
        "serviceName": "清掃ナビAI",
        "slug": "seiso-navi-ai-53",
        "oneLiner": "QRと写真で作業報告・品質管理・発注企業報告書を自動完結するビルメンアプリ",
        "conceptLead": "【新規性】QRコード＋写真撮影だけで作業完了確認・品質チェック・発注企業向けPDF報告書を自動生成するビルメン特化設計は国内初。",
    },
    {
        "number": 54,
        "serviceName": "店舗シフトAI",
        "slug": "tenpo-shift-ai-54",
        "oneLiner": "シフト管理と在庫補充をAI需要予測で連動させた国内初の中小小売向けSaaS",
        "conceptLead": "【新規性】シフト必要人員数と在庫補充タイミングをAI需要予測で連動させる一体型SaaSは国内の中小小売市場に存在しない設計。",
    },
    {
        "number": 55,
        "serviceName": "旅デスク",
        "slug": "tabi-desk-55",
        "oneLiner": "行程・手配・原価・多言語書類を一元管理する中小旅行代理店向けクラウドSaaS",
        "conceptLead": "【新規性】行程作成・仕入手配・原価管理・インバウンド多言語書類生成をワンSaaSで完結する中小旅行代理店特化設計は国内未整備。",
    },
]

conn = psycopg2.connect(os.environ["DATABASE_URL"])
try:
    cur = conn.cursor()
    for u in updates:
        cur.execute("""
            UPDATE "Idea"
            SET "serviceName" = %s,
                slug = %s,
                "oneLiner" = %s,
                concept = CONCAT(%s, concept),
                "updatedAt" = NOW()
            WHERE number = %s
        """, (u["serviceName"], u["slug"], u["oneLiner"], u["conceptLead"], u["number"]))
        print(f"#{u['number']} → {u['serviceName']} ({u['slug']})")
    conn.commit()
    print("[完了] #38-#55 更新済み")
finally:
    conn.close()
