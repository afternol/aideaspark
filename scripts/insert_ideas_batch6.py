"""アイデア#56-#65: Batch6 (Claude Code直接生成)"""
import io, sys, json, uuid, re
from datetime import date

if sys.stdout.encoding and sys.stdout.encoding.lower() != "utf-8":
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")

try:
    from dotenv import load_dotenv; load_dotenv()
except ImportError:
    pass

import os, psycopg2
DATABASE_URL = os.environ.get("DATABASE_URL")
if not DATABASE_URL:
    sys.exit("ERROR: DATABASE_URL 未設定")

PATTERN_RE = re.compile(r'^[A-J]-\d+$')

def validate(idea):
    errors = []
    ol = idea.get("oneLiner", "")
    if not (20 <= len(ol) <= 40): errors.append(f"oneLiner: {len(ol)}字「{ol}」")
    pats = idea.get("patterns", [])
    if len(pats) != 2: errors.append(f"patterns: {len(pats)}件")
    for p in pats:
        if not PATTERN_RE.match(str(p)): errors.append(f"patternID不正: {p}")
    sc = idea.get("scores", {})
    if len(set(sc.values())) == 1: errors.append("scores全軸同一")
    for k, v in sc.items():
        if not isinstance(v, int) or not (1 <= v <= 5): errors.append(f"scores.{k}={v}")
    scc = idea.get("scoreComments", {})
    for axis in ["novelty","marketSize","profitability","growth","feasibility","moat"]:
        c = scc.get(axis, "")
        if not (30 <= len(c) <= 60): errors.append(f"scoreComments.{axis}: {len(c)}字「{c}」")
    if len(idea.get("trendKeywords", [])) != 3: errors.append("trendKeywords != 3件")
    comp_list = [c.strip() for c in idea.get("competitors","").split(",") if c.strip()]
    if len(comp_list) < 3: errors.append(f"competitors {len(comp_list)}社")
    return errors

