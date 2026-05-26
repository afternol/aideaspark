import sys, psycopg2, json
sys.stdout.reconfigure(encoding='utf-8')

import os
try:
    from dotenv import load_dotenv; load_dotenv()
except ImportError:
    pass
DATABASE_URL = os.environ.get("DATABASE_URL", "")

# 各アイデアの超過フィールドを短縮した修正値
UPDATES = {
    1: {
        "whyNow": "2024年度介護報酬改定で見守り機器設置時の夜勤配置基準が緩和。生産性向上推進体制加算（2024年度新設）が費用対効果を後押しすると考えられる。",
        "scoreComments_patch": {
            "growth": "2024年度介護報酬改定の夜勤配置基準緩和と生産性向上推進体制加算新設が追い風"
        }
    },
    2: {
        "whyNow": "食料システム法取引適正化規定が2026年4月に全面施行。食品ロス60%削減目標の引き上げで規制対応需要が高まっている。",
        "noveltyNote": "sinops-CLOUDは大手チェーン向け発注最適化に特化し中小店舗の不規則仕入れに対応しにくい。本サービスはOCR登録×当日販促自動化で余剰を即収益化する逆転アプローチを取る。",
        "strengthNote": "Uber Eatsのサージプライシングを廃棄リスクに転用し余剰在庫を即収益化する構造が差別化軸。店舗固有の実績データ蓄積が乗換コストを高める。",
        "scoreComments_patch": {
            "growth": "食料システム法2026年4月全面施行と食品ロス削減目標引き上げで規制追い風が続く",
            "marketSize": "外食産業の食品ロスは年間約60〜66万トン（農水省令和4〜5年度推計）で対象市場は大きい"
        }
    },
    3: {
        "whyNow": "2025年12月施行の担い手三法で処遇改善が努力義務化。2030年に技能工約17.9万人不足予測と重なり、今が参入適期と考えられる。",
        "scoreComments_patch": {
            "growth": "担い手三法（2025年12月施行）の努力義務化が追い風。採用・育成投資の拡大が見込まれる",
            "marketSize": "建設業は2030年に技能工約17.9万人不足予測（ヒューマンリソシア試算）で需要は大きい"
        }
    },
    4: {
        "whyNow": "2024年11月施行フリーランス新法で企業の対応ニーズが顕在化。2026年1月施行の取適法でさらに規制が強化されたため今が参入好機と考えられる。",
        "noveltyNote": "freee業務委託管理等は契約書レビュー対応が中心だが、本サービスは補償機能を組み合わせた結果売りで差別化。建設瑕疵保険アナロジーによる逆転アプローチ。",
        "strengthNote": "契約スキャン実績データが蓄積するほど判定精度が向上し競合模倣困難な資産となる。保険会社提携による補償機能は規制ノウハウが必要で参入障壁になり得る。",
        "competitiveEdge": "freee・クラウドサインレビュー等は契約書レビュー対応が中心だが、本サービスは補償まで含む結果売りで差別化できると考えられる。",
        "scoreComments_patch": {
            "novelty": "類似の国産3社が存在するが、補償機能の組み合わせで部分的差別化が見込まれる"
        }
    }
}

conn = psycopg2.connect(DATABASE_URL)
cur = conn.cursor()

for number, patches in UPDATES.items():
    # scoreCommentsをDBから取得してパッチ適用
    if "scoreComments_patch" in patches:
        cur.execute('SELECT "scoreComments" FROM "Idea" WHERE number = %s', (number,))
        row = cur.fetchone()
        sc = json.loads(row[0]) if isinstance(row[0], str) else row[0]
        sc.update(patches.pop("scoreComments_patch"))
        patches["scoreComments"] = json.dumps(sc, ensure_ascii=False)

    # SET句を組み立て
    set_clauses = []
    values = []
    for field, val in patches.items():
        set_clauses.append(f'"{field}" = %s')
        values.append(val)
    values.append(number)

    sql = f'UPDATE "Idea" SET {", ".join(set_clauses)}, "updatedAt" = NOW() WHERE number = %s'
    cur.execute(sql, values)
    print(f"#{number} UPDATE完了")

conn.commit()
cur.close()
conn.close()

# 確認
conn = psycopg2.connect(DATABASE_URL)
cur = conn.cursor()
cur.execute('SELECT number, \"serviceName\", \"whyNow\", \"noveltyNote\", \"strengthNote\", \"competitiveEdge\", \"scoreComments\" FROM "Idea" WHERE number < 5 ORDER BY number')
for r in cur.fetchall():
    sc = json.loads(r[6]) if isinstance(r[6], str) else r[6]
    sc_max = max(len(v) for v in sc.values())
    over = [f"{k}({len(v)})" for k,v in sc.items() if len(v) > 50]
    print(f"#{r[0]} {r[1]}: whyNow={len(r[2])}字 noveltyNote={len(r[3])}字 strengthNote={len(r[4])}字 competitiveEdge={len(r[5])}字 sc最大={sc_max}字{'  !!!超過:'+','.join(over) if over else ''}")
cur.close()
conn.close()
