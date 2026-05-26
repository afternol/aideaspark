"""#20-#37: serviceName / slug / oneLiner / concept(冒頭)一括更新"""
import io, sys, os, psycopg2
if sys.stdout.encoding and sys.stdout.encoding.lower() != "utf-8":
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")
try:
    from dotenv import load_dotenv; load_dotenv()
except ImportError:
    pass

updates = [
    {
        "number": 20,
        "serviceName": "補助金ナビ",
        "slug": "hojyokin-navi-20",
        "oneLiner": "事業内容を入力するだけで最適補助金をAIが提案する中小企業向けSaaS",
        "conceptLead": "【新規性】業種・規模・課題の3項目入力のみで補助金候補を自動抽出する「検索ゼロ」設計は中小企業向け補助金SaaSで初。",
    },
    {
        "number": 21,
        "serviceName": "シニアマッチ",
        "slug": "senior-match-21",
        "oneLiner": "65歳超の即戦力シニアをプロジェクト単位で活用するシニア特化マッチング",
        "conceptLead": "【新規性】65歳以上のプロ人材を「週2日・スポット」で活用する日本初のシニア特化プロジェクト単位マッチングSaaS。",
    },
    {
        "number": 22,
        "serviceName": "こころケアAI",
        "slug": "kokoro-care-ai-22",
        "oneLiner": "50人未満にもストレスチェック義務化対応を低コストで実現するAI SaaS",
        "conceptLead": "【新規性】2025年施行の50人未満へのストレスチェック義務拡大に特化し、専任担当者なしでAIが対応完結する設計は国内初。",
    },
    {
        "number": 23,
        "serviceName": "フリーOps",
        "slug": "free-ops-23",
        "oneLiner": "案件・請求・税務をAIが一元管理するフリーランス向けオールインワンSaaS",
        "conceptLead": "【新規性】案件管理・請求書発行・経費記録・確定申告をAIが横断管理するフリーランス特化オールインワンは国内未整備の設計領域。",
    },
    {
        "number": 24,
        "serviceName": "安全教育AI",
        "slug": "anzen-kyoiku-ai-24",
        "oneLiner": "スマホ動画で安全教育から修了証発行まで完結する建設業向けeラーニング",
        "conceptLead": "【新規性】建設現場の安全教育→テスト→修了証発行までをスマホ完結させ法定教育記録も自動保存する建設業eラーニングは市場空白。",
    },
    {
        "number": 25,
        "serviceName": "CompliBot",
        "slug": "compli-bot-25",
        "oneLiner": "ハラスメント診断から研修まで一気通貫で自動完結するコンプライアンスAI",
        "conceptLead": "【新規性】ハラスメントリスク診断・eラーニング研修・修了記録管理を一つのAIで完結させる中小企業向けコンプライアンスSaaSは初の試み。",
    },
    {
        "number": 26,
        "serviceName": "フードロスAI",
        "slug": "foodloss-ai-26",
        "oneLiner": "AI需要予測で食材ロスを削減し原価改善まで提案する中小飲食専用SaaS",
        "conceptLead": "【新規性】廃棄予測に加えて「代替メニュー提案」「原価改善シミュレーション」まで一体提案するのは中小飲食専用SaaSとして国内初。",
    },
    {
        "number": 27,
        "serviceName": "家主ナビAI",
        "slug": "yanushi-navi-ai-27",
        "oneLiner": "管理会社不要でAIが家賃回収・修繕対応・収支管理を代行する家主向けSaaS",
        "conceptLead": "【新規性】管理会社を介さずオーナー自身がAIで賃貸経営を完全自走できる「脱・管理会社」設計は個人家主向けに国内初。",
    },
    {
        "number": 28,
        "serviceName": "配車AI",
        "slug": "haisha-ai-28",
        "oneLiner": "AIが走行距離を30%削減する配車最適化で中小配送業者のコストを圧縮",
        "conceptLead": "【新規性】大手物流専用だったAI配車最適化を中小配送業者が月額数万円で使える価格帯に落とした点が最大の差別化。",
    },
    {
        "number": 29,
        "serviceName": "産廃ナビ",
        "slug": "sanpai-navi-29",
        "oneLiner": "スマホ発行・追跡で産廃マニフェストの法的義務を完全デジタル化するSaaS",
        "conceptLead": "【新規性】産廃マニフェストの電子化義務対応をスマホのみで完結し、収集運搬業者への電子通知まで一気通貫する設計が国内初。",
    },
    {
        "number": 30,
        "serviceName": "冷庫AI",
        "slug": "reiko-ai-30",
        "oneLiner": "温度異常即検知とHACCP記録自動生成を一体化した冷機器IoT SaaS",
        "conceptLead": "【新規性】IoT温度センサーによる異常検知とHACCP衛生記録の自動生成を一体化したSaaSは飲食店・食品工場向けに国内未整備。",
    },
    {
        "number": 31,
        "serviceName": "脱炭素ナビ",
        "slug": "datsuranso-navi-31",
        "oneLiner": "Excel不要でCO2排出を自動計測しサプライチェーン開示まで完結するSaaS",
        "conceptLead": "【新規性】電力・燃料データの自動取得からScope1-3排出量計算・開示レポート生成まで一気通貫する中小企業特化設計が国内初。",
    },
    {
        "number": 32,
        "serviceName": "店舗AI発注",
        "slug": "tenpo-ai-hatchu-32",
        "oneLiner": "天候・イベントで売上を予測し在庫過剰ゼロを実現する小売向けAI発注SaaS",
        "conceptLead": "【新規性】天気予報・地域イベント・競合データを組み合わせた需要予測で在庫最適化と自動発注を実現する独立系小売専用SaaSは初。",
    },
    {
        "number": 33,
        "serviceName": "農直EC",
        "slug": "nochoku-ec-33",
        "oneLiner": "農家が消費者と直接つながるEC・決済・集客を一体化した産直販売SaaS",
        "conceptLead": "【新規性】ECサイト・決済・集客SNS連携・配送ラベル印刷を農家向けに一体化した産直専用SaaSは既存の農産物ECにない設計。",
    },
    {
        "number": 34,
        "serviceName": "ESGナビ",
        "slug": "esg-navi-34",
        "oneLiner": "書類不要でAIがESGレポートを自動生成する中小企業向け開示対応SaaS",
        "conceptLead": "【新規性】財務データ・電力データを自動取得してESGレポートを生成する「入力ゼロ」設計は中小企業向けESG SaaSで初の試み。",
    },
    {
        "number": 35,
        "serviceName": "校務AI",
        "slug": "komu-ai-35",
        "oneLiner": "成績・出席・保護者連絡をAIで一元管理し教員の校務負担を半減するSaaS",
        "conceptLead": "【新規性】成績管理・出欠記録・保護者一斉連絡・生徒指導記録をAIで横断管理し教員の校務時間を半減させる設計が国内初。",
    },
    {
        "number": 36,
        "serviceName": "契約書AI",
        "slug": "keiyakusho-ai-36",
        "oneLiner": "法的リスク診断とワンクリック契約書生成を一体化した中小企業向けSaaS",
        "conceptLead": "【新規性】リスク診断→修正提案→修正済み契約書の再生成を一つのAIが連続実行する設計は中小企業向けリーガルSaaSで国内初。",
    },
    {
        "number": 37,
        "serviceName": "フリ税務AI",
        "slug": "furi-zeimu-ai-37",
        "oneLiner": "収支分析から申告書類まで個人事業主の税務を丸ごとAIが完結するSaaS",
        "conceptLead": "【新規性】収支自動分類・節税シミュレーション・申告書類生成・e-Tax送信までを個人事業主向けに一気通貫完結する設計が国内初。",
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
    print("[完了] #20-#37 更新済み")
finally:
    conn.close()
