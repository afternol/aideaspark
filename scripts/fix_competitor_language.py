import sys, psycopg2, json
sys.stdout.reconfigure(encoding='utf-8')

import os
try:
    from dotenv import load_dotenv; load_dotenv()
except ImportError:
    pass
DATABASE_URL = os.environ.get("DATABASE_URL", "")

# 各アイデアのネガティブ表現を中立・ポジティブな言い回しに修正
UPDATES = {
    1: {  # ナイトガードSOC
        "noveltyNote": "眠りSCAN等が検知通知を中心としているのに対し、本サービスはセキュリティSOCモデルを転用した遠隔トリアージという異なるアプローチで差別化している。",
        "competitiveEdge": "本サービスは遠隔トリアージで誤報を削減し、成果連動課金で施設の初期投資負担を抑えられる設計で、既存サービスとは価値提供の軸が異なると考えられる。",
        "scoreComments_patch": {
            "novelty": "ツール売り→成果報酬＋遠隔SOCの2軸で既存サービスとは異なるアプローチを採用"
        }
    },
    2: {  # ロスカット・ラボ
        "noveltyNote": "sinops-CLOUDが大手チェーンの発注最適化を中心としているのに対し、本サービスはOCR登録×当日販促自動化で「発注後の余剰を即収益化」する異なるアプローチを取る。",
        "competitiveEdge": "発注最適化サービスと余剰品マッチングサービスのそれぞれとは異なり、本サービスは廃棄予兆→販売促進を店舗内で完結させる点でアプローチが異なると考えられる。",
        "scoreComments_patch": {
            "novelty": "発注最適化と余剰品即時販売促進の統合という点で既存サービスとは異なるアプローチ"
        }
    },
    3: {  # ShokuninPass
        "noveltyNote": "Edu建が動画視聴型eラーニングを中心としているのに対し、本サービスは技能単位×従量課金×社外メンター活用という異なるアプローチを採用していると考えられる。",
        "competitiveEdge": "本サービスは技能習得の成果単位に課金するため、企業のROIが可視化される点で既存ツールとは価値提供の軸が異なると考えられる。",
        "scoreComments_patch": {
            "novelty": "従量課金×社外メンター活用は既存サービスとは異なるアプローチで差別化軸が明確"
        }
    },
    4: {  # CommitGuard
        "noveltyNote": "freee業務委託管理等が契約書レビューを中心としているのに対し、本サービスは補償機能を組み合わせた結果売りという異なる価値提供モデルを採用している。",
        "competitiveEdge": "freee・クラウドサインレビュー等が契約書レビューを主軸としているのに対し、本サービスは補償まで含む結果売りという異なるアプローチで差別化できると考えられる。",
        "scoreComments_patch": {
            "novelty": "類似の国産3社が存在するが、補償機能の組み合わせで異なるアプローチを採用"
        }
    },
    5: {  # AgriShield
        "noveltyNote": "TENRYO等が農家向け予測ツールを中心としているのに対し、本サービスは保険会社をB2B顧客とし農家の保険金自動支払いを実現するという異なるアプローチを採用している。",
        "competitiveEdge": "TENRYO等が農家向け予測ツール提供を主軸としているのに対し、本サービスは保険会社との連携と自動支払いの仕組みを中心とする異なるモデルを採用している。"
    }
}

conn = psycopg2.connect(DATABASE_URL)
cur = conn.cursor()

for number, patches in UPDATES.items():
    if "scoreComments_patch" in patches:
        cur.execute('SELECT "scoreComments" FROM "Idea" WHERE number = %s', (number,))
        row = cur.fetchone()
        sc = json.loads(row[0]) if isinstance(row[0], str) else row[0]
        sc.update(patches.pop("scoreComments_patch"))
        patches["scoreComments"] = json.dumps(sc, ensure_ascii=False)

    set_clauses = []
    values = []
    for field, val in patches.items():
        set_clauses.append(f'"{field}" = %s')
        values.append(val)
    values.append(number)

    sql = f'UPDATE "Idea" SET {", ".join(set_clauses)}, "updatedAt" = NOW() WHERE number = %s'
    cur.execute(sql, values)
    print(f"#{number} ネガティブ表現修正完了")

conn.commit()
cur.close()
conn.close()
print("全件完了")
