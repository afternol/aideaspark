"""
insert_idea.py — AideaSpark 汎用アイデアINSERTスクリプト
=========================================================
使い方:
  1. 下の idea = {...} を生成したアイデアJSONで埋める
  2. python scripts/insert_idea.py を実行

.env (bizidea/.env) の DATABASE_URL を自動読み込み。
INSERT前にフィールド値を検証し、不正な値はエラーで停止する。
"""

import io
import json
import sys
import uuid
from datetime import date

# Windows コンソールの文字化け対策
if sys.stdout.encoding and sys.stdout.encoding.lower() != "utf-8":
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")

import psycopg2

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

import os
DATABASE_URL = os.environ.get("DATABASE_URL")
if not DATABASE_URL:
    sys.exit("ERROR: DATABASE_URL が未設定です（.env または OS 環境変数）")

# ── 定義済み定数（constants.ts と完全一致させること） ──────────────────

VALID_CATEGORIES = {
    "SaaS","D2C","プラットフォーム","マーケットプレイス","サブスクリプション",
    "シェアリング","アグリゲーター","API","BaaS","バーティカルSaaS","コミュニティ",
    "AI/ML","生成AI","AIエージェント","音声AI","画像・動画AI","データ分析",
    "RPA・自動化","AI SaaS","チャットボット","パーソナライズ",
    "フィンテック","決済","インシュアテック","資産運用","融資・レンディング",
    "会計・経理DX","Web3・ブロックチェーン","暗号資産",
    "デジタルヘルス","メンタルヘルス","フェムテック","スリープテック",
    "フィットネステック","介護テック","エイジテック","予防医療","ペットテック",
    "EdTech","リスキリング","HR Tech","採用テック","タレントマネジメント",
    "コーチング・メンタリング","語学学習","資格・試験対策",
    "フードテック","リテールテック","プロップテック","トラベルテック",
    "ファッションテック","ビューティーテック","家事代行・生活支援",
    "ローカルビジネス","ギフト・EC",
    "モビリティ","物流テック","建設テック","製造DX","アグリテック",
    "エネルギーテック","セキュリティ","リーガルテック","GovTech","宇宙ビジネス",
    "カーボンテック","サーキュラーエコノミー","クリーンテック","ESG・インパクト","フードロス",
    "コンテンツ","クリエイターエコノミー","ゲーム・eスポーツ","音楽テック",
    "動画・配信","ファンコミュニティ","メディア・出版","ライブコマース",
    "XR・メタバース","IoT","ロボティクス","量子コンピューティング","ドローン",
    "3Dプリンティング","デジタルツイン","ノーコード・ローコード",
}

VALID_INDUSTRIES = {
    "IT・通信","ソフトウェア・SaaS","ゲーム","広告・マーケティング","メディア・出版","通信・インフラ",
    "製造","自動車・モビリティ","電機・精密機器","建設・土木","素材・化学","アパレル・繊維",
    "小売・EC","飲食・食品","物流・運輸","旅行・宿泊","美容・理容","不動産・住宅",
    "人材・HR","外食・フードサービス","冠婚葬祭",
    "金融・保険","銀行・証券","法務・士業","会計・税務","コンサルティング",
    "医療・福祉","教育・研修","行政・自治体","NPO・社会貢献","介護・保育","スポーツ・フィットネス",
    "農業・一次産業","水産・畜産","エネルギー・電力","環境・リサイクル","全業界",
}

VALID_CUSTOMERS = {
    "中小企業","大企業","スタートアップ","個人事業主","NPO・社団法人",
    "自治体・行政","教育機関","医療機関","飲食店・店舗",
    "一般消費者","ファミリー層","Z世代・若年層","シニア層","子ども・保護者",
    "共働き世帯","単身世帯","富裕層","学生","就活生・転職者",
    "フリーランス・副業","クリエイター・配信者","エンジニア・開発者","デザイナー",
    "マーケター","士業（弁護士・税理士等）","医療従事者","農家・生産者","投資家・VC",
}

VALID_INVESTMENT_SCALES = {"〜50万円","50〜200万円","200〜500万円","500万円〜"}
VALID_DIFFICULTIES = {"低","中","高"}

import re
PATTERN_RE = re.compile(r'^[A-J]-\d+$')


