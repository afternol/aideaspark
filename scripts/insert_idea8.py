"""アイデア#8: VisaBridge — 外国人労働者在留資格・就労管理SaaS"""
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
    "serviceName": "VisaBridge",
    "oneLiner": "外国人社員の在留資格期限・就労資格をAIで一元管理するHR SaaS",
    "concept": "外国人従業員の在留カード・就労資格・契約情報をクラウドで一元管理し、期限切れをAIが自動検知してアラート通知。行政書士連携で更新申請代行まで完結する中小企業向けHR SaaS。",
    "target": "外国人従業員5名以上を雇用する中小製造・建設・飲食・介護企業の総務・人事担当者",
    "problem": "在留資格の期限管理をExcelや紙台帳で行い、更新漏れによる不法就労リスクが高い。特定技能・育成就労の複数在留資格が混在し、担当者が管理しきれない状況が増えている。",
    "product": "在留カードの有効期限・就労制限のAI自動監視とアラート\n多言語対応の外国人向けオンボーディング書類管理\n行政書士マッチングによる在留資格更新申請代行\n育成就労・特定技能対応の書類テンプレート自動生成",
    "revenueModel": "月額SaaS 外国人従業員数課金（5名まで8,000円〜）\n行政書士紹介・申請代行手数料（1件3万円〜）",
    "competitors": "Visame, CAMCAT, ZEROone, Noborder, irohana",
    "competitiveEdge": "Visame等は在留カード管理が主体だが、VisaBridgeは育成就労制度（2027年施行）への対応テンプレートと行政書士マッチングを統合し、書類管理から申請代行まで一気通貫で提供する。",
    "category": "HR Tech",
    "targetIndustry": "人材・HR",
    "targetCustomer": "中小企業",
    "investmentScale": "50〜200万円",
    "difficulty": "中",
    "scores": {
        "novelty": 4,
        "marketSize": 4,
        "profitability": 4,
        "growth": 5,
        "feasibility": 3,
        "moat": 3,
    },
    "scoreComments": {
        "novelty": "在留資格管理＋育成就労対応＋書士マッチングの一体型は国内類似少ない",
        "marketSize": "外国人労働者は257万人超（2025年、過去最高）。受入企業数は増加の一途",
        "profitability": "月額SaaS＋申請代行手数料の二層収益でARPUが高く解約率が低い",
        "growth": "2027年4月の育成就労制度施行で企業の在留資格管理義務が大幅に強化される",
        "feasibility": "行政書士連携の構築と各在留資格の制度変化への追従に継続コストが必要",
        "moat": "企業ごとの外国人雇用履歴・書類データが蓄積し乗り換えコストが極めて高い",
    },
    "whyNow": "外国人労働者数が2025年時点で257万人を超え過去最高を更新しており、特定技能分野は2026年1月に19分野に拡大された。さらに2027年4月施行の育成就労制度により企業側の雇用管理・書類義務が複雑化し、専用SaaSへのニーズが急拡大している。",
    "noveltyNote": "VisameやCAMCATは在留カードの期限管理・書類保存を主機能とするが、育成就労制度への対応テンプレートと行政書士マッチングによる申請代行を一体化したSaaSは国内に確認できない。本サービスは「管理するだけでなく更新まで完結する」点で根本的に差別化する。",
    "strengthNote": "企業ごとの外国人雇用履歴・更新書類・行政書士とのやり取りデータが蓄積するほど乗り換えコストが高まり、粘着性の高い収益構造が成立する。行政書士ネットワークの拡大で代行品質が向上し、後発参入者が追いつけない信頼資産となる。",
    "patternRationale": "A-2（規制変化の「窓」）は育成就労制度施行・特定技能分野拡大という明確な参入機会を捉え、C-7（BtoBtoC）は企業（法人）を主顧客としながら外国人労働者（個人）のオンボーディングまで価値を届ける三者プラットフォーム構造に対応する。",
    "patterns": ["A-2", "C-7"],
    "trendKeywords": ["育成就労制度", "特定技能拡大", "外国人雇用DX"],
    "tags": ["在留資格管理", "不法就労防止", "行政書士連携", "多言語HR"],
}

PATTERN_RE = re.compile(r'^[A-J]-\d+$')
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

if errors:
    print("[VALIDATION ERROR]")
    for e in errors: print(f"  [NG] {e}")
    sys.exit(1)
print("[VALIDATION OK]")

conn = psycopg2.connect(DATABASE_URL)
try:
    cur = conn.cursor()
    cur.execute('SELECT COALESCE(MAX(number), 0) FROM "Idea"')
    number = cur.fetchone()[0] + 1
    slug = f"visabridge-{number}"
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
