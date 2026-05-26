"""アイデア#7: FieldSync — 中小建設業向け施工管理・勤怠一体SaaS"""
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
    "serviceName": "FieldSync",
    "oneLiner": "現場写真1枚でAIが工事日報・勤怠・残業を自動生成する建設業SaaS",
    "concept": "スマホで現場写真を撮るだけでAIが工事日報・勤怠記録・残業時間を自動生成。2024年の建設業残業上限規制に対応しながら、5名規模の中小建設業でも翌日から使える月額SaaS。",
    "target": "従業員5〜30名規模の中小建設・リフォーム会社の経営者・現場監督",
    "problem": "中小建設業は日報・勤怠・残業管理を紙や口頭で行い、2024年の残業上限規制への対応が遅れている。ANDPADなど既存SaaSは機能過多・高コストで中小には導入障壁が高い。",
    "product": "現場写真→AI自動日報生成（進捗・工種・作業員を認識）\n勤怠・残業時間の自動集計と上限アラート\nLINE感覚の現場コミュニケーション機能\n工事台帳・見積もり連携（オプション）",
    "revenueModel": "月額SaaS ユーザー数課金（5名まで9,800円〜）\nAI日報生成アドオン（月2,000円/現場）",
    "competitors": "ANDPAD, Photoruction, KANNA, 現場ポケット, Buildee",
    "competitiveEdge": "ANDPADは大企業向けで機能が多すぎる一方、FieldSyncは写真→日報の1アクション完結と残業管理を両立し、5名規模でも翌日から使える中小特化設計で差別化する。",
    "category": "建設テック",
    "targetIndustry": "建設・土木",
    "targetCustomer": "中小企業",
    "investmentScale": "50〜200万円",
    "difficulty": "低",
    "scores": {
        "novelty": 3,
        "marketSize": 4,
        "profitability": 3,
        "growth": 5,
        "feasibility": 4,
        "moat": 3,
    },
    "scoreComments": {
        "novelty": "写真→日報・勤怠・残業一括生成の中小建設業特化型は競合が少ない",
        "marketSize": "建設業許可業者は約47万社。半数超がDX未認知で未開拓市場が大きい",
        "profitability": "月額SaaSで解約しにくい。有料オプション追加でARPUを引き上げ可能",
        "growth": "2024年4月の建設業残業上限規制適用で勤怠管理の法的義務化が加速した",
        "feasibility": "スマホカメラとクラウドで完結し、設備投資不要で最短1週間で導入できる",
        "moat": "現場写真・日報・施工実績データが蓄積し見積もり精度の向上につながる",
    },
    "whyNow": "2024年4月から建設業にも時間外労働の上限規制（原則年360時間・違反で刑事罰）が適用され、中小企業も残業の正確な記録が法的義務となった。しかし半数超の中小建設業者がDXを認知しておらず（業界調査）、法対応と現場効率化を同時に解決するシンプルなツールへの需要が急拡大している。",
    "noveltyNote": "ANDPADやPhotoructionは施工管理の包括的プラットフォームとして大企業・中堅向けに設計されているが、5名規模の中小が翌日から使える写真1枚日報＋勤怠・残業管理の一体型SaaSは確認できない。本サービスはDX未経験の現場監督が直感的に使えるUXを最優先に設計する。",
    "strengthNote": "月額課金で解約率が低く、現場写真・施工実績データが蓄積するほど見積もり精度が向上する。データ資産化により競合への乗り換えコストが高まり、顧客の粘着性が年々強まる構造になっている。",
    "patternRationale": "A-2（規制変化の「窓」）は2024年の残業上限規制という明確な参入機会を捉え、B-4（摩擦の徹底除去）は写真1枚→日報・勤怠一括生成という中小現場の最大の摩擦点を解消する技術軸に対応する。",
    "patterns": ["A-2", "B-4"],
    "trendKeywords": ["建設業2024年問題", "施工管理DX", "残業上限規制"],
    "tags": ["工事日報自動化", "勤怠管理", "中小建設業", "AI写真解析"],
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
    slug = f"fieldsync-{number}"
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
