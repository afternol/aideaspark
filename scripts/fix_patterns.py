import sys, psycopg2, json
sys.stdout.reconfigure(encoding='utf-8')

import os
try:
    from dotenv import load_dotenv; load_dotenv()
except ImportError:
    pass
DATABASE_URL = os.environ.get("DATABASE_URL", "")

# 各アイデアに対して、コンセプトに最も合致するパターンIDを割り当て
# B-6: アウトカム課金（成果連動型）
# C-7: BtoBtoC・ビジネスモデル変換
# E-8: 廃棄・余剰・無駄の価値化
# I-4: 人間×AIハイブリッドサービス
# A-2: 規制変化の「窓」を捉える
# F-7: API・インフラ（Picks & Shovels）戦略
# H-1: 職人・暗黙知のデジタル資産化
# D-5: 規制・ライセンス取得（Regulatory Moat）

PATTERN_UPDATES = {
    1: ["B-6", "I-4"],   # ナイトガードSOC: 成果報酬課金 + 人間×AIハイブリッド遠隔SOC
    2: ["E-8", "B-6"],   # ロスカット・ラボ: 廃棄・余剰の価値化 + アウトカム課金
    3: ["B-6", "C-7"],   # ShokuninPass: アウトカム課金 + BtoBtoC
    4: ["A-2", "B-6"],   # CommitGuard: 規制変化の窓（フリーランス新法）+ アウトカム課金
    5: ["A-2", "F-7"],   # AgriShield: 規制変化の窓（スマート農業促進法）+ APIインフラ戦略
}

conn = psycopg2.connect(DATABASE_URL)
cur = conn.cursor()

for number, pattern_ids in PATTERN_UPDATES.items():
    cur.execute(
        'UPDATE "Idea" SET patterns = %s, "updatedAt" = NOW() WHERE number = %s',
        (json.dumps(pattern_ids, ensure_ascii=False), number)
    )
    print(f"#{number}: {pattern_ids}")

conn.commit()

# 確認
cur.execute('SELECT number, "serviceName", patterns FROM "Idea" ORDER BY number')
print("\n--- 修正後 ---")
for r in cur.fetchall():
    p = json.loads(r[2]) if isinstance(r[2], str) else r[2]
    print(f"#{r[0]} {r[1]}: {p}")

cur.close()
conn.close()
