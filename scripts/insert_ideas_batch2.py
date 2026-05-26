"""アイデア#16〜#25 バッチINSERTスクリプト"""
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
    {
        "slug_prefix": "recruiterai",
        "serviceName": "RecruiterAI",
        "oneLiner": "AIが一次面接・書類選考を自動化し採用コストを半減させるSaaS",
        "concept": "中小企業の採用担当者向けに、AIが書類選考・一次面接動画分析・採用可否スコアリングを自動化するSaaS。少子化による採用難とDX推進の必要性に対応し、週10時間以上かかる書類選考・面接業務を大幅に短縮する。",
        "target": "年間採用10名以上で採用担当者が兼任の中小企業の人事・採用責任者",
        "problem": "採用担当者が書類選考・一次面接に週10時間超を費やしコア業務に集中できない。AI面接ツールは大企業向けで高価格すぎ中小には導入障壁が高い。",
        "product": "応募書類のAI自動スクリーニングとスコアリング\nAI動画面接による一次面接代行（24時間受付）\n採用可否根拠レポートの自動生成\nATSとのデータ連携（SmartHR・kintone対応）",
        "revenueModel": "月額SaaS 採用枠数課金（月5枠まで29,800円〜）\n成功報酬オプション（採用1名5万円〜）",
        "competitors": "Talent Palette, AI面接官, SHaiN, JAPAN AI HR, HR Next",
        "competitiveEdge": "Talent Paletteは大企業向け統合HRMSで中小には機能過多かつ高価格だが、RecruiterAIは書類選考＋AI動画面接の2機能に絞り中小採用担当が当日から使える設計で差別化する。",
        "category": "採用テック",
        "targetIndustry": "人材・HR",
        "targetCustomer": "中小企業",
        "investmentScale": "50〜200万円",
        "difficulty": "低",
        "scores": {"novelty": 3, "marketSize": 4, "profitability": 4, "growth": 4, "feasibility": 4, "moat": 3},
        "scoreComments": {
            "novelty": "書類選考＋AI面接の中小特化2機能パッケージは競合が手薄な領域",
            "marketSize": "採用ニーズを持つ中小企業は約250万社。AI面接の普及率はまだ20%台",
            "profitability": "採用枠数課金＋成功報酬の二層収益でARPUが安定し解約率が低い",
            "growth": "AI採用導入済み企業が2025年に20%超となり未導入市場が急速に拡大",
            "feasibility": "動画分析APIは既存サービスで調達可能で最短3ヶ月でMVP開発できる",
            "moat": "採用履歴データが蓄積するほど企業ごとの選考基準がAIに最適化される",
        },
        "whyNow": "2025年調査では56.9%の企業がAI採用に前向きで20.6%が既に導入済みだが、生成AIを使ったES作成が学生間で加速したことで書類選考の信頼性が低下しており、AIによる多面的な面接評価ツールへの需要が急増している。",
        "noveltyNote": "Talent PaletteやAI面接官は大企業・大量採用向けで機能が複雑かつ高価格だが、書類選考＋AI動画面接の2機能に絞り中小採用担当が当日から使える設計のSaaSは確認できない。本サービスはシンプルさと中小特化で差別化する。",
        "strengthNote": "採用枠数課金で解約率が低く、採用履歴・合否データが蓄積するほど企業ごとの選考基準がAIに最適化され乗り換えコストが高まる。採用成功実績が積み上がるほどサービスの信頼性が自己強化される構造。",
        "patternRationale": "A-3（人口動態の必然）は少子化による採用難という不可逆的構造変化を捉え、B-4（摩擦の徹底除去）は書類選考・一次面接という採用プロセス最大の時間的摩擦を解消する技術軸に対応する。",
        "patterns": ["A-3", "B-4"],
        "trendKeywords": ["AI採用自動化", "書類選考廃止潮流", "採用DX"],
        "tags": ["AI書類選考", "動画面接代行", "採用コスト削減", "中小採用"],
    },
    {
        "slug_prefix": "disabledwork",
        "serviceName": "DisabledWork",
        "oneLiner": "障害者雇用の法定管理・定着支援をAIで一元化する中小企業向けSaaS",
        "concept": "障害者雇用促進法に基づく法定雇用率管理・納付金計算・定着支援プログラムをクラウドで一元管理するSaaS。AIが障害特性に応じた業務アサインを提案し、担当者の負担を軽減しながらコンプライアンスリスクを排除する。",
        "target": "障害者雇用義務のある従業員45名以上の中小製造・サービス業の人事・総務担当者",
        "problem": "法定雇用率の管理・納付金計算・障害者社員の定着支援を専任担当者なしで行う中小企業では対応が属人化し、2026年の法定率引き上げへの備えもできていない。",
        "product": "法定雇用率・不足数・納付金のリアルタイム自動計算\n障害特性別の業務アサイン提案AI\n定着支援プログラム（面談記録・合理的配慮履歴管理）\n雇用状況報告書の自動生成と提出管理",
        "revenueModel": "月額SaaS 従業員数課金（45名まで12,000円〜）\n雇用コンサルタント紹介料（成功報酬型）",
        "competitors": "knowbe, WelsysPlus, NDソフトウェア ほのぼのmore, かべなしクラウド",
        "competitiveEdge": "WelsysPlusが無料で法定管理を提供する一方、DisabledWorkは障害特性別AI業務アサインと合理的配慮履歴管理を統合し雇用から定着まで一気通貫で支援するSaaSとして差別化する。",
        "category": "HR Tech",
        "targetIndustry": "人材・HR",
        "targetCustomer": "中小企業",
        "investmentScale": "50〜200万円",
        "difficulty": "中",
        "scores": {"novelty": 4, "marketSize": 3, "profitability": 3, "growth": 4, "feasibility": 3, "moat": 4},
        "scoreComments": {
            "novelty": "法定管理＋AI業務アサイン＋定着支援の三位一体は国内に類似なし",
            "marketSize": "法定雇用義務がある企業は約100万社超。2026年に法定率が2.7%へ引き上げ",
            "profitability": "月額SaaSで解約率が低く、コンサル紹介料で二層収益を確保できる",
            "growth": "2026年7月の法定雇用率2.7%引き上げで新たな義務対象企業が急増する",
            "feasibility": "法改正への追従と障害特性データベース整備に専門知識とコストが必要",
            "moat": "障害者社員ごとの定着履歴・合理的配慮データが蓄積し乗り換えを阻む",
        },
        "whyNow": "2026年7月に障害者法定雇用率が2.7%に引き上げられることで新たに雇用義務が生じる企業が急増する。合理的配慮提供義務が2024年4月から中小企業にも法的義務化され、専用システムなしでの対応が困難になっている。",
        "noveltyNote": "knowbeやWelsysPlusは法定管理・書類管理が主機能で、障害特性に応じたAI業務アサインや定着支援プログラム管理まで統合したSaaSは確認できない。本サービスは管理から定着まで一気通貫で提供する点で差別化する。",
        "strengthNote": "企業ごとの障害者雇用履歴・定着支援データが蓄積するほど乗り換えコストが高まり、法定報告書の自動生成で行政対応業務に不可欠なツールとなる。法定雇用率引き上げのたびに既存顧客からの追加需要が自動発生する構造。",
        "patternRationale": "A-2（規制変化の「窓」）は法定雇用率引き上げと合理的配慮義務化という明確な参入機会を捉え、C-7（BtoBtoC）は企業（法人）を主顧客としながら障害者社員（個人）の定着まで価値を届ける構造に対応する。",
        "patterns": ["A-2", "C-7"],
        "trendKeywords": ["障害者法定雇用率引き上げ", "合理的配慮義務化", "障害者雇用DX"],
        "tags": ["障害者雇用管理", "法定雇用率", "定着支援", "合理的配慮"],
    },
    {
        "slug_prefix": "visitcare",
        "serviceName": "VisitCare",
        "oneLiner": "訪問看護のシフト・記録・請求をAIが一体管理する中小事業所向けSaaS",
        "concept": "訪問看護ステーションのシフト管理・訪問記録・介護保険請求を一体化したクラウドSaaS。AIがスタッフ稼働状況と利用者需要を自動マッチングしてシフト作成時間を80%削減し、請求漏れをゼロにする。",
        "target": "スタッフ5〜20名規模の訪問看護ステーション管理者・事務担当者",
        "problem": "訪問看護のシフト・記録・請求を別システムで管理し転記ミスや請求漏れが発生している。カイポケ等の既存SaaSはコストが高く小規模事業所には導入障壁がある。",
        "product": "AIシフト自動生成（スタッフ資格・稼働制約・利用者希望を考慮）\nスマホでの訪問記録入力と自動カルテ化\n介護保険・医療保険請求の自動計算と国保連伝送\n稼働率・収益分析ダッシュボード",
        "revenueModel": "月額SaaS スタッフ数課金（5名まで19,800円〜）\n請求代行オプション（月3,000円〜）",
        "competitors": "カイポケ訪問看護, Care-wing, カナミッククラウド, iBow, HOPE LifeMark-HH",
        "competitiveEdge": "カイポケ訪問看護はシェアが高いが月額費用が高く小規模事業所には重い。VisitCareはAIシフト自動生成機能を月額19,800円の低価格帯で提供し5名規模から翌日導入できる点で差別化する。",
        "category": "介護テック",
        "targetIndustry": "医療・福祉",
        "targetCustomer": "中小企業",
        "investmentScale": "50〜200万円",
        "difficulty": "中",
        "scores": {"novelty": 3, "marketSize": 4, "profitability": 3, "growth": 5, "feasibility": 3, "moat": 3},
        "scoreComments": {
            "novelty": "AIシフト自動生成と記録・請求一体化の小規模特化型は競合が少ない",
            "marketSize": "全国訪問看護事業所は約15,000か所超。8割超が10名以下の小規模事業所",
            "profitability": "月額SaaSで解約率が低く、請求代行オプションでARPUを引き上げられる",
            "growth": "2024年度介護報酬改定で訪問看護需要が増加しDX加算新設で導入が加速",
            "feasibility": "介護保険請求仕様の複雑さとレセコン連携構築に高い専門知識が必要となる",
            "moat": "事業所ごとの利用者データとシフトパターンが蓄積し乗り換えコストが高まる",
        },
        "whyNow": "2024年度介護報酬改定で生産性向上推進体制加算が新設され、ICT導入による業務効率化が加算評価されるようになった。介護職員不足は2030年代まで構造的に続くとされており、シフト省力化ニーズは今後不可逆的に高まる。",
        "noveltyNote": "カイポケ訪問看護やCare-wingはシフト・記録・請求を個別に提供するが、AIシフト自動生成と保険請求を一体化した5名規模から使える低価格SaaSは確認できない。本サービスは小規模事業所の翌日導入を最優先に設計する。",
        "strengthNote": "月額SaaSで解約率が低く、事業所ごとの利用者データ・シフトパターンが蓄積するほどAIの精度が向上する。介護請求データが基幹業務に組み込まれると乗り換えコストが極めて高まり、粘着性の高い収益構造が成立する。",
        "patternRationale": "A-3（人口動態の必然）は高齢化・訪問看護需要増という不可逆的トレンドを捉え、B-4（摩擦の徹底除去）はシフト作成・記録・請求という3つの日次摩擦を1サービスで解消する技術軸に対応する。",
        "patterns": ["A-3", "B-4"],
        "trendKeywords": ["訪問看護DX", "介護保険請求自動化", "シフト管理AI"],
        "tags": ["訪問看護", "シフト自動生成", "介護請求", "小規模事業所"],
    },
    {
        "slug_prefix": "pharmasense",
        "serviceName": "PharmaSense",
        "oneLiner": "薬局の在庫過剰・欠品をAIが予測し自動発注する中小薬局向けSaaS",
        "concept": "調剤薬局の在庫データ・処方実績・薬価改定情報をAIが分析し最適発注量を自動計算するSaaS。過剰在庫を30%削減し欠品による調剤機会損失をゼロにする。薬価改定時の在庫インパクトをリアルタイムでシミュレーションする。",
        "target": "店舗数1〜5の独立系・中小チェーン調剤薬局の管理薬剤師・事務長",
        "problem": "薬局の在庫管理は薬剤師の経験則に依存し、薬価改定のたびに発注量の見直しが手作業で発生する。過剰在庫と欠品が同時に起きる非効率な状態が中小薬局に広く存在している。",
        "product": "処方実績×薬価トレンドのAI発注量自動計算\n薬価改定時の在庫インパクトシミュレーション\n期限切れ薬品アラートと廃棄コスト可視化\n卸会社との発注データ自動連携",
        "revenueModel": "月額SaaS 店舗数課金（1店舗19,800円〜）\nAI発注精度レポートオプション（月3,000円〜）",
        "competitors": "メドオーダー, Musubi, premedi, アサイクル, 日立システムズ医薬品AI発注",
        "competitiveEdge": "Muusubiやpremediはレセコンとのデータ連携が主体だが、PharmaSenseは薬価改定情報をリアルタイム反映したAI発注量最適化を中小薬局向けの低価格で提供し差別化する。",
        "category": "AI SaaS",
        "targetIndustry": "医療・福祉",
        "targetCustomer": "中小企業",
        "investmentScale": "50〜200万円",
        "difficulty": "中",
        "scores": {"novelty": 4, "marketSize": 3, "profitability": 4, "growth": 4, "feasibility": 3, "moat": 3},
        "scoreComments": {
            "novelty": "薬価改定リアルタイム反映のAI発注最適化は中小薬局向けが国内に少ない",
            "marketSize": "全国薬局は約63,000軒超。独立・中小チェーンが約70%を占める大きな市場",
            "profitability": "過剰在庫削減効果が月数十万円規模のため価格転嫁しやすく解約率が低い",
            "growth": "2024年10月薬価改定で管理コストが急増しAI発注ニーズが連動して拡大中",
            "feasibility": "薬局ごとにレセコンが異なり連携仕様の対応に相当な開発工数が必要となる",
            "moat": "処方パターンと発注履歴が蓄積するほどAI精度が向上し乗り換えを阻む",
        },
        "whyNow": "2024年10月の薬価改定で薬価が大幅に変動し在庫管理コストが急増した。さらに2025年の薬機法改正でオンライン服薬指導が恒久化され、薬局DXへの投資意欲が高まっている。AI発注ツールの必要性は不可逆的に高まっている。",
        "noveltyNote": "MuusubiやASKANは在庫管理・発注支援を提供するが、薬価改定情報をリアルタイムで連動させたAI発注量最適化と廃棄コスト可視化を中小薬局向け低価格で統合したSaaSは確認できない。",
        "strengthNote": "薬局ごとの処方パターンと発注履歴が蓄積するほどAI精度が向上し、乗り換えると精度が下がるため解約率が極めて低くなる。薬価改定のたびに既存顧客からのアップグレード需要が自動発生する構造。",
        "patternRationale": "B-4（摩擦の徹底除去）は薬価改定対応と在庫管理という薬剤師の最大の時間的摩擦を解消し、F-6（センサー×未計測領域）は在庫量・期限・廃棄コストのリアルタイム可視化という未デジタル化領域の計測に対応する。",
        "patterns": ["B-4", "F-6"],
        "trendKeywords": ["薬価改定自動対応", "調剤薬局DX", "在庫最適化AI"],
        "tags": ["薬局在庫管理", "AI発注最適化", "薬価改定対応", "欠品防止"],
    },
    {
        "slug_prefix": "grantmatch",
        "serviceName": "GrantMatch",
        "oneLiner": "中小企業の事業内容から最適補助金をAIが自動抽出する申請支援SaaS",
        "concept": "中小企業の事業情報・財務状況・投資計画を入力するだけで全国2万件以上の補助金・助成金から最適なものをAIが自動マッチングし、採択率が高い申請書テンプレートまで提供するSaaS。",
        "target": "補助金申請を検討している従業員5〜100名規模の中小製造・IT・サービス業の経営者・経営企画担当",
        "problem": "中小企業が利用できる補助金は全国2万件以上あるが、情報収集・要件確認に数十時間かかり、多くの企業が申請を断念している。申請書作成支援のある専門家への依頼費用も高額になりがちだ。",
        "product": "事業情報入力→最適補助金AIマッチング（全国2万件対応）\n採択率分析と申請難易度スコアリング\n採択実績ベースの申請書テンプレート自動生成\n申請期限・追加募集のアラート通知",
        "revenueModel": "月額SaaS（フリー無料〜プレミアム月3,980円）\n採択成功報酬（交付額の3〜5%）",
        "competitors": "補助金クラウド, ミラサポplus, BizHint, 採択くん, J-Net21",
        "competitiveEdge": "ミラサポplusは政府提供で情報量が多いが申請書作成支援はなく、補助金クラウドはマッチングのみだが採択実績ベースの申請書テンプレート自動生成と成功報酬型の組み合わせを一体提供するSaaSは少ない。",
        "category": "AI SaaS",
        "targetIndustry": "全業界",
        "targetCustomer": "中小企業",
        "investmentScale": "〜50万円",
        "difficulty": "低",
        "scores": {"novelty": 3, "marketSize": 5, "profitability": 4, "growth": 4, "feasibility": 4, "moat": 3},
        "scoreComments": {
            "novelty": "採択実績ベース申請書テンプレートと成功報酬の組み合わせは競合が少ない",
            "marketSize": "日本の中小企業は約330万社超。補助金申請経験がない企業が7割以上存在",
            "profitability": "月額SaaS＋採択成功報酬の二層収益で高ARPU。採択率向上で口コミ獲得",
            "growth": "2025年省力化投資補助金が本格開始し中小企業の補助金申請ニーズが急増中",
            "feasibility": "補助金データベースの維持と審査基準変化への追従コストが継続的に発生",
            "moat": "採択実績データが蓄積するほどAIの申請書品質が向上し競合との差が広がる",
        },
        "whyNow": "2025年に省力化投資補助金が本格開始し、IT導入補助金・ものづくり補助金と合わせ中小企業向け補助金の総額が過去最高水準となった。しかし申請率は対象企業の数%にとどまっており、AIによる情報格差解消への需要が急増している。",
        "noveltyNote": "ミラサポplusや補助金クラウドは補助金情報の検索・マッチングを提供するが、採択実績データを学習したAIによる申請書テンプレート自動生成を組み合わせたSaaSは確認できない。本サービスは申請完結まで一貫して支援する。",
        "strengthNote": "月額SaaSで継続利用される上、採択実績データが蓄積するほどAIの申請書品質が向上する。成功報酬モデルにより顧客の採択率向上への動機と自社収益が完全に一致し、信頼資産として機能する。",
        "patternRationale": "A-2（規制変化の「窓」）は省力化投資補助金開始という明確な参入機会を捉え、B-4（摩擦の徹底除去）は補助金情報収集・申請書作成という中小経営者の最大の事務的摩擦を解消する技術軸に対応する。",
        "patterns": ["A-2", "B-4"],
        "trendKeywords": ["省力化投資補助金", "補助金DX", "中小企業支援AI"],
        "tags": ["補助金マッチング", "申請書自動生成", "採択率向上", "助成金支援"],
    },
    {
        "slug_prefix": "seniorhub",
        "serviceName": "SeniorHub",
        "oneLiner": "65歳超の即戦力シニアをプロジェクト単位で活用するマッチングSaaS",
        "concept": "定年後の高スキルシニア人材をプロジェクト型・顧問型で活用したい企業とAIでマッチングするSaaS。スキルとプロジェクト要件の自動照合で採用決定まで最短3日。フルタイム雇用にこだわらない新しい人材活用を実現する。",
        "target": "65歳以上の専門職・管理職経験者をプロジェクト型で活用したい中小企業の経営者・人事担当者",
        "problem": "定年後の高スキルシニアを活用したい企業が増えているが、既存求人媒体はフルタイム採用中心でプロジェクト型・短時間活用に対応しておらずマッチングが成立しにくい。",
        "product": "スキル×プロジェクト要件のAIマッチング（最短3日成約）\nプロジェクト型・顧問型・業務委託の3形態対応\nシニアのスキル証明と健康状態の事前確認機能\n成果ベースの評価レポート自動作成",
        "revenueModel": "成功報酬型（マッチング成立時、月額報酬の15〜20%）\n企業向け人材プールサブスク（月額9,800円〜）",
        "competitors": "シニアジョブ, マイナビミドルシニア, GBER, Inow, エン・ジャパン ミドル",
        "competitiveEdge": "シニアジョブやマイナビミドルシニアは求人媒体型でフルタイム雇用中心だが、SeniorHubはプロジェクト型・顧問型の短期活用特化でAIスキルマッチングを3日で成立させる点で差別化する。",
        "category": "HR Tech",
        "targetIndustry": "人材・HR",
        "targetCustomer": "中小企業",
        "investmentScale": "〜50万円",
        "difficulty": "低",
        "scores": {"novelty": 4, "marketSize": 4, "profitability": 4, "growth": 5, "feasibility": 4, "moat": 3},
        "scoreComments": {
            "novelty": "シニアのプロジェクト型・顧問型特化AIマッチングは既存媒体と根本的に異なる",
            "marketSize": "65歳以上の就業希望者は900万人超。受入企業のシニア活用ニーズも拡大中",
            "profitability": "成功報酬型で初期費用ゼロ。成立率が上がるほど収益が自動的に拡大する",
            "growth": "高年齢者雇用安定法改正（2025年4月）でシニア就業支援の企業義務が強化",
            "feasibility": "シニアのデジタルリテラシー支援とプロフィール整備に想定以上の工数が必要",
            "moat": "マッチング実績と評価データが蓄積するほど成約率が向上し競合と差がつく",
        },
        "whyNow": "2025年4月施行の高年齢者雇用安定法改正で65歳超の雇用確保措置が強化され、企業はシニア活用の具体策を求めている。老齢年金支給開始年齢の段階的引き上げと人手不足の深刻化により、シニア人材市場は急速に拡大している。",
        "noveltyNote": "シニアジョブやマイナビミドルシニアはフルタイム求人媒体として機能するが、プロジェクト型・顧問型の短期活用に特化しAIで3日以内のマッチングを成立させるSaaSは確認できない。本サービスはシニアの多様な働き方に対応する。",
        "strengthNote": "成功報酬型で初期投資ゼロのため顧客獲得の摩擦が小さく、マッチング実績・評価データが蓄積するほど成約率が向上して収益が自己強化される。高年齢者雇用法改正のたびに企業側の需要が喚起される構造。",
        "patternRationale": "A-3（人口動態の必然）は高齢化・シニア就業ニーズの拡大という不可逆的トレンドを捉え、B-4（摩擦の徹底除去）はプロジェクト型シニア採用の情報収集・面談という最大の摩擦をAIマッチングで解消する技術軸に対応する。",
        "patterns": ["A-3", "B-4"],
        "trendKeywords": ["シニア活躍推進", "高年齢者雇用法改正", "プロジェクト型雇用"],
        "tags": ["シニア人材", "プロジェクト型採用", "顧問マッチング", "定年後活躍"],
    },
    {
        "slug_prefix": "mindbridge",
        "serviceName": "MindBridge",
        "oneLiner": "50人未満企業のストレスチェック義務化をAIサポートで完全対応するSaaS",
        "concept": "2025年法改正でストレスチェックが全企業義務化されることを受け、50人未満の中小企業でも専任担当者なしで実施から産業医連携・高ストレス者フォローまで完結できるメンタルヘルスSaaS。",
        "target": "ストレスチェック義務化に備える従業員10〜50名未満の中小企業の経営者・総務担当者",
        "problem": "50人未満の中小企業は2025年法改正でストレスチェックが義務化されるが、専任担当者も産業医も社内にいないケースが多く、対応コストと方法に不安を抱えている企業が大半を占める。",
        "product": "オンラインストレスチェック実施と厚生労働省基準の自動集計\n高ストレス者へのAIチャット初期サポートと産業医紹介\n経営者向けチームメンタルヘルス状態ダッシュボード\n法的義務対応の完了証明書自動発行",
        "revenueModel": "月額SaaS 従業員数課金（10名まで4,980円〜）\n産業医面談チケット（1回5,000円〜）",
        "competitors": "ストレスチェッカー, ソシキスイッチ, アドバンテッジEAP, Growbase, CARES",
        "competitiveEdge": "ストレスチェッカーは10,000社導入の大手だが機能が多く中小には過剰な一方、MindBridgeは50人未満の義務化対応に特化し産業医紹介まで含めたワンストップ最安値クラスのSaaSで差別化する。",
        "category": "メンタルヘルス",
        "targetIndustry": "全業界",
        "targetCustomer": "中小企業",
        "investmentScale": "〜50万円",
        "difficulty": "低",
        "scores": {"novelty": 3, "marketSize": 5, "profitability": 4, "growth": 5, "feasibility": 4, "moat": 3},
        "scoreComments": {
            "novelty": "50人未満特化のストレスチェック＋AI初期サポート一体型は市場に少ない",
            "marketSize": "50人未満の中小企業は日本全企業の98%超。潜在対象市場が非常に大きい",
            "profitability": "月額SaaS＋産業医チケットの二層収益。低単価でも大量顧客で収益確保",
            "growth": "2025年5月法改正公布で50人未満の義務化が最長2028年5月までに施行",
            "feasibility": "産業医ネットワーク構築と厚生労働省基準への準拠確認が導入前に必要",
            "moat": "従業員のストレス傾向データが蓄積するほど予兆検知精度が向上し解約率が低い",
        },
        "whyNow": "2025年5月14日公布の労働安全衛生法改正でストレスチェックが50人未満にも義務化（最長2028年5月施行）され、対象企業が日本全体の98%超に拡大する。義務化に向けた準備需要が今後急増する。",
        "noveltyNote": "ストレスチェッカーやソシキスイッチは50人以上の大企業向け設計で機能が多く費用が高い。50人未満企業が産業医なしで義務化対応を完結できるワンストップSaaSは市場に確認できない。",
        "strengthNote": "月額SaaSで解約率が低く、従業員のストレス傾向データが蓄積するほど予兆検知精度が向上する。法的義務対応に不可欠なツールとなることで乗り換えコストが高まり、義務化施行のたびに新規顧客が自動流入する。",
        "patternRationale": "A-2（規制変化の「窓」）は2025年法改正による50人未満義務化という明確な参入機会を捉え、B-4（摩擦の徹底除去）は専任担当者なしで義務化対応を完結できない中小企業の最大の行政的摩擦を解消する技術軸に対応する。",
        "patterns": ["A-2", "B-4"],
        "trendKeywords": ["ストレスチェック義務化", "中小企業メンタルヘルス", "産業医DX"],
        "tags": ["ストレスチェック", "EAP", "メンタルヘルスケア", "産業医連携"],
    },
    {
        "slug_prefix": "freelanceops",
        "serviceName": "FreelanceOps",
        "oneLiner": "フリーランスの案件・請求・経費・税務をAIが一元管理するオールインワンSaaS",
        "concept": "フリーランス向けに案件管理・見積書・請求書作成・経費記録・確定申告まで一気通貫で対応するSaaS。フリーランス保護法施行後の契約明示義務への自動対応と、AIによる確定申告書草案生成まで完結する。",
        "target": "月収50万円以上の個人フリーランスエンジニア・デザイナー・ライター",
        "problem": "フリーランスが案件管理・経理・税務を別々のツールで行い、フリーランス保護法の契約明示義務にも手作業で対応しており、業務管理に週5時間以上を費やしている状況が続いている。",
        "product": "案件パイプライン管理と稼働時間トラッキング\n保護法対応の法定項目を満たす契約書・請求書自動生成\nAI自動仕訳と確定申告書草案の自動作成\nフリーランス保護法の契約条件コンプライアンスチェック",
        "revenueModel": "月額サブスク（ライト月980円〜、プロ月2,980円）\n税理士紹介・確定申告代行（年間29,800円〜）",
        "competitors": "freee, board, マネーフォワード クラウド, Meeepa, やよいの白色申告",
        "competitiveEdge": "freeeやマネーフォワードは法人・個人事業主向け汎用会計ソフトで案件管理機能が弱く、FreelanceOpsはフリーランス保護法対応の契約書チェックと案件パイプライン管理を統合した専業ツールで差別化する。",
        "category": "SaaS",
        "targetIndustry": "IT・通信",
        "targetCustomer": "フリーランス・副業",
        "investmentScale": "〜50万円",
        "difficulty": "低",
        "scores": {"novelty": 3, "marketSize": 4, "profitability": 3, "growth": 4, "feasibility": 4, "moat": 3},
        "scoreComments": {
            "novelty": "フリーランス保護法対応の契約書チェックと案件管理の統合は国内に少ない",
            "marketSize": "フリーランス人口は2025年に約462万人超。年収500万超の層が増加している",
            "profitability": "月額サブスク＋税理士紹介で二層収益。低価格帯で解約率を低く抑えられる",
            "growth": "2024年11月フリーランス保護法施行で契約管理ツールへの需要が急増中",
            "feasibility": "freeeやマネーフォワードと競合するため差別化価値訴求に工夫が求められる",
            "moat": "案件履歴・収支データが蓄積するほど確定申告が自動化され乗り換えを阻む",
        },
        "whyNow": "2024年11月1日にフリーランス保護法が施行され、取引条件の書面明示・報酬支払期日60日以内などの義務が発生した。施行1年間で445件の違反指導・勧告が発令されており、コンプライアンス対応ツールへの需要が急増している。",
        "noveltyNote": "freeeやboardは会計・請求書作成が主機能でフリーランス保護法の契約条件チェックや案件パイプライン管理を統合したSaaSは確認できない。本サービスはフリーランス特有の業務フロー全体をカバーする専業ツールとして差別化する。",
        "strengthNote": "月額サブスクで解約率が低く、案件履歴・収支データが蓄積するほど確定申告の自動化精度が向上する。保護法対応という法的義務が継続する限り乗り換えコストが高く、税理士紹介による高単価収益も安定する。",
        "patternRationale": "A-2（規制変化の「窓」）はフリーランス保護法施行という明確な参入機会を捉え、B-4（摩擦の徹底除去）は案件管理・経理・税務・法令対応という4つの業務摩擦を1サービスで解消する技術軸に対応する。",
        "patterns": ["A-2", "B-4"],
        "trendKeywords": ["フリーランス保護法", "副業解禁DX", "確定申告AI自動化"],
        "tags": ["フリーランス管理", "案件パイプライン", "保護法対応契約書", "副業経理"],
    },
    {
        "slug_prefix": "safelearn",
        "serviceName": "SafeLearn",
        "oneLiner": "建設現場の安全教育をスマホ動画で完結し修了証まで発行するeラーニングSaaS",
        "concept": "職長教育・特別教育・雇い入れ時安全教育を現場スマホで受講から修了証発行まで完結するSaaS。外国人作業員向けの多言語対応と顔認証受講確認で法的要件を完全充足する。",
        "target": "外国人含む10〜200名規模の工事現場を管理する中小建設会社の安全管理者・経営者",
        "problem": "建設業の安全教育は集合研修依存で外国人作業員への多言語対応や受講記録管理が困難。2024年4月の法改正で全業種に義務化が拡大し対応コストが急増している。",
        "product": "職長教育・特別教育の動画コンテンツ（10言語字幕対応）\n顔認証による受講確認と法的修了証の自動発行\n現場・作業員別の受講状況一元管理ダッシュボード\n新規入場者教育の当日完結デジタル運用",
        "revenueModel": "月額SaaS 作業員数課金（10名まで5,800円〜）\nコンテンツ制作代行（1コース30万円〜）",
        "competitors": "建設業教育協会, 安全・技能推進協会, Edu建, CIC日本建設情報センター, SAT",
        "competitiveEdge": "建設業教育協会やEdu建は日本語コンテンツ中心だが、SafeLearnは多言語対応動画と顔認証受講確認を組み合わせ外国人作業員が多い現場でも法的要件を完全充足できる点で差別化する。",
        "category": "EdTech",
        "targetIndustry": "建設・土木",
        "targetCustomer": "中小企業",
        "investmentScale": "50〜200万円",
        "difficulty": "中",
        "scores": {"novelty": 4, "marketSize": 4, "profitability": 3, "growth": 4, "feasibility": 3, "moat": 3},
        "scoreComments": {
            "novelty": "多言語対応動画＋顔認証受講確認の建設現場特化eラーニングは競合が少ない",
            "marketSize": "建設業許可業者は約47万社。外国人作業員数は2025年に過去最高を更新した",
            "profitability": "月額SaaSで解約しにくく、コンテンツ制作代行で高単価受注が可能となる",
            "growth": "2024年4月改正で安全教育が全業種義務化となりデジタル化需要が急増した",
            "feasibility": "顔認証精度と多言語翻訳品質の担保に専門パートナーとの連携が必要になる",
            "moat": "現場別の受講実績・修了証データが蓄積し労基署監査対応で乗り換えを阻む",
        },
        "whyNow": "2024年4月の労働安全衛生法改正で雇い入れ時安全衛生教育の省略規定が廃止され全業種で義務化された。外国人建設就労者数が2025年に過去最高を更新し、多言語対応の安全教育デジタル化ニーズが急拡大している。",
        "noveltyNote": "建設業教育協会やCIC日本建設情報センターはeラーニング提供の実績があるが、顔認証による受講確認と多言語対応を組み合わせ外国人作業員の多い現場での法的要件を完全充足するSaaSは確認できない。",
        "strengthNote": "月額SaaSで解約率が低く、現場別の受講実績・修了証データが労基署監査対応で不可欠となるため乗り換えコストが高い。外国人作業員比率の増加とともに多言語対応機能の価値が自動的に高まる構造。",
        "patternRationale": "A-2（規制変化の「窓」）は2024年法改正による安全教育義務拡大という明確な参入機会を捉え、C-7（BtoBtoC）は建設会社（法人）を主顧客としながら外国人作業員（個人）の教育完結まで価値を届ける構造に対応する。",
        "patterns": ["A-2", "C-7"],
        "trendKeywords": ["建設安全教育デジタル化", "外国人作業員教育", "eラーニング義務化"],
        "tags": ["安全教育デジタル化", "多言語eラーニング", "修了証自動発行", "顔認証受講"],
    },
    {
        "slug_prefix": "complibot",
        "serviceName": "CompliBot",
        "oneLiner": "ハラスメント・情報漏洩リスクをAIが診断し研修まで自動完結するSaaS",
        "concept": "企業のハラスメント防止・情報セキュリティ・個人情報保護のコンプライアンス研修をAIが自動生成・配信・習熟度測定まで完結するSaaS。2026年義務化対応を専任担当者なしで最短1日で完了する。",
        "target": "年1回の法定コンプライアンス研修対応に課題を持つ従業員5〜300名の中小企業の総務・人事担当者",
        "problem": "コンプライアンス研修の年1回義務化が中小企業にも拡大しているが、集合研修のコスト・教材作成の工数・受講管理の煩雑さから対応できていない企業が多数存在している。",
        "product": "業種別・職種別コンプライアンス研修コンテンツの自動配信\nAI習熟度テストと未修了者への自動リマインド送信\nハラスメントリスクスコアの組織単位での可視化\n研修実施証明書と受講記録の法的保全管理",
        "revenueModel": "月額SaaS 従業員数課金（20名まで9,800円〜）\nカスタムコンテンツ制作（1テーマ15万円〜）",
        "competitors": "manebi, Schoo, AirCourse, LearningBOX, Smart相談室",
        "competitiveEdge": "manebiは3,500社導入の大手eラーニングだが機能が多く費用が高い。CompliiBotは法定コンプライアンス研修の義務化対応に特化し月9,800円から使える中小向け設計で差別化する。",
        "category": "AI SaaS",
        "targetIndustry": "全業界",
        "targetCustomer": "中小企業",
        "investmentScale": "〜50万円",
        "difficulty": "低",
        "scores": {"novelty": 3, "marketSize": 4, "profitability": 4, "growth": 5, "feasibility": 4, "moat": 3},
        "scoreComments": {
            "novelty": "義務化対応特化の最安値クラス中小向けコンプライアンスSaaSは競合が少ない",
            "marketSize": "コンプライアンス研修義務がある企業は全国数百万社超。潜在市場が極めて大きい",
            "profitability": "月額SaaS＋カスタムコンテンツで二層収益。法的義務で解約されにくい",
            "growth": "2026年10月カスハラ・就活ハラスメント防止措置義務化で需要が新規拡大",
            "feasibility": "法改正への追従とコンテンツ品質の継続的な更新維持に専門知識が必要となる",
            "moat": "受講履歴とリスクスコアが蓄積するほど組織に応じた研修が最適化される",
        },
        "whyNow": "2026年10月1日施行予定のカスタマーハラスメント・就活ハラスメント防止義務化により、コンプライアンス研修対象テーマが拡大する。2025年度からハラスメント防止研修の年1回義務化が予定されており中小企業の対応需要が急増している。",
        "noveltyNote": "manebiやSchooは大企業・中堅向けの汎用eラーニングプラットフォームで中小には費用が高い。年1回の法定コンプライアンス研修義務化対応に特化し月9,800円から使えるSaaSは確認できない。",
        "strengthNote": "月額SaaSで解約率が低く、受講履歴・ハラスメントリスクスコアが蓄積するほど組織特性に応じた研修が最適化される。法的義務対応ツールとして必需品化することで乗り換えコストが高まり、義務化テーマ拡大のたびに追加収益が発生する。",
        "patternRationale": "A-2（規制変化の「窓」）はハラスメント防止研修義務化・カスハラ防止義務化という明確な参入機会を捉え、B-4（摩擦の徹底除去）は研修コンテンツ作成・配信・受講管理という中小総務の最大の事務的摩擦を解消する技術軸に対応する。",
        "patterns": ["A-2", "B-4"],
        "trendKeywords": ["ハラスメント防止義務化", "コンプライアンスDX", "eラーニング年次研修"],
        "tags": ["ハラスメント防止研修", "情報セキュリティ教育", "受講管理自動化", "コンプライアンス"],
    },
]

