"""アイデア#46-#55: Batch5"""
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
        "serviceName": "AgriSense",
        "oneLiner": "AIと圃場センサーで収量予測・農薬最適化を実現するスマート農業SaaS",
        "concept": "スマホカメラとIoTセンサーで圃場データを自動収集し、AIが収量予測・農薬散布量最適化・作業スケジュールを提案。農業DX補助金対象で、農業法人が翌作から使える中小農家特化型スマート農業SaaS。",
        "target": "従業員5名以上の農業法人・大規模農家・農業参入企業の経営者・現場管理者",
        "problem": "農業法人の収量予測や農薬管理は勘や経験に依存しており、データ活用が進んでいない。KSASやアグリノートなど既存サービスは大手農機メーカー系または作業記録が主体で、AIによる収量予測と資材最適化を中小農業法人向けに低価格提供するSaaSが不足している。",
        "product": "スマホカメラ＋IoTセンサーによる圃場生育データ自動収集\nAI収量予測モデル（気象・土壌・農薬データを多変量解析）\n農薬・肥料投入量の最適化提案と作業スケジュール自動生成\n農業DX補助金申請サポートドキュメント自動生成",
        "revenueModel": "月額SaaS 圃場面積課金（10ha未満2万円〜）\nIoTセンサーキット販売（1セット5万円〜）",
        "competitors": "KSAS, アグリノート, OPTiM Agriculture, Farmnote, スマートアシストリモート",
        "competitiveEdge": "KSASやアグリノートは農機管理・作業記録が主体だが、AgriSenseはAI収量予測と農薬最適化に特化し、スマートフォンとIoTセンサーだけで翌作から導入できる低コスト設計で中小農業法人を開拓する。",
        "category": "アグリテック",
        "targetIndustry": "農業・一次産業",
        "targetCustomer": "中小企業",
        "investmentScale": "50〜200万円",
        "difficulty": "中",
        "scores": {
            "novelty": 3,
            "marketSize": 3,
            "profitability": 3,
            "growth": 4,
            "feasibility": 3,
            "moat": 4,
        },
        "scoreComments": {
            "novelty": "大手農機メーカー系以外の中小農業法人向けAI収量予測特化型SaaSは少ない",
            "marketSize": "農業法人数は約3万社。農業DX補助金の拡充で投資意欲が高まっている",
            "profitability": "月額SaaS＋IoT機器販売の二層収益で農業法人は一度導入すると解約しにくい",
            "growth": "農業DX推進計画とスマート農業実証事業で国内投資額が急拡大している",
            "feasibility": "IoTセンサー連携の初期開発コストと農村のネット環境整備が課題となる",
            "moat": "圃場ごとの収量・農薬使用データが蓄積し翌年以降の予測精度が向上する",
        },
        "whyNow": "農林水産省の農業DX推進計画が加速し、スマート農業実証事業に国費が継続投入されている。農業法人・大規模農家を中心にIoTセンサーや画像解析による収量予測への需要が急増する一方、既存サービスの多くは大手農機メーカー系で中小農業法人には導入ハードルが高く、空白市場が広がっている。",
        "noveltyNote": "アグリノートやKSASは営農記録・農機管理が主体で、AIによる収量予測と農薬散布量の最適化を中小農業法人向けに特化して低価格提供するSaaSは確認されていない。AgriSenseはスマホカメラとIoTセンサーを組み合わせた多変量予測モデルで差別化する。",
        "strengthNote": "圃場ごとの生育データ・気象データ・農薬使用履歴が年々蓄積することで予測精度が向上し、競合への乗り換えコストが高まる。農家の暗黙知をデータ化することで後発参入者が短期間では追いつけない知識資産を形成する。",
        "patternRationale": "A-3（ニッチ市場集中）は農業法人・大規模農家という特定セグメントへの深い価値提供に対応し、B-4（摩擦の徹底除去）はスマホ1台で圃場記録から収量予測まで完結するUXの摩擦ゼロ設計を指す。",
        "patterns": ["A-3", "B-4"],
        "trendKeywords": ["スマート農業", "農業DX", "農業IoT"],
        "tags": ["収量予測", "農薬最適化", "農業法人", "圃場管理"],
    },
    {
        "serviceName": "GrantMatch",
        "oneLiner": "業種・規模を入力するだけで最適補助金をAIが自動マッチングするSaaS",
        "concept": "業種・従業員数・課題を入力するだけでAIが最適な補助金・助成金を自動提案し、生成AIが申請書類ドラフトを作成。中小企業が補助金を「知らない・書けない・申請できない」という三大課題を一気に解消するSaaS。",
        "target": "補助金申請に不慣れな中小企業・個人事業主の経営者・総務担当者",
        "problem": "中小企業の補助金申請率は低く、その主因は「制度の複雑さ」「書類作成の手間」「申請サポート不足」の三点。国公式のミラサポplusは検索機能が主体で申請書類作成支援がなく、専門家に依頼すると高額な費用が発生する。",
        "product": "業種・規模・課題入力によるAI補助金マッチング（3万件超のデータベース）\n生成AIによる申請書類ドラフト自動作成\n採択事例分析レポートによる採択率向上提案\n行政書士・専門家への申請代行依頼機能",
        "revenueModel": "月額SaaS 企業規模課金（中小企業3,000円〜）\n申請代行成功報酬（採択額の3〜5%）",
        "competitors": "ミラサポplus, 補助金クラウド, 補助金ポータル, ラクリア, クラウドシエン",
        "competitiveEdge": "ミラサポplusは検索が主体で申請書作成支援がなく、ラクリアは申請書作成特化だが採択事例分析がない。GrantMatchは補助金マッチング・申請書生成・採択事例分析・専門家連携を一体化し、採択まで伴走する点で差別化する。",
        "category": "GovTech",
        "targetIndustry": "全業界",
        "targetCustomer": "中小企業",
        "investmentScale": "50〜200万円",
        "difficulty": "中",
        "scores": {
            "novelty": 4,
            "marketSize": 5,
            "profitability": 4,
            "growth": 4,
            "feasibility": 3,
            "moat": 3,
        },
        "scoreComments": {
            "novelty": "AI補助金マッチングと生成AI申請書作成支援の一体型SaaSは国内に数少ない",
            "marketSize": "全国の中小企業は約330万社。補助金認知率は高いが申請率は低く需要大",
            "profitability": "月額SaaS＋成功報酬型申請代行で高ARPUを実現しやすいモデルとなる",
            "growth": "IT導入補助金・省力化補助金の予算規模が毎年拡大し申請需要が急増中",
            "feasibility": "補助金制度は毎年変更されるため最新情報へのデータ追従コストが継続発生",
            "moat": "申請履歴と採択パターンデータが蓄積するほどマッチング精度が向上していく",
        },
        "whyNow": "IT導入補助金・省力化補助金など政府の中小企業向け補助金の予算規模が拡大する一方、申請率は依然低水準にとどまる。生成AIの普及で申請書類の自動ドラフト生成が実用レベルに達し、補助金申請の三大障壁（発見・書類作成・専門家連携）をワンストップで解消できる環境が整った。",
        "noveltyNote": "ラクリアは申請書作成特化、補助金ポータルは検索特化と機能が分断されている。GrantMatchはAIマッチング・生成AI書類作成・採択事例分析・専門家マッチングを一体化し、採択まで伴走するSaaSとして国内未開拓の設計となっている。",
        "strengthNote": "企業ごとの申請履歴・採択パターン・書類テンプレートが蓄積するほどAIの精度が向上し、後発との格差が広がる。行政書士ネットワークの拡大で申請代行品質が向上し、信頼資産として機能する。",
        "patternRationale": "A-2（規制変化の「窓」）は補助金制度拡充という明確な参入機会を指し、B-4（摩擦の徹底除去）は補助金発見・書類作成・申請という三段階の摩擦を生成AIで一気に解消する設計に対応する。",
        "patterns": ["A-2", "B-4"],
        "trendKeywords": ["補助金DX", "生成AI申請書", "中小企業支援"],
        "tags": ["補助金マッチング", "申請書自動生成", "中小企業DX", "行政書士連携"],
    },
    {
        "serviceName": "NurseRoute",
        "oneLiner": "AIが訪問ルートとシフトを自動最適化する訪問看護向けクラウドSaaS",
        "concept": "訪問看護スケジュール・ルート・スタッフシフトをAIが自動最適化し、介護保険レセプト請求まで一気通貫で管理。iBow・カイポケと異なり、ルート最適化とスタッフ負荷分散に特化した訪問看護ステーション向けクラウドSaaS。",
        "target": "スタッフ5〜20名規模の訪問看護ステーション管理者・事務担当者",
        "problem": "訪問看護ステーションのスケジュール作成は手作業が多く、ルート最適化とスタッフシフト調整の両立が困難。iBowやカイポケは電子カルテ・レセプトが主体で、ルート最適化とシフト自動作成の精度が不十分。スタッフの移動時間ロスと残業が慢性化している。",
        "product": "AIルート最適化（訪問先住所・優先度・移動時間を自動計算）\nシフト自動作成・スタッフ負荷分散機能\n電子記録・介護保険レセプト自動生成\nリアルタイム訪問状況ダッシュボード",
        "revenueModel": "月額SaaS スタッフ数課金（5名まで15,000円〜）\nレセプト代行オプション（月5,000円）",
        "competitors": "iBow, カイポケ訪問看護, ZEST, Ssystem, ほのぼのNEXT",
        "competitiveEdge": "iBowやカイポケは電子カルテ・レセプトが主体だが、NurseRouteはAIルート最適化とシフト自動生成を核心機能として設計し、移動時間削減・スタッフ残業圧縮という数値で示せるROIを武器に差別化する。",
        "category": "介護テック",
        "targetIndustry": "介護・保育",
        "targetCustomer": "医療機関",
        "investmentScale": "50〜200万円",
        "difficulty": "中",
        "scores": {
            "novelty": 3,
            "marketSize": 4,
            "profitability": 4,
            "growth": 4,
            "feasibility": 3,
            "moat": 4,
        },
        "scoreComments": {
            "novelty": "AI訪問ルート最適化と電子記録・レセプトを一体化した訪問看護SaaSは少ない",
            "marketSize": "訪問看護ステーションは全国約1万6千か所。高齢化で継続拡大が確実",
            "profitability": "月額SaaSで解約しにくく、レセプト代行オプションでARPUを大幅に引き上げ可能",
            "growth": "2025年の介護報酬改定でICT活用推進が強化され訪問看護DX需要が急増",
            "feasibility": "iBow・カイポケなど既存大手との差別化とレセプト連携の複雑な実装が必要",
            "moat": "ステーションごとのルートデータや利用者情報が蓄積し乗り換えコストが高い",
        },
        "whyNow": "2025年の介護報酬改定でICT活用推進が強化され、訪問看護ステーションへのDX補助金支給が拡大している。人手不足・スタッフ離職が深刻化する中で、ルート最適化・シフト効率化による残業削減の数値効果が経営者の意思決定を加速させている。",
        "noveltyNote": "ZESTはルート最適化特化だが電子記録・レセプトと連携しておらず、iBowやカイポケはレセプト機能が強くルート最適化が不十分。NurseRouteはルート最適化・シフト管理・電子記録・レセプトを一体設計し、移動時間削減効果を数値で提示できる点で差別化する。",
        "strengthNote": "ステーションごとの訪問先住所・移動時間・スタッフスキルデータが蓄積するほどAIの最適化精度が向上し、乗り換えコストが年々高まる。レセプト請求データと連動することで経営分析機能を追加でき、顧客の粘着性が強化される。",
        "patternRationale": "A-2（規制変化の「窓」）は介護報酬改定・ICT推進強化という明確な参入機会を捉え、B-4（摩擦の徹底除去）はスケジュール作成・ルート最適化・レセプト生成の三大手作業を自動化する設計に対応する。",
        "patterns": ["A-2", "B-4"],
        "trendKeywords": ["訪問看護DX", "介護ICT", "ルート最適化"],
        "tags": ["訪問看護", "ルート最適化", "シフト管理", "レセプト自動化"],
    },
    {
        "serviceName": "JukuSync",
        "oneLiner": "生徒・保護者・授業記録をLINE連携で一元管理する個別指導塾SaaS",
        "concept": "生徒の授業進捗・宿題・テスト結果をAIが分析し、保護者にLINEで自動レポート送信。月謝請求・シフト管理・教材発注まで一元化した、個別指導塾・補習塾が翌月から使える低価格SaaS。",
        "target": "生徒数20〜200名規模の個別指導塾・補習塾・学習教室の塾長・教室長",
        "problem": "個別指導塾は保護者への連絡・授業記録・月謝管理・シフト作成を各ツールで個別管理しており、連携コストが高い。Comiruは多機能で料金が高く小規模塾には過剰、スクパスは機能限定的でLINE自動レポートがない。",
        "product": "授業記録・宿題・テスト結果のAI自動分析と保護者LINE報告\n月謝請求・クレジット決済・領収書自動発行\nスタッフシフト自動作成と授業コマ管理\n教材発注・在庫管理連携（オプション）",
        "revenueModel": "月額SaaS 生徒数課金（20名まで5,000円〜）\nLINE自動報告アドオン（月2,000円）",
        "competitors": "Comiru, スクパス, wagaco, TechnoSMS, 塾管理システムGrow",
        "competitiveEdge": "Comiruは5,000教室以上の導入実績があるが価格が高く、スクパスは低価格だがLINE自動レポートがない。JukuSyncはAI学習分析＋LINE自動報告を月額5,000円からの低価格で提供し、小規模個別指導塾の口コミ獲得を差別化軸とする。",
        "category": "EdTech",
        "targetIndustry": "教育・研修",
        "targetCustomer": "教育機関",
        "investmentScale": "50〜200万円",
        "difficulty": "低",
        "scores": {
            "novelty": 3,
            "marketSize": 3,
            "profitability": 3,
            "growth": 3,
            "feasibility": 4,
            "moat": 3,
        },
        "scoreComments": {
            "novelty": "保護者連絡・授業進捗・請求を一元化したLINE連携型個別指導塾SaaSは少ない",
            "marketSize": "全国の学習塾は約5万件。個別指導塾は増加傾向でデジタル化が遅れている",
            "profitability": "生徒数課金で塾が成長するほど収益増加。教材連携でARPUを引き上げ可能",
            "growth": "少子化でも個別指導ニーズは増加傾向。2026年学習指導要領改訂対応も拡大",
            "feasibility": "Comiru・スクパスと競合するがLINE連携の利便性で差別化は十分可能",
            "moat": "生徒の学習履歴・保護者とのやり取りデータが蓄積し乗り換えコストが高い",
        },
        "whyNow": "個別指導塾市場は少子化の中でも単価上昇・需要増が続いており、保護者の情報共有・進捗可視化ニーズが高まっている。LINE公式APIの安定化でLINE連携SaaSの開発コストが低下し、小規模塾でも月数千円で導入できるSaaSを設計できる環境が整っている。",
        "noveltyNote": "Comiruは大手チェーン向けの多機能設計で小規模塾には過剰コスト、スクパスは低価格だがLINE自動報告機能がない。JukuSyncはAI学習分析とLINE自動保護者レポートを月額5,000円からの低価格で提供し、小規模個別指導塾に特化した設計で差別化する。",
        "strengthNote": "生徒一人ひとりの学習履歴・苦手分析・保護者連絡履歴が蓄積するほど、AIの学習改善提案精度が向上する。口コミによる塾の評判向上→生徒増加→課金増加という正のフィードバックが形成される。",
        "patternRationale": "A-3（ニッチ市場集中）は小規模個別指導塾という特定セグメントへの深い価値提供に対応し、B-4（摩擦の徹底除去）はLINE連携で保護者報告・請求・シフトの三大手作業を一気に自動化する設計を指す。",
        "patterns": ["A-3", "B-4"],
        "trendKeywords": ["学習塾DX", "個別指導テック", "保護者連絡自動化"],
        "tags": ["塾管理", "保護者連絡", "LINE連携", "学習分析"],
    },
    {
        "serviceName": "HaccpLog",
        "oneLiner": "スマホ入力1分でHACCP衛生記録が完結する飲食店向けDXアプリ",
        "concept": "スマホのタップ入力と温度センサー自動連携でHACCP衛生管理記録を1分で完結。保健所対応レポートを自動生成し、チェーン店の全店舗一括管理も可能な飲食店・食品事業者向けSaaS。",
        "target": "HACCP対応に課題を抱える中小飲食チェーン・食品事業者の衛生管理担当者・店長",
        "problem": "2021年のHACCP義務化以降も中小飲食業者の多くが紙帳票での記録を継続しており、保健所対応時の書類整理に大きな手間がかかる。カミナシは多業種向けで飲食特化機能が少なく、ハレコードは温度センサー連携がない。",
        "product": "スマホタップ入力によるHACCP日常点検記録（1分以内）\nIoT温度センサー連携での冷機器自動監視・アラート\n保健所対応HACCP計画書・記録簿の自動生成\n複数店舗の衛生管理状況一括ダッシュボード",
        "revenueModel": "月額SaaS 店舗数課金（1店舗3,000円〜）\nIoT温度センサーキット（1台2万円〜）",
        "competitors": "カミナシ, ハレコード, HACCPヘルパー, HACCP CLOUD, GRASP-HACCP",
        "competitiveEdge": "カミナシは多業種プラットフォームでHACCP特化機能が限定的、ハレコードは温度センサー連携がない。HaccpLogはIoT温度センサー連携と飲食店特化のUXを組み合わせ、チェーン店の全店舗一括管理機能で大手チェーンにも対応できる設計とする。",
        "category": "フードテック",
        "targetIndustry": "飲食・食品",
        "targetCustomer": "飲食店・店舗",
        "investmentScale": "50〜200万円",
        "difficulty": "低",
        "scores": {
            "novelty": 3,
            "marketSize": 4,
            "profitability": 3,
            "growth": 4,
            "feasibility": 4,
            "moat": 3,
        },
        "scoreComments": {
            "novelty": "QRコードと温度センサー連携でHACCP記録と申請書類を自動生成するSaaS",
            "marketSize": "全国の食品事業者は約60万か所。2021年義務化後も中小では未対応が多い",
            "profitability": "月額SaaSで解約しにくく、温度センサーハードとの組み合わせで収益拡大可能",
            "growth": "2021年義務化後も紙管理の事業者が多く、食品衛生法強化で切り替え需要継続",
            "feasibility": "カミナシやハレコードと競合するが温度センサー連携で差別化は十分実現可能",
            "moat": "店舗ごとのHACCP記録・温度管理データが蓄積し保健所対応でも活用できる",
        },
        "whyNow": "2021年のHACCP義務化から数年が経過した現在も、中小飲食業者の多くが紙帳票での記録を継続している。食品衛生法の運用強化・保健所検査の厳格化が進む中で、デジタル化による正確な記録管理へのニーズが急速に高まっている。",
        "noveltyNote": "カミナシは多業種向けの汎用帳票プラットフォームでHACCP特化機能が限定的、ハレコードは飲食特化だが温度センサー連携がない。HaccpLogはIoT温度センサー連携と飲食店専用テンプレートを組み合わせた、保健所対応まで完結する一体型設計で差別化する。",
        "strengthNote": "店舗ごとのHACCP点検記録・温度異常履歴・保健所対応データが蓄積するほど、監査対応の証跡として価値が高まり乗り換えコストが上昇する。チェーン店での全店舗一括管理機能により、本部への展開で一気に導入店舗数が拡大する構造を持つ。",
        "patternRationale": "A-2（規制変化の「窓」）はHACCP義務化という明確な参入機会を捉え、B-4（摩擦の徹底除去）はスマホタップ1分・温度センサー自動記録という現場の最大の摩擦点を解消する設計に対応する。",
        "patterns": ["A-2", "B-4"],
        "trendKeywords": ["HACCP義務化", "食品衛生DX", "飲食店ペーパーレス"],
        "tags": ["HACCP記録", "温度管理", "食品衛生", "飲食店DX"],
    },
    {
        "serviceName": "RealSign",
        "oneLiner": "重説からIT重説・電子契約まで宅建業務をデジタル完結するSaaS",
        "concept": "重要事項説明（35条書面）・37条書面のIT重説から電子署名・書類保管まで、宅建業法に準拠した不動産取引フローをデジタルで一気通貫管理。クラウドサインとは異なり、宅建業特有のワークフローに特化した不動産会社向けSaaS。",
        "target": "年間取引件数50件以上の中小不動産仲介・売買・管理会社の事務担当者・代表",
        "problem": "2022年の不動産取引電子化解禁後も、中小不動産会社では書類作成・印鑑・郵送のアナログプロセスが残る。クラウドサインやGMOサインは汎用電子署名で宅建業特有のIT重説ワークフロー・35条書面確認が設計に組み込まれていない。",
        "product": "宅建業法準拠のIT重説（35条書面）ワークフロー管理\n37条書面・売買契約書の電子署名・保管一体型管理\n取引ごとの書類自動分類・期限管理アラート\n宅建士資格・免許更新期限の自動リマインド",
        "revenueModel": "月額SaaS 取引件数課金（50件まで8,000円〜）\n電子署名トークン従量課金（1件100円）",
        "competitors": "クラウドサイン, GMOサイン, いえらぶサイン, 電子契約くん, レリーズ",
        "competitiveEdge": "クラウドサインやGMOサインは汎用電子署名で宅建業特有フローへの対応が浅い。RealSignは35条書面・IT重説・37条書面を一体設計し、宅建業法の改正に即座に対応するアップデート体制と合わせて中小不動産会社に特化した価値を提供する。",
        "category": "プロップテック",
        "targetIndustry": "不動産・住宅",
        "targetCustomer": "中小企業",
        "investmentScale": "50〜200万円",
        "difficulty": "中",
        "scores": {
            "novelty": 4,
            "marketSize": 4,
            "profitability": 4,
            "growth": 4,
            "feasibility": 3,
            "moat": 4,
        },
        "scoreComments": {
            "novelty": "重説・37条書面のIT重説から電子署名まで宅建業務特化の一気通貫SaaSは少ない",
            "marketSize": "宅建業者は全国約13万社。2022年電子化解禁で契約デジタル化需要が急拡大",
            "profitability": "月額SaaS＋電子署名トークン従量課金で取引量増加に比例して収益が拡大する",
            "growth": "不動産取引電子化解禁が2022年に実現し中小不動産会社の対応ニーズが急増",
            "feasibility": "クラウドサインやGMOサインとの差別化には宅建業特有のワークフロー対応が必要",
            "moat": "不動産会社の全取引書類・顧客署名データが蓄積し乗り換えコストが非常に高い",
        },
        "whyNow": "2022年の宅建業法改正で不動産取引の電子化が全面解禁され、中小不動産会社でのIT重説・電子契約導入ニーズが急拡大している。しかし汎用電子署名サービスは宅建業特有の35条書面・37条書面のワークフローに対応しておらず、業界特化型SaaSへの需要が生まれている。",
        "noveltyNote": "いえらぶサインや電子契約くんは不動産業向けを訴求するが、35条書面の説明確認フロー・37条書面・売買契約書を法令準拠ワークフローで一体管理し、宅建士資格管理まで含むSaaSは国内に確認できない。RealSignは宅建業法の改正への即時対応を強みとする。",
        "strengthNote": "不動産会社の全取引書類・顧客の電子署名データ・書類保管履歴が蓄積するほど乗り換えコストが極めて高まる。宅建業法改正への即時対応と法令準拠アップデートの継続が、顧客の信頼資産となり後発参入者が追いつけない競争優位を形成する。",
        "patternRationale": "A-2（規制変化の「窓」）は2022年の宅建業法改正・電子化解禁という明確な参入機会を捉え、B-4（摩擦の徹底除去）はIT重説・電子署名・書類保管の三工程を宅建業法準拠で一気通貫自動化する設計に対応する。",
        "patterns": ["A-2", "B-4"],
        "trendKeywords": ["不動産電子契約", "IT重説", "宅建業法DX"],
        "tags": ["電子契約", "IT重説", "不動産DX", "宅建業"],
    },
    {
        "serviceName": "DentFlow",
        "oneLiner": "AIが予約・リコール・医院経営を最適化する歯科クリニック向けSaaS",
        "concept": "AIが患者のリコール時期を予測して自動リマインド送信し、予約枠を最適化。自由診療比率・スタッフ稼働率・患者単価をリアルタイム分析する経営ダッシュボードを備えた歯科医院向けオールインワンSaaS。",
        "target": "スタッフ5〜20名規模の歯科医院の院長・事務長・受付スタッフ",
        "problem": "歯科医院はレセコン・予約システム・患者管理を別々のツールで運用しており、連携コストが高い。DENTISは大手向けで価格が高く、既存システムは患者リコール予測や経営分析ダッシュボードが弱い。院長の高齢化・承継問題で経営効率化への圧力が高まっている。",
        "product": "AI患者リコール予測・自動リマインドSMS/LINE送信\n予約枠AIスケジューリング（キャンセル率・稼働率最適化）\n自由診療比率・スタッフ稼働・患者単価の経営ダッシュボード\nレセコンAPI連携・電子カルテ標準フォーマット対応",
        "revenueModel": "月額SaaS スタッフ数課金（5名まで15,000円〜）\nAIリコール管理アドオン（月3,000円）",
        "competitors": "DENTIS, ジニー, Dentry byGMO, CLINICS, ノーザ",
        "competitiveEdge": "DENTISは大手向けオールインワンだが価格が高く、ジニーは予約・患者管理特化でリコール予測がない。DentFlowはAIリコール予測・経営ダッシュボード・予約最適化を一体設計し、院長一人でも経営数値を把握できるUIで差別化する。",
        "category": "デジタルヘルス",
        "targetIndustry": "医療・福祉",
        "targetCustomer": "医療機関",
        "investmentScale": "50〜200万円",
        "difficulty": "中",
        "scores": {
            "novelty": 3,
            "marketSize": 4,
            "profitability": 4,
            "growth": 3,
            "feasibility": 3,
            "moat": 4,
        },
        "scoreComments": {
            "novelty": "AIリコール最適化と予約・経営分析を一体化した歯科医院特化型SaaSは少ない",
            "marketSize": "歯科診療所は全国約7万施設。院長高齢化で経営効率化への投資意欲が高い",
            "profitability": "月額SaaS＋予約・請求連携オプションで高ARPUが維持でき解約率が低い",
            "growth": "歯科医院の院長高齢化・承継問題でDX化・経営効率化ニーズが急拡大している",
            "feasibility": "DENTIS・クリニクスなど既存プレイヤーが強くAIリコール機能での差別化が鍵",
            "moat": "患者の治療履歴・リコール管理データが蓄積するほど来院予測精度が向上する",
        },
        "whyNow": "歯科医院の院長平均年齢が上昇し、承継・M&A需要が増加する中で経営数値の可視化・効率化ニーズが高まっている。AI予約最適化とリコール自動化による患者来院率改善の数値効果が出始めており、投資対効果を院長に説明しやすい環境が整った。",
        "noveltyNote": "DENTISは大手向けオールインワンで価格が高く、ジニーは予約・患者管理特化でリコール予測AI・経営ダッシュボードがない。DentFlowはAIリコール予測と予約最適化・経営分析を一体設計し、院長が月次経営数値をリアルタイムで把握できるSaaSとして差別化する。",
        "strengthNote": "患者の来院履歴・治療記録・リコール対応データが蓄積するほどAIの来院予測精度が向上し、乗り換えコストが高まる。患者データの資産化により、承継・M&A時のデューデリジェンス資料としても機能し、顧客の粘着性が年々強化される。",
        "patternRationale": "A-3（ニッチ市場集中）は歯科医院という特定セグメントへの深い価値提供に対応し、B-4（摩擦の徹底除去）はリコール管理・予約最適化・経営分析の三大手作業をAIで自動化する設計に対応する。",
        "patterns": ["A-3", "B-4"],
        "trendKeywords": ["歯科DX", "医院経営最適化", "患者リコール自動化"],
        "tags": ["歯科クリニック", "リコール管理", "予約最適化", "医院経営"],
    },
    {
        "serviceName": "CleanOps",
        "oneLiner": "QRコードと写真で清掃作業報告・品質管理を完結するビルメンDXアプリ",
        "concept": "QRコードと写真撮影だけで清掃完了報告・品質チェック・作業時間記録を完結するスマホアプリ。発注企業への報告書自動生成・スタッフシフト管理まで一体化した、清掃業・ビルメンテナンス会社向けバーティカルSaaS。",
        "target": "スタッフ10〜100名規模の清掃会社・ビルメンテナンス会社の現場マネージャー・経営者",
        "problem": "清掃業・ビルメン業界は作業報告を紙帳票・電話・LINEで行っており、品質管理が属人化している。ビルメンクラウドやビルカンは設備管理が主体で、清掃作業完了確認・品質チェック・発注企業向け報告書生成に特化した低価格SaaSが不足している。",
        "product": "QRコードスキャン＋写真撮影による清掃完了確認・品質チェック\n発注企業向け作業完了報告書PDF自動生成\nスタッフシフト管理・作業時間集計・給与計算連携\n顧客ポータル（発注企業がリアルタイムで状況確認）",
        "revenueModel": "月額SaaS スタッフ数課金（10名まで10,000円〜）\n顧客ポータルオプション（月5,000円/発注先）",
        "competitors": "ビルメンクラウド, ビルカン, DK-CONNECT BM, 管理ロイド, ビルメンDX",
        "competitiveEdge": "ビルメンクラウドやビルカンは設備管理・点検記録が主体だが、CleanOpsは清掃作業完了確認・品質チェック・発注企業向け報告書生成に特化し、QRコードとスマホカメラだけで現場スタッフが即日使えるUXを武器とする。",
        "category": "バーティカルSaaS",
        "targetIndustry": "建設・土木",
        "targetCustomer": "中小企業",
        "investmentScale": "50〜200万円",
        "difficulty": "低",
        "scores": {
            "novelty": 3,
            "marketSize": 3,
            "profitability": 3,
            "growth": 3,
            "feasibility": 4,
            "moat": 3,
        },
        "scoreComments": {
            "novelty": "QRコードと写真で清掃完了確認・品質チェックをペーパーレス化するSaaSは少ない",
            "marketSize": "清掃・ビルメン業者は全国約6万社。ICT化率が極めて低く未開拓市場が大きい",
            "profitability": "月額SaaSで解約しにくく設備点検・修繕アドオンでARPUを引き上げ可能",
            "growth": "清掃業界の人手不足でICTによる業務効率化・品質管理のニーズが急増中",
            "feasibility": "ビルメンクラウドやビルカンと競合するがスマホ完結UXで参入障壁は低い",
            "moat": "建物ごとの清掃履歴・設備点検データが蓄積し発注企業の信頼獲得につながる",
        },
        "whyNow": "清掃業界の人手不足が深刻化する中で、少ない人数で品質を維持するための業務効率化ニーズが急増している。スマホカメラとQRコードを使った作業記録の低コスト実装が可能になり、ICT化率が極めて低い清掃業界への参入機会が広がっている。",
        "noveltyNote": "ビルメンクラウドやビルカンは設備管理・点検記録が主機能で、清掃作業の完了確認・品質チェック・発注企業向けリアルタイム報告に特化した低価格スマホアプリは確認できない。CleanOpsはQRコードと写真撮影だけで現場スタッフが即日使えるUXを最優先に設計する。",
        "strengthNote": "建物ごとの清掃履歴・品質チェック結果・作業時間データが蓄積するほど発注企業からの信頼が高まり、競合への乗り換えコストが上昇する。顧客ポータル機能で発注企業とのデータ共有が深まると、複数の建物管理を任せるアカウント拡張につながる。",
        "patternRationale": "A-3（ニッチ市場集中）は清掃業・ビルメンという特定セグメントへの深い価値提供に対応し、B-4（摩擦の徹底除去）はQRコードと写真撮影で作業報告・品質管理・報告書生成を一気に自動化する設計に対応する。",
        "patterns": ["A-3", "B-4"],
        "trendKeywords": ["ビルメンDX", "清掃業務デジタル化", "現場ペーパーレス"],
        "tags": ["清掃管理", "ビルメンテナンス", "作業報告自動化", "品質管理"],
    },
    {
        "serviceName": "ShiftStock",
        "oneLiner": "AI需要予測でシフトと在庫を連動管理する中小小売店向けSaaS",
        "concept": "過去の販売データ・季節性・天気予報をAIが解析し、シフトと在庫補充を自動提案。中小スーパー・ドラッグストア・専門小売店が既存POSと連携してシフトと在庫を一元管理できるオールインワンSaaS。",
        "target": "スタッフ5〜50名規模の中小スーパー・ドラッグストア・専門小売店の店長・オーナー",
        "problem": "中小小売店のシフト作成と在庫発注は店長の経験と勘に依存しており、人件費・在庫コストの最適化ができていない。R-Shiftはシフト特化、スマレジは在庫特化で、シフトと在庫をAI需要予測で連動管理する中小小売向けSaaSが存在しない。",
        "product": "過去販売データ・季節・天気を活用したAI需要予測\nシフト自動提案（必要人員数・スキル考慮）\nAI在庫補充提案・発注書自動生成\n既存POSシステムとのデータ連携API",
        "revenueModel": "月額SaaS 店舗数課金（1店舗12,000円〜）\nAI需要予測アドオン（月3,000円）",
        "competitors": "R-Shift, Airシフト, oplus, スマレジ, zaico",
        "competitiveEdge": "R-ShiftやAirシフトはシフト管理特化、スマレジやzaicoは在庫管理特化で、シフトと在庫をAI需要予測で連動させる中小小売向けSaaSは存在しない。ShiftStockはシフト最適化と在庫削減の両方でROIを示せる点が最大の差別化軸となる。",
        "category": "リテールテック",
        "targetIndustry": "小売・EC",
        "targetCustomer": "中小企業",
        "investmentScale": "50〜200万円",
        "difficulty": "中",
        "scores": {
            "novelty": 4,
            "marketSize": 4,
            "profitability": 3,
            "growth": 3,
            "feasibility": 3,
            "moat": 4,
        },
        "scoreComments": {
            "novelty": "シフト管理と在庫補充をAI需要予測で連動させた中小小売特化SaaSは数少ない",
            "marketSize": "スーパーやドラッグストアを含む中小小売業者は全国約100万社以上が対象",
            "profitability": "月額SaaS＋需要予測アドオンでARPUが高く在庫削減効果で解約しにくい",
            "growth": "物価高騰・人件費上昇で中小小売の利益率が悪化しシフト・在庫最適化が急務",
            "feasibility": "スマレジや既存POSとのデータ連携設計が必要だがAPI公開で実装は現実的",
            "moat": "店舗ごとの販売・在庫・シフトデータが蓄積しAI予測精度が年々向上していく",
        },
        "whyNow": "物価高騰・最低賃金引き上げで中小小売の人件費・仕入れコストが急上昇しており、シフト最適化と在庫削減の両立が経営課題の最上位に浮上している。AI需要予測の精度向上とPOS連携APIの普及により、中小小売でも手頃なコストで導入できる環境が整っている。",
        "noveltyNote": "R-ShiftやAirシフトはシフト管理特化、スマレジやzaicoは在庫管理特化と機能が分断されており、シフトと在庫をAI需要予測で連動管理する中小小売向け一体型SaaSは国内に確認できない。ShiftStockはシフト削減と在庫ロス削減の両方でROIを数値で示せる設計とする。",
        "strengthNote": "店舗ごとの販売実績・在庫回転・シフト効率データが蓄積するほどAI予測精度が向上し、後発との格差が広がる。複数店舗展開・チェーン化による横断分析機能の追加でARPUが拡大し、顧客の粘着性が強化される構造を持つ。",
        "patternRationale": "B-4（摩擦の徹底除去）は店長の勘に依存するシフト作成・発注作業という最大の摩擦点をAI自動提案で解消する設計に対応し、F-6（データ資産化）は蓄積する販売・在庫データが競合優位の核心となる構造を指す。",
        "patterns": ["B-4", "F-6"],
        "trendKeywords": ["小売DX", "需要予測AI", "シフト最適化"],
        "tags": ["シフト管理", "在庫管理", "需要予測", "小売テック"],
    },
    {
        "serviceName": "TripDesk",
        "oneLiner": "行程作成から手配・原価管理まで旅行代理店業務をクラウドDX一気通貫",
        "concept": "旅行代理店の行程作成・交通・宿泊手配・原価管理・顧客管理をクラウドで一元化。インバウンド多言語対応と行程のWeb共有機能を備え、小規模旅行会社が低コストで業務全体をデジタル化できるSaaS。",
        "target": "従業員5〜30名規模の中小旅行代理店・ランドオペレーター・インバウンド旅行会社の営業・事務担当者",
        "problem": "中小旅行代理店の行程作成・手配・原価管理はExcelと電話・FAXで行われており、インバウンド対応でも多言語書類を手作業で作成している。TRAVESENSは国内旅行特化で、インバウンド多言語対応と行程Web共有を統合したSaaSが不足している。",
        "product": "行程作成ツール（地図・写真・コメント付きWeb行程書の自動生成）\n交通・宿泊手配履歴管理・原価自動集計\n多言語（英・中・韓）行程書・見積書の自動翻訳生成\n顧客管理・過去旅行履歴・リピート提案機能",
        "revenueModel": "月額SaaS ユーザー数課金（5名まで15,000円〜）\nインバウンド多言語アドオン（月5,000円）",
        "competitors": "TRAVESENS, Holiday for Agency, SymphonyAtwo, マタタビSuite, Dream Journey.NET",
        "competitiveEdge": "TRAVESENSは国内旅行業向け行程・原価管理が主体で多言語インバウンド対応が弱い。TripDeskはインバウンド多言語行程書自動生成とWeb共有機能を核心に設計し、回復するインバウンド需要に対応する中小旅行会社に特化した価値を提供する。",
        "category": "トラベルテック",
        "targetIndustry": "旅行・宿泊",
        "targetCustomer": "中小企業",
        "investmentScale": "50〜200万円",
        "difficulty": "中",
        "scores": {
            "novelty": 3,
            "marketSize": 3,
            "profitability": 3,
            "growth": 4,
            "feasibility": 3,
            "moat": 3,
        },
        "scoreComments": {
            "novelty": "旅行代理店向けに行程・手配・原価・顧客管理を一元化したSaaSは国内に少ない",
            "marketSize": "旅行業者数は全国約1万社。コロナ後の旅行需要回復でDX投資意欲が高まる",
            "profitability": "月額SaaS＋多言語アドオンモデルで、インバウンド繁忙期に収益が連動して伸びる",
            "growth": "インバウンド需要急回復とアドベンチャーツーリズム拡大で旅行業DXが加速中",
            "feasibility": "TRAVESENSなど先行者が存在するがインバウンド多言語対応で差別化が可能",
            "moat": "旅行会社の顧客・手配・原価データが蓄積し旅程の品質と収益性が年々向上する",
        },
        "whyNow": "インバウンド旅行者数がコロナ前水準を超えて急回復しており、中小旅行会社・ランドオペレーターへの業務依頼が急増している。一方で多くの中小旅行会社はExcel・FAXのアナログ業務から脱却できておらず、インバウンド多言語対応と業務効率化の両立ニーズが急拡大している。",
        "noveltyNote": "TRAVESENSは国内旅行業向け行程・原価管理が主体でインバウンド多言語対応が弱く、Dream Journey.NETは高機能だが中小には価格・導入ハードルが高い。TripDeskはインバウンド多言語行程書の自動生成とWeb共有機能を中小旅行会社向け低価格で提供する差別化設計とする。",
        "strengthNote": "旅行会社の顧客情報・手配履歴・原価データが蓄積するほど見積精度と利益率が向上し、乗り換えコストが高まる。インバウンド顧客のリピート管理機能と多言語対応の品質向上が、口コミによる新規獲得サイクルを生み出す。",
        "patternRationale": "A-3（ニッチ市場集中）は中小旅行会社・ランドオペレーターという特定セグメントへの深い価値提供に対応し、B-4（摩擦の徹底除去）は行程作成・多言語書類生成・原価集計という三大手作業を自動化する設計に対応する。",
        "patterns": ["A-3", "B-4"],
        "trendKeywords": ["インバウンドDX", "旅行業務効率化", "多言語観光"],
        "tags": ["旅行代理店", "行程管理", "インバウンド対応", "原価管理"],
    },
]

all_ok = True
for idea in ideas:
    errs = validate(idea)
    if errs:
        print(f"[NG] {idea['serviceName']}: {errs}")
        all_ok = False
    else:
        print(f"[OK] {idea['serviceName']}")

if not all_ok:
    sys.exit(1)
print("[ALL VALIDATION OK]")

conn = psycopg2.connect(DATABASE_URL)
try:
    cur = conn.cursor()
    for idea in ideas:
        cur.execute('SELECT COALESCE(MAX(number), 0) FROM "Idea"')
        number = cur.fetchone()[0] + 1
        svc = idea["serviceName"].lower().replace(" ", "")
        slug = f"{svc}-{number}"
        idea_id = str(uuid.uuid4())
        today = date.today().isoformat()
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
        conn.commit()
        avg = sum(idea["scores"].values()) / 6
        print(f"INSERT完了: #{number} {idea['serviceName']} (slug: {slug}) 平均スコア: {avg:.1f}")
finally:
    conn.close()
print("[完了] 10件を挿入しました")
