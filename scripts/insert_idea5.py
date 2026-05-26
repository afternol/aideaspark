import psycopg2, json, uuid
from datetime import date

import os
try:
    from dotenv import load_dotenv; load_dotenv()
except ImportError:
    pass
DATABASE_URL = os.environ.get("DATABASE_URL", "")

idea = {
    "serviceName": "AgriShield（アグリシールド）",
    "oneLiner": "収量データ連動で農家の気候被害を自動ヘッジする保険インフラ",
    "concept": "気象・衛星・収量実績データを農業共済会社へAPI提供し、収量閾値割れを自動検知して保険金を即日支払うパラメトリック保険基盤",
    "target": "収入保険加入済みの中規模農家（2〜10ha）と農業共済組合・損害保険会社",
    "problem": "農業共済の損害調査は2〜4週間かかる。気候変動で被害が増す中、農家のキャッシュフロー危機が深刻化している",
    "product": "衛星・気象センサーによる収量推定API\n収量閾値割れの自動検知・保険会社通知\n農家向けリスクダッシュボード\n保険会社向け引受支援レポート",
    "revenueModel": "保険会社向けAPI利用料（100円/農家/月〜）\n農家向けリスクモニタリング月額（2,000円〜）",
    "competitors": "TENRYO（ミライ菜園）、クボタスマートアグリシステム、raim（ファームノート）、収入保険（農林水産省）",
    "competitiveEdge": "TENRYO等は農家向け予測ツール提供のみで、保険会社連携と自動支払いの仕組みを持たない",
    "tags": ["パラメトリック保険", "農業DX", "気候変動適応", "B2B2C"],
    "category": "インシュアテック",
    "targetIndustry": "農業",
    "targetCustomer": "法人",
    "investmentScale": "500万〜1,000万円",
    "difficulty": "高",
    "scores": {
        "novelty": 4,
        "marketSize": 3,
        "profitability": 3,
        "growth": 4,
        "feasibility": 2,
        "moat": 4
    },
    "scoreComments": {
        "novelty": "予測ツールと異なり保険支払い自動化という新軸。国産での類似事例は確認できない",
        "marketSize": "国内農業保険市場は数千億円規模。保険会社連携が取れるかが普及の鍵",
        "profitability": "10,000農家×2,400円/年で2.4億円想定。保険会社APIが主収益",
        "growth": "2024年施行スマート農業促進法で融資優遇開始。気候変動で農業被害は増加傾向",
        "feasibility": "少額短期保険業登録が必要。まず保険会社向けB2B APIから参入が現実的",
        "moat": "収量実績データは年数で精度が上がる。保険会社提携完了後はスイッチングコスト高"
    },
    "trendKeywords": ["パラメトリック保険", "スマート農業促進法", "気候変動適応"],
    "oneLiner": "収量データ連動で農家の気候被害を自動ヘッジする保険インフラ",
    "patterns": ["インシュアテック", "データAPI販売"],
    "whyNow": "2024年10月施行のスマート農業促進法でDX融資優遇が開始した。気候変動で農業被害が増加しており、迅速補償ニーズが急拡大している",
    "noveltyNote": "TENRYO等は農家向け予測ツール提供にとどまるが、本サービスは保険会社をB2B顧客とし農家の保険金自動支払いを実現する点が根本的に異なる",
    "strengthNote": "収量実績データは年数で精度が向上し、競合が同データを持つまでのリードタイムが数年ある。保険会社との提携完了後は乗り換えコストが高くなる",
    "patternRationale": "インシュアテックパターンは保険会社向けAPI販売に、データAPI販売パターンは衛星・気象データの有償提供にそれぞれ対応する"
}

conn = psycopg2.connect(DATABASE_URL)
cur = conn.cursor()

cur.execute('SELECT COALESCE(MAX(number), 0) FROM "Idea"')
max_num = cur.fetchone()[0]
number = max(5, max_num + 1)

idea_id = str(uuid.uuid4())
slug = f"agrishield-{number}"
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
    json.dumps(idea["tags"], ensure_ascii=False),
    idea["category"], idea["targetIndustry"], idea["targetCustomer"],
    idea["investmentScale"], idea["difficulty"],
    json.dumps(idea["scores"], ensure_ascii=False),
    json.dumps(idea["scoreComments"], ensure_ascii=False),
    json.dumps(idea["trendKeywords"], ensure_ascii=False),
    idea["oneLiner"], today,
    json.dumps(idea["patterns"], ensure_ascii=False),
    idea["whyNow"], idea["noveltyNote"], idea["strengthNote"], idea["patternRationale"],
))
conn.commit()

sc = idea["scores"]
avg = sum(sc.values()) / len(sc)
print(f"INSERT完了: #{number} {idea['serviceName']} (slug:{slug}) 平均スコア:{avg:.1f}")

cur.close()
conn.close()