# バリデーション
has_error = False
for idea in ideas:
    errors = validate(idea)
    if errors:
        print(f"[VALIDATION ERROR] {idea['serviceName']}")
        for e in errors: print(f"  [NG] {e}")
        has_error = True
    else:
        print(f"[OK] {idea['serviceName']}")

if has_error:
    sys.exit(1)
print("[ALL VALIDATION OK]")

# INSERT
conn = psycopg2.connect(DATABASE_URL)
try:
    cur = conn.cursor()
    cur.execute('SELECT COALESCE(MAX(number), 0) FROM "Idea"')
    next_number = cur.fetchone()[0] + 1
    today = date.today().isoformat()

    for idea in ideas:
        number = next_number
        next_number += 1
        sp = idea.get("slug_prefix", "")
        if not sp:
            sp = re.sub(r'[^a-z0-9]+', '-', idea["serviceName"].lower()).strip('-')
        slug = f"{sp}-{number}" if sp else f"idea-{number}"
        idea_id = str(uuid.uuid4())

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
                %s,%s,%s,%s,%s,%s,%s,%s,
                %s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,
                %s,%s,%s,%s,%s,%s,%s,%s,
                0, 0, NOW(), NOW()
            )
        """, (
            idea_id, slug, number, idea["serviceName"],
            idea["concept"], idea["target"], idea["problem"], idea["product"],
            idea["revenueModel"], idea["competitors"], idea["competitiveEdge"],
            json.dumps(idea.get("tags", []), ensure_ascii=False),
            idea["category"], idea["targetIndustry"], idea["targetCustomer"],
            idea["investmentScale"], idea["difficulty"],
            json.dumps(idea["scores"], ensure_ascii=False),
            json.dumps(idea["scoreComments"], ensure_ascii=False),
            json.dumps(idea.get("trendKeywords", []), ensure_ascii=False),
            idea["oneLiner"], today,
            json.dumps(idea["patterns"], ensure_ascii=False),
            idea["whyNow"], idea["noveltyNote"], idea["strengthNote"],
            idea.get("patternRationale", ""),
        ))
        avg = sum(idea["scores"].values()) / 6
        print(f"INSERT完了: #{number} {idea['serviceName']} (slug: {slug}) 平均スコア: {avg:.1f}")

    conn.commit()
    print(f"[完了] {len(ideas)}件を挿入しました")
finally:
    conn.close()