ideas = [
    # #56
    {
        "serviceName": "SalesOrbit",
        "oneLiner": "法人営業のBDR業務をAIエージェントが自動代行するSaaS",
        "concept": "ターゲット企業の自動選定から初回アプローチメール生成・送信まで一貫してAIが実行し、営業担当は商談のみに集中できるインサイドセールスSaaS。",
        "target": "従業員30〜500名規模の法人営業部門を持つIT・SaaS企業のインサイドセールスチームリーダー・営業部長",
        "problem": "法人営業のBDR担当者はリスト作成・初回アプローチ・架電に多くの時間を費やし商談数が伸びない。既存SFAは記録管理が主体で自動実行機能が弱い。",
        "product": "ターゲット企業自動選定エンジン\nAI初回アプローチメール自動生成・送信\n返信分類と次アクション自動提示機能\n送信・商談化率リアルタイムダッシュボード",
        "revenueModel": "月額SaaS 席数課金（1席3万円〜/月）\n初期設定費（10万円〜）",
        "competitors": "Sales Marker, HubSpot, Mazrica Sales, Salesforce, Outreach",
        "competitiveEdge": "Sales MarkerやHubSpotはデータ提供・CRM管理が主体だが、SalesOrbitはターゲット選定から初回送信まで自動実行に特化する。",
        "category": "AIエージェント",
        "targetIndustry": "IT・通信",
        "targetCustomer": "中小企業",
        "investmentScale": "50〜200万円",
        "difficulty": "中",
        "scores": {"novelty": 4, "marketSize": 3, "profitability": 4, "growth": 5, "feasibility": 3, "moat": 4},
        "scoreComments": {
            "novelty": "BDR自動実行特化型AIエージェントSaaSは日本市場にまだ浸透していない",
            "marketSize": "インサイドセールス導入B2B企業は急増。IT・SaaS業界だけで数千社規模",
            "profitability": "月額SaaS席数課金でLTVが高く商談獲得成果直結で解約率が低い",
            "growth": "生成AI普及とインサイドセールス移行の双波が同時に追い風となる",
            "feasibility": "Claude等APIで基本機能は実装可能。日本語精度とメール到達率が課題",
            "moat": "接触・返信データ蓄積でターゲティング精度が向上するフライホイール効果",
        },
        "whyNow": "AIエージェント技術が実用段階に達しインサイドセールス移行が加速する2026年に、BDR業務を人に依存せず自動化できる環境が整った。",
        "noveltyNote": "Sales MarkerはインテントデータDB、HubSpotはCRM管理が中心で、AIがターゲット選定から初回アプローチ実行まで一気通貫で自動代行する国産特化型SaaSは確認されていない。",
        "strengthNote": "接触・返信データが蓄積するほどAIのターゲティング精度が向上し乗り換えコストが高まる粘着構造が成立する。",
        "patternRationale": "F-4のAIエージェント自動化がBDR業務の完全代行を実現し、D-1のデータフライホイールが継続利用で精度向上する複利効果を生む。",
        "patterns": ["F-4", "D-1"],
        "trendKeywords": ["インサイドセールス", "AIエージェント", "セールスオートメーション"],
        "tags": ["BDR自動化", "セールスAI", "法人営業", "アウトバウンド"],
    },
    # #57
    {
        "serviceName": "CareNote AI",
        "oneLiner": "介護現場の記録と申し送りをAI音声認識で自動化するSaaS",
        "concept": "音声入力と画像から介護記録を自動作成し申し送り資料を生成。記録業務を削減しケアに集中できる介護施設向けバーティカルAI SaaS。",
        "target": "従業員20名以上の特別養護老人ホーム・グループホーム・デイサービスの施設長・介護主任",
        "problem": "介護スタッフは記録・申し送り準備に1日1〜2時間費やし慢性的な人手不足が深刻化している。既存記録ツールはPC入力前提でスタッフへの負担が残る。",
        "product": "音声入力による介護記録自動生成\n申し送り資料の自動サマリー作成\nバイタル数値の音声入力と自動転記\n家族向けケア日報の自動生成・配信",
        "revenueModel": "月額SaaS 利用者数課金（50人まで3万円〜）\n介護ソフト連携API利用料（月1万円〜）",
        "competitors": "カイポケ, ほのぼのNEXT, CareWiz Hanasuto, ワイズマン SMILE, トリケアトプス",
        "competitiveEdge": "カイポケやほのぼのNEXTは請求・計画書管理が主体だが、CareNote AIは音声認識による記録自動化と申し送りサマリー生成に特化する。",
        "category": "介護テック",
        "targetIndustry": "医療・福祉",
        "targetCustomer": "医療機関",
        "investmentScale": "50〜200万円",
        "difficulty": "中",
        "scores": {"novelty": 3, "marketSize": 4, "profitability": 3, "growth": 5, "feasibility": 3, "moat": 4},
        "scoreComments": {
            "novelty": "音声AI記録は既存製品に一部機能あり。申し送り自動生成の特化は少ない",
            "marketSize": "特養・グループホーム等の介護施設は全国に約1万施設。人手不足で導入意欲高い",
            "profitability": "月額SaaS利用者数課金でARPUが安定。介護補助金が初期費用を補填する",
            "growth": "介護人材不足が深刻化し2025年問題で需要急増。DX補助金が後押しする",
            "feasibility": "音声認識精度と介護専門用語への対応が課題。既存ソフトとのAPI連携が必要",
            "moat": "施設ごとの記録テンプレートとケアパターンデータが蓄積し乗り換えコスト高まる",
        },
        "whyNow": "2024年の介護報酬改定で生産性向上支援が強化され介護DX補助金の拡充により音声AI記録への導入障壁が下がっている。",
        "noveltyNote": "カイポケやCareWiz Hanasutoは請求・計画書管理が主体で、音声認識で記録から申し送り資料まで自動生成する申し送り特化機能を持つ製品は確認されていない。",
        "strengthNote": "施設ごとの記録パターンとケア手順データが蓄積し施設に特化した記録テンプレートが生成されることで乗り換えコストが高まる。",
        "patternRationale": "F-2のAI専門家民主化が介護記録専門知識のAI代替を実現し、B-4の摩擦除去がスマホ1台で記録完結するUXを設計する。",
        "patterns": ["F-2", "B-4"],
        "trendKeywords": ["介護DX", "2025年問題", "音声AI記録"],
        "tags": ["介護記録", "申し送り自動化", "音声認識", "介護人材不足"],
    },
    # #58
    {
        "serviceName": "DisclosureNav",
        "oneLiner": "上場企業の人的資本開示義務化に対応するレポート自動生成SaaS",
        "concept": "人事・財務データを入力すると有価証券報告書の人的資本開示項目をAIが自動でドラフト生成。開示義務対応を最短2週間で完了できる。",
        "target": "東証プライム・スタンダード上場企業の人事部門・IR部門・経営企画部門の開示担当者",
        "problem": "2023年3月期から義務化された人的資本開示は定量指標収集・文章作成・比較分析に膨大な工数がかかる。コンサル依頼はコストが高く内製化が困難。",
        "product": "人的資本KPI自動収集・集計機能\n有報開示文章のAI自動ドラフト生成\n他社開示事例とのベンチマーク比較\n開示スケジュール・チェックリスト管理",
        "revenueModel": "年額SaaS 従業員規模課金（50万円/年〜）\nコンサルオプション（追加100万円〜）",
        "competitors": "SmartHR, HITO-Link, Resily, Workday, SAP SuccessFactors",
        "competitiveEdge": "SmartHRやHITO-Linkは人事データ管理が主体で、有価証券報告書の人的資本開示文章を自動生成する機能は持たない。",
        "category": "HR Tech",
        "targetIndustry": "全業界",
        "targetCustomer": "大企業",
        "investmentScale": "200〜500万円",
        "difficulty": "中",
        "scores": {"novelty": 4, "marketSize": 3, "profitability": 4, "growth": 5, "feasibility": 3, "moat": 3},
        "scoreComments": {
            "novelty": "人的資本開示ドラフト生成特化SaaSは確認されておらず差別化余地が大きい",
            "marketSize": "東証プライム・スタンダード上場企業は約3,800社。全社が義務対応対象となる",
            "profitability": "年額SaaSで解約サイクルが長く毎年の更新で高ARPUが維持できる構造",
            "growth": "開示要求水準が年々高まりESG投資拡大で詳細開示への圧力が増している",
            "feasibility": "人事システムとのAPI連携と有報フォーマット対応の実装工数が課題となる",
            "moat": "開示実績データ蓄積による業界ベンチマーク構築だけが差別化になりうる",
        },
        "whyNow": "内閣府令改正により2023年3月期から上場企業の人的資本開示が義務化され投資家からの詳細情報要求が年々高まっている。",
        "noveltyNote": "SmartHRやWorkdayは人事データ管理・集計が主体で、義務化された有価証券報告書記載の開示文章をAIが自動ドラフトするSaaSは日本市場で確認されていない。",
        "strengthNote": "企業の開示データと他社ベンチマークデータが蓄積するほど提案精度が向上し毎年の開示サイクルで更新する構造から解約されにくい。",
        "patternRationale": "A-2の規制変化の窓が人的資本開示義務化という確実な市場機会を生み、F-1のバーティカルAIが開示領域特化の高精度文書生成を実現する。",
        "patterns": ["A-2", "F-1"],
        "trendKeywords": ["人的資本開示", "ESG経営", "上場企業IR"],
        "tags": ["人的資本", "有報開示", "ESG", "HR SaaS"],
    },
    # #59
    {
        "serviceName": "ZeiBot",
        "oneLiner": "フリーランスの確定申告書類をAIが自動作成するアシスタント",
        "concept": "銀行口座・クレカ明細を連携するだけでAIが経費分類・売上集計・申告書類を自動作成。税理士不要で確定申告を完了できるフリーランス特化サービス。",
        "target": "副業・フリーランスとして年収100〜500万円規模の個人事業主・IT系フリーランス・デザイナー・ライター",
        "problem": "フリーランスの確定申告は経費分類・帳簿作成・控除計算に年間10時間以上かかる。freeeやMFクラウドは機能豊富だが学習コストが高く使いこなせない人が多い。",
        "product": "口座・クレカ明細自動連携・経費分類\nインボイス・電帳法対応の自動仕訳\nAI経費アドバイスと節税提案機能\n確定申告書類の自動生成・e-Tax連携",
        "revenueModel": "月額サブスク（980円/月・9,800円/年）\n税理士紹介マッチング手数料（成約時3万円）",
        "competitors": "freee, マネーフォワード クラウド確定申告, やよいの青色申告, Taxnote, 弥生オンライン",
        "competitiveEdge": "freeeやMFクラウドはSMB全般向けで機能過多だが、ZeiBotはフリーランス個人特化で申告書類まで自動生成し学習コストをゼロにする。",
        "category": "会計・経理DX",
        "targetIndustry": "全業界",
        "targetCustomer": "フリーランス・副業",
        "investmentScale": "〜50万円",
        "difficulty": "低",
        "scores": {"novelty": 3, "marketSize": 5, "profitability": 3, "growth": 4, "feasibility": 4, "moat": 3},
        "scoreComments": {
            "novelty": "freee等の競合が強固だがフリーランス個人特化×書類自動生成は差別化余地あり",
            "marketSize": "フリーランス・副業人口は国内1,000万人超。インボイス登録者増で対象が拡大",
            "profitability": "月額980円の低単価だが税理士紹介マッチングでARPUを補完できる構造",
            "growth": "インボイス・電帳法の義務化で税務対応需要が急増し市場が拡大している",
            "feasibility": "金融API連携と税務ロジックの正確性担保が実装の主要課題となる",
            "moat": "過去の申告・経費データ蓄積が乗り換えを抑制するスイッチングコスト",
        },
        "whyNow": "インボイス制度完全移行（2023年10月〜）と電帳法完全義務化（2024年1月〜）が重なりフリーランスの税務対応の複雑さが急増している。",
        "noveltyNote": "freeeやマネーフォワードはSMB全般向けの多機能会計SaaSだが、フリーランス個人に特化して申告書類の完全自動生成とe-Tax連携まで担うシンプル特化型は確認されていない。",
        "strengthNote": "利用年数が増えるほど経費パターンと節税実績が蓄積し乗り換えると過去データが失われる強固なスイッチングコストが機能する。",
        "patternRationale": "F-2のAI専門家民主化が税理士サービスの代替を実現し、D-3のスイッチングコスト設計が毎年の確定申告サイクルで積み上がる仕組みを構築する。",
        "patterns": ["F-2", "D-3"],
        "trendKeywords": ["インボイス制度", "フリーランス新法", "電帳法対応"],
        "tags": ["確定申告", "フリーランス", "税務AI", "インボイス"],
    },
    # #60
    {
        "serviceName": "SafeEye",
        "oneLiner": "建設現場の危険行動をAIカメラがリアルタイム検知して自動通報",
        "concept": "現場設置カメラの映像をAIがリアルタイム解析しヘルメット未着用・立入禁止侵入・墜落リスクを自動検知して管理者にアラート通知する建設安全管理SaaS。",
        "target": "従業員50〜300名規模の建設会社・ゼネコン・土木会社の現場安全管理担当者・工事部長",
        "problem": "建設現場の安全確認は巡回点検に依存しており危険行動を見逃すリスクが高い。労働安全衛生法改正で安全記録の義務が強化されたが人手での対応に限界がある。",
        "product": "現場カメラ映像のAIリアルタイム解析\n危険行動検知・管理者即時アラート通知\nヒヤリハット自動記録と月次レポート\n労働安全衛生法対応記録書類自動生成",
        "revenueModel": "月額SaaS カメラ台数課金（1台2万円〜）\nカメラ設置工事・初期設定費（20万円〜）",
        "competitors": "スパイダープラス, ANDPAD, フォトラクション, Safie, ClearBoard",
        "competitiveEdge": "ANDPADやフォトラクションは工程・図面管理が主体だが、SafeEyeはカメラ映像のAI解析による危険行動リアルタイム検知に完全特化する。",
        "category": "建設テック",
        "targetIndustry": "建設・土木",
        "targetCustomer": "中小企業",
        "investmentScale": "200〜500万円",
        "difficulty": "中",
        "scores": {"novelty": 4, "marketSize": 3, "profitability": 3, "growth": 5, "feasibility": 3, "moat": 4},
        "scoreComments": {
            "novelty": "建設特化の危険行動リアルタイムAI検知SaaSは国産では確認されていない",
            "marketSize": "建設会社は全国約45万社。大規模現場から順次普及が見込める市場規模",
            "profitability": "カメラ台数課金でARPUが施工規模に比例。設置工事費でイニシャル収益も",
            "growth": "建設業時間外規制と安全義務強化のダブル追い風で導入圧力が2024年から急増",
            "feasibility": "屋外カメラの映像解析精度と既存カメラへの後付け対応が実装の主な課題",
            "moat": "現場別危険行動データの蓄積が検知精度を高め乗り換えコストを積み上げる",
        },
        "whyNow": "2024年4月の建設業時間外労働規制と労働安全衛生法改正強化により工数削減しながら安全記録を確保できるAI監視への需要が急増している。",
        "noveltyNote": "ANDPADやスパイダープラスは工程・写真管理が中心で、現場カメラ映像をAIがリアルタイム解析して危険行動を自動検知・記録する国産特化SaaSは確認されていない。",
        "strengthNote": "現場ごとの危険行動パターンデータが蓄積されることで検知精度が向上し安全実績データが保険料率交渉材料になる価値が乗り換え阻止力になる。",
        "patternRationale": "F-6のセンサー×IoTデジタル化がカメラ映像をリアルタイム安全データ化し、A-2の規制変化の窓が労働安全衛生法強化という確実な市場需要を捉える。",
        "patterns": ["F-6", "A-2"],
        "trendKeywords": ["建設DX", "労働安全衛生法", "現場AI監視"],
        "tags": ["建設安全", "AIカメラ", "ヒヤリハット", "現場管理"],
    },
    # #61
    {
        "serviceName": "フードサルベージ",
        "oneLiner": "飲食店の閉店前食品を近隣ユーザーに半額で販売するアプリ",
        "concept": "飲食店が閉店2時間前に余剰食品をアプリで出品し近隣ユーザーが半額で購入できるフードロス削減マーケットプレイス。位置情報通知で衝動的購買を設計する。",
        "target": "都市部の個人経営飲食店・チェーン店の店長と節約意識の高い20〜40代都市部在住者",
        "problem": "飲食店の食品廃棄コストと食材ロスが経営を圧迫している。既存の在庫処分手段は値引き販売のみで閉店後の残存食品を収益化する手段がない。",
        "product": "余剰食品出品・在庫管理機能\n位置情報ベースのユーザー通知\nQRコード受取・決済機能\n月次フードロス削減レポート",
        "revenueModel": "販売成立手数料（販売額の15%）\n飲食店向けプレミアム掲載料（月3,000円）",
        "competitors": "TABETE, ロスゼロ, クラダシ, サルベージパーティ, Too Good To Go（海外）",
        "competitiveEdge": "TABETEは事前予約型だがフードサルベージは位置情報通知と即時QR決済で閉店直前の衝動的購買を促し飲食店の出品負担を最小化する。",
        "category": "フードテック",
        "targetIndustry": "飲食・食品",
        "targetCustomer": "飲食店・店舗",
        "investmentScale": "〜50万円",
        "difficulty": "低",
        "scores": {"novelty": 3, "marketSize": 4, "profitability": 2, "growth": 4, "feasibility": 4, "moat": 3},
        "scoreComments": {
            "novelty": "TABETEが先行するが位置情報通知×即時決済×最小操作の組み合わせは差別化余地",
            "marketSize": "飲食店は全国約48万店。都市部から食品廃棄問題で導入意欲の高い層が多い",
            "profitability": "手数料15%だが競合も同水準。飲食店無料集客でユーザー課金に偏る収益構造",
            "growth": "食品ロス半減目標と節約意識の高まりで両サイドの利用動機が強まっている",
            "feasibility": "モバイルアプリ+決済連携で技術的ハードルは低く先行サービスの実績が証明",
            "moat": "飲食店数とユーザー数双方のネットワーク効果が地域ごとに機能する構造",
        },
        "whyNow": "食品ロス削減法（2019年施行）の2030年半減目標が行政・企業の取り組み義務を高め消費者の節約意識とサステナ意識が同時に高まっている。",
        "noveltyNote": "TABETEは事前予約型で計画的購入向けだが、フードサルベージは閉店2時間前の位置情報プッシュ通知で衝動的購買を促す設計が異なり飲食店の出品操作を最小化している。",
        "strengthNote": "出品飲食店数増加→ユーザー増加のネットワーク効果が地域ごとに機能し先行参入した都市で後発が追いつきにくい地域独占構造を形成する。",
        "patternRationale": "E-8の廃棄・余剰の価値化が閉店前食品の収益化を実現し、G-2のマルチサイドプラットフォームの非対称設計が飲食店を無料で集め消費者課金で収益化する。",
        "patterns": ["E-8", "G-2"],
        "trendKeywords": ["フードロス削減", "食品ロス法", "サステナブル消費"],
        "tags": ["フードロス", "飲食店支援", "位置情報", "サステナビリティ"],
    },
    # #62
    {
        "serviceName": "TeacherFlow",
        "oneLiner": "学校教員の通知表・保護者連絡をAIが自動生成する業務効率化SaaS",
        "concept": "指導要録・通知表文章・学級通信をAIが自動生成し保護者連絡テンプレートも提供。教員が本来業務（授業・生徒対応）に集中できる業務効率化SaaS。",
        "target": "公立・私立の小中学校・高校の担任教員・教頭・校務分掌担当者（特に業務過多の担任持ち教員）",
        "problem": "教員は通知表・報告書・保護者連絡等の事務作業に多くの時間を費やし授業準備が削られる。既存校務支援システムは自動化が不十分。",
        "product": "通知表・指導要録の文章AI自動生成\n学級通信・お便りのAIドラフト機能\n保護者連絡テンプレートライブラリ\n校務スケジュール自動管理",
        "revenueModel": "年額SaaS 教職員数課金（30名以下50万円/年〜）\n研修・導入サポート費（1校30万円）",
        "competitors": "Classi, コドモン, まなびポケット, スタディプラス, Google Classroom",
        "competitiveEdge": "ClassiやGoogle Classroomは授業管理・生徒対応が主体だが、TeacherFlowは通知表文章・学級通信のAI自動生成に特化し教員の記述作業をゼロにする。",
        "category": "EdTech",
        "targetIndustry": "教育・研修",
        "targetCustomer": "教育機関",
        "investmentScale": "200〜500万円",
        "difficulty": "中",
        "scores": {"novelty": 4, "marketSize": 4, "profitability": 3, "growth": 5, "feasibility": 3, "moat": 3},
        "scoreComments": {
            "novelty": "教員向け通知表AI自動生成特化SaaSは確認されておらず新規性が高い",
            "marketSize": "公立学校教員は約66万人。全国9,000以上の市区町村教育委員会が対象市場",
            "profitability": "学校予算サイクルは年度単位で解約が少ないが教育予算は削減傾向が続く",
            "growth": "教員働き方改革の答申目標と文科省EdTech補助金が2024年度から本格化",
            "feasibility": "校務系システムは文科省・自治体の調達制度に適合する認証取得が必要となる",
            "moat": "年次記録データ蓄積による精度向上と毎年の通知表作成サイクルの解約抑制",
        },
        "whyNow": "中央教育審議会の働き方改革答申と2024年度教員業務削減目標が設定されEdTech補助金が整備されることで学校のSaaS導入障壁が下がっている。",
        "noveltyNote": "ClassiやGoogle Classroomは授業配信・学習管理が主体で、通知表文章・学級通信・保護者連絡のAI自動生成に特化した国産教員向けSaaSは確認されていない。",
        "strengthNote": "学年・クラスの記録データが蓄積するほど文章提案の精度が向上し毎年の通知表作成サイクルで継続利用が続く解約困難な構造が成立する。",
        "patternRationale": "F-4のAIエージェント×ワークフロー自動化が教員事務作業の自動実行を担い、H-7の働き方変容新サービスが教員働き方改革という社会的必然の追い風に乗る。",
        "patterns": ["F-4", "H-7"],
        "trendKeywords": ["教員働き方改革", "EdTech", "校務DX"],
        "tags": ["教員業務効率化", "通知表AI", "学校DX", "校務支援"],
    },
    # #63
    {
        "serviceName": "ChainRadar",
        "oneLiner": "中小製造業の仕入先リスクをAIがリアルタイム監視するSaaS",
        "concept": "取引先企業の財務・ニュース・信用情報をAIが自動監視し供給停止リスクをアラート。海外依存サプライチェーンの代替調達先も自動提案する製造業特化SaaS。",
        "target": "従業員50〜1,000名規模の中小・中堅製造業の調達部門責任者・購買担当者・SCM担当者",
        "problem": "製造業の調達担当者は取引先の財務リスク・倒産・品質問題を察知するのが遅く代替調達先確保に時間がかかる。中小製造業は専門人員不足でリスク監視が手薄。",
        "product": "仕入先企業の信用・財務情報自動監視\nニュース・開示情報の異常検知アラート\n代替調達先の自動サジェスト機能\nサプライチェーンリスクダッシュボード",
        "revenueModel": "月額SaaS 監視取引先数課金（50社まで3万円〜）\n代替調達先マッチング成約手数料（3%）",
        "competitors": "Riskmethods, Resilinc, 帝国データバンク, 東京商工リサーチ, Sourceday",
        "competitiveEdge": "帝国データバンクは定期レポート提供が主体だが、ChainRadarはAIリアルタイム監視と代替調達先の自動提案を統合し中小製造業向けに提供する。",
        "category": "製造DX",
        "targetIndustry": "製造",
        "targetCustomer": "中小企業",
        "investmentScale": "200〜500万円",
        "difficulty": "高",
        "scores": {"novelty": 4, "marketSize": 4, "profitability": 3, "growth": 5, "feasibility": 3, "moat": 4},
        "scoreComments": {
            "novelty": "中小製造業向けAIリアルタイム監視と代替調達提案を統合した国産SaaSは少ない",
            "marketSize": "国内製造業は約18万社。調達部門を持つ中小中堅企業が主要対象市場となる",
            "profitability": "監視取引先数課金でARPUが規模に比例。マッチング手数料で追加収益を確保",
            "growth": "経済安保法とサプライチェーン強靭化補助金で企業の投資意欲が急拡大している",
            "feasibility": "信用情報DBとのAPI連携契約と国内外サプライヤーDB構築が実装の主要課題",
            "moat": "取引先・代替先データと過去のリスクアラート実績が蓄積するデータ資産となる",
        },
        "whyNow": "地政学リスク（米中デカップリング）でサプライチェーン国内回帰が加速し政府の経済安保推進法でサプライチェーン強靭化が義務化されている。",
        "noveltyNote": "帝国データバンクや東京商工リサーチは定期信用調査が主体で、AIによるリアルタイム監視と代替調達先の自動提案を製造業中小向けに月額で提供するSaaSは確認されていない。",
        "strengthNote": "監視対象の取引先データと代替調達先のマッチング実績が蓄積するほどAI提案精度が向上し過去の取引データを他社に移行できないスイッチングコストが生まれる。",
        "patternRationale": "F-5の予測→処方への昇華がリスク監視から代替調達提案まで担い、A-5の地政学リスクが生む国内需要が経済安保法制下での確実な市場機会を作る。",
        "patterns": ["F-5", "A-5"],
        "trendKeywords": ["サプライチェーン強靭化", "経済安保", "調達リスク"],
        "tags": ["サプライチェーン", "製造業DX", "リスク管理", "調達"],
    },
    # #64
    {
        "serviceName": "InboundPass",
        "oneLiner": "訪日外国人向けに地方の体験・工芸・文化を英語予約できるプラットフォーム",
        "concept": "全国の地方工芸・農業・文化体験を多言語で掲載し外国人旅行者がオンライン決済で予約できるマーケットプレイス。AI翻訳で地方事業者のDX参入障壁をゼロにする。",
        "target": "訪日観光客（欧米・東南アジアからの個人旅行者）と都市部以外の体験型コンテンツを提供する地方事業者・観光協会",
        "problem": "地方の体験型観光コンテンツは多言語予約手段がなく訪日客が都市集中する。既存プラットフォームは都市コンテンツに偏り地方は埋もれている。",
        "product": "地方体験コンテンツの多言語掲載機能\nAI自動翻訳による事業者出品サポート\n多通貨決済・QRチェックイン機能\n訪日客向けAIおすすめルート提案",
        "revenueModel": "予約成立手数料（予約額の20%）\n地方事業者向けプレミアム掲載料（月5,000円）",
        "competitors": "Airbnb Experiences, Viator, VELTRA, じゃらん体験, KKday",
        "competitiveEdge": "VELTRAやKKdayは都市アクティビティが主体だが、InboundPassはAI翻訳で地方小規模事業者がゼロ知識で多言語出品できる設計が差別化になる。",
        "category": "トラベルテック",
        "targetIndustry": "旅行・宿泊",
        "targetCustomer": "一般消費者",
        "investmentScale": "50〜200万円",
        "difficulty": "中",
        "scores": {"novelty": 3, "marketSize": 4, "profitability": 3, "growth": 5, "feasibility": 3, "moat": 4},
        "scoreComments": {
            "novelty": "Airbnb Experiences等の強豪があるが地方特化×AI翻訳無料出品の組み合わせは差別化",
            "marketSize": "2024年訪日客は3,000万人超。消費額5兆円目標で体験需要が急拡大している",
            "profitability": "手数料20%でAirbnbと同水準。地方事業者の追加課金でARPU補完が可能",
            "growth": "訪日客数の過去最高更新と地方インバウンド振興補助金の追い風が重なる",
            "feasibility": "多言語決済・AI翻訳のインフラは成熟しているが地方事業者の掲載獲得が課題",
            "moat": "地方体験コンテンツDB拡大とユーザーレビュー蓄積が後発参入への規模の壁になる",
        },
        "whyNow": "2024年の訪日客数が過去最高を更新し政府の観光立国推進計画でインバウンド消費目標5兆円が設定され地方分散化への補助金支援が拡充している。",
        "noveltyNote": "VELTRAやKKdayは都市・著名コンテンツが主体で、地方の小規模工芸・農業・文化体験をAI翻訳でゼロ操作出品させる地方特化型インバウンドプラットフォームは確認されていない。",
        "strengthNote": "出品コンテンツが増えるほど訪日客の満足度が上がりSEO・口コミが積み上がるネットワーク効果が機能し地方体験DBが大きくなるほど後発が追い付けない。",
        "patternRationale": "H-4のインバウンド×テクノロジーが地方体験を海外旅行者に直接届け、G-2の非対称プラットフォーム設計が地方事業者無料×訪日客課金の構造を生む。",
        "patterns": ["H-4", "G-2"],
        "trendKeywords": ["インバウンド消費", "観光DX", "地方体験ツーリズム"],
        "tags": ["インバウンド", "地方観光", "体験予約", "多言語対応"],
    },
    # #65
    {
        "serviceName": "HerHealth Biz",
        "oneLiner": "女性従業員の月経・更年期への職場配慮を実装するHR SaaS",
        "concept": "女性特有の健康課題（PMS・更年期等）を職場でサポートするための管理職向けガイド・配慮施策・匿名ヘルスデータ可視化を提供する企業向けHR SaaS。",
        "target": "従業員500名以上の大企業・上場企業の人事部門・ダイバーシティ推進担当者・産業医連携チーム",
        "problem": "女性特有の健康課題による就業困難が離職を生んでいるが管理職はどう配慮すべきか分からず適切な支援ができていない企業が多い。",
        "product": "管理職向け健康配慮ガイド・研修\n従業員向け匿名健康状態申告機能\n部署別女性健康支援状況ダッシュボード\n産業医・外部専門家との連携チャット",
        "revenueModel": "年額SaaS 従業員数課金（500名まで100万円/年）\nフェムテック研修オプション（50万円〜）",
        "competitors": "ルナルナ for Office, OiCARE, WELSA, Smart相談室, Helpo",
        "competitiveEdge": "ルナルナ for Officeはアプリ配布が主体だが、HerHealth BizはHRデータ連携で部署別配慮状況を可視化し管理職の行動変容を促す設計が異なる。",
        "category": "フェムテック",
        "targetIndustry": "全業界",
        "targetCustomer": "大企業",
        "investmentScale": "200〜500万円",
        "difficulty": "中",
        "scores": {"novelty": 4, "marketSize": 3, "profitability": 4, "growth": 5, "feasibility": 3, "moat": 4},
        "scoreComments": {
            "novelty": "管理職行動変容×部署別配慮可視化という切り口は国内フェムテックHR SaaSに少ない",
            "marketSize": "従業員500名以上の企業は約1万社。健康経営認定取得企業増で導入圧力が高まる",
            "profitability": "年額SaaS×従業員課金で解約率が低い。研修オプションでARPUを補完できる",
            "growth": "女性活躍推進法強化と健康経営優良法人の認定基準にフェムテック対応が追加",
            "feasibility": "匿名化設計とプライバシー保護の設計が重要。社労士・産業医との連携構築が必要",
            "moat": "健康経営スコアへの組み込みと配慮施策データが蓄積し解約コストが極めて高い",
        },
        "whyNow": "2024年の女性活躍推進法強化と健康経営優良法人認定基準にフェムテック対応が含まれ上場企業での導入義務化の圧力が高まっている。",
        "noveltyNote": "ルナルナ for Officeはアプリ配布型で従業員の自己管理が主体だが、HerHealth Bizは管理職の行動変容と部署別対応状況の可視化に特化したHR SaaSは確認されていない。",
        "strengthNote": "企業内の配慮施策データと利用実績が蓄積するほど健康経営スコアが向上し認定取得後の解約コストが極めて高い粘着モデルが成立する。",
        "patternRationale": "A-7の社会課題の事業機会への変換が女性健康課題を企業価値向上に繋げ、C-7のBtoBtoC設計が企業経由で女性従業員への価値提供を実現する。",
        "patterns": ["A-7", "C-7"],
        "trendKeywords": ["フェムテック", "女性活躍推進法", "健康経営"],
        "tags": ["フェムテック", "女性活躍", "健康経営", "ダイバーシティ"],
    },
]

