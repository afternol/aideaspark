"""アイデア#66-#75: Batch7 (Claude Code直接生成・新ルール適用版)
ルール: SaaS表記禁止・serviceName多様化・whyNow 2025-2026年情報必須
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
    # #66
    {
        "serviceName": "更年期ナビ",
        "oneLiner": "更年期症状をAI問診で把握し婦人科受診を最適化するアプリ",
        "concept": "月経不順・ホットフラッシュ等の症状をAI問診で記録し、最寄りの更年期対応婦人科への受診タイミングと準備事項を通知。保険診療の範囲を事前解説する女性向け健康管理アプリ。",
        "target": "40〜55歳の更年期症状が出始めた女性。婦人科受診に躊躇を感じているが症状が悪化している",
        "problem": "更年期症状を「年齢のせい」と諦め受診が遅れるケースが多い。近くの対応婦人科が分からず、症状と受診タイミングの判断基準も存在しない。",
        "product": "AI症状チェック（月次問診・グラフ化）\n最寄り更年期対応婦人科マップ\nHRT・漢方適応度スコア表示\n受診前準備ガイド自動生成",
        "revenueModel": "月額プレミアム（480円/月・症状グラフ・詳細アドバイス）\n婦人科医院掲載・予約手数料（1件500円〜）\n製薬企業向け匿名統計データAPI（法人定額）",
        "competitors": "ルナルナ, OWL, ILACY, Ubie, CLINICS",
        "competitiveEdge": "既存の女性健康アプリは生理周期記録が主体だが、本サービスは更年期特有の症状トラッキングと婦人科マッチングを一体提供し、受診障壁の除去に特化する。",
        "tags": ["フェムテック", "更年期", "婦人科", "女性ヘルスケア"],
        "category": "デジタルヘルス",
        "targetIndustry": "医療・福祉",
        "targetCustomer": "一般消費者",
        "investmentScale": "50〜200万円",
        "difficulty": "中",
        "scores": {"novelty": 4, "marketSize": 4, "profitability": 3, "growth": 5, "feasibility": 4, "moat": 3},
        "scoreComments": {
            "novelty": "更年期症状→婦人科受診の一貫導線は国内に類似サービスがほぼ存在しない",
            "marketSize": "40〜55歳女性は国内で約1,800万人規模、更年期対象者は推計900万人超",
            "profitability": "月額480円は低単価だが医療機関・製薬の法人収益が補完する収益構造",
            "growth": "2025年以降の更年期認知向上と女性活躍推進法の後押しで市場が急拡大中",
            "feasibility": "医療行為なしのアプリ開発で規制リスク低い。婦人科との提携も拡張可能",
            "moat": "症状×受診データの蓄積が精度を高め、婦人科ネットワークがスイッチングコストになる",
        },
        "trendKeywords": ["更年期DX", "フェムテック", "婦人科受診促進"],
        "patterns": ["F-3", "H-5"],
        "whyNow": "2025年、ルナルナが男性更年期プログラムを追加したことで更年期ケアへの社会的関心が急拡大しており、女性更年期市場も再加熱している。地方在住女性や40代前半層への情報提供手段が薄いまま課題が放置されている。",
        "noveltyNote": "既存の女性健康アプリが生理管理に集中する中、更年期症状から婦人科マッチングへの一貫した導線は市場に存在しない。",
        "strengthNote": "症状データ蓄積による受診行動パターン解析が収益化の核で、製薬・医療機関向けデータ提供で後発との差別化が可能。",
        "patternRationale": "F-3（少子高齢化シルバー市場）により急増する更年期層の需要を捉える。H-5（行動データ×予測サービス）で症状トレンドを解析し受診転換を促す。",
        "slug": "konenki-navi",
        "number": 66,
    },
    # #67
    {
        "serviceName": "ケアレポ",
        "oneLiner": "在宅介護の記録と相談をケアマネとリアルタイム共有するアプリ",
        "concept": "家族介護者が食事・服薬・体調を音声でかんたん記録し、ケアマネとリアルタイム共有。異変時にケアマネへ自動アラートを送る在宅介護記録ツール。",
        "target": "在宅で親を介護する40〜60代の家族介護者。介護経験ゼロで記録・相談の手段がない",
        "problem": "家族介護者は体調変化のメモを手書きかチャットで管理し、ケアマネとの情報共有が煩雑。体調の変化がケアプランに反映されるまでタイムラグが生じる。",
        "product": "音声入力で即座に記録（食事・服薬・体調を30秒で完了）\nケアマネとのリアルタイム記録共有機能\n体調異変の自動アラート通知\n週次サマリー自動生成（ケアプラン見直し用）",
        "revenueModel": "ケアマネ事業者向け月額契約（1事業所1.5万円〜/月）\n被介護者家族は無料（ケアマネ経由で利用）\n自治体向けケアラー支援ツール一括導入（年間ライセンス）",
        "competitors": "カイポケ, カナミックネットワーク, ケアカルテ, LINE WORKS, Chatwork",
        "competitiveEdge": "既存の介護記録ツールは事業者内スタッフ間連携が主体だが、本サービスは家族介護者（ケアラー）とケアマネの記録共有に特化し、現場外の見えない介護をケアプランに反映させる。",
        "tags": ["介護テック", "ケアラー支援", "在宅介護", "ケアマネ連携"],
        "category": "介護テック",
        "targetIndustry": "医療・福祉",
        "targetCustomer": "一般消費者",
        "investmentScale": "50〜200万円",
        "difficulty": "中",
        "scores": {"novelty": 4, "marketSize": 5, "profitability": 3, "growth": 5, "feasibility": 4, "moat": 3},
        "scoreComments": {
            "novelty": "家族介護者向け記録共有に特化した製品は国内にほぼ存在せず新規性が高い",
            "marketSize": "要介護・要支援認定者は670万人超、家族ケアラーは推計700万人に上る規模",
            "profitability": "ケアマネ事業所の月額1.5万円は安定だが単価が低く規模拡大が収益の鍵",
            "growth": "2026年度の介護報酬改定・電子化強化が追い風。要介護者は今後20年増加継続",
            "feasibility": "医療行為なしでアプリ開発可能。ケアマネとのAPI連携仕様書が公開済み",
            "moat": "ケアマネと家族の双方がデータを蓄積するほど解約しにくい構造になる",
        },
        "trendKeywords": ["介護DX", "ケアラー支援", "ケアプランデジタル化"],
        "patterns": ["F-3", "E-7"],
        "whyNow": "2026年3月から介護報酬の電子化要件が強化される方針が示され、ケアマネと家族間のデジタル情報連携への需要が高まっている。2025年度には政府が介護人材確保総合対策として200億円を投じICT化支援が加速している。",
        "noveltyNote": "既存の介護管理ツールが事業所スタッフ向けである中、家族介護者とケアマネの記録共有に特化した製品は市場にほぼ存在しない。",
        "strengthNote": "ケアマネ法人課金で安定収益を確保しつつ家族無料でネットワーク効果が働く両面市場モデルが強みになる。",
        "patternRationale": "F-3（少子高齢化シルバー市場）で増加する在宅介護ニーズを捉える。E-7（両面市場非対称戦略）でケアマネ課金・家族無料の構造を実現する。",
        "slug": "carepo",
        "number": 67,
    },
    # #68
    {
        "serviceName": "アグリ継ぎ",
        "oneLiner": "高齢農家のノウハウをAIで記録し後継者マッチングするサービス",
        "concept": "引退間近の農家が持つ栽培ノウハウをAI動画解析で記録・構造化し、就農希望者や隣農家へのスキル継承とほ場引き継ぎをサポートする農業継承プラットフォーム。",
        "target": "引退を考える65歳以上の農家と、就農希望の30〜40代移住者・兼業農家希望者",
        "problem": "農業従事者の65歳以上が71.7%を占め、ノウハウが後継者不在で消えていく。農地と技術の継承マッチングは農協頼みで選択肢が乏しい。",
        "product": "農家ノウハウ動画記録・AI構造化（栽培暦・コツを自動整理）\n就農希望者向けほ場・スキル継承マッチング\n農業承継計画書自動生成（補助金申請書式対応）\n農地管理者（農地バンク連携）へのAPIデータ提供",
        "revenueModel": "就農マッチング成功報酬（1件15万円〜）\n農業法人・自治体向け年間ライセンス（50万円〜/年）\n補助金申請書作成支援（1件3万円〜）",
        "competitors": "農業総合研究所, SMOUT, 農業人材機構, ファームコネクト, 全国農業会議所",
        "competitiveEdge": "既存の農業マッチングサービスは求人・農地紹介が主体だが、本サービスは高齢農家のノウハウをAIで記録・継承する点が独自で、農業知識の損失という根本課題を解決する。",
        "tags": ["アグリテック", "農業承継", "スマート農業", "地方創生"],
        "category": "アグリテック",
        "targetIndustry": "農業・一次産業",
        "targetCustomer": "農家・生産者",
        "investmentScale": "200〜500万円",
        "difficulty": "中",
        "scores": {"novelty": 5, "marketSize": 3, "profitability": 3, "growth": 4, "feasibility": 3, "moat": 5},
        "scoreComments": {
            "novelty": "農業知識のAI記録・継承特化は市場にほぼ存在せず独自性が高い",
            "marketSize": "農業従事者111万人だが事業対象は後継者難農家に限定され市場は中規模",
            "profitability": "マッチング成功報酬は高単価だが取引頻度が低く収益安定に時間がかかる",
            "growth": "2026年地域計画義務化で農地集約が加速し、承継ニーズが制度的に高まる",
            "feasibility": "農家ノウハウ記録は動画技術で実装可能だが農地バンクとの行政連携が難所",
            "moat": "地域別ノウハウデータと農地情報の蓄積が後発参入者が追いつけない資産になる",
        },
        "trendKeywords": ["農業承継", "スマート農業", "地域計画2026"],
        "patterns": ["F-6", "A-7"],
        "whyNow": "2026年3月に全国すべての農業委員会が地域計画策定を義務化し、担い手農家の特定と農地集約が制度的に加速する。2024年度の農業従事者111万人・65歳以上71.7%という統計が示す通り、知識の喪失は不可逆的に進行している。",
        "noveltyNote": "既存の農業マッチングが求人・農地仲介に留まる中、AI動画でノウハウを記録・継承する製品は市場にほぼ存在しない。",
        "strengthNote": "ノウハウ動画データの蓄積が他社に模倣できない地域農業知識ベースとなり、農地バンクや自治体連携が参入障壁を高める。",
        "patternRationale": "F-6（フードテック農業DX）で農業承継という社会課題を起点にする。A-7（ペルソナ×シチュエーション交差）で引退農家と就農希望者を結ぶ。",
        "slug": "agritsugi",
        "number": 68,
    },
    # #69
    {
        "serviceName": "まちDX窓口",
        "oneLiner": "小規模自治体向けAI窓口チャットを低コストで即導入するサービス",
        "concept": "自治体DX20業務標準化完了後の次フェーズとして、住民向けAI窓口チャットと申請書自動生成を月額低コストで提供。LGWAN対応で安全に導入できる行政DXツール。",
        "target": "人口1〜5万人規模の過疎・地方自治体のDX推進担当者・総務課職員",
        "problem": "自治体DX20業務の標準化期限後、住民向けAI窓口の導入ニーズは高いが、既存製品は大規模自治体向けで小規模自治体の予算に合わない。",
        "product": "住民向けAI窓口チャット（よくある質問・申請案内）\n申請書類自動作成支援（入力内容から書式へ変換）\nLGWAN環境対応のオンプレ・閉域クラウド構成\n他自治体のQ&A知識ベース共有機能",
        "revenueModel": "自治体向け月額ライセンス（1自治体10万円〜/月・人口規模別）\n初期設定・知識ベース構築支援（50万円〜）\n補助金活用支援コンサルティング（月額5万円〜）",
        "competitors": "Graffer, LoGoフォーム, Liny, 日立製作所, 富士通（自治体システム）",
        "competitiveEdge": "既存の自治体DXツールは電子申請の受け付けが主体だが、本サービスは小規模自治体が対応できる低コスト・低工数でのAI窓口特化型で、大手ベンダーが手を出せない過疎自治体市場を狙う。",
        "tags": ["GovTech", "自治体DX", "AI窓口", "過疎自治体"],
        "category": "GovTech",
        "targetIndustry": "行政・自治体",
        "targetCustomer": "自治体・行政",
        "investmentScale": "200〜500万円",
        "difficulty": "高",
        "scores": {"novelty": 4, "marketSize": 3, "profitability": 3, "growth": 5, "feasibility": 3, "moat": 4},
        "scoreComments": {
            "novelty": "過疎自治体向けAI窓口特化は国内競合がほぼなく明確な差別化ポジションがある",
            "marketSize": "全国1,700自治体のうち人口5万人未満が約1,200。市場は中規模だが競合が薄い",
            "profitability": "月額10万円×長期契約で安定するが自治体予算サイクルに依存する面がある",
            "growth": "2026年3月の標準化完了後にAI窓口への移行需要が一斉に顕在化する見込み",
            "feasibility": "LGWAN対応が技術的難所。自治体調達プロセスの理解と補助金ノウハウが必須",
            "moat": "自治体システムは一度導入すると切り替えコストが高く長期契約が前提になる",
        },
        "trendKeywords": ["自治体DX", "AI窓口", "過疎自治体デジタル化"],
        "patterns": ["F-1", "F-4"],
        "whyNow": "2025年3月に総務省が自治体DX推進計画第4.0版を公表し、2026年3月の20業務標準化完了後の次フェーズへの移行が全国で議論されている。AI窓口導入ニーズは高まる一方、過疎自治体向けの低コスト製品は現時点でほぼ存在しない。",
        "noveltyNote": "既存の行政DXツールが大規模自治体向けに集中する中、人口5万人未満の小規模自治体向けAI窓口製品は空白に近い。",
        "strengthNote": "Q&A知識ベースの自治体間共有が精度向上のフライホイールを生み、口コミ導入が低コスト獲得チャネルになる。",
        "patternRationale": "F-1（規制変化先取りRegTech）で自治体DX義務化の波を先取りする。F-4（地方創生デジタル行政）で過疎自治体という未開拓市場に特化する。",
        "slug": "machi-dx-madoguchi",
        "number": 69,
    },
    # #70
    {
        "serviceName": "ほうむAI",
        "oneLiner": "社内法務不在の中小企業が契約書リスクを即判断できるAIサービス",
        "concept": "弁護士監修のナレッジベースをもとにAIが契約書リスク診断と法的対応の方針を提示。社内法務不在の中小企業が弁護士への相談前の初動判断を低コストで行える。",
        "target": "社内法務部門を持たない従業員10〜100名規模の中小企業の経営者・総務担当者",
        "problem": "中小企業は契約書のリスク判断を経営者や総務が感覚で行っている。弁護士への都度相談は費用が高く、電子契約ツールを導入しても使いこなせていない。",
        "product": "AI契約書リスクスキャン（赤・黄・緑の3段階評価）\n法的対応方針の初動アドバイス自動生成\n弁護士へのエスカレーション機能（提携弁護士紹介）\n契約書テンプレートライブラリ（業種別100種）",
        "revenueModel": "中小企業向け月額プラン（1.5万円/月・AI利用無制限）\n弁護士紹介マッチング手数料（1件2万円〜）\n業種特化テンプレートパック販売（1万円〜/セット）",
        "competitors": "CloudSign, LegalOn Technologies, LegalForce, LAWGUE, 弁護士ドットコム",
        "competitiveEdge": "既存のAI契約書ツールは大企業・法務部門向けの精緻な審査が主体だが、本サービスは社内法務不在の中小企業が今すぐ判断するための初動サポートに特化し、価格帯と操作性を圧倒的に下げる。",
        "tags": ["リーガルテック", "中小企業法務", "AI契約書", "弁護士連携"],
        "category": "リーガルテック",
        "targetIndustry": "法務・士業",
        "targetCustomer": "中小企業",
        "investmentScale": "50〜200万円",
        "difficulty": "中",
        "scores": {"novelty": 4, "marketSize": 4, "profitability": 4, "growth": 5, "feasibility": 3, "moat": 3},
        "scoreComments": {
            "novelty": "中小企業の初動法的判断に特化した価格帯・UIは国内市場にほぼ存在しない",
            "marketSize": "社内法務不在の中小企業は国内で350万社超、潜在ターゲットは広大",
            "profitability": "月額1.5万円×長期契約で安定収益。弁護士紹介は高単価で収益を補完する",
            "growth": "電帳法義務化の追い風が2025年以降も継続し、法的リスク感度が急上昇中",
            "feasibility": "弁護士法との境界管理（非弁護士行為の回避）が最大の規制リスクになる",
            "moat": "業種別契約書データの蓄積には時間がかかるが蓄積後の模倣は困難",
        },
        "trendKeywords": ["AI法務", "中小企業リーガル", "契約書DX"],
        "patterns": ["B-2", "F-1"],
        "whyNow": "電子帳簿保存法の完全義務化以降、2025年も中小企業の契約書デジタル管理への意識が高まり続け、法的リスクへの感度が急上昇している。2023年の法務省ガイドラインでAI契約書審査の法的地位が明確化され、参入障壁が下がった。",
        "noveltyNote": "既存のAI法務ツールが大企業・法務部向けである中、中小企業の初動法的判断に特化した低価格製品は市場の空白に近い。",
        "strengthNote": "業種別契約書データの蓄積が診断精度を高め、弁護士紹介ネットワークが粘着性を生み解約率を抑制する。",
        "patternRationale": "B-2（AIによるエキスパート代替）で弁護士業務の初動判断をAI化する。F-1（規制変化先取り）で電帳法対応の需要増を取り込む。",
        "slug": "houmuai",
        "number": 70,
    },
    # #71
    {
        "serviceName": "クリエタス",
        "oneLiner": "プラットフォーム依存しない個人クリエイター向け独自収益化ツール",
        "concept": "自分のドメインでファンサイトを即時構築し、月額会員・コンテンツ販売を一元管理。プラットフォーム規制に左右されない独立した収益基盤を持てるクリエイター向けツール。",
        "target": "大手プラットフォームに依存するフォロワー1,000〜10,000人の個人クリエイター（イラスト・動画・音楽）",
        "problem": "大手プラットフォームの規制強化が相次ぎ収益を突然失うリスクが顕在化した。独自サイトへの移行ノウハウとコストが障壁で対応できないクリエイターが多い。",
        "product": "ドメイン接続型ファンサイト即時構築（テンプレ20種）\n月額会員管理・コンテンツ配信機能\nデジタルグッズ・限定コンテンツ販売機能\n既存プラットフォームからの移行インポートツール",
        "revenueModel": "クリエイター向け月額基本料（1,980円/月）\n販売手数料（売上の3%・主要プラットフォームの10〜20%より大幅低い）\n事務所向け所属クリエイター一括管理プラン（5万円〜/月）",
        "competitors": "pixiv FANBOX, note, Patreon, Gumroad, BASE",
        "competitiveEdge": "既存のコンテンツ販売プラットフォームは規約変更リスクを負うプラットフォーム依存型だが、本サービスはクリエイター自身のドメイン上での運営が前提で、規制リスクをゼロにする点が根本的に異なる。",
        "tags": ["クリエイターエコノミー", "D2Cコンテンツ", "プラットフォームリスク", "ファンビジネス"],
        "category": "クリエイターエコノミー",
        "targetIndustry": "メディア・出版",
        "targetCustomer": "クリエイター・配信者",
        "investmentScale": "50〜200万円",
        "difficulty": "中",
        "scores": {"novelty": 5, "marketSize": 3, "profitability": 4, "growth": 5, "feasibility": 4, "moat": 3},
        "scoreComments": {
            "novelty": "独自ドメイン運営特化・手数料3%のクリエイター向けツールは国内に類似なし",
            "marketSize": "プロクリエイターは国内数十万人規模だが有料化意欲が高い層は限定的",
            "profitability": "月額基本料＋手数料の二重収益でクリエイターが増えるほど自動拡大する",
            "growth": "2026年プラットフォーム規制強化が移行需要を直接喚起し急成長の契機になる",
            "feasibility": "決済基盤はStripe等で即座に実装可能。成人向けコンテンツ対応は別途設計が必要",
            "moat": "ファンデータの自社保有が粘着性を生むが技術的模倣は容易で参入障壁は中程度",
        },
        "trendKeywords": ["クリエイターエコノミー", "プラットフォームリスク", "D2Cコンテンツ"],
        "patterns": ["D-1", "C-1"],
        "whyNow": "2026年5月25日にFantiaが過去作品に遡及適用するモザイク規制強化を施行し、pixiv FANBOXも同時期に規制強化を実施、プラットフォーム依存リスクが一気に顕在化した。クリエイター全体で独自収益基盤の必要性への意識が急上昇している。",
        "noveltyNote": "収益化ツールがすべてプラットフォーム依存型の中、独自ドメイン運営特化の低手数料ツールは国内にほぼ存在しない。",
        "strengthNote": "ファンデータをクリエイター側が保有する設計が粘着性を生み、業界最低水準の手数料3%が乗り換えを防ぐ競争優位になる。",
        "patternRationale": "D-1（中間業者排除D2C）でプラットフォームを介さないクリエイター直販を実現する。C-1（サブスクリプション転換）で安定した月額収益モデルを確立する。",
        "slug": "crietars",
        "number": 71,
    },
    # #72
    {
        "serviceName": "現場つなぎ",
        "oneLiner": "専門工事業の日報・配置・工程管理をスマホで完結する施工管理ツール",
        "concept": "電気・管・塗装等の専門工事業者向けに、日報・作業員配置・工程管理をスマホで完結させるシンプルな施工管理ツール。大型ゼネコン向け製品の過剰機能を削ぎ落とした設計。",
        "target": "従業員5〜50名規模の専門工事会社（電気・管工事・塗装）の現場監督・工事部長",
        "problem": "大型施工管理ツールは専門工事業には機能過剰でコストが合わない。紙とチャットで現場管理を続けており、2024年4月の時間外規制適用後も改善が進まない。",
        "product": "スマホ音声入力の日報作成（30秒で完了）\n作業員配置表・シフト管理\n写真付き工程チェックリスト自動生成\n元請けゼネコンへの報告書PDF出力",
        "revenueModel": "月額固定制（現場5現場まで1万円/月・現場数課金）\n初期設定支援（5万円〜）\nゼネコン一括導入プラン（元請けが協力会社分をまとめて契約）",
        "competitors": "ANDPAD, スパイダープラス, Photoruction, バルデス, コムテックス",
        "competitiveEdge": "既存の施工管理ツールは総合ゼネコン向けの全機能搭載型が主体で、専門工事業の実務フローに最適化された低価格製品は手薄になっている。本サービスは日報・配置・報告の3機能に絞り即日利用を実現する。",
        "tags": ["建設テック", "専門工事DX", "施工管理", "現場DX"],
        "category": "建設テック",
        "targetIndustry": "建設・土木",
        "targetCustomer": "中小企業",
        "investmentScale": "〜50万円",
        "difficulty": "低",
        "scores": {"novelty": 3, "marketSize": 4, "profitability": 4, "growth": 4, "feasibility": 4, "moat": 3},
        "scoreComments": {
            "novelty": "専門工事業特化は差別化明確だが技術的新規性は高くなく模倣は容易な水準",
            "marketSize": "国内の電気・管・塗装等の専門工事業者は数万社規模で潜在市場は大きい",
            "profitability": "月額1万円・現場数課金は解約率が低くLTVが長い安定収益モデルになる",
            "growth": "時間外規制適用とi-Construction推進が中小専門工事業のDX化を加速する",
            "feasibility": "スマホアプリ開発で規制リスクが低く、既存施工管理ノウハウを転用可能",
            "moat": "現場データの蓄積が解約を防ぐが技術的模倣は容易で差別化の持続に工夫が必要",
        },
        "trendKeywords": ["建設2024年問題", "専門工事DX", "施工管理アプリ"],
        "patterns": ["A-3", "C-1"],
        "whyNow": "2024年4月に建設業にも時間外規制が完全適用され、2025年においても専門工事業の工程可視化・記録の必要性が高まり続けている。国交省のi-Construction 2.0で2040年生産性1.5倍を目標に掲げ、中小専門工事業支援が2025年以降具体化しつつある。",
        "noveltyNote": "ゼネコン向け全機能型が主流の中、専門工事業に絞り込んだ低価格・即日導入型の施工管理ツールは市場にほぼ存在しない。",
        "strengthNote": "元請けによるバンドル一括導入モデルが拡大速度を高め、現場ごとのデータ蓄積が強い粘着性と解約阻止になる。",
        "patternRationale": "A-3（アンダーサーブド探索）で大型製品の手が届かない専門工事業を狙う。C-1（サブスクリプション転換）で現場数課金の単純明快な収益モデルにする。",
        "slug": "genba-tsunagi",
        "number": 72,
    },
    # #73
    {
        "serviceName": "たべロスバンク",
        "oneLiner": "食品メーカー・卸の余剰在庫を中小飲食店へ即日マッチングするサービス",
        "concept": "食品メーカー・卸の余剰在庫を自動検出し中小飲食店へ最短当日マッチング。食品廃棄を削減しながら飲食店の食材コスト削減を同時に実現するBtoB余剰食材流通プラットフォーム。",
        "target": "月に1〜3トンの余剰在庫が発生する食品メーカー・食品卸の物流・営業担当者",
        "problem": "食品メーカー・卸の余剰在庫処理は電話・メールの個別交渉が主流。事業系食品ロスのBtoB段階での削減を支援するデジタルツールが欠如している。",
        "product": "余剰在庫自動検出・一括登録（在庫管理システム連携）\nAIによる最適購入先飲食店マッチング\n最短当日〜翌日配送の物流手配代行\n廃棄削減量のCO2換算・ESG報告書自動生成",
        "revenueModel": "取引成立手数料（取引額の8〜12%）\n食品メーカー向け月額掲載料（5万円〜/月）\nESGレポート生成オプション（1万円/月）",
        "competitors": "TABETE, Kuradashi, tabeloop, コークッキング, タベスケ",
        "competitiveEdge": "既存の食品ロス削減サービスが消費者向けの余剰食品販売に集中している中、食品メーカーと中小飲食店を繋ぐBtoBの余剰在庫流通に特化した点が異なる。ESGレポート自動生成で食品メーカーのCSR課題も同時に解決する。",
        "tags": ["フードロス", "フードテック", "BtoB流通", "ESG"],
        "category": "フードロス",
        "targetIndustry": "飲食・食品",
        "targetCustomer": "中小企業",
        "investmentScale": "200〜500万円",
        "difficulty": "中",
        "scores": {"novelty": 5, "marketSize": 4, "profitability": 3, "growth": 5, "feasibility": 3, "moat": 4},
        "scoreComments": {
            "novelty": "BtoB余剰食材マッチング特化は国内で類似サービスがほぼ存在せず独自性が高い",
            "marketSize": "事業系食品ロス231万トン・食品メーカー・卸は国内に数万社規模で対象は大きい",
            "profitability": "手数料率8〜12%だが食材単価が低く取引額が積み上がるまで時間がかかる",
            "growth": "2025年閣議決定と2030年削減目標が企業の取り組み義務感を高め追い風になる",
            "feasibility": "在庫管理システム連携と物流手配代行がオペレーション上の難所になる",
            "moat": "双方向ネットワーク効果が後発参入を難しくするが初期のニワトリ卵問題がある",
        },
        "trendKeywords": ["フードロスBtoB", "余剰食材流通", "食品ロス2030"],
        "patterns": ["C-3", "F-2"],
        "whyNow": "2025年3月に政府が食品ロス削減方針を改定・閣議決定し、2030年事業系60%削減目標が明文化され企業の対応義務感が高まっている。令和5年度の事業系食品ロス231万トンという統計が公表され、BtoB段階での削減ソリューション需要が顕在化している。",
        "noveltyNote": "BtoC向けフードロス削減が主流の中、食品メーカーと飲食店を繋ぐBtoB余剰在庫マッチング特化型は市場に存在しない。",
        "strengthNote": "取引データ蓄積によるAIマッチング精度向上と双方向ネットワーク効果が後発参入者を締め出す競争優位になる。",
        "patternRationale": "C-3（マーケットプレイス仲介）でBtoB食材流通の中間をデジタル化する。F-2（サステナビリティビジネス化）でESGレポートを付加価値にする。",
        "slug": "taberosbank",
        "number": 73,
    },
    # #74
    {
        "serviceName": "こころチェック",
        "oneLiner": "従業員50人未満の中小企業が低コストで義務化対応できるメンタル管理ツール",
        "concept": "2028年義務化に向けてストレスチェック・記録・産業医連携をワンストップで提供。従業員50人未満の事業所が低コストで法律準拠できるシンプルなメンタル健康管理ツール。",
        "target": "従業員5〜49名の中小企業の経営者・総務担当者。2028年義務化への対応方法がわからない",
        "problem": "2025年5月の義務化決定により対応が急務だが、中小企業向けの低価格ストレスチェックツールは少なく、予算・運用体制が整わない企業が大多数。",
        "product": "従業員向けオンラインストレスチェック（57項目・厚労省準拠）\n結果集計・高ストレス者フラグ自動生成\n産業医マッチング・面談予約機能\n実施記録の自動保存・行政報告書出力",
        "revenueModel": "事業所向け月額固定制（従業員10人で2,980円/月〜）\n産業医マッチング紹介料（1契約3万円〜）\n義務化対応コンサルティング（1社5万円〜/初期）",
        "competitors": "メンタルヘルステクノロジーズ, cotree, MICIN, ストレスチェッカー, SmartHR",
        "competitiveEdge": "既存のメンタルヘルステックは大企業・産業医常駐組織向けの高機能製品が主体だが、本サービスは義務化対応のみに絞り込み、月数千円で中小企業が即導入できるシンプルさを最優先する。",
        "tags": ["メンタルヘルス", "ストレスチェック義務化", "中小企業EAP", "産業医"],
        "category": "メンタルヘルス",
        "targetIndustry": "全業界",
        "targetCustomer": "中小企業",
        "investmentScale": "〜50万円",
        "difficulty": "低",
        "scores": {"novelty": 3, "marketSize": 5, "profitability": 4, "growth": 5, "feasibility": 4, "moat": 3},
        "scoreComments": {
            "novelty": "義務化対応に絞り込んだシンプル設計は差別化明確だが技術的新規性は低め",
            "marketSize": "義務化対象は約170万事業所・従業員総数は数千万人規模の最大市場",
            "profitability": "月額2,980円は低単価だが170万事業所の一部でも大きな収益規模になる",
            "growth": "2028年4月施行確定で市場ニーズが不可逆的に拡大することが法律で保証されている",
            "feasibility": "ストレスチェック実装は技術的に容易だが産業医ネットワーク構築が最初の難関",
            "moat": "先行者優位はあるが義務化後は大手参入が急増するため差別化維持が課題になる",
        },
        "trendKeywords": ["ストレスチェック義務化", "メンタルヘルス2028", "中小企業EAP"],
        "patterns": ["F-1", "C-2"],
        "whyNow": "2025年5月8日に改正労働安全衛生法が可決・成立し、2028年4月1日から従業員50人未満の約170万事業所にストレスチェックが義務化されることが確定した。対応ツールへの需要が確実に顕在化する3年前の現在が最大の参入タイミングとなっている。",
        "noveltyNote": "大企業向け高機能型が主流の中、中小向け義務化対応のみ特化した月数千円のシンプル設計は市場の明確な空白になっている。",
        "strengthNote": "義務化前に顧客基盤を構築する先行者優位が2028年施行時の一斉流入を取り込む最大の競争優位になる。",
        "patternRationale": "F-1（規制変化先取り）で義務化3年前の早期参入を実現する。C-2（フリーミアム→プレミアム）で無料体験から有料産業医連携へ転換を図る。",
        "slug": "kokoro-check",
        "number": 74,
    },
    # #75
    {
        "serviceName": "VPPコネクト",
        "oneLiner": "中小事業者の蓄電池をVPPに束ね需給調整市場の収益を自動還元するサービス",
        "concept": "家庭・中小事業者の蓄電池をVPPに組み込み、需給調整市場の収益を所有者に自動還元。2026年度解禁の低圧リソース市場参加を専門知識なしで利用できるアグリゲーターサービス。",
        "target": "蓄電池を導入した家庭・中小オフィスオーナーで、活用方法がわからずにいる人",
        "problem": "蓄電池導入者のほとんどがVPP参加の方法を知らず売電機会を逃している。アグリゲーター経由の手続きは複雑で個人・中小事業者が自力で対応することが困難。",
        "product": "蓄電池IoT接続・遠隔制御エージェント（メーカー横断対応）\nVPP参加申請・需給調整市場登録代行\n収益自動分配（月次振込）\n電力需要予測ダッシュボード（最適充放電スケジュール）",
        "revenueModel": "収益レベニューシェア（蓄電池オーナーの収益の20%受取）\n蓄電池メーカー・販売店向け導線提供（1件5,000円〜）\n法人向け複数拠点一括管理ライセンス（5万円〜/月）",
        "competitors": "エナリス, 自然電力, 大和エネルギー, 四国電力トレーディング, ニチコン",
        "competitiveEdge": "既存のアグリゲーターは大型工場・商業施設など高圧以上のリソースを対象としているが、本サービスは2026年度解禁の低圧リソース（家庭・中小）に特化し、専門知識なしで参加できる唯一の窓口を目指す。",
        "tags": ["エネルギーテック", "VPP", "蓄電池活用", "再生可能エネルギー"],
        "category": "エネルギーテック",
        "targetIndustry": "エネルギー・電力",
        "targetCustomer": "一般消費者",
        "investmentScale": "500万円〜",
        "difficulty": "高",
        "scores": {"novelty": 5, "marketSize": 4, "profitability": 3, "growth": 5, "feasibility": 3, "moat": 4},
        "scoreComments": {
            "novelty": "低圧リソース特化VPP参加代行は2026年解禁直後の市場で競合がほぼ存在しない",
            "marketSize": "家庭用蓄電池の2026〜2030年普及台数は累計300万台超で潜在市場は大きい",
            "profitability": "1台あたり収益は小さくスケールするまで利益化が課題だが台数拡大で急増する",
            "growth": "第7次エネルギー基本計画と蓄電池普及加速で市場が不可逆的に拡大している",
            "feasibility": "メーカー横断のIoT接続と電力市場登録実務が最大の難関で独自ノウハウが必須",
            "moat": "接続台数データとネットワーク効果の蓄積が後発参入者が追いつけない競争優位になる",
        },
        "trendKeywords": ["VPP", "アグリゲーター", "蓄電池活用2026"],
        "patterns": ["F-1", "C-8"],
        "whyNow": "2025年2月閣議決定の第7次エネルギー基本計画で、2026年度から低圧リソースの需給調整市場参加が解禁されることが決定した。家庭用蓄電池が年40万台ペースで普及を続け、VPP活用できるリソースが急速に積み上がっている。",
        "noveltyNote": "大型高圧設備向けのアグリゲーターが主流の中、2026年解禁の低圧リソース特化型VPP参加代行は市場にほぼ存在しない。",
        "strengthNote": "初期費用ゼロのレベニューシェア型で参加を促進し、接続台数増のネットワーク効果が後発を締め出す競争優位を生む。",
        "patternRationale": "F-1（規制変化先取り）で2026年度解禁の低圧リソース市場を先占する。C-8（レベニューシェア）で初期費用ゼロの参加しやすいモデルを実現する。",
        "slug": "vpp-connect",
        "number": 75,
    },
]

# ── バリデーション ──────────────────────────────────────────────
print("=== バリデーション ===")
all_ok = True
for idea in ideas:
    errs = validate(idea)
    name = idea.get("serviceName", "?")
    num = idea.get("number", "?")
    if errs:
        print(f"  NG #{num} {name}: {errs}")
        all_ok = False
    else:
        print(f"  OK #{num} {name}")

if not all_ok:
    sys.exit("バリデーションエラーあり。修正してから再実行してください。")

print("\n=== DB INSERT ===")
conn = psycopg2.connect(DATABASE_URL)
conn.autocommit = False
cur = conn.cursor()
ok_count = 0

try:
    for idea in ideas:
        num = idea["number"]
        idea_id = f"idea-{str(num).zfill(3)}"
        slug = idea["slug"]

        cur.execute("""
            INSERT INTO "Idea" (
                id, slug, number, "serviceName", concept, target, problem, product,
                "revenueModel", competitors, "competitiveEdge",
                tags, category, "targetIndustry", "targetCustomer",
                "investmentScale", difficulty, scores, "scoreComments",
                "trendKeywords", patterns, "publishedAt", views, bookmarks,
                "whyNow", "noveltyNote", "strengthNote", "patternRationale",
                "oneLiner", "updatedAt"
            ) VALUES (
                %s,%s,%s,%s,%s,%s,%s,%s,
                %s,%s,%s,
                %s,%s,%s,%s,
                %s,%s,%s,%s,
                %s,%s,%s,%s,%s,
                %s,%s,%s,%s,
                %s,%s
            )
        """, (
            idea_id, slug, num,
            idea["serviceName"],
            idea.get("concept", ""),
            idea.get("target", ""),
            idea.get("problem", ""),
            idea.get("product", ""),
            idea.get("revenueModel", ""),
            idea.get("competitors", ""),
            idea.get("competitiveEdge", ""),
            json.dumps(idea.get("tags", []), ensure_ascii=False),
            idea.get("category", ""),
            idea.get("targetIndustry", ""),
            idea.get("targetCustomer", ""),
            idea.get("investmentScale", ""),
            idea.get("difficulty", ""),
            json.dumps(idea.get("scores", {}), ensure_ascii=False),
            json.dumps(idea.get("scoreComments", {}), ensure_ascii=False),
            json.dumps(idea.get("trendKeywords", []), ensure_ascii=False),
            json.dumps(idea.get("patterns", []), ensure_ascii=False),
            date.today().isoformat(),
            0, 0,
            idea.get("whyNow", ""),
            idea.get("noveltyNote", ""),
            idea.get("strengthNote", ""),
            idea.get("patternRationale", ""),
            idea.get("oneLiner", ""),
            date.today().isoformat(),
        ))
        print(f"  INSERT #{num} {idea['serviceName']} (slug: {slug})")
        ok_count += 1

    conn.commit()
    print(f"\n完了: {ok_count}/{len(ideas)}件 INSERT成功")

except Exception as e:
    conn.rollback()
    print(f"ERROR: {e}")
    raise
finally:
    cur.close()
    conn.close()
