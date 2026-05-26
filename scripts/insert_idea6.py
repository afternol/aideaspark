"""アイデア#6: ナイトアイ — 介護施設夜間見守りAI SaaS"""
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

idea = {
    "serviceName": "ナイトアイ",
    "oneLiner": "介護施設の夜間転倒・異変をAIが即検知しスタッフへ通報するSaaS",
    "concept": "天井カメラとエッジAIが24時間姿勢・呼吸・離床を監視し異変を即スタッフへ通知。夜間巡回を削減しながら検知ログを介護記録に自動連携する施設向けSaaS。",
    "target": "夜間1〜3名体制で20床以上を担当する特養・有料老人ホームの施設長・介護部門責任者",
    "problem": "夜間は少人数スタッフが多数の入居者を担当し、転倒・体調急変の発見が定時巡回のタイミングに依存する。即時対応が構造的に困難で重症化リスクが高い。",
    "product": "AIカメラによる転倒・離床・呼吸異常の即時検知\nスタッフスマホへのリアルタイム通知と現場確認ログ\n夜間異変ログの介護記録への自動反映\n月次リスクレポート（高リスク入居者の特定）",
    "revenueModel": "月額SaaS 施設規模課金（30床まで4.8万円〜）\n初期カメラ設置工事費（10万円〜/区画）",
    "competitors": "KaigoDX, パナソニック コネクト, i-PRO, ケアコム, Neos+Care",
    "competitiveEdge": "KaigoDX等は機器・カメラ提供が主体だが、本サービスは介護記録への自動連携と入居者ごとのリスクスコアリングをSaaSで一体提供し差別化する。",
    "category": "介護テック",
    "targetIndustry": "介護・保育",
    "targetCustomer": "中小企業",
    "investmentScale": "200〜500万円",
    "difficulty": "中",
    "scores": {
        "novelty": 4,
        "marketSize": 4,
        "profitability": 3,
        "growth": 5,
        "feasibility": 3,
        "moat": 4,
    },
    "scoreComments": {
        "novelty": "AI検知＋介護記録自動連携の一体型SaaSは国内に類似サービスが少ない",
        "marketSize": "全国約8万施設超が対象。夜間見守りニーズは全介護施設に共通する",
        "profitability": "月額SaaSで解約率が低いが、初期カメラ工事費の回収期間が課題となる",
        "growth": "2024年介護報酬改定で生産性向上推進体制加算が新設。ICT導入が加速",
        "feasibility": "カメラ設置工事と施設側の信頼構築・導入折衝に数ヶ月単位を要する",
        "moat": "施設ごとの異変パターン蓄積でAI精度が向上し乗り換えコストが高まる",
    },
    "whyNow": "2024年度介護報酬改定で「生産性向上推進体制加算」が新設され、見守り機器導入による夜間人員配置基準の緩和と月最大100単位の加算が実現した。介護職員不足は2030年代にかけて構造的に続くとされており、夜間省人化ニーズは今後不可逆的に高まる。",
    "noveltyNote": "KaigoDXやパナソニック コネクトはカメラ・センサー機器の提供が主体で、介護記録との自動連携や入居者ごとのリスクスコアリング機能は持たない。本サービスはハードではなくデータ活用SaaSとして位置づけ、導入後のデータ資産形成で競合との根本的な差別化を図る。",
    "strengthNote": "月額SaaSと初期工事費の二層収益でLTVが高く、施設ごとの入居者データが蓄積するほどAI検知精度が向上する。競合が同品質のデータを持つには数年単位の時間を要し、早期参入によるデータ優位が持続的な参入障壁となる。",
    "patternRationale": "A-3（人口動態の必然）は高齢化・介護人材不足という不可逆的需要を捉え、F-6（センサー・IoT×未計測領域）は夜間の非デジタル見守り業務をデジタル化する本質的技術軸に対応する。",
    "patterns": ["A-3", "F-6"],
    "trendKeywords": ["夜間見守りAI", "生産性向上推進体制加算", "介護DX"],
    "tags": ["転倒検知", "夜間巡回削減", "エッジAI", "介護記録連携"],
}

# ── バリデーション ──────────────────────────────────────────────────────
PATTERN_RE = re.compile(r'^[A-J]-\d+$')
errors = []
ol = idea.get("oneLiner", "")
if not (20 <= len(ol) <= 40): errors.append(f"oneLiner: {len(ol)}字")
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

if errors:
    print("[VALIDATION ERROR]")
    for e in errors: print(f"  [NG] {e}")
    sys.exit(1)
print("[VALIDATION OK]")

# ── INSERT ────────────────────────────────────────────────────────────────
conn = psycopg2.connect(DATABASE_URL)
try:
    cur = conn.cursor()
    cur.execute('SELECT COALESCE(MAX(number), 0) FROM "Idea"')
    number = cur.fetchone()[0] + 1
    name_slug = re.sub(r'[^a-z0-9]+', '-', idea["serviceName"].lower()).strip('-')
    slug = f"{name_slug}-{number}" if name_slug else f"idea-{number}"
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