def make_slug(service_name, number):
    import unicodedata, re
    normalized = unicodedata.normalize("NFKD", service_name)
    ascii_text = normalized.encode("ascii", "ignore").decode("ascii")
    cleaned = re.sub(r"[^\w\s-]", "", ascii_text).strip().lower()
    slug_base = re.sub(r"[\s_-]+", "-", cleaned)
    return f"{slug_base}-{number}" if slug_base else f"idea-{number}"

def insert_idea(cur, idea, number):
    idea_id = str(uuid.uuid4())
    slug = make_slug(idea["serviceName"], number)
    today = "2026-05-25"
    cur.execute("""
        INSERT INTO "Idea" (
            id, slug, number, "serviceName", concept, target, problem, product,
            "revenueModel", competitors, "competitiveEdge",
            tags, category, "targetIndustry", "targetCustomer",
            "investmentScale", difficulty, scores, "scoreComments",
            "trendKeywords", "oneLiner", "publishedAt",
            patterns, "whyNow", "noveltyNote", "strengthNote", "patternRationale",
            views, bookmarks, "createdAt", "updatedAt"
        ) VALUES (
            %s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,
            %s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,
            %s,%s,%s,%s,%s, 0, 0, NOW(), NOW()
        )
    """, (
        idea_id, slug, number,
        idea["serviceName"], idea["concept"], idea["target"], idea["problem"], idea["product"],
        idea["revenueModel"], idea["competitors"], idea["competitiveEdge"],
        json.dumps(idea.get("tags", []), ensure_ascii=False),
        idea["category"], idea["targetIndustry"], idea["targetCustomer"],
        idea["investmentScale"], idea["difficulty"],
        json.dumps(idea["scores"], ensure_ascii=False),
        json.dumps(idea["scoreComments"], ensure_ascii=False),
        json.dumps(idea["trendKeywords"], ensure_ascii=False),
        idea["oneLiner"], today,
        json.dumps(idea["patterns"], ensure_ascii=False),
        idea.get("whyNow", ""), idea.get("noveltyNote", ""),
        idea.get("strengthNote", ""), idea.get("patternRationale", ""),
    ))
    return idea_id, slug

def main():
    print("=== Batch6 バリデーション ===")
    all_ok = True
    for i, idea in enumerate(ideas):
        errors = validate(idea)
        if errors:
            print(f"  ❌ #{56+i} {idea['serviceName']}: {errors}")
            all_ok = False
        else:
            print(f"  ✅ #{56+i} {idea['serviceName']}")
    if not all_ok:
        print("\nバリデーションエラーあり。中止します。")
        sys.exit(1)

    print("\n=== DB INSERT ===")
    conn = psycopg2.connect(DATABASE_URL)
    try:
        cur = conn.cursor()
        for i, idea in enumerate(ideas):
            number = 56 + i
            idea_id, slug = insert_idea(cur, idea, number)
            print(f"  ✅ #{number} {idea['serviceName']} → {slug}")
        conn.commit()
        print(f"\n完了: {len(ideas)}件をDBに登録しました")
    except Exception as e:
        conn.rollback()
        print(f"❌ エラー: {e}")
        raise
    finally:
        conn.close()

if __name__ == "__main__":
    main()
