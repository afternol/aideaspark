import anthropic, psycopg2, json, uuid, re, unicodedata, os
from datetime import date
try:
    from dotenv import load_dotenv; load_dotenv()
except ImportError:
    pass

API_KEY = os.environ.get("ANTHROPIC_API_KEY", "")
DATABASE_URL = os.environ.get("DATABASE_URL", "")
client = anthropic.Anthropic(api_key=API_KEY)

theme = "フリーランス・副業者の税務・社会保険・法的リスク管理"
number = 4

PHASE2_SYSTEM = """あなたは日本市場向け新規事業アイデアの生成エキスパートです。

【新規性創出の思考フレーム（JSON生成前に必ずこのプロセスを実行すること）】

ステップ1：競合の「共通仮定」を特定する
ステップ2：最も逆転余地のある仮定を1つ選んで崩す
ステップ3：異業界アナロジーを一つ適用する（必須）

【スコアリングの厳格な基準】
novelty：「AIを使う」だけでは最大2点。仮定逆転や異業界アナロジーが反映されていれば3〜4点。
moat：公的データ・汎用API中心→最大3点。固有データ蓄積＋ネットワーク効果→4点以上。
feasibility：規制産業で法的リスク未解決→最大3点。

【未確認情報の表現ルール】
Phase1のWebSearchで確認できた情報→断定形可。確認できていない仮説・推測→「〜と考えられる」等の不確実性表現を必ず使う。

【絶対禁止表現】
「国内初」「業界初」「世界初」「〇〇はほぼ存在しない」「この領域は空白地帯」「担任負担ゼロ」「完全自動化」「〇〇補助金の対象」

必ず JSON のみを返答してください。マークダウンコードブロックで囲むこと。"""

def get_text(content):
    return "\n".join(b.text for b in content if hasattr(b, "text"))

def extract_json(text):
    text = re.sub(r"```(?:json)?\s*", "", text).replace("```", "").strip()
    try:
        return json.loads(text)
    except Exception:
        m = re.search(r"\{[\s\S]*\}", text)
        if m:
            try:
                return json.loads(m.group(0))
            except Exception:
                pass
    return None

def slugify(text):
    text = unicodedata.normalize("NFKD", text)
    text = text.encode("ascii", "ignore").decode("ascii")
    text = re.sub(r"[^\w\s-]", "", text).strip().lower()
    text = re.sub(r"[\s_-]+", "-", text)
    return text or "idea"

print("Phase 1: 市場調査中...")
p1 = client.messages.create(
    model="claude-sonnet-4-6",
    max_tokens=3000,
    tools=[{"type": "web_search_20250305", "name": "web_search"}],
    messages=[{"role": "user", "content": f"""テーマ: {theme}

日本市場の最新動向と国産競合サービスを調査してください。
「{theme} サービス 日本 スタートアップ」
「{theme} SaaS 国産 2024 2025」
で検索し、5社以上の国産競合をリストアップしてください。
競合の共通仮定（誰に・何を・どう課金しているか）も整理してください。"""}],
)
p1_text = get_text(p1.content)
print(f"Phase 1完了 ({len(p1_text)}文字)")

print("Phase 2: アイデア生成中...")
p2_user = f"""## 生成テーマ
{theme}

## 調査済み市場シグナルと国産競合情報
{p1_text}

## アイデア生成の手順
手順1: 競合の共通仮定を分析する（誰に・何を・どう課金・どこで届けるか）
手順2: 最も逆転余地のある仮定を1つ選ぶ
手順3: 異業界アナロジーを1つ適用する
手順4: 手順2・3からJSONを生成する

noveltyNoteには「〇〇（競合名）は〜という制約を持つが、本サービスは〜という手段でその制約を回避している」と書く。
未確認の仮説は必ず「〜と考えられる」等の不確実性表現を使う。

## 出力フォーマット（```jsonブロックで出力すること）

```json
{{
  "serviceName": "",
  "oneLiner": "",
  "concept": "",
  "target": "",
  "problem": "",
  "product": "",
  "revenueModel": "",
  "competitors": "",
  "competitiveEdge": "",
  "tags": ["", "", "", ""],
  "category": "",
  "targetIndustry": "",
  "targetCustomer": "",
  "investmentScale": "",
  "difficulty": "",
  "scores": {{"novelty": 0, "marketSize": 0, "profitability": 0, "growth": 0, "feasibility": 0, "moat": 0}},
  "scoreComments": {{"novelty": "", "marketSize": "", "profitability": "", "growth": "", "feasibility": "", "moat": ""}},
  "trendKeywords": ["", "", ""],
  "patterns": ["", ""],
  "whyNow": "",
  "noveltyNote": "",
  "strengthNote": "",
  "patternRationale": ""
}}
```"""

p2 = client.messages.create(
    model="claude-sonnet-4-6",
    max_tokens=4000,
    system=PHASE2_SYSTEM,
    messages=[{"role": "user", "content": p2_user}],
)
raw = get_text(p2.content)
idea = extract_json(raw)

if not idea:
    print("JSON抽出失敗。生テキスト先頭1000字:")
    print(raw[:1000])
else:
    print(f"Phase 2完了: {idea.get('serviceName', '不明')}")

    conn = psycopg2.connect(DATABASE_URL)
    cur = conn.cursor()
    idea_id = str(uuid.uuid4())
    service_name = idea.get("serviceName", f"アイデア{number}")
    base_slug = slugify(service_name)
    slug = f"{base_slug}-{number}" if base_slug else f"idea-{number}"
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
            %s, %s, %s, %s, %s, %s, %s, %s,
            %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s,
            %s, %s, %s, %s, %s, %s, %s, %s, 0, 0, NOW(), NOW()
        )
    """, (
        idea_id, slug, number, service_name,
        idea.get("concept",""), idea.get("target",""), idea.get("problem",""), idea.get("product",""),
        idea.get("revenueModel",""), idea.get("competitors",""), idea.get("competitiveEdge",""),
        json.dumps(idea.get("tags",[]), ensure_ascii=False),
        idea.get("category","その他"), idea.get("targetIndustry","その他"), idea.get("targetCustomer",""),
        idea.get("investmentScale","〜500万円"), idea.get("difficulty","中"),
        json.dumps(idea.get("scores",{}), ensure_ascii=False),
        json.dumps(idea.get("scoreComments",{}), ensure_ascii=False),
        json.dumps(idea.get("trendKeywords",[]), ensure_ascii=False),
        idea.get("oneLiner",""), today,
        json.dumps(idea.get("patterns",[]), ensure_ascii=False),
        idea.get("whyNow",""), idea.get("noveltyNote",""), idea.get("strengthNote",""), idea.get("patternRationale",""),
    ))
    conn.commit()
    sc = idea.get("scores", {})
    avg = sum(sc.values())/len(sc) if sc else 0
    print(f"DB INSERT完了: #{number} {service_name} (slug:{slug}) 平均スコア:{avg:.1f}")
    cur.close()
    conn.close()
