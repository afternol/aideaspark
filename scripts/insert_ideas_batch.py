"""
アイデア #9〜#15 バッチINSERT
各アイデアをバリデーション → 順次INSERT
"""
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

def validate(idea, label):
    errors = []
    ol = idea.get("oneLiner", "")
    if not (20 <= len(ol) <= 40):
        errors.append(f"oneLiner: {len(ol)}字「{ol}」")
    pats = idea.get("patterns", [])
    if len(pats) != 2:
        errors.append(f"patterns: {len(pats)}件")
    for p in pats:
        if not PATTERN_RE.match(str(p)):
            errors.append(f"patternID不正: {p}")
    sc = idea.get("scores", {})
    if len(set(sc.values())) == 1:
        errors.append("scores全軸同一")
    for k, v in sc.items():
        if not isinstance(v, int) or not (1 <= v <= 5):
            errors.append(f"scores.{k}={v}")
    scc = idea.get("scoreComments", {})
    for axis in ["novelty","marketSize","profitability","growth","feasibility","moat"]:
        c = scc.get(axis, "")
        if not (30 <= len(c) <= 60):
            errors.append(f"scoreComments.{axis}: {len(c)}字「{c}」")
    if len(idea.get("trendKeywords", [])) != 3:
        errors.append("trendKeywords != 3件")
    comp_list = [c.strip() for c in idea.get("competitors","").split(",") if c.strip()]
    if len(comp_list) < 3:
        errors.append(f"competitors {len(comp_list)}社")
    if errors:
        print(f"[{label}] VALIDATION ERROR:")
        for e in errors:
            print(f"  [NG] {e}")
        return False
    return True


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# アイデアデータ一覧
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ideas = [

# ─── #9: QualitAI ─────────────────────────────────────────────────────
{
    "slug_prefix": "qualitai",
    "serviceName": "QualitAI",
    "oneLiner": "既存カメラをAIに変えて製造不良を自動検知する中小製造業向けSaaS",
    "concept": "工場の既存カメラ・WebカメラをAIに接続し、合成不良画像でモデルを学習。不良品サンプルが少ない中小製造業でも専門知識なしで外観検査を自動化できる月額SaaS。",
    "target": "従業員10〜100名の金属・プラスチック・食品加工の中小製造業の品質管理担当者",
    "problem": "目視検査は人手不足と検査員の熟練度依存で品質が不安定。AI外観検査の既存製品は専門知識・高コスト・大量不良サンプルが必要で中小には導入障壁が高い。",
    "product": "既存カメラのAI化コネクタ（設置工事不要）\n合成不良画像生成によるAIモデル自動構築\n不良品リアルタイム検知と工程への自動フィードバック\nダッシュボードによる品質トレンド分析",
    "revenueModel": "月額SaaS カメラ台数課金（3台まで3万円〜）\nAIモデル構築アドオン（1モデル5万円〜）",
    "competitors": "RoxyAI, フツパー, WisSight, Phoenix Vision, アプライド AI外観検査",
    "competitiveEdge": "RoxyAI等は不良サンプルが必要だが、QualitAIは合成不良画像生成技術で不良品が少なくてもモデル構築でき、既存カメラに接続するだけで導入できる点で差別化する。",
    "category": "製造DX",
    "targetIndustry": "製造",
    "targetCustomer": "中小企業",
    "investmentScale": "200〜500万円",
    "difficulty": "中",
    "scores": {"novelty": 4, "marketSize": 4, "profitability": 3, "growth": 4, "feasibility": 3, "moat": 4},
    "scoreComments": {
        "novelty": "合成不良画像でAI学習できるため不良サンプルが少ない中小でも即導入可能",
        "marketSize": "国内製造業事業所は約20万社超。目視検査に人手を要する工程は無数に存在する",
        "profitability": "月額SaaS＋モデル構築アドオンで安定収益。既存機器活用で初期費用を抑制",
        "growth": "人手不足加速と品質管理強化でAI外観検査の中小製造業への普及圧力が高まる",
        "feasibility": "既存カメラやWebカメラ対応設計で専用機器不要。導入ハードルが低い設計",
        "moat": "工場ごとの不良パターンデータが蓄積しAI精度が向上、乗り換えが困難になる",
    },
    "whyNow": "製造業の人手不足が深刻化する中、2024年版ものづくり白書でも品質管理の自動化がDX重点課題として明記された。従来のAI外観検査は高コスト・専門知識が必要だったが、生成AI技術の進化で合成データ生成コストが大幅に低下し、中小製造業でも現実的な選択肢になった。",
    "noveltyNote": "RoxyAIやフツパーは既存のAI外観検査プレイヤーだが、合成不良画像による学習フローと既存カメラへの接続だけで開始できる設計を一体化したSaaSは国内に確認できない。本サービスはサンプル不足という最大の導入障壁を技術で解消し、中小製造業の参入障壁を根本的に下げる。",
    "strengthNote": "工場ごとの不良パターンデータが蓄積するほどAI検知精度が向上し、競合が同品質のモデルを作るには年単位の時間を要する。カメラ接続コネクタが既設備に組み込まれることで、乗り換えには設備変更コストが発生し粘着性が高まる。",
    "patternRationale": "A-3（人口動態の必然）は製造業の人手不足という不可逆的需要を捉え、F-1（バーティカルAI）は製造業特化の外観検査AIという業界垂直統合の技術軸に対応する。",
    "patterns": ["A-3", "F-1"],
    "trendKeywords": ["AI外観検査", "製造DX", "合成データ"],
    "tags": ["品質管理自動化", "目視検査AI", "中小製造業", "エッジAI"],
},

# ─── #10: ExitPilot ────────────────────────────────────────────────────
{
    "slug_prefix": "exitpilot",
    "serviceName": "ExitPilot",
    "oneLiner": "AIが中小企業の事業価値を診断し最適な承継戦略を提案するSaaS",
    "concept": "財務データとヒアリングをもとにAIが企業価値を診断し、M&A用の企業概要書（CIM）を自動生成。BATONZ等のマッチングプラットフォームへの連携投稿まで一気通貫で支援する事業承継準備SaaS。",
    "target": "後継者不在で5〜10年以内の事業承継・M&Aを検討する売上1億〜10億円規模の中小企業経営者",
    "problem": "後継者が不在の中小経営者は企業価値の算定方法もM&Aの進め方もわからず、士業に頼むと高額。プラットフォームに登録しても企業の魅力を伝えるCIMが作れず成約率が低い。",
    "product": "AI財務分析による企業価値診断レポート（DCF・類似企業比較法）\n強み・リスクのヒアリング → CIM（企業概要書）自動生成\nBAHONZ/relay等への案件自動掲載連携\n候補先からの問い合わせ一元管理",
    "revenueModel": "月額SaaS 診断・CIM生成プラン（3万円〜）\n成約時の成功報酬（成約額の0.5〜1%）",
    "competitors": "BATONZ, relay, TRANBI, M&Aナビ, fundbook",
    "competitiveEdge": "BATONZ等は案件マッチングが主体でCIM自動生成や企業価値診断の機能は持たない。ExitPilotはマッチング前の準備フェーズに特化することで既存プラットフォームと競合せず補完的に機能する。",
    "category": "AI SaaS",
    "targetIndustry": "全業界",
    "targetCustomer": "中小企業",
    "investmentScale": "50〜200万円",
    "difficulty": "中",
    "scores": {"novelty": 4, "marketSize": 4, "profitability": 4, "growth": 5, "feasibility": 3, "moat": 3},
    "scoreComments": {
        "novelty": "BATONZ等は案件マッチング主体でCIM自動生成機能は持たず差別化点が明確",
        "marketSize": "後継者不在は中小企業の半数以上（帝国データバンク）。毎年数万社が廃業を選択",
        "profitability": "月額SaaS＋成約成功報酬でARPUが高く、承継完了まで継続利用される構造",
        "growth": "団塊世代経営者の引退期が2025〜2030年に集中し事業承継ニーズが急拡大中",
        "feasibility": "AI財務分析は既存APIで実現可能だがM&Aアドバイザーネットワーク構築が課題",
        "moat": "企業ごとの財務・事業データ蓄積で診断精度が向上し乗り換えコストが高くなる",
    },
    "whyNow": "団塊世代の経営者が70代後半を迎える2025〜2030年が事業承継の集中期であり、後継者不在企業が廃業を選ぶ前に行動できる期間は限られている。同時に生成AIの進化でCIM自動生成が技術的に実現可能となり、中小経営者がコストをかけずに承継準備を始められる環境が整った。",
    "noveltyNote": "BATONZ・relay・TRANBIはマッチングプラットフォームであり、売り手が企業を魅力的に見せるための価値診断・CIM生成機能は持たない。ExitPilotはマッチング前の「承継準備」フェーズに特化することで既存サービスとは根本的に異なる価値を提供し、補完関係を構築する。",
    "strengthNote": "企業ごとの財務・経営データが蓄積するほどAIの企業価値診断精度が向上し、乗り換えると蓄積データが失われる構造でスイッチングコストが高い。成功報酬モデルにより承継が完了するまで長期利用が続き、LTVが高い収益構造が成立する。",
    "patternRationale": "A-3（人口動態の必然）は団塊世代引退という不可逆的な事業承継ニーズを捉え、F-2（AIによる専門家サービスの民主化）はM&Aアドバイザリーの高コスト問題をAIで解消する技術軸に対応する。",
    "patterns": ["A-3", "F-2"],
    "trendKeywords": ["事業承継", "中小M&A", "CIM自動生成"],
    "tags": ["後継者不在", "企業価値診断", "AI承継支援", "M&A準備"],
},

# ─── #11: SideCalc ─────────────────────────────────────────────────────
{
    "slug_prefix": "sidecalc",
    "serviceName": "SideCalc",
    "oneLiner": "副業収入を複数プラットフォームから自動集計しe-Taxへ直送する確定申告アプリ",
    "concept": "YouTube・Coconala・Upwork等の副業プラットフォームの収入をAPIで自動集計し、AI仕訳・経費判定・確定申告書B作成・e-Tax送信までをスマホ1台で完結させる副業会社員向けアプリ。",
    "target": "年間副業収入20万円超の会社員・公務員・派遣社員で確定申告に不安を感じる30〜45歳層",
    "problem": "副業が複数プラットフォームに分散しており、収入の集計・経費の仕訳・確定申告の方法がわからない。freee等の一般会計ソフトは副業特有のプラットフォーム連携が弱く操作が複雑で使いにくい。",
    "product": "副業プラットフォーム（YouTube・Coconala・Lancers等）のAPI収入自動集計\nAIによる経費判定・仕訳提案（副業特有の経費ガイド付き）\n確定申告書B・青色申告決算書の自動作成\ne-Tax電子申告への直接送信",
    "revenueModel": "年額プラン 980円〜（確定申告シーズン型課金）\n税理士レビューオプション 5,000円〜（オンデマンド）",
    "competitors": "freee 確定申告, マネーフォワード ME, やよいの青色申告, 弥生の確定申告, マネーフォワードクラウド確定申告",
    "competitiveEdge": "freeeやマネーフォワードは汎用会計ソフトで副業専用のプラットフォーム連携が弱い。SideCalcは副業収入の多プラットフォーム自動集計とe-Tax直送を副業会社員特化で設計し差別化する。",
    "category": "会計・経理DX",
    "targetIndustry": "全業界",
    "targetCustomer": "フリーランス・副業",
    "investmentScale": "50〜200万円",
    "difficulty": "中",
    "scores": {"novelty": 3, "marketSize": 4, "profitability": 2, "growth": 4, "feasibility": 3, "moat": 2},
    "scoreComments": {
        "novelty": "副業収入の複数プラットフォーム一括連携とe-Tax直送の一体型は類似が少ない",
        "marketSize": "副業所得申告が必要な会社員は年間数百万人規模。副業人口は年々増加傾向",
        "profitability": "年額課金で単価が低い。税理士レビュー等の高単価オプションが収益の鍵になる",
        "growth": "副業推進施策と2024年施行のフリーランス保護法で副業人口が増加している",
        "feasibility": "e-Tax API連携は申請手続きが複雑だが一度構築すれば大きな差別化要因になる",
        "moat": "仕訳・経費データが蓄積するほど精度向上し乗り換えが面倒になる粘着構造",
    },
    "whyNow": "政府の副業・兼業推進ガイドラインの浸透と2024年施行のフリーランス保護法により会社員の副業人口が増加しており、確定申告が必要な層が急拡大している。同時にe-Tax普及率が年々上昇しており、スマホ完結型の確定申告ニーズが高まっている。",
    "noveltyNote": "freeeやマネーフォワードは一般会計ソフトとして設計されており、YouTube・Coconala・Lancers等の副業プラットフォームとのAPI連携を一括で提供するサービスは確認できない。SideCalcは副業会社員の「複数収入源の集計」という最大の摩擦点を解消することで独自の市場を作る。",
    "strengthNote": "ユーザーの過去の仕訳データ・経費判定履歴が蓄積するほどAIの提案精度が向上し、毎年の確定申告で蓄積データを活用できることから乗り換えコストが高まる。副業プラットフォームとのAPI連携数が増えるほど価値が上がる正のネットワーク効果も機能する。",
    "patternRationale": "A-4（行動変容の「取り残し」）は確定申告を敬遠する副業会社員という行動変容の遅れを捉え、F-2（AIによる専門家サービスの民主化）は税理士が必要だった確定申告をAIで個人が自己完結できるようにする技術軸に対応する。",
    "patterns": ["A-4", "F-2"],
    "trendKeywords": ["副業確定申告", "e-Tax自動化", "フリーランス保護法"],
    "tags": ["副業収入管理", "多プラットフォーム連携", "節税AI", "スマホ申告"],
},

# ─── #12: KidsOps ──────────────────────────────────────────────────────
{
    "slug_prefix": "kidsops",
    "serviceName": "KidsOps",
    "oneLiner": "学童保育の連絡・出欠・料金計算をLINEで完結させる民間学童向けSaaS",
    "concept": "保護者とのやり取りをLINEに集約し、出欠確認・延長申請・料金の自動計算・請求書発行をワンプラットフォームで完結。コドモン等の機能過多・高コストな保育SaaSに対抗する民間学童特化の軽量SaaS。",
    "target": "従業員5〜20名の民間放課後児童クラブ・学童保育を運営する施設長・経営者",
    "problem": "保護者連絡はLINE・電話・連絡帳が混在し、延長保育の連絡漏れや料金計算ミスが頻発。コドモン等の既存システムは機能が多く高コストで、小規模民間学童には過剰スペックになっている。",
    "product": "LINE連携による欠席・延長申請の自動受付と通知\n出席・延長記録の自動集計と月額料金の自動計算\nPDF請求書の自動生成・保護者へのLINE送付\n施設スタッフのシフト管理・連絡共有機能",
    "revenueModel": "月額SaaS 児童数課金（20名まで8,000円〜）\nLINE公式アカウント連携オプション（月2,000円）",
    "competitors": "CoDMON（コドモン）学童版, Hokally, GAKUDOU, Child Care System, さくらケーシーエス",
    "competitiveEdge": "CoDMONは保育業界No.1だが機能が多く月額費用も高め。KidsOpsはLINEで完結する連絡・料金管理に特化し、民間学童保育が翌日から使える低コスト設計で差別化する。",
    "category": "EdTech",
    "targetIndustry": "教育・研修",
    "targetCustomer": "中小企業",
    "investmentScale": "〜50万円",
    "difficulty": "低",
    "scores": {"novelty": 3, "marketSize": 3, "profitability": 3, "growth": 4, "feasibility": 5, "moat": 2},
    "scoreComments": {
        "novelty": "コドモンの機能を省きLINE連携・料金計算に特化した民間学童向け設計が差別化点",
        "marketSize": "全国の放課後児童クラブは約2万6千ヵ所超。民間学童保育の増加が著しい",
        "profitability": "月額SaaSで解約しにくい。小規模施設は低単価だがボリュームゾーンが大きい",
        "growth": "共働き世帯の増加で学童保育需要が年々拡大。民間学童の新規開設が続いている",
        "feasibility": "LINEとクラウドのみで完結し、設備投資不要で最短1週間以内に導入が可能",
        "moat": "施設ごとの児童・保護者データが蓄積するほど乗り換えコストが高くなる",
    },
    "whyNow": "共働き世帯の増加と待機児童対策の流れで民間学童保育の新規開設が続いており、運営者のICTニーズが急増している。一方、コドモンは保育園向けに特化した機能が多く民間学童向けの軽量・低コストな選択肢が不足しており、参入機会が拡大している。",
    "noveltyNote": "CoDMONやHokallyは保育園・学童向け総合ICTシステムとして機能が充実しているが、LINEをメインチャネルとした連絡・料金計算・請求書発行の一体型で月額8,000円から使えるサービスは国内に確認できない。KidsOpsはLINE接触率の高い保護者層の行動を起点に設計する。",
    "strengthNote": "月額固定課金で施設の解約率が低く、児童・保護者データが蓄積するほど乗り換えコストが高まる。学童保育業界は業者間の横のつながりが強く、口コミによる紹介獲得でCAC（顧客獲得コスト）を低く保つことができる。",
    "patternRationale": "H-2（中小企業DX代行）は小規模民間学童の運営者がICTに不慣れな状況でのDX支援を示し、B-4（摩擦の徹底除去）はLINEで保護者とのやり取りを完結させるUX設計の技術軸に対応する。",
    "patterns": ["H-2", "B-4"],
    "trendKeywords": ["学童保育DX", "民間学童増加", "LINE保護者連絡"],
    "tags": ["放課後児童クラブ", "保護者連絡自動化", "料金計算AI", "LINE連携"],
},

# ─── #13: DentLink ─────────────────────────────────────────────────────
{
    "slug_prefix": "dentlink",
    "serviceName": "DentLink",
    "oneLiner": "AIが患者の来院パターンを学習し定期検診の自動リマインドで再診率を高めるSaaS",
    "concept": "歯科患者ごとの来院間隔・治療進捗・過去のキャンセル傾向をAIが学習し、最適なタイミングでLINEまたはSMSで自動リマインドを送信。定期検診の再診率向上と予約埋め率改善を同時実現する歯科医院向けSaaS。",
    "target": "院長1〜2名・スタッフ5名以内の個人・小規模歯科医院で再診率向上・患者定着に課題を持つ院長",
    "problem": "歯科治療完了後の患者が定期検診に来院しない「離脱」が深刻で、1年以内の再診率は50%を下回るとされる。現在のリマインドは画一的なはがき・一斉SMSで、患者ごとの最適タイミングに対応できていない。",
    "product": "患者ごとのAI来院予測モデル（最適リマインドタイミング算出）\nLINE・SMS自動パーソナライズメッセージ配信\n離脱予兆スコアリングと優先フォローリスト生成\n再診率・予約充填率のリアルタイムダッシュボード",
    "revenueModel": "月額SaaS 患者数課金（500名まで1.5万円〜）\nLINE公式アカウント連携・配信数追加オプション",
    "competitors": "ジニー（Genie）, DENTIS, Dentry byGMO, デンタマップラス, RESERVA",
    "competitiveEdge": "ジニー・DENTISは予約管理が主体で患者ごとのAIリマインド最適化機能は持たない。DentLinkは「再診率向上」という歯科医院の収益直結課題に特化し、既存システムへのアドオンとして導入できる差別化を持つ。",
    "category": "デジタルヘルス",
    "targetIndustry": "医療・福祉",
    "targetCustomer": "医療機関",
    "investmentScale": "50〜200万円",
    "difficulty": "中",
    "scores": {"novelty": 4, "marketSize": 3, "profitability": 3, "growth": 3, "feasibility": 4, "moat": 4},
    "scoreComments": {
        "novelty": "再診率向上に特化したAI来院パターン学習リマインドは国内歯科SaaSに確認できない",
        "marketSize": "全国の歯科診療所は約6.8万件。再診率の低さは全院共通の収益課題である",
        "profitability": "月額SaaS＋LINEオプションで安定収益。歯科医院は一度使うと乗り換えしにくい",
        "growth": "歯科医院間競争の激化で差別化が必須。再診率向上は収益に直結する最優先課題",
        "feasibility": "LINE・SMS配信APIで実現可能。既存カルテとのCSV連携で初期設定が可能",
        "moat": "患者ごとの来院・治療パターンデータが蓄積しAI精度が向上、競合が追えない",
    },
    "whyNow": "歯科診療所数が全国でコンビニを超える水準に達し競争が激化する中、廃院・休院が右肩上がりになっている。患者獲得より既存患者の定着（再診率向上）が収益安定に直結するという認識が院長の間で広がっており、AI活用への関心が高まっている。",
    "noveltyNote": "ジニーやDENTISは予約管理・患者台帳管理を主軸とするシステムだが、患者ごとのAI来院予測に基づくパーソナライズされたLINEリマインドを自動送信する機能は確認できない。DentLinkは既存予約システムを置き換えず「再診率向上専用のアドオン」として導入できる点で補完的かつ差別化された位置づけを取る。",
    "strengthNote": "患者ごとの来院間隔・キャンセル履歴・治療進捗データが蓄積するほどAIのリマインドタイミング精度が向上し、他のシステムに移行するとこのデータ資産を失う。歯科医院は電子カルテ連携が完了した後は解約コストが高く、粘着性の高い収益構造が成立する。",
    "patternRationale": "D-1（データ資産の複利効果）は患者データが蓄積するほどAI精度が向上するフライホイール構造に対応し、B-6（アウトカム課金）は再診率向上という明確な成果に連動した成功報酬モデルへの展開可能性を示す。",
    "patterns": ["D-1", "B-6"],
    "trendKeywords": ["歯科再診率向上", "患者定着AI", "LINE医療連絡"],
    "tags": ["定期検診自動化", "患者離脱防止", "歯科DX", "リマインドAI"],
},

# ─── #14: CropSense ────────────────────────────────────────────────────
{
    "slug_prefix": "cropsense",
    "serviceName": "CropSense",
    "oneLiner": "スマホ写真1枚でAIが病害虫を診断し収量予測と農薬最適化を提案するSaaS",
    "concept": "スマートフォンで圃場の作物を撮影するだけで、AIが病害虫を自動診断し防除タイミング・農薬種類・散布量を提案。衛星データとの組み合わせで収量予測まで行い、クボタ・NEC等の大規模システム不要で使える中小農家向けSaaS。",
    "target": "水稲・野菜・果樹を栽培する経営面積2〜50haの中規模農家・農業生産法人",
    "problem": "病害虫の発見が遅れることで収量が大幅に落ちるが、農薬の種類・タイミングは経験則に頼っており、若手農業者には判断が難しい。既存のスマート農業システムは高コスト・複雑で中小農家には導入障壁が高い。",
    "product": "スマホカメラ写真→AI病害虫即時診断（100種以上の病害虫対応）\n農薬種類・散布タイミング・散布量の最適化提案\n衛星データ連携による圃場全体の収量予測マップ\n農業日誌・作業記録の自動生成",
    "revenueModel": "月額SaaS 経営面積課金（5haまで3,000円〜）\n農薬メーカーとの提携（推奨農薬紹介手数料）",
    "competitors": "クボタ KSAS, NEC CropScope, オプティム Agri House Manager, Happy Quality, xarvio（BASF）",
    "competitiveEdge": "クボタKSASやNEC CropScopeは大規模農業向けで専用機器が必要だが、CropSenseはスマホカメラだけで動作し月額3,000円〜の価格で中小農家でも利用できる点で根本的に異なる。",
    "category": "アグリテック",
    "targetIndustry": "農業・一次産業",
    "targetCustomer": "農家・生産者",
    "investmentScale": "50〜200万円",
    "difficulty": "中",
    "scores": {"novelty": 4, "marketSize": 3, "profitability": 3, "growth": 4, "feasibility": 3, "moat": 4},
    "scoreComments": {
        "novelty": "クボタ・NEC等は大規模農業向けで中小農家がスマホだけで使えるSaaSは少ない",
        "marketSize": "国内農業就業者は約170万人。スマート農業市場は2025年に3,885億円規模と予測",
        "profitability": "月額SaaS農地面積課金＋農薬紹介手数料で安定収益。年間解約率が低い傾向",
        "growth": "2024年施行スマート農業促進法でDX補助金が拡充。農業人材不足で省力化需要増",
        "feasibility": "スマホカメラとクラウドで完結し農家の初期投資を最小化できる設計が可能",
        "moat": "圃場ごとの収量・病害虫パターンデータが蓄積しAI精度が向上する複利構造",
    },
    "whyNow": "2024年10月に施行されたスマート農業技術の活用促進に関する法律でDX化が後押しされており、自治体・JAによる補助金制度も整備されつつある。農業就業者の高齢化と人材不足が深刻化する中、若手農業者が経験則に依存せず適切な病害虫防除ができるツールへの需要が急拡大している。",
    "noveltyNote": "クボタKSASやNEC CropScopeはIoTセンサー・専用機器が必要で大規模農場向けに設計されており、スマートフォン撮影のみで完結する病害虫診断・農薬最適化・収量予測を一体化したSaaSは国内に確認できない。CropSenseは機器不要・スマホ完結という根本的な利便性の差で市場を開拓する。",
    "strengthNote": "圃場ごとの気象・土壌・病害虫発生パターンデータが蓄積するほどAIの診断精度が向上し、他サービスに移行するとこの圃場固有のデータ資産を失う。農薬メーカーとの推奨農薬連携により、データ収益化の第二の柱が生まれ競合との差別化が持続的になる。",
    "patternRationale": "A-3（人口動態の必然）は農業人材不足という不可逆的な省力化需要を捉え、F-6（センサー・IoT×未計測領域）はスマホカメラをセンサーとして活用し圃場の非デジタル状態をデジタル化する技術軸に対応する。",
    "patterns": ["A-3", "F-6"],
    "trendKeywords": ["スマート農業", "病害虫AI診断", "農薬最適化"],
    "tags": ["精密農業", "農薬削減", "収量予測", "スマホ農業"],
},

# ─── #15: SkillBridge ──────────────────────────────────────────────────
{
    "slug_prefix": "skillbridge",
    "serviceName": "SkillBridge",
    "oneLiner": "建設職人の実績・評価を蓄積し信頼できる協力業者との継続発注を支援するSaaS",
    "concept": "建設業の元請け企業が協力業者・職人の施工実績・品質評価・技能資格をデジタルで蓄積し管理。スポットマッチングではなく「長期信頼関係」を軸とした協力業者ポートフォリオ管理SaaS。",
    "target": "協力業者20〜100社を抱える中堅建設・リフォーム会社の現場監督・資材調達担当者",
    "problem": "協力業者・職人の探索は口コミや人脈頼みで、技術品質にばらつきがあり品質事故リスクが高い。既存マッチングサービスはスポット発注向けで、実績・品質評価の蓄積機能がなく長期取引管理に向かない。",
    "product": "協力業者ごとの施工実績・品質評価スコアの蓄積DB\n技能資格・保険証・安全教育履歴のデジタル管理\n発注実績に基づく優先業者ランキングと推奨機能\n協力業者向けスマホアプリ（実績確認・案件応募）",
    "revenueModel": "月額SaaS 登録協力業者数課金（20社まで2万円〜）\nプレミアム認定バッジ（協力業者向け月額1,000円）",
    "competitors": "助太刀, ツクリンク, 請負市場, CAREECON, CCレシポ",
    "competitiveEdge": "助太刀・ツクリンクはスポット仕事マッチングが主体で協力業者の実績・品質評価の蓄積機能を持たない。SkillBridgeは「長期継続取引」と「品質評価DB」に特化することで元請けの信頼ある協力業者ポートフォリオ構築を支援する。",
    "category": "建設テック",
    "targetIndustry": "建設・土木",
    "targetCustomer": "中小企業",
    "investmentScale": "50〜200万円",
    "difficulty": "低",
    "scores": {"novelty": 4, "marketSize": 4, "profitability": 3, "growth": 4, "feasibility": 4, "moat": 3},
    "scoreComments": {
        "novelty": "助太刀等はスポットマッチング主体で継続取引・技術評価DB機能は持たない",
        "marketSize": "建設業の協力業者数は数十万社規模。下請け管理課題はゼネコン・中小全て共通",
        "profitability": "月額SaaS＋協力業者向け課金の二層収益。継続取引増加で自然解約率が低い",
        "growth": "2024年問題で協力業者の安定確保が急務。下請け管理DXへの需要が急拡大中",
        "feasibility": "基本はウェブアプリとスマホアプリで完結し、初期開発コストが比較的抑えられる",
        "moat": "協力業者の評価・実績データが蓄積するほど信頼性が高まり他社移行が困難になる",
    },
    "whyNow": "建設業の時間外労働上限規制が2024年4月から適用され、工期短縮・品質維持のために信頼できる協力業者の早期確保が急務となった。CraftBankが2026年4月にサービスを終了したことで、34,000社超の登録企業が代替サービスを探しており、参入機会が生まれている。",
    "noveltyNote": "助太刀やツクリンクは職人・協力業者とのスポット案件マッチングに特化しており、元請けが協力業者の実績・品質評価・資格情報を一元管理し継続取引の優先順位付けを行う機能は確認できない。SkillBridgeは「マッチング後の関係管理」という既存プレイヤーが手を出していない領域に特化する。",
    "strengthNote": "元請け企業ごとの協力業者評価・発注実績データが蓄積するほど精度が向上し、データ移行コストが高くなる。協力業者側もプレミアム認定バッジを取得することでSkillBridgeへの依存度が高まり、両サイドの粘着性を高めるツーサイドプラットフォーム効果が働く。",
    "patternRationale": "A-2（規制変化の「窓」）は2024年の建設業残業規制と主要競合のサービス終了が生む参入機会を捉え、D-1（データ資産の複利効果）は協力業者評価データが蓄積するほど価値が上がるフライホイール構造に対応する。",
    "patterns": ["A-2", "D-1"],
    "trendKeywords": ["建設業2024年問題", "協力業者DX", "職人評価DB"],
    "tags": ["下請け管理", "職人実績管理", "継続発注", "建設品質向上"],
},

]

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# バリデーション → 一括INSERT
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# 事前バリデーション（全件）
all_ok = True
for i, idea in enumerate(ideas):
    label = idea.get("serviceName", f"#{i}")
    if not validate(idea, label):
        all_ok = False

if not all_ok:
    print("\n[ABORT] バリデーションエラーあり。修正後に再実行してください。")
    sys.exit(1)

print(f"[VALIDATION OK] 全{len(ideas)}件通過。INSERTを開始します。\n")

# INSERT
conn = psycopg2.connect(DATABASE_URL)
try:
    cur = conn.cursor()
    for idea in ideas:
        cur.execute('SELECT COALESCE(MAX(number), 0) FROM "Idea"')
        number = cur.fetchone()[0] + 1
        prefix = idea.get("slug_prefix", re.sub(r'[^a-z0-9]+', '-', idea["serviceName"].lower()).strip('-'))
        slug = f"{prefix}-{number}" if prefix else f"idea-{number}"
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

print(f"\n[DONE] {len(ideas)}件のアイデアをINSERTしました。")
