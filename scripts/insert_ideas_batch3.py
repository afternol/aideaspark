"""アイデア#26〜#35 バッチINSERTスクリプト"""
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
        "slug_prefix": "foodcast",
        "serviceName": "FoodCast",
        "oneLiner": "飲食店の食材ロスをAI需要予測で削減する中小飲食専用SaaS",
        "concept": "飲食店の売上データ・気象情報・イベントカレンダーをAIが分析し日次発注量を自動計算するSaaS。食材ロスを30%削減しながら欠品ゼロを実現。月額5万円超の大手向けサービスを使えない独立系飲食店向けに特化する。",
        "target": "1〜5店舗の独立系・小規模チェーン飲食店のオーナーシェフ・店長",
        "problem": "飲食店の食材発注は経験則に依存し、週末や悪天候時の売れ残りや仕入れ過多が利益を圧迫している。大手向けAI需要予測は月額5万円超で独立系飲食店には導入不可能だ。",
        "product": "日次・週次の食材需要AI予測（気象・曜日・地域イベント連動）\n発注量自動計算と主要卸業者への自動FAX/メール送信\n食材ロス率・廃棄コストの可視化ダッシュボード\n季節メニュー変更時の在庫調整シミュレーション",
        "revenueModel": "月額SaaS 店舗数課金（1店舗9,800円〜）\nAI発注精度保証プラン（月19,800円〜）",
        "competitors": "AIsee, Fujitsu ODMA, パロアルトインサイト, クックビズ, Lsystem",
        "competitiveEdge": "Fujitsu ODMAやパロアルトインサイトは大手チェーン向けで月額が高く独立系飲食店には不向きだが、FoodCastは1店舗月額9,800円から使えるシンプルな設計で独立系飲食店特化を徹底する。",
        "category": "AI SaaS",
        "targetIndustry": "飲食・食品",
        "targetCustomer": "飲食店・店舗",
        "investmentScale": "〜50万円",
        "difficulty": "低",
        "scores": {"novelty": 3, "marketSize": 4, "profitability": 4, "growth": 4, "feasibility": 4, "moat": 3},
        "scoreComments": {
            "novelty": "1店舗1万円以下の独立系飲食店特化AI需要予測は大手競合が未参入",
            "marketSize": "全国飲食店は約50万店超。食品ロス削減ニーズは全店舗に共通する課題",
            "profitability": "月額SaaSで解約率が低く食材ロス削減効果が月数万円で費用対効果が高い",
            "growth": "食品ロス削減目標（2030年半減）が義務化傾向となり需要が急速に拡大中",
            "feasibility": "気象API・POS連携はSaaSで調達可能で最短2ヶ月でMVP開発できる",
            "moat": "店舗の売上・ロスデータが蓄積するほどAI予測精度が向上し乗り換えを阻む",
        },
        "whyNow": "食品ロス削減促進法（2019年施行）を受け2030年までに食品ロスを半減させる目標が政府から示された。2024年にスシローが廃棄率75%削減を実現したAI需要予測の成果が報道され、独立系飲食店でも需要予測DXへの関心が急増している。",
        "noveltyNote": "AIseeやFujitsu ODMAは大手チェーン向けで月額5万円超の高価格帯だが、1店舗月額9,800円から使えるシンプルなAI需要予測SaaSは独立系飲食店向けに確認できない。本サービスはシンプルな設計と低価格帯で差別化する。",
        "strengthNote": "月額SaaSで解約率が低く、店舗ごとの売上・ロスデータが蓄積するほどAI予測精度が向上する。食材ロス削減効果が月数万円規模のため費用対効果が明確で顧客が自発的に継続利用する構造となる。",
        "patternRationale": "A-3（人口動態の必然）は食品ロス削減義務化という不可逆的社会要請を捉え、B-4（摩擦の徹底除去）は食材発注という毎日の業務摩擦をAIで自動化する技術軸に対応する。",
        "patterns": ["A-3", "B-4"],
        "trendKeywords": ["フードロス削減DX", "飲食店AI発注", "食品ロス半減目標"],
        "tags": ["食材ロス削減", "AI需要予測", "自動発注", "独立系飲食店"],
    },
    {
        "slug_prefix": "propowner",
        "serviceName": "PropOwner",
        "oneLiner": "物件オーナーが管理会社なしで賃貸経営をAIで完全自走できるSaaS",
        "concept": "物件オーナーが管理会社を介さずに入居者管理・家賃収納・修繕手配・収支報告をクラウドで自走できるSaaS。AIが修繕費用を自動見積もりし確定申告書類まで自動生成することで月数万円の管理費を節約する。",
        "target": "物件を5〜30室保有する個人不動産オーナー・小規模家主",
        "problem": "個人オーナーは管理会社に家賃の5〜10%を支払っているが手数料が高く報告が不透明なケースも多い。自主管理に切り替えると入居者対応・収支管理の工数が膨大になるジレンマがある。",
        "product": "入居者管理（契約書・更新・退去）のデジタル一元管理\n家賃収納・滞納アラート・催促メッセージ自動送信\n修繕手配AI見積もりとリフォーム業者マッチング\n確定申告用収支明細の自動生成とe-Tax連携",
        "revenueModel": "月額SaaS 保有室数課金（10室まで4,980円〜）\n修繕業者紹介手数料（成功報酬型）",
        "competitors": "GMO賃貸DX, いい生活Owner, くらさぽコネクト, オーナーズクラウド, 大家さんの強い味方",
        "competitiveEdge": "GMO賃貸DXやくらさぽコネクトは管理会社が導入するシステムで個人オーナーが直接使う設計ではなく、PropOwnerはオーナー自主管理特化の確定申告連携まで含むSaaSとして差別化する。",
        "category": "プロップテック",
        "targetIndustry": "不動産・住宅",
        "targetCustomer": "個人事業主",
        "investmentScale": "〜50万円",
        "difficulty": "低",
        "scores": {"novelty": 4, "marketSize": 4, "profitability": 3, "growth": 4, "feasibility": 4, "moat": 3},
        "scoreComments": {
            "novelty": "個人オーナー自主管理特化の確定申告連携SaaSは国内に競合が少ない",
            "marketSize": "個人賃貸物件オーナーは約200万人以上。自主管理比率は約30%で増加傾向",
            "profitability": "月額SaaSで解約率が低く、修繕業者紹介手数料で追加収益を確保できる",
            "growth": "金利上昇で管理コスト削減ニーズが高まり自主管理を検討するオーナーが増加",
            "feasibility": "入居者との直接連絡機能と修繕業者ネットワーク構築に時間とコストが必要",
            "moat": "物件・修繕履歴が蓄積するほど確定申告自動化の精度が上がり乗り換えを阻む",
        },
        "whyNow": "金利上昇局面で不動産オーナーのコスト削減意識が高まり管理会社への手数料節約で自主管理への関心が増している。2024年の相続登記義務化と賃貸借契約の電子化が進みデジタル自主管理の基盤が整いつつある。",
        "noveltyNote": "GMO賃貸DXやくらさぽコネクトは管理会社向けシステムで個人オーナーが単独で使う設計ではなく、確定申告書類自動生成と修繕業者マッチングを統合したオーナー自主管理SaaSは確認できない。",
        "strengthNote": "月額SaaSで解約率が低く、物件・入居者・修繕履歴が蓄積するほど確定申告の自動化精度が向上する。修繕業者紹介の成功報酬モデルにより顧客の物件維持と自社収益が連動し自己強化的な収益構造が成立する。",
        "patternRationale": "B-4（摩擦の徹底除去）は自主管理オーナーの管理業務という日常的摩擦をAIで解消し、C-7（BtoBtoC）は修繕業者（法人）とオーナー（個人）をつなぐ三者プラットフォーム構造に対応する。",
        "patterns": ["B-4", "C-7"],
        "trendKeywords": ["不動産自主管理DX", "相続登記義務化", "賃貸経営コスト削減"],
        "tags": ["個人オーナー", "自主管理", "家賃収納", "確定申告連携"],
    },
    {
        "slug_prefix": "routeopt",
        "serviceName": "RouteOpt",
        "oneLiner": "AI配車で中小配送業者の1日の走行距離を30%削減するSaaS",
        "concept": "中小配送業者の配達先リストをアップロードするだけでAIが最適配送ルートを自動生成するSaaS。ドライバーの残業削減と燃料費削減を同時に実現し2024年物流問題への法的対応を支援する。",
        "target": "ドライバー3〜20名規模の中小配送会社・食品卸・EC配送事業者の管理者・経営者",
        "problem": "中小配送業者の配車計画は手作業やアナログルートに依存しドライバーの残業時間が多い。LoogiaやLYNAなど既存のAI配車SaaSは月額10万円以上で中小には導入障壁が高い。",
        "product": "配達先リスト一括アップロード→最適ルート自動生成\nリアルタイム渋滞回避とルート再計算\nドライバーアプリとの連携（音声ナビ機能）\n走行距離・燃料費・残業時間の削減効果レポート",
        "revenueModel": "月額SaaS ドライバー数課金（3名まで9,800円〜）\n配送実績データ分析レポート（月2,000円〜）",
        "competitors": "Loogia, LYNA自動配車クラウド, ZENRIN ロジスティクス, NAVITIME配送ルート最適化, オプティマップ",
        "competitiveEdge": "LoogiaやLYNAは月額10万円以上で中小には高価格だが、RouteOptは3名規模から月額9,800円で使えるシンプルな設計でスマホナビとの即日連携が可能な中小特化版として差別化する。",
        "category": "物流テック",
        "targetIndustry": "物流・運輸",
        "targetCustomer": "中小企業",
        "investmentScale": "〜50万円",
        "difficulty": "低",
        "scores": {"novelty": 3, "marketSize": 4, "profitability": 4, "growth": 5, "feasibility": 4, "moat": 3},
        "scoreComments": {
            "novelty": "3名規模から月額1万円で使えるAI配車SaaSは中小配送業者市場に少ない",
            "marketSize": "全国貨物運送業者は約6万社超。ドライバー人手不足で効率化需要が急増中",
            "profitability": "月額SaaSで解約率が低く燃料費削減効果が月数万円で費用対効果が明確",
            "growth": "2024年物流問題でドライバー残業規制が強化され配車最適化が急務となった",
            "feasibility": "地図APIと配送最適化アルゴリズムは既存ライブラリで実装が可能となる",
            "moat": "配送ルート・ドライバー特性データが蓄積するほどAI最適化精度が向上する",
        },
        "whyNow": "2024年4月から物流業界にも残業上限規制（年960時間）が適用され中小配送業者は配車効率化が法的義務となった。燃料費高騰と運転手不足が重なりAIによる配車最適化への投資意欲が急速に高まっている。",
        "noveltyNote": "LoogiaやLYNA自動配車クラウドは大手・中堅向けで月額10万円以上の高価格帯だが、3名規模のドライバーから月額9,800円で翌日から使えるAI配車SaaSは中小配送業者向けに確認できない。",
        "strengthNote": "月額SaaSで解約率が低く、配送ルート・ドライバー特性データが蓄積するほどAI最適化精度が向上する。残業規制対応という法的義務が継続する限り解約しにくく粘着性の高い収益構造が成立する。",
        "patternRationale": "A-2（規制変化の「窓」）は物流2024年問題の残業上限規制という明確な参入機会を捉え、B-4（摩擦の徹底除去）は毎日の配車計画という最大の業務摩擦をAIで解消する技術軸に対応する。",
        "patterns": ["A-2", "B-4"],
        "trendKeywords": ["物流2024年問題", "AI配車最適化", "ドライバー残業規制"],
        "tags": ["AI配車", "ルート最適化", "燃料費削減", "中小配送"],
    },
    {
        "slug_prefix": "wastemanifest",
        "serviceName": "WasteManifest",
        "oneLiner": "産廃マニフェストをスマホで発行・追跡し法定管理を自動完結するSaaS",
        "concept": "産業廃棄物排出企業がスマホからマニフェスト発行・処理業者への伝達・回収確認・保存までを完結するSaaS。電子マニフェスト義務化への対応と廃棄物コスト削減レポートまで自動生成する。",
        "target": "産業廃棄物を排出する従業員10〜200名規模の中小製造・建設・医療機関の環境担当者",
        "problem": "産業廃棄物のマニフェスト管理は紙台帳や手作業での追跡に依存し、法定保存義務（5年間）への対応や処理業者ごとの集計に多大な工数がかかっている。",
        "product": "スマホでの電子マニフェスト発行とJWNET自動伝送\n処理業者別の廃棄物量・コスト集計ダッシュボード\n法定保存書類の自動アーカイブ（5年間対応）\n廃棄物削減施策の提案レポート自動生成",
        "revenueModel": "月額SaaS 月間マニフェスト件数課金（50件まで9,800円〜）\nコンサルティング代行（年間50万円〜）",
        "competitors": "むつみのマニフェスト, e-reverse.com, PBasis, 廃棄物管理クラウド, CANOT",
        "competitiveEdge": "むつみのマニフェストは紙台帳管理が主体でスマホ対応が限定的な一方、WasteManifestはスマホファーストの電子マニフェスト発行とJWNET自動連携で法定管理を即日デジタル化できる点で差別化する。",
        "category": "カーボンテック",
        "targetIndustry": "環境・リサイクル",
        "targetCustomer": "中小企業",
        "investmentScale": "〜50万円",
        "difficulty": "中",
        "scores": {"novelty": 3, "marketSize": 3, "profitability": 3, "growth": 4, "feasibility": 4, "moat": 3},
        "scoreComments": {
            "novelty": "スマホファーストのマニフェスト発行とJWNET自動連携は競合に少ない",
            "marketSize": "産廃排出事業者は全国約15万社超。電子化義務拡大で新規需要が継続する",
            "profitability": "マニフェスト件数課金で使うほど収益が積み上がり月額収益が安定する",
            "growth": "電子マニフェスト義務化範囲拡大の議論が進んでおりデジタル化需要が増加",
            "feasibility": "JWNETとのAPI連携仕様対応と廃棄物コードへの準拠が開発に必要となる",
            "moat": "処理業者との取引データと保存書類が蓄積し行政監査対応で乗り換えを阻む",
        },
        "whyNow": "特別産業廃棄物を50トン以上排出する企業は2020年4月から電子マニフェスト登録が義務化された。廃棄物処理法の改正が継続的に進んでおり義務対象範囲の拡大と未対応企業への指導強化が見込まれている。",
        "noveltyNote": "むつみのマニフェストやe-reverse.comは電子マニフェスト管理を提供するが、スマホからワンタップで発行しJWNETに自動伝送する廃棄物コスト可視化機能を統合したSaaSは確認できない。",
        "strengthNote": "月額SaaSで解約率が低く、処理業者との取引データと5年分の保管書類が蓄積するほど乗り換えコストが高まる。行政監査対応という法的義務により必需品化し廃棄物削減施策レポートでアップセルが可能。",
        "patternRationale": "A-2（規制変化の「窓」）は電子マニフェスト義務化という明確な参入機会を捉え、B-4（摩擦の徹底除去）は紙マニフェストの発行・追跡・保存という最大の事務的摩擦をスマホで完全解消する技術軸に対応する。",
        "patterns": ["A-2", "B-4"],
        "trendKeywords": ["電子マニフェスト義務化", "廃棄物管理DX", "産廃コスト削減"],
        "tags": ["産業廃棄物管理", "電子マニフェスト", "JWNET連携", "法定保存対応"],
    },
    {
        "slug_prefix": "coldguard",
        "serviceName": "ColdGuard",
        "oneLiner": "冷蔵・冷凍設備の温度異常をAIが即検知しHACCP記録を自動生成するSaaS",
        "concept": "飲食店・食品工場・薬局の冷蔵・冷凍設備にセンサーを設置するだけでAIが24時間温度監視し異常時にスタッフスマホへ即通知するIoT SaaS。HACCP義務対応の温度記録ログを自動生成する。",
        "target": "HACCP義務対応が必要な従業員5〜100名規模の食品製造業・飲食店・調剤薬局の衛生管理担当者",
        "problem": "冷蔵・冷凍庫の温度記録を手作業で1日2回行いHACCP対応書類作成に月数時間を費やしている。夜間・休日の温度異常発見が遅れ食品廃棄ロスが発生するリスクが高い状態が続いている。",
        "product": "IoTセンサーによる24時間リアルタイム温度監視\n温度異常時のスタッフスマホへの即時アラート\nHACCP対応温度記録の自動生成・保存（7年分対応）\n複数店舗・冷蔵庫の温度状況一元管理ダッシュボード",
        "revenueModel": "月額SaaS センサー台数課金（3台まで4,980円〜）\n初期センサー設置費（1台8,000円〜）",
        "competitors": "温度っち, Toami, IIJ HACCP温度管理支援, おくだけセンサー for HACCP, ユビキタス電力IoT",
        "competitiveEdge": "温度っちは月350円/台の最安値だが管理機能が限定的な一方、ColdGuardはAI異常予測と複数店舗の一元管理・HACCP書類自動生成を一体提供し多店舗展開する食品事業者向けに差別化する。",
        "category": "IoT",
        "targetIndustry": "飲食・食品",
        "targetCustomer": "中小企業",
        "investmentScale": "〜50万円",
        "difficulty": "低",
        "scores": {"novelty": 3, "marketSize": 4, "profitability": 3, "growth": 4, "feasibility": 4, "moat": 4},
        "scoreComments": {
            "novelty": "AI異常予測＋複数店舗一元管理＋HACCP書類自動生成の一体型は少ない",
            "marketSize": "HACCP義務対象の食品事業者は全国数十万社超。薬局も含め対象が広範",
            "profitability": "センサー設置初期費用＋月額SaaSで初期から黒字化しやすい収益構造",
            "growth": "2021年のHACCP完全義務化から対応が遅れている中小事業者が多数残存",
            "feasibility": "IoTセンサーとクラウド連携は既存モジュールで構築可能で参入障壁が低い",
            "moat": "センサーが設置されると除去コストが高く温度履歴データが監査証跡となる",
        },
        "whyNow": "2021年6月にHACCP管理が全食品事業者に義務化されたが対応が遅れている中小食品事業者が多数残存している。2024年の食品衛生法改正でHACCP記録の電磁的保存が推奨となりデジタル温度管理への移行需要が急増している。",
        "noveltyNote": "温度っちやおくだけセンサーは低コストのIoT温度計測が主体だが、AI異常予測・複数店舗一元管理・HACCP書類の自動生成を統合したSaaSは確認できない。本サービスはデータ活用まで含めたHACCP対応の完結を実現する。",
        "strengthNote": "センサー設置後は除去コストが高く物理的ロックインが発生する。温度履歴データがHACCP義務の監査証跡として蓄積するため競合への乗り換えが事実上困難になり長期的な解約率が極めて低くなる。",
        "patternRationale": "A-2（規制変化の「窓」）はHACCP義務化という明確な参入機会を捉え、F-6（センサー・IoT×未計測領域）は冷蔵庫温度という24時間未計測領域をデジタル化する本質的技術軸に対応する。",
        "patterns": ["A-2", "F-6"],
        "trendKeywords": ["HACCP義務化対応", "食品温度管理IoT", "冷凍冷蔵DX"],
        "tags": ["温度管理IoT", "HACCP対応", "冷凍冷蔵監視", "食品安全"],
    },
    {
        "slug_prefix": "greentrack",
        "serviceName": "GreenTrack",
        "oneLiner": "中小企業のCO2排出量をExcel不要で自動計測する脱炭素SaaS",
        "concept": "中小企業の電気・ガス・燃料の請求書をアップロードするだけでScope1〜2のCO2排出量を自動算出するSaaS。取引先からのScope3開示要求に対応するレポートを低コストで自動生成する。",
        "target": "取引先からCO2排出量の開示を求められ始めた従業員20〜200名規模の中小製造・サービス業の環境担当・総務",
        "problem": "中小企業は取引先大企業からサプライチェーンのCO2開示を求められているが、ZeroboardなどのSaaSは中小には高価格でExcelでの手作業集計が実態となっている。",
        "product": "請求書アップロード→Scope1・2排出量の自動算出\n取引先提出用CO2開示レポートの自動生成\n削減目標設定と進捗モニタリングダッシュボード\n業界平均との排出量比較ベンチマーク機能",
        "revenueModel": "月額SaaS 従業員数課金（20名まで4,980円〜）\nScope3対応コンサルティング（年間30万円〜）",
        "competitors": "Zeroboard, e-dash, ScopeX, オンド, GHGプラットフォーム",
        "competitiveEdge": "Zeroboardやe-dashは大企業・中堅向けで費用が高く中小では導入が困難だが、GreenTrackは請求書アップロードのみで月額4,980円からScope1〜2を自動算出し中小企業の開示要求に即対応できる点で差別化する。",
        "category": "カーボンテック",
        "targetIndustry": "製造",
        "targetCustomer": "中小企業",
        "investmentScale": "〜50万円",
        "difficulty": "低",
        "scores": {"novelty": 3, "marketSize": 4, "profitability": 3, "growth": 5, "feasibility": 4, "moat": 3},
        "scoreComments": {
            "novelty": "請求書アップロードのみでScope1・2算出できる最安値中小向けは少ない",
            "marketSize": "取引先からCO2開示を求められる中小企業は今後数十万社規模に拡大する",
            "profitability": "月額SaaSで解約率が低くコンサルティング追加収益でARPUを引き上げられる",
            "growth": "東証プライム企業のScope3開示義務化の波及で中小企業の対応需要が急増",
            "feasibility": "排出係数DBの継続的メンテナンスと規制変化への追従コストが長期的に必要",
            "moat": "企業ごとの排出量履歴と削減実績が蓄積するほどレポート品質が向上する",
        },
        "whyNow": "東証プライム上場企業のTCFD/ISSB開示義務化が2025年から本格化しサプライチェーン全体のScope3排出量開示が取引先中小企業にも波及している。欧州CBAM（炭素国境調整措置）が2026年から本格適用となり輸出中小企業の対応が急務となっている。",
        "noveltyNote": "ZeroboardやScopeXは大企業・中堅向けで機能が多く費用が高い。請求書アップロードのみでScope1〜2を算出し月額4,980円から使える中小企業向けSaaSは確認できない。本サービスは取引先への開示対応を最小工数で完結させる。",
        "strengthNote": "月額SaaSで解約率が低く、企業ごとの排出量履歴と削減実績が蓄積するほどレポート品質と精度が向上する。取引先への開示が継続的に求められる限り解約しにくくコンサルティング追加収益でARPUが安定して成長する。",
        "patternRationale": "A-2（規制変化の「窓」）は東証プライム開示義務化とCBAM適用という明確な参入機会を捉え、B-4（摩擦の徹底除去）は請求書からのCO2集計という中小企業の最大の環境対応摩擦を解消する技術軸に対応する。",
        "patterns": ["A-2", "B-4"],
        "trendKeywords": ["Scope3開示義務化", "サプライチェーン脱炭素", "CBAM対応"],
        "tags": ["CO2排出量計測", "脱炭素SaaS", "Scope3対応", "カーボンフットプリント"],
    },
    {
        "slug_prefix": "shopcast",
        "serviceName": "ShopCast",
        "oneLiner": "独立系小売店の売上を天候・イベントから予測し自動発注するSaaS",
        "concept": "独立系スーパー・ドラッグストア・食品小売店の売上データ・気象情報・地域イベントをAIが分析し最適発注量を自動計算するSaaS。大手チェーン向けシステムが入れられない単店・小規模チェーン特化で展開する。",
        "target": "3〜30店舗の独立系スーパー・ドラッグストア・食品小売の仕入れ担当者・店長",
        "problem": "独立系小売店の発注は担当者の経験則に依存し、週末や季節イベントの売れ残りや欠品が利益を圧迫している。AI需要予測はNECや日立など大企業向けで単店・小規模チェーンには導入できない。",
        "product": "POS実績×気象×地域イベントのAI需要予測モデル\nカテゴリ別・SKU別の最適発注量自動計算\n季節メニュー・セール時の在庫インパクトシミュレーション\n欠品・ロス率削減効果の可視化ダッシュボード",
        "revenueModel": "月額SaaS 店舗数課金（1店舗14,800円〜）\n発注精度保証プラン（月29,800円〜）",
        "competitors": "AI-Order Foresight, NEC需要予測型自動発注, 日立システムズ需要予測, Shelly, inSmarts",
        "competitiveEdge": "AI-Order ForesightやNECは大手スーパー（130〜304店舗規模）向けで単店・小規模チェーンには機能過多かつ高価格だが、ShopCastは3店舗から月額14,800円で使えるシンプルな設計で差別化する。",
        "category": "リテールテック",
        "targetIndustry": "小売・EC",
        "targetCustomer": "中小企業",
        "investmentScale": "50〜200万円",
        "difficulty": "中",
        "scores": {"novelty": 3, "marketSize": 4, "profitability": 3, "growth": 4, "feasibility": 3, "moat": 3},
        "scoreComments": {
            "novelty": "独立系単店・小規模チェーン特化のAI需要予測SaaSは大手競合が未参入",
            "marketSize": "全国独立系食品スーパー・ドラッグストアは数万店規模。未開拓市場が大きい",
            "profitability": "月額SaaSで解約率が低く発注精度保証プランでARPUを引き上げられる",
            "growth": "人手不足で仕入れ担当のDX化が急務となり需要予測SaaSへの関心が高まる",
            "feasibility": "POS連携仕様が小売業者ごとに異なりAPI開発コストが想定以上になりやすい",
            "moat": "店舗の売上・発注履歴が蓄積するほどAI予測精度が向上し乗り換えを阻む",
        },
        "whyNow": "食品ロス削減促進法の目標（2030年半減）と小売業界の深刻な人手不足が重なりAIによる発注自動化への需要が急増している。大手チェーンでのAI発注成功事例が業界に広まり独立系小売店でも同様のツールへの関心が高まっている。",
        "noveltyNote": "AI-Order ForesightやNEC需要予測型自動発注は大手チェーン専用設計で小規模店舗では導入コストが高すぎる。3店舗から月額14,800円で使えるPOS連携型AI需要予測SaaSは独立系小売向けに確認できない。",
        "strengthNote": "月額SaaSで解約率が低く、店舗ごとの売上・発注履歴が蓄積するほどAI予測精度が向上する。欠品・ロス率削減効果が月数十万円規模のため費用対効果が明確で顧客が自発的に継続利用する構造となる。",
        "patternRationale": "A-3（人口動態の必然）は少子化・人手不足による小売DX化という不可逆的トレンドを捉え、B-4（摩擦の徹底除去）は仕入れ担当の発注判断という毎日の業務摩擦をAIで解消する技術軸に対応する。",
        "patterns": ["A-3", "B-4"],
        "trendKeywords": ["小売AI発注最適化", "食品ロス削減DX", "POS連携需要予測"],
        "tags": ["AI需要予測", "自動発注", "独立系小売", "食品ロス削減"],
    },
    {
        "slug_prefix": "farmdirect",
        "serviceName": "FarmDirect",
        "oneLiner": "農家が産直ECで消費者に直接販売できるオールインワンSaaS",
        "concept": "農業生産者がEC構築・決済・配送手配・顧客管理をワンストップで管理できる産直EC SaaS。食べチョクやポケットマルシェへの依存を脱却し自社ブランドの直販ECサイトを低コストで立ち上げる。",
        "target": "直販EC展開を検討している年商500万円〜5,000万円規模の農業生産者・農業法人の経営者",
        "problem": "食べチョクやポケットマルシェは手数料が20%と高く自社ブランドを構築しにくい。一方EC構築から配送管理まで自分で対応するのは農業者には専門知識が必要で導入障壁が高い。",
        "product": "自社ブランドの産直ECサイト自動構築（テンプレート型）\n注文管理・決済・ヤマト/佐川連携配送手配の自動化\nリピーター向けの定期便・セット商品販売機能\n顧客データ分析とメルマガ自動配信機能",
        "revenueModel": "月額SaaS（9,800円〜）＋売上の2.5%\n配送代行オプション（1件500円〜）",
        "competitors": "食べチョク, ポケットマルシェ, 産直アウル, アグリーチ, Makeshop農業向け",
        "competitiveEdge": "食べチョクやポケットマルシェは手数料20%の他社プラットフォーム依存で自社ブランド構築が困難だが、FarmDirectは売上の2.5%の低手数料で自社ブランドECを即日立ち上げられる設計で差別化する。",
        "category": "プラットフォーム",
        "targetIndustry": "農業・一次産業",
        "targetCustomer": "農家・生産者",
        "investmentScale": "〜50万円",
        "difficulty": "低",
        "scores": {"novelty": 4, "marketSize": 3, "profitability": 3, "growth": 4, "feasibility": 4, "moat": 3},
        "scoreComments": {
            "novelty": "農業者向け自社ブランドECの自動構築と配送連携一体型は競合に少ない",
            "marketSize": "農業生産者の直販EC参入率はまだ数%。産直EC市場は2020年比20倍成長",
            "profitability": "月額SaaS＋売上比例課金で収益が農家の成長と連動し自動拡大する",
            "growth": "産直ECの流通額は2020年から急増し農業者の直販意向が年々高まっている",
            "feasibility": "決済・配送APIは既存SaaSで調達可能でECサイト構築は2〜3ヶ月で完成",
            "moat": "農家ごとの顧客データとリピーター基盤が蓄積するほど乗り換えコストが高まる",
        },
        "whyNow": "産直ECの流通額が2020年から急増し農業者の直販意向が高まっている。2024年の農業基本法改正でスマート農業・農産物流通改革が政策重点となり農業者が自ら消費者に販売するDtoCモデルへの支援が強化されている。",
        "noveltyNote": "食べチョクやポケットマルシェは他社プラットフォームで手数料20%だが、農業者が自社ブランドECを即日立ち上げて配送まで一元管理できる低手数料のSaaSは確認できない。本サービスは農業者のブランド自律を支援する。",
        "strengthNote": "月額SaaSで解約率が低く、農家ごとの顧客データとリピーター基盤が蓄積するほど乗り換えコストが高まる。農家の成長とともに売上比例収益が自動拡大し顧客と共に収益が伸びる自己強化的な事業構造となる。",
        "patternRationale": "A-3（人口動態の必然）は農業従事者減少・農家の収益改善ニーズという不可逆的トレンドを捉え、C-7（BtoBtoC）は農業生産者（法人）を主顧客としながら消費者（個人）との直取引を実現する三者プラットフォーム構造に対応する。",
        "patterns": ["A-3", "C-7"],
        "trendKeywords": ["農業DtoCEC", "産直流通改革", "農業法改正DX"],
        "tags": ["農業直販EC", "産直プラットフォーム", "農家自社ブランド", "DtoC農業"],
    },
    {
        "slug_prefix": "esgeasy",
        "serviceName": "ESGEasy",
        "oneLiner": "中小企業のESGレポートをAIが書類不要で自動生成する開示SaaS",
        "concept": "中小企業が環境・社会・ガバナンスの非財務情報をフォーム入力するだけでAIがESGレポートを自動生成するSaaS。取引先大企業からの開示要求に迅速対応しISO14001や各種ESG基準への対応を低コストで実現する。",
        "target": "取引先からESG開示を求められ始めた従業員20〜300名規模の中小製造・IT・物流企業の経営企画・総務担当者",
        "problem": "中小企業は取引先からESG開示を求められているがSmartESGやTERRASTは大企業向けで高価格すぎる。コンサルタントへの依頼費用も数百万円規模で中小には対応が困難だ。",
        "product": "フォーム入力→ESGレポートのAI自動生成（GRI・TCFD対応）\n取引先別のカスタム開示フォーマット生成機能\nCO2排出量・エネルギー消費の自動集計連携\n年次更新の変化点サマリーと改善提案自動生成",
        "revenueModel": "月額SaaS 従業員数課金（20名まで4,980円〜）\n認証取得コンサルティング（年間30万円〜）",
        "competitors": "SmartESG, TERRAST, Diginex, Greenly, サステナクラフト",
        "competitiveEdge": "SmartESGは東証プライム上場企業の約15%が採用する大企業向けで中小には機能過多だが、ESGEasyはフォーム入力のみで月額4,980円からESGレポートを自動生成し中小の開示要求に即対応できる点で差別化する。",
        "category": "ESG・インパクト",
        "targetIndustry": "製造",
        "targetCustomer": "中小企業",
        "investmentScale": "〜50万円",
        "difficulty": "低",
        "scores": {"novelty": 3, "marketSize": 4, "profitability": 3, "growth": 5, "feasibility": 4, "moat": 3},
        "scoreComments": {
            "novelty": "フォーム入力のみで月5千円からESGレポートを自動生成するSaaSは少ない",
            "marketSize": "取引先からESG開示を求められる中小企業は今後数十万社規模に拡大する",
            "profitability": "月額SaaSで解約率が低くコンサルティング追加収益でARPUを引き上げられる",
            "growth": "東証プライムのISSB開示義務化が中小サプライヤーへの開示要求を急増させる",
            "feasibility": "ESG基準の多様性への対応とレポート品質維持に専門知識の継続的投資が必要",
            "moat": "企業ごとの非財務情報と開示履歴が蓄積するほどレポート品質が向上する",
        },
        "whyNow": "東証プライム上場企業のISSBサステナビリティ開示が2025年から義務化されそのサプライチェーンである中小企業にも開示要求が波及している。欧州CSRD（企業サステナビリティ報告指令）が2025年から本格適用となり輸出企業の対応が急務となっている。",
        "noveltyNote": "SmartESGやDiginexは中堅以上の企業向けで月額費用が高い。フォーム入力のみでGRI・TCFD対応のESGレポートを月額4,980円から自動生成するSaaSは中小企業向けに確認できない。",
        "strengthNote": "月額SaaSで解約率が低く、企業ごとの非財務情報と開示履歴が蓄積するほどレポート品質が向上する。大企業からの開示要求という外部圧力が継続する限り解約しにくく認証取得コンサルティングでARPUが安定して成長する。",
        "patternRationale": "A-2（規制変化の「窓」）はISSB開示義務化とCSRD適用という明確な参入機会を捉え、B-4（摩擦の徹底除去）はESGレポート作成という中小経営者の最大の事務的摩擦をAIで解消する技術軸に対応する。",
        "patterns": ["A-2", "B-4"],
        "trendKeywords": ["ISSB開示義務化", "ESGサプライチェーン", "非財務情報開示"],
        "tags": ["ESGレポート自動生成", "TCFD対応", "サステナビリティ開示", "脱炭素経営"],
    },
    {
        "slug_prefix": "schoolops",
        "serviceName": "SchoolOps",
        "oneLiner": "小中学校の成績・出席・保護者連絡をAIが一元管理するクラウドSaaS",
        "concept": "小中学校の成績処理・出席管理・通知表作成・保護者連絡をクラウドで一元管理するSaaS。教職員の週20時間以上の事務作業を自動化しGIGAスクール構想のクラウド移行に対応する。",
        "target": "教職員の事務負担軽減に取り組む市区町村立小中学校の校長・教頭・事務担当者",
        "problem": "学校の成績処理・通知表作成・保護者連絡をオンプレミスシステムや紙で行い教職員が事務作業で残業している。SaaS型の校務支援システムは全体の4%にとどまり移行が遅れている。",
        "product": "成績処理・通知表のクラウド自動生成（文科省様式対応）\n保護者向けスマホアプリ配信（欠席連絡・お知らせ）\n出席・健康状態の一元管理と統計レポート自動生成\n教職員の業務時間分析ダッシュボード（働き方改革対応）",
        "revenueModel": "月額SaaS 学校規模課金（100名まで29,800円〜）\n導入支援・研修サービス（1校30万円〜）",
        "competitors": "EDUCOMマネージャーC4th, School Engine, デジタル校務, RYOBI-校支援",
        "competitiveEdge": "EDUCOMマネージャーC4thは11,000校以上の実績があるがオンプレミスが主体で移行コストが高い。SchoolOpsはSaaS型で初期費用ゼロ・月額課金で自治体のクラウド化予算に合わせた柔軟な導入ができる点で差別化する。",
        "category": "EdTech",
        "targetIndustry": "教育・研修",
        "targetCustomer": "自治体・行政",
        "investmentScale": "50〜200万円",
        "difficulty": "高",
        "scores": {"novelty": 3, "marketSize": 3, "profitability": 3, "growth": 4, "feasibility": 3, "moat": 4},
        "scoreComments": {
            "novelty": "SaaS型の小中学校向け校務支援システムは全体の4%で市場が未開拓",
            "marketSize": "全国小中学校は約3万校。校務SaaS化率4%からの移行需要が今後急増する",
            "profitability": "学校は解約率が極めて低く一度導入されると5〜10年単位で継続利用される",
            "growth": "GIGAスクール構想の第2フェーズでクラウド型校務システムへの移行が加速",
            "feasibility": "自治体調達プロセスと文科省の標準仕様対応に長期の認証・入札対応が必要",
            "moat": "成績・出席データが多年度蓄積し学校側の乗り換えコストが極めて高くなる",
        },
        "whyNow": "GIGAスクール構想の第2フェーズでクラウド型教育システムへの移行が加速し文部科学省が2023年に「教育データ利活用ロードマップ」を策定して校務DX化を政策的に推進している。教職員の働き方改革も重なり校務事務の効率化需要が急増している。",
        "noveltyNote": "EDUCOMマネージャーC4thやSchool Engineは実績豊富だがオンプレミス主体で移行コストが高い。GIGAスクール対応のSaaS型で初期費用ゼロから導入できる小中学校向け校務支援SaaSは参入余地がある。",
        "strengthNote": "学校は一度導入したシステムの乗り換えコストが極めて高く、成績・出席データが多年度蓄積するほど乗り換えが困難になる。自治体単位での一括導入が成立すれば複数校のスケーリングで収益が効率的に拡大する。",
        "patternRationale": "A-2（規制変化の「窓」）はGIGAスクール第2フェーズという明確なデジタル化推進機会を捉え、B-4（摩擦の徹底除去）は成績処理・通知表作成・保護者連絡という教職員の最大の事務的摩擦を解消する技術軸に対応する。",
        "patterns": ["A-2", "B-4"],
        "trendKeywords": ["GIGAスクール第2フェーズ", "校務DX", "教職員働き方改革"],
        "tags": ["学校事務DX", "校務支援システム", "成績処理自動化", "保護者連絡"],
    },
]

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
