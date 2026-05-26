"""アイデア#36〜#45 バッチINSERTスクリプト"""
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
        "slug_prefix": "legaldoc",
        "serviceName": "LegalDoc",
        "oneLiner": "中小企業の契約書をAIが法的リスク診断しワンクリックで生成するSaaS",
        "concept": "法務部がない中小企業向けに取引先から届いた契約書のリスク条項をAIが自動検出し修正提案と自社保護条件を追加した対案を即生成するSaaS。月額定額で弁護士品質の契約書管理を実現する。",
        "target": "法務部がなく契約書対応を経営者・総務が担っている従業員5〜100名の中小企業",
        "problem": "中小企業は取引先から届いた契約書のリスク条項を確認できず不利な条件で締結してしまうケースが多い。弁護士への依頼は1件数万円〜で日常的な契約業務のコストが高すぎる。",
        "product": "契約書PDF/Wordアップロード→リスク条項のAI自動検出\n自社有利な修正条文の即時生成と対案PDF作成\n取引先別の契約書履歴・変更点の一元管理\n秘密保持・業務委託・売買の標準テンプレート生成",
        "revenueModel": "月額SaaS（法人向け月9,800円〜）\n弁護士相談チケット（1回1万円〜）",
        "competitors": "LeCHECK, LegalForce, CloudSign Review, GVA assist, AI-CON",
        "competitiveEdge": "LegalForceは大手・中堅法務部向けで費用が高く中小には過剰だが、LegalDocは中小企業の総務担当が弁護士なしで使えるリスク診断＋対案生成を月額9,800円の低価格帯で提供し差別化する。",
        "category": "リーガルテック",
        "targetIndustry": "法務・士業",
        "targetCustomer": "中小企業",
        "investmentScale": "〜50万円",
        "difficulty": "低",
        "scores": {"novelty": 3, "marketSize": 4, "profitability": 4, "growth": 4, "feasibility": 4, "moat": 3},
        "scoreComments": {
            "novelty": "中小総務が弁護士なしでリスク診断と対案生成を完結できるSaaSは少ない",
            "marketSize": "法務部がない中小企業は約300万社超。契約書トラブルは年間数万件に上る",
            "profitability": "月額SaaS＋弁護士チケットの二層収益。法的リスク回避効果で解約率が低い",
            "growth": "AI契約書レビュー市場は2026年に急成長しており中小企業の導入需要が拡大",
            "feasibility": "契約書AIレビューAPIは既存プロバイダーで調達可能で開発期間が短縮できる",
            "moat": "企業ごとの契約履歴とリスク基準が蓄積するほどAI診断精度が向上する",
        },
        "whyNow": "AI契約書レビュー市場が2026年に急成長しており導入企業が4,500社以上に達している。電子契約の普及（CloudSign等）に伴い契約の数と速度が増加し法務部のない中小企業の契約リスク管理ニーズが急増している。",
        "noveltyNote": "LegalForceは大手企業の法務部向けで機能が多く費用が高い。中小企業の総務担当が弁護士なしで取引先からの契約書のリスク診断と対案生成を月額9,800円で完結できるSaaSは確認できない。",
        "strengthNote": "月額SaaSで解約率が低く、企業ごとの契約履歴とリスク基準が蓄積するほどAI診断精度が向上する。契約リスク回避の価値が明確で弁護士チケット追加収益でARPUが安定して成長する。",
        "patternRationale": "A-4（技術コスト急落の窓）はLLMによる契約書解析コストの急落を捉え、B-4（摩擦の徹底除去）は契約書審査という中小企業の最大の法的摩擦をAIで解消する技術軸に対応する。",
        "patterns": ["A-4", "B-4"],
        "trendKeywords": ["AI契約書レビュー", "リーガルテックDX", "中小企業法務自動化"],
        "tags": ["契約書AI審査", "リスク条項検出", "対案自動生成", "法務DX"],
    },
    {
        "slug_prefix": "taxflow",
        "serviceName": "TaxFlow",
        "oneLiner": "個人事業主の確定申告をAIが収支分析から書類作成まで完結するSaaS",
        "concept": "フリーランス・個人事業主向けに銀行口座・カードの取引を自動連携しAIが確定申告書を自動作成するSaaS。AIチャットで「これは経費？」に即答しながら申告書まで一気通貫で完結する。",
        "target": "確定申告経験が浅い・苦手意識がある開業1〜5年目の個人事業主・フリーランス",
        "problem": "個人事業主の確定申告はfreeeやマネーフォワードが普及しているがAI機能や操作の複雑さで使いこなせない層が多く毎年2〜3月に多大な時間を費やしている。",
        "product": "銀行口座・クレカの自動連携とAI仕訳分類\n確定申告書（青色・白色）の自動草案生成\n「これは経費になる？」AIチャット問い合わせ機能\ne-Tax提出まで完結するワンクリック申告支援",
        "revenueModel": "月額SaaS（個人プラン月980円〜、年払い割引あり）\n税理士サポートオプション（年間29,800円〜）",
        "competitors": "freee会計, マネーフォワード クラウド確定申告, 弥生オンライン, やるぞ確定申告, クラウド確定申告",
        "competitiveEdge": "freeeやマネーフォワードは機能が多く初心者には複雑な一方、TaxFlowはAIチャットで経費判定に答えながら申告書まで完結させる初心者特化の設計で差別化する。",
        "category": "フィンテック",
        "targetIndustry": "IT・通信",
        "targetCustomer": "フリーランス・副業",
        "investmentScale": "〜50万円",
        "difficulty": "低",
        "scores": {"novelty": 3, "marketSize": 4, "profitability": 3, "growth": 4, "feasibility": 4, "moat": 3},
        "scoreComments": {
            "novelty": "AIチャット経費相談と申告書自動作成の初心者特化一体型は競合が少ない",
            "marketSize": "個人事業主・フリーランスは約500万人超。申告苦手意識を持つ層が大半",
            "profitability": "月額SaaS＋税理士サポートオプションで二層収益。申告期は解約率がゼロ",
            "growth": "2025年e-Tax拡張で自動取得項目が36項目に増加し申告デジタル化が加速",
            "feasibility": "freeeやマネーフォワードとの差別化価値の訴求に初期マーケティング工数が必要",
            "moat": "過去の申告データが蓄積するほど翌年の自動仕訳精度が向上し乗り換えを阻む",
        },
        "whyNow": "2025年からe-Taxスマートフォン申告の自動取得項目が12から36項目に拡大しAI推奨控除機能が追加された。フリーランス人口が500万人を超えフリーランス保護法施行後に業務委託収入を申告する新規層が急増している。",
        "noveltyNote": "freeeやマネーフォワードはクラウド会計の老舗だが機能が多く初心者には複雑で、AIチャットで経費判定に即答しながら申告書まで一気通貫で完結する初心者特化SaaSは確認できない。",
        "strengthNote": "月額SaaSで解約率が低く、過去の申告データが蓄積するほど翌年の自動仕訳精度が向上する。年間の税務サイクルに組み込まれると乗り換えコストが高まり税理士サポートオプションで高ARPUが確保できる。",
        "patternRationale": "A-4（技術コスト急落の窓）はLLMによる税務相談コストの急落を捉え、B-4（摩擦の徹底除去）は確定申告という年1回の最大の事務的摩擦を解消する技術軸に対応する。",
        "patterns": ["A-4", "B-4"],
        "trendKeywords": ["確定申告AI自動化", "e-Tax拡張", "フリーランス税務DX"],
        "tags": ["確定申告サポート", "AI仕訳分類", "経費判定AI", "青色申告"],
    },
    {
        "slug_prefix": "cybershield",
        "serviceName": "CyberShield",
        "oneLiner": "中小企業のサイバーリスクをAIが診断し優先対策を提示するSaaS",
        "concept": "中小企業のWebサイト・社内システム・クラウドサービスの脆弱性をAIが自動診断しリスクを優先順位付けして対策方法を提示するSaaS。IPAガイドライン対応チェックリストまで自動生成する。",
        "target": "サイバーセキュリティ専任担当者がいない従業員5〜200名の中小IT企業・製造業・小売業の経営者・システム担当",
        "problem": "中小企業はサイバー攻撃の主要ターゲットになっているが専任担当者がなく定期的な脆弱性診断ができていない。既存のセキュリティ診断は単価が高く中小企業には手が出ない。",
        "product": "WebサイトとAPIの脆弱性AI自動スキャン（月次）\nリスク優先順位と具体的な対策手順書の自動生成\nIPAセキュリティガイドライン対応チェックリスト\nインシデント時のファーストレスポンス手順書生成",
        "revenueModel": "月額SaaS（ドメイン数課金、1ドメイン14,800円〜）\n詳細診断・ペネトレーションテスト（1回30万円〜）",
        "competitors": "AeyeScan, Securify, ラック SaaS設定診断, YAMAHA UTX, MOTEX",
        "competitiveEdge": "AeyeScanは市場シェア1位だが詳細設定に専門知識が必要な一方、CyberShieldはIPAガイドライン対応チェックリストと対策手順書の自動生成で非専門家の中小担当者が即日対応できる設計で差別化する。",
        "category": "セキュリティ",
        "targetIndustry": "IT・通信",
        "targetCustomer": "中小企業",
        "investmentScale": "50〜200万円",
        "difficulty": "中",
        "scores": {"novelty": 3, "marketSize": 4, "profitability": 4, "growth": 5, "feasibility": 3, "moat": 3},
        "scoreComments": {
            "novelty": "IPAガイドライン対応チェックリストと対策手順書の自動生成は競合に少ない",
            "marketSize": "中小企業は国内サイバー攻撃の主要標的で被害件数が年々急増している",
            "profitability": "ドメイン数課金で顧客拡大と収益が拡大し詳細診断で高単価受注も可能",
            "growth": "2025年IPA中小企業セキュリティガイドライン4.0版公表で対策需要が急増",
            "feasibility": "脆弱性診断エンジンの精度維持と最新攻撃手法への追従に継続的コストが必要",
            "moat": "脆弱性スキャン履歴と修復実績が蓄積するほど企業ごとのリスク評価が精緻化",
        },
        "whyNow": "2025年に経済産業省とIPAが「中小企業情報セキュリティ対策ガイドライン第4.0版」を公表し中小企業のセキュリティ対策が政策的に強化された。ランサムウェア攻撃が中小企業を標的にする事例が増加し対策ツールへの需要が急増している。",
        "noveltyNote": "AeyeScanやSecurifyは脆弱性診断の技術機能が主体で非専門家向けの対策手順書自動生成やIPAガイドライン対応チェックリスト機能を統合したSaaSは確認できない。本サービスは中小の非専門担当者が即日対応できる設計を優先する。",
        "strengthNote": "月額SaaSで解約率が低く、脆弱性スキャン履歴と修復実績が蓄積するほど企業ごとのリスク評価が精緻化される。セキュリティ対策が法的・取引的に求められる環境が続く限り解約しにくく詳細診断の高単価収益も安定する。",
        "patternRationale": "A-2（規制変化の「窓」）はIPAガイドライン改訂とサイバー攻撃急増という明確な参入機会を捉え、B-4（摩擦の徹底除去）は脆弱性診断・対策手順作成という中小IT担当者の最大の専門的摩擦を解消する技術軸に対応する。",
        "patterns": ["A-2", "B-4"],
        "trendKeywords": ["中小企業セキュリティ強化", "脆弱性診断自動化", "IPAガイドライン対応"],
        "tags": ["サイバーセキュリティ診断", "脆弱性スキャン", "中小企業セキュリティ", "IPA対応"],
    },
    {
        "slug_prefix": "petclinic",
        "serviceName": "PetClinic",
        "oneLiner": "動物病院の診察・カルテ・予約・会計をAIが一元管理するSaaS",
        "concept": "動物病院向けに電子カルテ・予約管理・会計・薬剤在庫・飼い主コミュニケーションを一体化したSaaS。AIが診察記録から病歴サマリーを自動生成し飼い主へのリマインドも自動送信する。",
        "target": "獣医師1〜5名規模の中小動物病院の院長・事務担当者",
        "problem": "多くの動物病院が紙カルテや個別システムで管理しており飼い主対応・薬剤在庫・会計の連携が取れていない。既存の動物病院向けシステムは高価格・導入障壁が高い。",
        "product": "電子カルテのAI病歴サマリー自動生成\n飼い主スマホアプリ連携（予約・診察結果・リマインド）\n薬剤在庫管理と発注アラート\n会計・レセプト処理の自動化と分析ダッシュボード",
        "revenueModel": "月額SaaS 獣医師数課金（1名まで19,800円〜）\n飼い主アプリ追加機能（月3,000円〜）",
        "competitors": "ミニイク, PETS ONE, V-Speed, ベテレスコープ, Animary byGMO",
        "competitiveEdge": "ミニイクは動物病院向けオールインワン系だが飼い主アプリ連携やAI機能が限定的な一方、PetClinicはAI病歴サマリー生成と飼い主スマホ連携を統合し診察品質と経営効率を同時に改善する設計で差別化する。",
        "category": "ペットテック",
        "targetIndustry": "医療・福祉",
        "targetCustomer": "中小企業",
        "investmentScale": "50〜200万円",
        "difficulty": "中",
        "scores": {"novelty": 4, "marketSize": 3, "profitability": 3, "growth": 4, "feasibility": 3, "moat": 4},
        "scoreComments": {
            "novelty": "AI病歴サマリー生成と飼い主アプリ連携を統合した動物病院SaaSは少ない",
            "marketSize": "全国動物病院は約13,000院超。ペット飼育世帯数は増加し医療需要が拡大中",
            "profitability": "月額SaaS＋飼い主アプリ追加機能の二層収益。動物病院の解約率が低い",
            "growth": "ペット医療費は年々増加しデジタル化・予防医療への関心が飼い主に広まる",
            "feasibility": "獣医師向けのカルテ設計と薬剤コードへの対応に専門的知識の習得が必要",
            "moat": "患者データと診察履歴が蓄積するほど医院にとって不可欠となり解約が難しい",
        },
        "whyNow": "ペット医療費の増加と飼い主の健康管理意識の高まりにより動物病院の経営DX化需要が急増している。コロナ禍以降のペット飼育世帯増加（2,000万世帯超）と高齢ペットの増加で慢性疾患管理ニーズが高まり電子カルテ導入の必要性が急増している。",
        "noveltyNote": "ミニイクやPETS ONEは動物病院向けシステムを提供するが、AI病歴サマリーの自動生成と飼い主向けスマホアプリを統合した電子カルテSaaSは確認できない。本サービスは診察の質向上と飼い主体験の改善を同時に実現する。",
        "strengthNote": "月額SaaSで解約率が低く、患者データと診察履歴が蓄積するほど医院にとって不可欠なシステムとなる。飼い主アプリの普及により患者との接点が強化されリピート受診率向上で医院と自社の収益が連動して成長する。",
        "patternRationale": "A-3（人口動態の必然）はペット飼育世帯増加・高齢ペット増加という不可逆的トレンドを捉え、F-6（センサー・IoT×未計測領域）は動物病院の診察・薬剤・飼い主連携という未デジタル化領域のデータ活用に対応する。",
        "patterns": ["A-3", "F-6"],
        "trendKeywords": ["動物病院DX", "ペット医療電子カルテ", "ペット飼育世帯増加"],
        "tags": ["動物病院電子カルテ", "飼い主アプリ連携", "薬剤在庫管理", "獣医師DX"],
    },
    {
        "slug_prefix": "insuretrack",
        "serviceName": "InsureTrack",
        "oneLiner": "法人の保険証券を一元管理し過不足をAIが診断する経営者向けSaaS",
        "concept": "中小企業が加入している損害・生命・賠償責任保険などの証券を一元管理しAIが補償の重複・不足・解約タイミングを分析して最適な保険ポートフォリオを提案するSaaS。",
        "target": "複数の保険に加入している従業員10〜200名規模の中小企業の経営者・総務担当者",
        "problem": "中小企業が加入している保険証券を担当者が個別管理しており補償の重複・更新漏れ・コスト最適化の機会を見逃している。保険代理店への相談は客観性に欠けることもある。",
        "product": "保険証券のAI-OCR読み取りと補償内容の自動整理\n補償の重複・不足・最適化提案のAI診断レポート\n更新時期アラートと保険料推移の可視化\n中立的な保険見直し提案と代理店マッチング",
        "revenueModel": "月額SaaS（年間払い月額換算2,980円〜）\n保険見直し成約手数料（成功報酬型）",
        "competitors": "iChain保険ウォレット, folder, 保険クラウド Inspire, 保険市場, ほけんROOM",
        "competitiveEdge": "iChain保険ウォレットやfolderは個人向けが主体で法人の複数保険を補償重複・不足の視点でAI診断するSaaSは少なく、InsureTrackは中小法人の経営リスク管理視点での保険最適化に特化し差別化する。",
        "category": "インシュアテック",
        "targetIndustry": "金融・保険",
        "targetCustomer": "中小企業",
        "investmentScale": "〜50万円",
        "difficulty": "低",
        "scores": {"novelty": 4, "marketSize": 3, "profitability": 4, "growth": 3, "feasibility": 4, "moat": 3},
        "scoreComments": {
            "novelty": "法人保険の補償重複・不足をAIが中立診断するSaaSは国内に競合が少ない",
            "marketSize": "中小企業の保険加入率は高いが証券管理・最適化の専門対応ができていない",
            "profitability": "月額SaaS＋保険見直し成約手数料の二層収益で高ARPUを実現できる",
            "growth": "保険市場のデジタル化が加速し証券デジタル化・管理自動化への需要が増加中",
            "feasibility": "AI-OCRによる証券読み取りと保険会社別データベース整備に開発工数が必要",
            "moat": "企業ごとの保険証券データが蓄積するほど最適化精度が向上し乗り換えを阻む",
        },
        "whyNow": "保険業界のデジタル化が加速し証券のデジタル管理への需要が高まっている。2024年以降の保険料値上がり局面で中小企業の保険コスト最適化ニーズが急増し第三者的な保険診断ツールへの関心が高まっている。",
        "noveltyNote": "iChain保険ウォレットやfolderは個人向けの証券管理が主体で法人保険の補償重複・不足を中立的にAI診断するSaaSは確認できない。本サービスは経営リスク管理の視点で中小法人の保険ポートフォリオ最適化を支援する。",
        "strengthNote": "月額SaaSで解約率が低く、企業ごとの保険証券データが蓄積するほど最適化精度が向上する。保険見直し成約手数料の成功報酬モデルにより顧客のコスト削減と自社収益が完全に一致する。",
        "patternRationale": "B-4（摩擦の徹底除去）は保険証券管理という中小経営者の最大の見えにくいコスト摩擦をAIで可視化し、D-3（中立的な第三者情報）は代理店に依存しない客観的な保険診断という情報優位を確立する軸に対応する。",
        "patterns": ["B-4", "D-3"],
        "trendKeywords": ["保険デジタル化", "法人保険最適化", "保険証券管理DX"],
        "tags": ["保険証券管理", "法人保険最適化", "補償重複診断", "インシュアテック"],
    },
    {
        "slug_prefix": "weddingops",
        "serviceName": "WeddingOps",
        "oneLiner": "結婚式場の予約・接客・顧客管理をAIで一元化するブライダルSaaS",
        "concept": "結婚式場の問い合わせ管理・見学予約・接客履歴・プランナー業務・顧客フォローをAIが一元管理するSaaS。婚礼件数の減少とスタッフ不足に対応し接客成約率の向上と業務効率化を同時に実現する。",
        "target": "スタッフ5〜30名規模の中小結婚式場・ゲストハウスウエディングの支配人・マーケティング担当者",
        "problem": "中小結婚式場は見学問い合わせ・接客履歴・契約進捗をExcelや紙で管理しており引き継ぎの漏れや対応遅延が成約率低下を招いている。婚礼件数の減少でスタッフ削減も進んでいる。",
        "product": "問い合わせ〜見学〜成約までの顧客フローAI管理\nプランナー別の接客履歴・好み・懸念点の一元記録\nAIによる未成約顧客へのフォローアップ提案\n婚礼準備チェックリストと当日スタッフ共有機能",
        "revenueModel": "月額SaaS 式場規模課金（50名収容まで29,800円〜）\n導入支援コンサルティング（1社10万円〜）",
        "competitors": "Oiwaii, CIRCLE, ブライズノート, RAKUDAWEDDING, ウエディングウォーカーシステム",
        "competitiveEdge": "Oiwaii等は包括的なブライダルシステムで中小式場には機能過多かつ高価格な一方、WeddingOpsは問い合わせ〜成約のCRM機能とAIフォローアップに絞り中小式場が翌月から使える設計で差別化する。",
        "category": "SaaS",
        "targetIndustry": "冠婚葬祭",
        "targetCustomer": "中小企業",
        "investmentScale": "50〜200万円",
        "difficulty": "中",
        "scores": {"novelty": 4, "marketSize": 3, "profitability": 3, "growth": 3, "feasibility": 4, "moat": 3},
        "scoreComments": {
            "novelty": "問い合わせ〜成約のCRM特化とAIフォローアップの中小式場向けは少ない",
            "marketSize": "全国結婚式場は約1,500施設超。婚礼件数減少で差別化・効率化需要が急増",
            "profitability": "月額SaaSで解約率が低く婚礼シーズンに業務が集中し解約タイミングがない",
            "growth": "婚礼件数は減少傾向だが1件当たりの単価上昇で式場の収益追求意欲が高まる",
            "feasibility": "式場ごとの業務フローのカスタマイズ対応とブライダル知識の習得が必要となる",
            "moat": "顧客の接客履歴と婚礼実績データが蓄積するほど成約率が向上し乗り換えを阻む",
        },
        "whyNow": "婚礼件数の減少（2023年に過去最少レベル）とスタッフ不足の深刻化が重なり中小式場は少人数で高い成約率を維持することが生存要件になっている。ゼクシィなどの媒体費用が高騰し顧客情報の内製活用への関心が高まっている。",
        "noveltyNote": "OiwaiいやRAKUDAWEDDINGは包括的なブライダルシステムで中小には機能過多かつ高価格だが、問い合わせ〜成約のCRM機能とAIフォローアップ提案に絞った中小式場特化SaaSは確認できない。",
        "strengthNote": "月額SaaSで解約率が低く、顧客の接客履歴と成約・失注データが蓄積するほど成約率予測精度が向上する。婚礼という高単価サービスの成約率改善は費用対効果が極めて明確で解約動機が生まれにくい構造となる。",
        "patternRationale": "A-3（人口動態の必然）は少子化・婚礼件数減少という不可逆的構造変化を捉え、B-4（摩擦の徹底除去）は接客履歴の記録・フォローアップという中小式場の最大の業務摩擦をAIで解消する技術軸に対応する。",
        "patterns": ["A-3", "B-4"],
        "trendKeywords": ["ブライダルDX", "婚礼成約率向上AI", "式場顧客管理"],
        "tags": ["結婚式場CRM", "接客管理DX", "婚礼業務自動化", "式場AI"],
    },
    {
        "slug_prefix": "babysteps",
        "serviceName": "BabySteps",
        "oneLiner": "産後うつリスクをAIが検知し自治体サービスにつなぐ育児支援アプリ",
        "concept": "産後の育児記録（睡眠・授乳・体重）をスマホで管理しながらAIが産後うつリスクを検知し自治体の産後ケア・保育サービスに自動でつなぐアプリ。パパの育児参加率の可視化機能も搭載する。",
        "target": "出産後6ヶ月〜2歳のお子さんを持つ産後ケアに不安を抱えている母親・父親",
        "problem": "産後の孤立育児による産後うつの発症率が20%に達し自治体のサポートに辿り着けない親が多い。育児記録アプリは多数あるがAIによる産後うつリスク検知と自治体サービス連携まで行うものがない。",
        "product": "授乳・睡眠・体重の日次記録とAI健康サマリー\n産後うつリスクAI検知と自治体産後ケア窓口への誘導\nパパの育児参加率可視化と家族内共有機能\n月齢別の発達チェックリストと小児科受診タイミング提案",
        "revenueModel": "基本無料、プレミアム月額480円（育児記録無制限・相談機能）\n自治体向けB2G契約（年間50〜200万円）",
        "competitors": "ninaru baby, ママリ, Baby+, 妊娠・育児記録アプリMilk, sukusuku",
        "competitiveEdge": "ninaru babyやママリは情報提供・コミュニティが主体だが、BabyStepsはAI産後うつリスク検知と自治体サービス連携を統合し産後の孤立育児をシステムで解消する設計で差別化する。",
        "category": "デジタルヘルス",
        "targetIndustry": "医療・福祉",
        "targetCustomer": "一般消費者",
        "investmentScale": "50〜200万円",
        "difficulty": "中",
        "scores": {"novelty": 4, "marketSize": 4, "profitability": 3, "growth": 4, "feasibility": 3, "moat": 3},
        "scoreComments": {
            "novelty": "AI産後うつリスク検知と自治体サービス連携を統合した育児アプリは少ない",
            "marketSize": "年間出生数は約73万人（2023年）。全産後ケアに関わる潜在市場が大きい",
            "profitability": "フリーミアムで大量ユーザーを獲得し自治体B2G契約で高単価収益を確保",
            "growth": "産後うつ予防の重要性が社会的に認知され自治体のデジタル支援投資が増加中",
            "feasibility": "産後うつAI検知には医師監修とエビデンスベースのモデル構築に時間がかかる",
            "moat": "育児記録データが蓄積するほどユーザーの乗り換えコストが高まり継続率が上がる",
        },
        "whyNow": "産後うつによる自殺が日本の産後1年以内の死亡原因の1位となっていることが2024年に報告された。こども家庭庁の設置（2023年）と自治体の産後デジタルケア強化が政策的に推進され産後支援DXへの公的投資が急増している。",
        "noveltyNote": "ninaru babyやママリは育児情報・コミュニティ提供が主体で産後うつリスクのAI検知と自治体サービスへの自動誘導を統合したアプリは確認できない。本サービスは産後の孤立育児という社会課題をシステムで解決する。",
        "strengthNote": "月額フリーミアムで大量ユーザーを獲得しデータが蓄積するほどリスク検知精度が向上する。自治体B2G契約により安定した高単価収益が確保でき子育て支援政策との連動で行政予算を収益化する構造が成立する。",
        "patternRationale": "A-3（人口動態の必然）は少子化・産後うつ対策という社会的課題の拡大を捉え、C-7（BtoBtoC）は自治体（法人）を主顧客としながら親（個人）への支援まで届ける三者プラットフォーム構造に対応する。",
        "patterns": ["A-3", "C-7"],
        "trendKeywords": ["産後うつ対策DX", "育児支援デジタル化", "こども家庭庁施策"],
        "tags": ["産後うつリスク検知", "育児記録AI", "自治体連携", "ペアレンティングDX"],
    },
    {
        "slug_prefix": "eventflow",
        "serviceName": "EventFlow",
        "oneLiner": "セミナー・イベントの集客から参加者管理まで自動完結するSaaS",
        "concept": "中小企業・士業・コンサルタントが開催するセミナー・展示会・体験会の申込ページ作成・決済・参加者管理・アーカイブ配信をワンストップで管理するSaaS。AIが最適な告知文と投稿タイミングを提案する。",
        "target": "月1〜5回セミナーを開催する中小企業・士業・コンサルタント・スクールの主催者",
        "problem": "セミナー・イベント開催のたびに申込ページ作成・決済設定・参加者管理・リマインドメール配信を別々のツールで行っており1回のイベントに数時間の事務作業が発生している。",
        "product": "申込ページのノーコード作成と決済設定（最短10分）\n参加者への自動リマインドメール・Zoom URL送信\nAI集客コピー生成とSNS投稿タイミング提案\n参加者データのCRM蓄積と次回イベント招待自動化",
        "revenueModel": "月額SaaS（基本月1,980円〜）＋決済手数料（3.5%）\nイベント録画アーカイブ配信（月2,000円〜）",
        "competitors": "EventRegist, Peatix, Zoom Webinar, Doorkeeper, STORES予約",
        "competitiveEdge": "EventRegistは大規模イベント向けで個人・中小には機能過多、PeatixはSNS集客機能が弱い一方、EventFlowはAI集客コピー生成とSNS投稿提案を統合し中小主催者が最小工数で集客できる設計で差別化する。",
        "category": "SaaS",
        "targetIndustry": "広告・マーケティング",
        "targetCustomer": "中小企業",
        "investmentScale": "〜50万円",
        "difficulty": "低",
        "scores": {"novelty": 3, "marketSize": 4, "profitability": 3, "growth": 4, "feasibility": 4, "moat": 3},
        "scoreComments": {
            "novelty": "AI集客コピー生成とSNS投稿提案を統合したイベント管理SaaSは競合が少ない",
            "marketSize": "国内セミナー・オンラインイベント市場は年間数千億円規模。中小主催者が大半",
            "profitability": "月額SaaS＋決済手数料の二層収益。イベント頻度が上がるほど収益が拡大する",
            "growth": "コロナ以降のオンラインイベント定着で中小主催者の開催件数が大幅に増加",
            "feasibility": "申込・決済・メール・Zoom連携は既存APIで調達可能で開発期間が短縮できる",
            "moat": "参加者データが蓄積するほど次回イベントの招待成功率が上がりロックインが強化",
        },
        "whyNow": "コロナ禍でオンラインセミナーが定着し中小企業・個人事業主のセミナー開催が急増した。2025年以降もハイブリッドイベントが常態化しAI集客コピー生成ツールへの需要が急増している。",
        "noveltyNote": "EventRegistやPeatixはイベント管理プラットフォームとして機能するが、AI集客コピー生成とSNS投稿タイミング提案を統合した中小特化のオールインワンSaaSは確認できない。",
        "strengthNote": "月額SaaSで解約率が低く参加者データが蓄積するほど次回イベントの招待成功率が上がる。決済手数料がイベント件数の増加とともに拡大し顧客の成長と収益が連動する自己強化的な構造となる。",
        "patternRationale": "A-4（技術コスト急落の窓）はLLMによるコピー生成コストの急落を捉え、B-4（摩擦の徹底除去）は申込ページ作成・決済・参加者管理・集客という4つのイベント運営摩擦を1サービスで解消する技術軸に対応する。",
        "patterns": ["A-4", "B-4"],
        "trendKeywords": ["オンラインセミナー定着", "イベントDX", "AI集客コピー生成"],
        "tags": ["イベント管理SaaS", "集客自動化", "セミナー申込システム", "参加者CRM"],
    },
    {
        "slug_prefix": "jobpage",
        "serviceName": "JobPage",
        "oneLiner": "質問に答えるだけで中小企業の採用サイトをAIが即日作成するSaaS",
        "concept": "採用担当者がいない中小企業が質問に答えるだけで採用サイト・求人票をAIが自動生成しIndeed・Google検索など複数の求人媒体に自動掲載するSaaS。応募者との面接日程調整も自動化する。",
        "target": "採用専任担当者がいない従業員5〜50名の中小製造・サービス業の経営者・人事兼務担当者",
        "problem": "採用専任担当者がいない中小企業は求人票作成・採用サイト構築・応募管理に多大な工数がかかる。採用係長等の競合は機能が多く設定に時間がかかり中小には導入障壁が高い。",
        "product": "質問形式AI回答→採用サイト+求人票の自動生成\nIndeed・Googleしごと検索への自動掲載連携\n応募者管理・選考ステータスのシンプル一元管理\n面接日程調整の自動化（カレンダー連携）",
        "revenueModel": "月額SaaS 採用枠数課金（3求人まで9,800円〜）\n採用成功報酬（内定承諾1名3万円〜）",
        "competitors": "採用係長, トルー, iRec, HRハッカー, 求人ボックス採用管理",
        "competitiveEdge": "採用係長は72,549事業所の実績があるが設定に時間がかかる一方、JobPageは質問に答えるだけで10分以内に採用サイトが完成しIndeedへの自動掲載まで即日完結できる点で差別化する。",
        "category": "採用テック",
        "targetIndustry": "人材・HR",
        "targetCustomer": "中小企業",
        "investmentScale": "〜50万円",
        "difficulty": "低",
        "scores": {"novelty": 3, "marketSize": 5, "profitability": 4, "growth": 4, "feasibility": 4, "moat": 3},
        "scoreComments": {
            "novelty": "質問10分で採用サイト完成しIndeed自動掲載まで即日完結するSaaSは少ない",
            "marketSize": "採用専任担当のいない中小企業は約300万社超。採用コスト削減需要が急増中",
            "profitability": "月額SaaS＋採用成功報酬の二層収益でARPUが高く採用成功で口コミ獲得",
            "growth": "少子化による採用難が深刻化しており中小企業の採用DX化の緊急度が高まる",
            "feasibility": "Indeed APIとGoogleしごと検索連携は既存パートナーシップで実現が可能",
            "moat": "応募者・採用実績データが蓄積するほどAIの求人票品質が向上し乗り換えを阻む",
        },
        "whyNow": "少子化による採用難が深刻化し中小企業の人手不足は2025年も過去最悪水準が続いている。Indeed等の求人媒体費用が高騰し自社採用サイトへの内製化ニーズが急増しており、AIによる採用コンテンツ自動生成への需要が高まっている。",
        "noveltyNote": "採用係長は72,549事業所の実績があるが設定に時間がかかり非専任担当者には難しい。質問に答えるだけで10分以内に採用サイトが完成しIndeed・Googleしごと検索への自動掲載まで即日完結するSaaSは確認できない。",
        "strengthNote": "月額SaaSで解約率が低く、応募者・採用実績データが蓄積するほどAIの求人票品質が向上する。採用成功報酬モデルにより顧客の採用成功と自社収益が完全に一致し信頼資産として機能する。",
        "patternRationale": "A-3（人口動態の必然）は少子化による採用難という不可逆的構造変化を捉え、B-4（摩擦の徹底除去）は採用サイト作成・媒体掲載・応募管理という中小採用担当の最大の時間的摩擦を解消する技術軸に対応する。",
        "patterns": ["A-3", "B-4"],
        "trendKeywords": ["中小企業採用DX", "AI求人票生成", "採用サイト自動作成"],
        "tags": ["採用サイト自動作成", "Indeed自動掲載", "求人票AI生成", "中小採用"],
    },
    {
        "slug_prefix": "petbooking",
        "serviceName": "PetBooking",
        "oneLiner": "ペットホテル・トリミングの予約・顧客管理・LINE連携を一元化するSaaS",
        "concept": "ペットホテル・トリミングサロン・動物病院が飼い主のLINEから24時間予約を受け付けカルテ・会計・リピート管理まで完結するSaaS。ペット情報の自動引き継ぎで初回カウンセリング工数を削減する。",
        "target": "スタッフ1〜10名規模のペットホテル・トリミングサロン・ペットクリニックの経営者・店長",
        "problem": "小規模ペット事業者は電話予約・紙カルテ・手作業会計に依存しており予約ミスやリピート管理の漏れが顧客離反につながっている。LINE公式アカウントとの連携が手作業で非効率だ。",
        "product": "LINE公式アカウント連携の24時間オンライン予約\nペットカルテ（体重・ワクチン・アレルギー履歴）の自動管理\nサービス完了後の飼い主へのケアレポート自動送信\nリピート促進の自動DM・次回予約リマインド機能",
        "revenueModel": "月額SaaS 店舗数課金（1店舗9,800円〜）\n初期設定・LINE連携代行（1店舗5万円〜）",
        "competitors": "シェリービジネスポータル, Petindex, RESERVA予約, Animary byGMO, ペットサロンシステム",
        "competitiveEdge": "Animary byGMOはLINE連携に対応するが動物病院向けが主体な一方、PetBookingはペットホテル・トリミングサロンに特化し24時間LINE予約からケアレポート自動送信まで飼い主体験を最優先に設計する点で差別化する。",
        "category": "ペットテック",
        "targetIndustry": "美容・理容",
        "targetCustomer": "飲食店・店舗",
        "investmentScale": "〜50万円",
        "difficulty": "低",
        "scores": {"novelty": 3, "marketSize": 3, "profitability": 3, "growth": 4, "feasibility": 4, "moat": 3},
        "scoreComments": {
            "novelty": "ペットサロン特化でLINE予約からケアレポート自動送信まで一体型は少ない",
            "marketSize": "全国ペット関連店舗は数万店規模。ペット産業市場は2025年も拡大が続く",
            "profitability": "月額SaaS＋初期設定代行で初期から黒字化しやすい収益構造を確立できる",
            "growth": "ペット飼育世帯増加とペット医療・サービス高度化でDX化需要が継続拡大中",
            "feasibility": "LINE公式API連携と予約カレンダー機能は既存モジュールで2ヶ月で構築可能",
            "moat": "ペットカルテと飼い主との関係データが蓄積するほど乗り換えコストが高まる",
        },
        "whyNow": "ペット飼育世帯が2,000万世帯超となり猫・犬の飼育数が増加傾向にある。LINE利用率が90%超の日本でLINE公式アカウントを活用したビジネス連携が標準化しており、ペット事業者のLINE予約自動化への需要が急増している。",
        "noveltyNote": "シェリービジネスポータルやPetindexはペットサロン向け予約・顧客管理を提供するが、LINE連携の24時間予約受付からペットカルテ管理・ケアレポート自動送信まで一体化したSaaSは確認できない。",
        "strengthNote": "月額SaaSで解約率が低く、ペットカルテと飼い主との関係データが蓄積するほど乗り換えコストが高まる。ケアレポート自動送信による飼い主との関係強化がリピート率向上と収益の自己強化につながる。",
        "patternRationale": "A-3（人口動態の必然）はペット飼育世帯増加という不可逆的トレンドを捉え、B-4（摩擦の徹底除去）は電話予約・紙カルテ・手作業会計というペット事業者の最大の日常的摩擦をLINE連携で解消する技術軸に対応する。",
        "patterns": ["A-3", "B-4"],
        "trendKeywords": ["ペット産業DX", "LINE予約自動化", "ペットビジネスIT化"],
        "tags": ["ペットサロン予約管理", "LINE連携予約", "トリミング管理", "ケアレポート"],
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