def validate(idea: dict):
    errors = []

    # serviceName
    if not idea.get("serviceName"):
        errors.append("serviceName が空")

    # oneLiner 文字数
    ol = idea.get("oneLiner", "")
    if not (20 <= len(ol) <= 40):
        errors.append(f"oneLiner が20〜40字範囲外: {len(ol)}字「{ol}」")

    # category
    cat = idea.get("category", "")
    if cat not in VALID_CATEGORIES:
        errors.append(f"category が定義外: '{cat}'")

    # targetIndustry
    ti = idea.get("targetIndustry", "")
    if ti not in VALID_INDUSTRIES:
        errors.append(f"targetIndustry が定義外: '{ti}'")

    # targetCustomer
    tc = idea.get("targetCustomer", "")
    if tc not in VALID_CUSTOMERS:
        errors.append(f"targetCustomer が定義外: '{tc}'")

    # investmentScale
    inv = idea.get("investmentScale", "")
    if inv not in VALID_INVESTMENT_SCALES:
        errors.append(f"investmentScale が定義外: '{inv}' — 使用可能: {VALID_INVESTMENT_SCALES}")

    # difficulty
    diff = idea.get("difficulty", "")
    if diff not in VALID_DIFFICULTIES:
        errors.append(f"difficulty が定義外: '{diff}'")

    # patterns: 2件、A-1〜J-x 形式
    pats = idea.get("patterns", [])
    if len(pats) != 2:
        errors.append(f"patterns は必ず2件 (現在{len(pats)}件): {pats}")
    for p in pats:
        if not PATTERN_RE.match(str(p)):
            errors.append(f"patterns のID形式が不正: '{p}' (例: 'A-2', 'F-7')")

    # scores: 全項目同一禁止
    sc = idea.get("scores", {})
    required_axes = {"novelty","marketSize","profitability","growth","feasibility","moat"}
    missing = required_axes - set(sc.keys())
    if missing:
        errors.append(f"scores に不足軸: {missing}")
    vals = list(sc.values())
    if vals and len(set(vals)) == 1:
        errors.append(f"scores が全軸同一値({vals[0]}) — 禁止")
    for k, v in sc.items():
        if not isinstance(v, int) or not (1 <= v <= 5):
            errors.append(f"scores.{k} が1〜5の整数でない: {v}")

    # scoreComments: 30〜50字
    scc = idea.get("scoreComments", {})
    for axis in required_axes:
        comment = scc.get(axis, "")
        if not (30 <= len(comment) <= 60):
            errors.append(f"scoreComments.{axis} が30〜60字範囲外: {len(comment)}字「{comment[:30]}…」")

    # 必須フィールド存在チェック
    for field in ["competitors","whyNow","noveltyNote","strengthNote","patternRationale","concept","target","problem","product","revenueModel"]:
        if not idea.get(field):
            errors.append(f"{field} が空")

    # competitors: カンマ区切りで3社以上
    comp_str = idea.get("competitors", "")
    comp_list = [c.strip() for c in comp_str.split(",") if c.strip()]
    if len(comp_list) < 3:
        errors.append(f"competitors は実在企業3社以上必要 (現在{len(comp_list)}社): '{comp_str}'")

    # trendKeywords: 3件
    tk = idea.get("trendKeywords", [])
    if len(tk) != 3:
        errors.append(f"trendKeywords は3件必要 (現在{len(tk)}件)")

    if errors:
        print("\n[VALIDATION ERROR] 以下の問題を修正してから再実行してください:")
        for e in errors:
            print(f"  [NG] {e}")
        sys.exit(1)

    print("[VALIDATION OK] 全フィールド検証通過")


def insert(idea: dict):
    conn = psycopg2.connect(DATABASE_URL)
    try:
        cur = conn.cursor()
        cur.execute('SELECT COALESCE(MAX(number), 0) FROM "Idea"')
        max_num = cur.fetchone()[0]
        number = max_num + 1

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
        print(f"URL: http://localhost:4001/ideas/{slug}")
        return number, slug
    finally:
        conn.close()


# ════════════════════════════════════════════════════════════════════════
# ▼▼▼ ここにアイデアを記入する ▼▼▼
# ════════════════════════════════════════════════════════════════════════
idea = {
    # ── 基本情報 ───────────────────────────────────────────────────
    "serviceName": "",          # 例: "CareWatch Pro"（slug用に英語名推奨。日本語可だがslugはidea-Nになる）
    "oneLiner": "",             # 20〜40字
    "concept": "",              # 100〜180字
    "target": "",               # 40〜100字 （会社規模・役職・状況を具体的に）
    "problem": "",              # 80〜150字 （現状の問題 + なぜ今の手段ではダメか）

    # ── プロダクト・収益 ────────────────────────────────────────────
    "product": "",              # 改行区切り 3〜6項目、各行30字以内
    "revenueModel": "",         # 改行区切り 2〜4パターン、単価明示

    # ── 競合・優位性 ────────────────────────────────────────────────
    "competitors": "",          # 実在サービス名 カンマ区切り 3〜5社
    "competitiveEdge": "",      # 競合名を含む具体的差別化 60〜120字

    # ── 分類（constants.ts の定義値のみ使用） ───────────────────────
    "category": "",             # VALID_CATEGORIES のいずれか
    "targetIndustry": "",       # VALID_INDUSTRIES のいずれか
    "targetCustomer": "",       # VALID_CUSTOMERS のいずれか
    "investmentScale": "",      # "〜50万円" / "50〜200万円" / "200〜500万円" / "500万円〜"
    "difficulty": "",           # "低" / "中" / "高"

    # ── スコア（1〜5の整数、全軸同一禁止） ──────────────────────────
    "scores": {
        "novelty": 0,
        "marketSize": 0,
        "profitability": 0,
        "growth": 0,
        "feasibility": 0,
        "moat": 0,
    },
    "scoreComments": {          # 各軸 30〜60字
        "novelty": "",
        "marketSize": "",
        "profitability": "",
        "growth": "",
        "feasibility": "",
        "moat": "",
    },

    # ── インサイト（必須・散文2文） ──────────────────────────────────
    "whyNow": "",               # 規制/技術/行動変容の具体的引用 + 今成立する理由
    "noveltyNote": "",          # 「〇〇は存在するが△△がない」対比構造
    "strengthNote": "",         # 収益構造・参入障壁の具体的根拠
    "patternRationale": "",     # パターン選定の理由

    # ── メタ ────────────────────────────────────────────────────────
    "patterns": [],             # 2件: A-1〜J-x のIDのみ（日本語名禁止）
    "trendKeywords": [],        # 3件: 各15字以内
    "tags": [],                 # 3〜5件: category/industry/customerとは異なる切り口
}
# ════════════════════════════════════════════════════════════════════════


if __name__ == "__main__":
    validate(idea)
    insert(idea)
