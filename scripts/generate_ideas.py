"""
generate_ideas.py  v2.1
========================
AideaSpark アイデア生成パイプライン（最高品質版）

使い方:
  python generate_ideas.py "テーマ1" "テーマ2" ...

.env（または OS 環境変数）:
  DATABASE_URL=postgresql://...
  ANTHROPIC_API_KEY=sk-ant-...
"""

import asyncio
import json
import logging
import os
import re
import sys
import unicodedata
import uuid
from datetime import date, datetime, timezone

import anthropic
import psycopg2

# ── 環境変数 ─────────────────────────────────────────────────────────
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

DATABASE_URL      = os.environ.get("DATABASE_URL")
ANTHROPIC_API_KEY = os.environ.get("ANTHROPIC_API_KEY")

if not DATABASE_URL:
    sys.exit("ERROR: DATABASE_URL が未設定です（.env または OS 環境変数）")
if not ANTHROPIC_API_KEY:
    sys.exit("ERROR: ANTHROPIC_API_KEY が未設定です（.env または OS 環境変数）")

# ── ロギング ──────────────────────────────────────────────────────────
_log_filename = f"generate_ideas_{datetime.now().strftime('%Y%m%d_%H%M%S')}.log"
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler(_log_filename, encoding="utf-8"),
    ],
)
log = logging.getLogger(__name__)

# ── 定数 ──────────────────────────────────────────────────────────────
MAX_CONCURRENT_THEMES  = 3   # テーマ間の同時実行数
MAX_RETRIES            = 3   # API エラー時の最大リトライ回数
RETRY_BASE_DELAY       = 10  # リトライ待機の基本秒数（指数バックオフ）
CANDIDATES_PER_THEME   = 3   # 1テーマあたりの生成案数
# Phase3並列数：テーマ並列3 × Phase3並列3 = 9同時API呼び出しを防ぐためセマフォで絞る
MAX_CONCURRENT_FACTCHECKS = 2

# ── Anthropic 非同期クライアント ──────────────────────────────────────
ai = anthropic.AsyncAnthropic(api_key=ANTHROPIC_API_KEY)

# ── プロンプト共通定数 ────────────────────────────────────────────────

PERSONAS = """【ターゲットペルソナ5名】
- 田中翔太（32歳・副業SE）: 難易度低〜中・技術スタック明快・初期投資200万円以内
- 鈴木美咲（35歳・大手メーカー新規事業担当）: 市場データ・競合の弱点・スコア根拠が明確なB2B案件
- 山田健一（42歳・連続起業家）: novelty・moatが高く、レッドオーシャンでない成長余地のある領域
- 佐藤あかり（24歳・新卒起業志望）: 社会課題解決・Z世代共感テーマ・理解しやすいコンセプト
- 中村誠（55歳・地方中小経営者）: 既存事業の延長線上・行政連携・低難易度で今期から動ける案件"""

FIELD_LIMITS = """【字数上限（必ず守ること）】
serviceName: カタカナ・日本語・英日混在を積極活用。英語のみは最大3件/バッチ10件
oneLiner: 20〜40字（範囲外はNG）。「SaaS」という語を使わないこと
concept: 80字以内。「SaaS」という語を使わないこと（代替: クラウドサービス・Webアプリ・定額制ツール等）
target: 60字以内
problem: 80字以内
competitiveEdge: 80字以内。**実在企業名・サービス名の記載は厳禁**。既存手段カテゴリ（例: 既存の人事SaaS／従来の会計ツール）と抽象的に対比すること
whyNow: 45〜60字・1文。WebSearchで確認した最新の法令・統計・市場変化だけを書く。2024年以前の情報のみの使用禁止。「SaaS」という語を使わないこと
noveltyNote: 45〜60字・1文。既存手段カテゴリの一般的特徴と本サービスの差分を書く。**実在企業名・サービス名の記載は厳禁**。「存在しない」「空白地帯」も禁止。「SaaS」という語を使わないこと
strengthNote: 45〜60字・1文。確認済みの仕組み・データ蓄積・収益構造から説明できる強みだけを書く。「SaaS」という語を使わないこと
patternRationale: 80字以内・2文の散文
scoreComments の各値: 30〜60字
product: 各行30字以内・3〜5行
revenueModel: 各行40字以内・2〜3行。「SaaS」という語を使わないこと
personaFit: 50字以内"""

ABSOLUTE_BANS = """【絶対禁止表現】
「国内初」「業界初」「世界初」「〇〇はほぼ存在しない」「この領域は空白地帯」
「担任負担ゼロ」「完全自動化」「100%対応」「〇〇補助金の対象」(要件未確認)
実在する競合・企業へのネガティブ表現:
  NG: 「●●の提供に留まる」「●●止まり」「●●が不足」「●●では解決できない」「●●が劣る」
  OK: 「●●が●●を中心としているのに対し、本サービスは●●という異なるアプローチを採用」

【最重要・誹謗中傷リスク回避】
competitiveEdge / noveltyNote の2フィールドでは、実在する企業名・サービス名・プロダクト名の記載を厳禁とする。
  NG例: 「SmartHRは管理が主体だが…」「freeeやマネーフォワードは…」「ANDPADは工程管理が主体で…」
  OK例: 「既存の人事SaaSは管理が主体だが…」「従来の会計ツールは…」「一般的な建設管理サービスは工程管理が主体で…」
実在名は competitors フィールドにのみ記載すること（情報提供目的）。
competitiveEdge / noveltyNote では「既存の◯◯」「従来の◯◯」「一般的な◯◯」「主流の◯◯」といった抽象カテゴリ表現で対比する。

【SaaS表記禁止】
oneLiner / concept / whyNow / noveltyNote / strengthNote / patternRationale / revenueModel / product の各フィールドに「SaaS」という語を記載することを禁止する。
  NG: 「月額SaaSとして提供」「SaaSプロダクト」「SaaS化する」
  OK: 「月額制クラウドサービス」「定額制管理ツール」「Webアプリとして提供」「サブスクリプション方式」
  ※ competitors フィールド・competitiveEdge での競合カテゴリ対比（「既存の人事SaaS」等）は対象外

【serviceName 多様性ルール】
1バッチ10件のうち英語のみの名称（ラテン文字のみ）は最大3件。残り7件以上はカタカナ・日本語・ひらがな・英日混在を使うこと。
  OK例: 「アシストワーク」「まかせて帳」「現場レポ」「SmartKojo」「ケアFit」
  NG: 10件全て英語名（SalesOrbit, CareNote, PlannerX… 等）"""

SCORING_RULES = """【スコアリングの厳格な基準】
novelty:
  「AIを使う」だけで顧客・提供形式・収益モデルが競合と同じ → 最大2点
  仮定逆転 or 異業界アナロジーが反映されている → 3〜4点
  顧客・提供形式・収益モデルの2軸以上で既存競合と明確に異なる → 4〜5点
moat:
  公的データ・汎用API中心 → 最大3点（競合も同じデータを使えるため）
  固有データ蓄積＋ネットワーク効果＋規制対応ノウハウのうち2つ以上 → 4点以上
feasibility:
  医療・介護・金融・教育など規制産業で法的リスクが未解決 → 最大3点
スコア全6項目の平均が4.0超 → 最も楽観的な項目を1点引き下げ
全項目を同一スコアにすることは禁止（例: 全部3点・全部4点はNG）"""

UNCERTAINTY_RULE = """【未確認情報の表現ルール】
Phase1のWebSearchで確認できた情報 → 断定形で記述してよい
確認できていない仮説・推測 → 「〜と考えられる」「〜の可能性がある」等の不確実性表現を必ず使う
競合の料金・機能情報 → 「公開情報として確認した範囲では」を前置き"""

# 実運用で蓄積されたハルシネーション頻出パターン（A〜R）
HALLUCINATION_PATTERNS = """【実運用で確認されたハルシネーション頻出パターン（必ず照合すること）】

A. 廃止・終了済みサービスの競合欄混入
   Reduce Go(2021年終了), LINEスマート投資(2022年終了), ペットみるん(2020年終了),
   STRUCTIONSITE(DroneDeploy買収), Savioke(Relay Robotics買収に改名),
   Shelf Engine(Crisp買収), みんなの法人保険(実在不明)
   → 確認: サービス名 + "サービス終了 OR 廃止 OR 閉鎖" で検索

B. 義務化・施行年の誤り（LLMの学習データ混濁が原因）
   HACCP義務化「2024年」→正しくは2021年6月
   高校金融教育「2025年義務化」→正しくは2022年度学習指導要領で必修化
   種苗法「2025年完全施行」→正しくは2022年4月完全施行
   → 確認: 「〇〇 義務化 施行 年」で官公庁一次ソースを確認

C. 統計数値の誤り
   食材ロス率「15〜30%」→正しくは「3〜5%」
   教員数「90万人」→正しくは「66万人」
   → 確認: 省庁公式サイト・調査機関で確認

D. 市場規模の時点・出所誤り
   睡眠市場「2030年2,162億円」→正しくは「2027年160億円（矢野経済研究所）」
   → 「○○年調査・○○年市場規模・国内/世界」の3軸を明記

E. 企業名・サービス名のリブランド未反映
   GVA assist → OLGA（2024年11月）
   Holmes → ContractS CLM
   Nuance DAX → Dragon Copilot（2025年3月）
   PayPay資産運用 → PayPay証券（2026年2月）
   カレコ → 三井のカーシェアーズ（2024年2月）
   HiPro Biz → HiPro Direct
   → 確認: サービス名 + "2024 OR 2025 OR 2026 リブランド OR 名称変更" で検索

F. EU規制・国際規制の日程誤り
   EU CSDDD: 2028年7月転置・2029年7月適用に延期（Omnibus I改正）
   GDPR「2024年特定強化」→2018年施行の継続適用が正確

G. 法令の根拠条文・命令名の誤記
   人的資本開示義務「金融商品取引法改正」→正しくは「企業内容等の開示に関する内閣府令改正」

H. ハードウェア製品のEOL
   HoloLens 2: 2024年10月製造終了
   Meta Quest Pro: 2024年3月販売終了

I. 架空サービス・企業名の混入
   「ディスカバー農業」「横浜生命保険」「BAONZ（正しくはBATONZ）」等

J. 和暦→西暦換算ミス（令和6年=2024年、令和7年=2025年）

K. 料金非公開サービスへの具体額記述
   LegalForce/OLGA等は料金非公開

L. 外食への法令義務化の誤適用
   食品表示法のアレルゲン表示義務は容器包装食品が対象（外食は対象外）

P. 架空の政府補助金・事業名
   「スマート農業実装推進事業」は存在しない（実在: スマート農業実証プロジェクト）

R. 3年/周期改定制度の中間年記述誤り
   介護報酬改定は3年ごと（2021→2024→2027年）。「2025年改定」は存在しない"""

PHASE2_SYSTEM = f"""あなたは日本市場向け新規事業アイデアの生成エキスパートです。
{PERSONAS}

【新規性創出の思考フレーム（JSON生成前に必ずこのプロセスを実行すること）】

ステップ1：競合の「共通仮定」を特定する
  調査済み競合が全員採用している前提を4軸で特定する：
  - 誰に売るか（顧客セグメント）
  - 何を売るか（価値提供の形）
  - どう課金するか（収益モデル）
  - どこで届けるか（流通チャネル）

ステップ2：逆転余地のある仮定を崩す（3案それぞれ異なる軸で逆転すること）
  案A: 顧客セグメントの逆転（例: 施設向け → 在宅・家族向け）
  案B: 収益モデルの逆転（例: 月額SaaS → 成果報酬・従量課金）
  案C: 提供形式の逆転（例: ツール提供 → 代行サービス or B2B2C）

ステップ3：異業界アナロジーを必ず1つ適用する（必須）
  別業界の成功モデルを転用して差別化軸を生む。
  noveltyNote には「（アナロジー元の業界モデル：例「サブスクD2C型」「マッチング両面市場型」）×（テーマ）」の構造で抽象的に明示すること。
  実在サービス名（例: Netflix, Airbnb等）は絶対に書かない。

{SCORING_RULES}
{UNCERTAINTY_RULE}
{ABSOLUTE_BANS}

必ず JSON 配列のみを返してください。余分なテキストは一切不要です。"""

PHASE3_SYSTEM = f"""あなたはビジネスアイデアのファクトチェック・品質校正の専門家です。
web_search ツールを使って各事実を確認し、誤りを修正した完全な JSON のみを返してください。
余分なテキストは一切不要です。

{HALLUCINATION_PATTERNS}

## 確認・修正ルール（優先順）

### グループ0: 誹謗中傷リスク回避（最優先・必ず実行）
0a. competitiveEdge / noveltyNote に実在企業名・サービス名（例: SmartHR, freee, ANDPAD, Salesforce 等の固有名詞）が含まれていたら必ず削除し、抽象カテゴリ表現に書き換える
0b. 書き換え例: 「SmartHRは…」→「既存の人事SaaSは…」 / 「ANDPADは…」→「一般的な建設管理サービスは…」 / 「freeeやマネーフォワードは…」→「従来の会計クラウドは…」
0c. competitors フィールドの実在名はそのまま残す（情報提供目的で許可）

### グループ1: 競合・サービス情報（competitorsフィールドの確認）
1. competitors の全サービスを「サービス名 サービス終了 OR 廃止 OR リブランド」で検索 → 廃止・終了済みは削除、リブランド済みは新名称に更新
2. 競合の社名でウェブ検索し公式サイトの存在を確認 → 存在しない場合は削除
3. サービスの対象商材・顧客層がこのアイデアと一致するか確認。不一致なら除外
4. ユーザープロンプトに含まれるサービス名で「〇〇類似 日本 サービス 2024 2025」を日本語で検索 → 未記載の重要国産競合があれば追記（最大5社）

### グループ2: 数値・統計
5. 具体的数値（%・万人・億円）→ 一次ソースで確認。見つからなければ定性表現に変換
6. 市場規模・統計 → 調査年と対象年のずれ・国内/世界の別を確認（パターンDに注意）

### グループ3: 法令・制度
7. 「義務化」「必須」「唯一」「急増」「国内初」→ WebSearchで根拠確認、反証があればトーンダウン
8. 法律・制度の施行年月 → 官公庁の一次情報で確認（パターンB・J・Rに注意）
9. 「〇〇補助金の対象」→ 正式名称・要件を確認。要件不明なら「可能性がある」に修正（パターンP）

### グループ4: スコアの適正化
10. noveltyスコア: 類似国産サービスが3社以上存在すれば3以下に修正
11. moatスコア: 公的データ・汎用API中心なら3以下に修正
12. feasibilityスコア: 規制産業でリスク未解消なら3以下を維持
13. スコア平均が4.0超 → 最も楽観的な項目を1点引き下げ
14. 全項目同一スコア → 最高値項目を1点引き下げ

### グループ5: パターン整合性
15. patterns の内容がアイデアの収益構造・価値提供と一致するか確認。不整合なら差し替え

### グループ6: インサイトカード短文化
16. whyNow / noveltyNote / strengthNote は各45〜60字・1文に圧縮
17. WebSearchで確認できた最新公開情報、現存競合、実際の仕組みに基づく記述だけ残す
18. 根拠が取れない数値・法令名・競合差分・優位性は削除または定性表現に修正

検索なしの推測修正は禁止。必ず web_search で確認してから判断してください。"""

PHASE4_SYSTEM = f"""あなたは新規事業アイデアの評価専門家です。
複数のアイデア案を評価し、最も有望な1案を選択して JSON のみを返してください。

{PERSONAS}

【評価基準（優先順）】
1. ペルソナ適合: 5ペルソナのうち誰かが「今すぐ使いたい」と感じるか明確か
2. 意外性・面白さ: 「なるほど！」と思える仮定の逆転と異業界アナロジーがnoveltyNoteに明示されているか
3. タイミングの必然性: whyNow に規制/技術/行動変容の2つ以上の変化の交差が書かれているか
4. 差別化の明確さ: noveltyNote の対比構造が具体的で説得力があるか
5. スコアの妥当性: ファクトに基づき楽観的すぎないか

選択した案の完全な JSON のみを返してください。余分なテキストは不要です。"""

JSON_TEMPLATE = """{
  "serviceName": "",
  "slugEn": "",
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
  "scores": {"novelty":0,"marketSize":0,"profitability":0,"growth":0,"feasibility":0,"moat":0},
  "scoreComments": {"novelty":"","marketSize":"","profitability":"","growth":"","feasibility":"","moat":""},
  "trendKeywords": ["", "", ""],
  "patterns": ["", ""],
  "whyNow": "",
  "noveltyNote": "",
  "strengthNote": "",
  "patternRationale": "",
  "personaFit": ""
}"""

# ── ユーティリティ ────────────────────────────────────────────────────

def get_text(content: list) -> str:
    return "\n".join(b.text for b in content if hasattr(b, "text"))

def extract_json(text: str):
    """JSONを安全に抽出する。バグ修正: forループ外でjson.loads(text)を先に試みる"""
    text = re.sub(r"```(?:json)?\s*", "", text).replace("```", "").strip()
    # まずテキスト全体をパース試行
    try:
        return json.loads(text)
    except Exception:
        pass
    # 配列 → オブジェクトの順で部分抽出を試みる
    for pattern in [r"\[[\s\S]*\]", r"\{[\s\S]*\}"]:
        m = re.search(pattern, text)
        if m:
            try:
                return json.loads(m.group(0))
            except Exception:
                pass
    return None

def make_slug(idea: dict, number: int) -> str:
    """slugEn フィールドを優先。なければ serviceName を ASCII 変換"""
    base = idea.get("slugEn", "") or idea.get("serviceName", "")
    normalized = unicodedata.normalize("NFKD", base)
    ascii_text = normalized.encode("ascii", "ignore").decode("ascii")
    cleaned = re.sub(r"[^\w\s-]", "", ascii_text).strip().lower()
    slug_base = re.sub(r"[\s_-]+", "-", cleaned)
    return f"{slug_base}-{number}" if slug_base else f"idea-{number}"

def validate_and_clean(idea: dict, theme: str) -> dict:
    """
    DB INSERT 前の品質バリデーション（idea-creation-rules.md 準拠）
    修正できるものは自動修正し、問題点はログに記録する。
    """
    label = idea.get("serviceName", theme[:15])

    # scores: 全項目同一値を禁止 → 最高値を1点引き下げ
    scores = idea.get("scores", {})
    vals = [v for v in scores.values() if isinstance(v, (int, float))]
    if vals and len(set(vals)) == 1:
        # 全項目同一なので novelty を1点引き下げ（最も楽観的と見なす）
        key_to_lower = "novelty"
        new_val = max(1, scores.get(key_to_lower, 3) - 1)
        idea["scores"][key_to_lower] = new_val
        log.warning(f"  [{label}] 品質: scores全項目同一 → {key_to_lower}を{new_val}に修正")

    # oneLiner: 40字超は警告
    one_liner = idea.get("oneLiner", "")
    if len(one_liner) > 40:
        log.warning(f"  [{label}] 品質: oneLiner {len(one_liner)}字（上限40字）: {one_liner[:30]}...")
    if len(one_liner) < 10:
        log.warning(f"  [{label}] 品質: oneLiner が短すぎます（{len(one_liner)}字）")

    # patterns: 2件以上、A-1〜J-8 形式か確認
    patterns = idea.get("patterns", [])
    if len(patterns) < 2:
        log.warning(f"  [{label}] 品質: patterns が{len(patterns)}件（2件必要）")
    pattern_fmt = re.compile(r'^[A-J]-\d+$')
    for p in patterns:
        if not pattern_fmt.match(str(p)):
            log.warning(f"  [{label}] 品質: patterns の形式が不正: {p}")

    # investmentScale: 定義値チェック
    valid_scales = {"〜50万円", "50〜200万円", "200〜500万円", "500万円〜"}
    if idea.get("investmentScale") not in valid_scales:
        log.warning(f"  [{label}] 品質: investmentScale 不正値: {idea.get('investmentScale')}")

    # difficulty: 定義値チェック
    if idea.get("difficulty") not in {"低", "中", "高"}:
        log.warning(f"  [{label}] 品質: difficulty 不正値: {idea.get('difficulty')}")

    # competitors: 空でないか
    if not idea.get("competitors", "").strip():
        log.warning(f"  [{label}] 品質: competitors が空です")

    # whyNow: 空でないか
    if not idea.get("whyNow", "").strip():
        log.warning(f"  [{label}] 品質: whyNow が空です")

    # noveltyNote: 競合名を含む対比構造か（簡易チェック）
    novelty_note = idea.get("noveltyNote", "")
    if novelty_note and "に対し" not in novelty_note and "のに対して" not in novelty_note:
        log.warning(f"  [{label}] 品質: noveltyNote に対比構造（「〜に対し」）がありません")

    return idea

async def with_retry(coro_fn, label: str = ""):
    """API 呼び出しを最大 MAX_RETRIES 回リトライ（指数バックオフ）"""
    for attempt in range(1, MAX_RETRIES + 1):
        try:
            return await coro_fn()
        except (anthropic.RateLimitError, anthropic.APITimeoutError) as e:
            if attempt < MAX_RETRIES:
                wait = RETRY_BASE_DELAY * attempt
                log.warning(f"[{label}] {type(e).__name__} — {wait}秒後にリトライ ({attempt}/{MAX_RETRIES})")
                await asyncio.sleep(wait)
            else:
                log.error(f"[{label}] 最大リトライ到達")
                raise
        except anthropic.APIError as e:
            if attempt < MAX_RETRIES:
                log.warning(f"[{label}] APIError: {e} — {RETRY_BASE_DELAY}秒後にリトライ ({attempt}/{MAX_RETRIES})")
                await asyncio.sleep(RETRY_BASE_DELAY)
            else:
                raise

# ── Phase 1: 市場調査（3方向を並列実行） ─────────────────────────────

async def search_regulations(theme: str) -> str:
    """規制・法令・市場動向を調査（官公庁一次情報優先）"""
    msg = await with_retry(lambda: ai.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=2000,
        tools=[{"type": "web_search_20250305", "name": "web_search"}],
        messages=[{"role": "user", "content": f"""日本の「{theme}」領域について以下を調査してください。

1. 2023〜2026年に施行・改正された関連法令・規制（施行日・適用範囲・罰則を含む）
2. 2025〜2026年に予定されている規制変化・義務化（確定済みのもののみ）
3. 市場規模の最新データ（出典機関名・調査年・国内/世界の別を必ず明記）
4. 政府・行政の補助金・支援策（正式名称・要件・予算額）

必ず官公庁の一次情報（省庁公式サイト・e-Gov等）を優先してください。
数値は出典が確認できたもののみ記載し、不明な場合は「要確認」と記してください。
施行予定の制度は「確定」と「検討中」を明確に区別してください。"""}],
    ), label=f"regulations/{theme[:12]}")
    return get_text(msg.content)

async def search_competitors(theme: str) -> str:
    """国産競合を日本語で徹底調査（稼働状況・共通仮定の記述を必須とする）"""
    msg = await with_retry(lambda: ai.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=2000,
        tools=[{"type": "web_search_20250305", "name": "web_search"}],
        messages=[{"role": "user", "content": f"""「{theme}」領域の日本国内競合サービスを徹底調査してください。

検索クエリ（全て日本語で実行すること）:
- 「{theme} SaaS 国産 2024 2025」
- 「{theme} スタートアップ 日本 サービス」
- 「{theme} プラットフォーム 比較」

各サービスについて報告（稼働確認済みのもののみ）:
- サービス名・企業名・公式URL
- 主要機能・価格（非公開は「要問合せ」と記載）
- ターゲット顧客・解決する課題
- ユーザーからの不満点・弱点

【重要】2022年以降にサービス終了・廃止・買収・リブランドされたサービスは
「終了済み」または「リブランド済み（新名称: ○○）」と明記すること。
最低5社をリストアップし、各サービスの稼働状況を必ず明記すること。
最後に「競合全社が共通して採用している前提（誰に・何を・どう課金・どこで）」を
1段落でまとめること（アイデア生成のベースになります）。"""}],
    ), label=f"competitors/{theme[:12]}")
    return get_text(msg.content)

async def search_overseas(theme: str) -> str:
    """海外成功事例を英語で調査（日本未参入モデルを優先）"""
    msg = await with_retry(lambda: ai.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=2000,
        tools=[{"type": "web_search_20250305", "name": "web_search"}],
        messages=[{"role": "user", "content": f"""Search for successful overseas business models related to "{theme}" that could be adapted for the Japanese market.

Search queries to run:
- "{theme} startup funding 2024 2025 site:techcrunch.com OR crunchbase.com"
- "{theme} SaaS successful business model Y Combinator OR a16z"
- "{theme} disruption innovative business model"

For each case, report IN JAPANESE:
- 企業名・設立国・公式URL
- ビジネスモデル（誰が・何に・いくら払うか）
- 既存競合との差別化軸（どの「共通仮定」を崩しているか）
- 資金調達額・売上（公開情報のみ）
- 日本市場への適用可能性（有望な理由 or 参入障壁）

日本未参入のモデルを優先すること。最低3社を報告してください。"""}],
    ), label=f"overseas/{theme[:12]}")
    return get_text(msg.content)

async def phase1_research(theme: str) -> dict:
    """3方向の調査を並列実行して統合"""
    log.info(f"  [{theme[:15]}] Phase1: 規制・競合・海外 並列調査開始")
    regs, comps, overseas = await asyncio.gather(
        search_regulations(theme),
        search_competitors(theme),
        search_overseas(theme),
    )
    log.info(
        f"  [{theme[:15]}] Phase1完了 — "
        f"規制:{len(regs)}字 / 競合:{len(comps)}字 / 海外:{len(overseas)}字"
    )
    return {
        "regulations": regs,
        "competitors": comps,
        "overseas": overseas,
        "fetched_at": datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC"),
    }

# ── Phase 2: 複数案生成 ───────────────────────────────────────────────

async def phase2_generate(theme: str, research: dict) -> list:
    """Phase1の調査結果を使って3案を生成（異なる逆転軸で）"""
    log.info(f"  [{theme[:15]}] Phase2: {CANDIDATES_PER_THEME}案生成中...")

    user_prompt = f"""## 生成テーマ
{theme}

## 規制・市場動向（調査済み・{research['fetched_at']}時点）
{research['regulations']}

## 国産競合情報（調査済み）
{research['competitors']}

## 海外成功事例（調査済み・日本市場への転用候補）
{research['overseas']}

## アイデア生成の手順

### 手順1: 競合の共通仮定を分析する
上記競合情報の末尾にある「競合全社の共通仮定」を確認し、4軸を整理する。

### 手順2: 3案それぞれ異なる軸で仮定を逆転させる
- 案A: 顧客セグメントの逆転
- 案B: 収益モデルの逆転
- 案C: 提供形式の逆転（代行 or B2B2C など）

### 手順3: 各案に異業界アナロジーを1つ当てる（必須）
noveltyNote に「（アナロジー元サービス名）×（テーマ）」の構造で明示すること。

### 手順4: 3案のJSON配列を生成する
- slugEn: サービス名の英語スラッグ（例: "care-watch-pro"）
- personaFit: 最も合致するペルソナ名と理由（50字以内）
- 未確認の仮説は「〜と考えられる」等の不確実性表現を使うこと

{FIELD_LIMITS}

## 出力フォーマット（JSON配列・{CANDIDATES_PER_THEME}要素・余分なテキスト禁止）
[
  {JSON_TEMPLATE},
  {JSON_TEMPLATE},
  {JSON_TEMPLATE}
]"""

    msg = await with_retry(lambda: ai.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=8000,
        system=PHASE2_SYSTEM,
        messages=[{"role": "user", "content": user_prompt}],
    ), label=f"phase2/{theme[:12]}")

    raw = get_text(msg.content)
    ideas = extract_json(raw)

    if isinstance(ideas, dict):
        ideas = [ideas]
    elif not isinstance(ideas, list):
        ideas = []

    log.info(f"  [{theme[:15]}] Phase2完了: {len(ideas)}案生成")
    return ideas

# ── Phase 3: ファクトチェック（セマフォで同時実行数を制限） ───────────

_fc_sem = asyncio.Semaphore(MAX_CONCURRENT_FACTCHECKS)

async def phase3_factcheck_one(idea: dict, theme: str, index: int) -> dict:
    """1案をファクトチェック・スコア校正（同時実行数をセマフォで制限）"""
    async with _fc_sem:
        service_name = idea.get("serviceName", f"案{index+1}")
        log.info(f"  [{theme[:15]}] Phase3: 案{index+1} ({service_name}) ファクトチェック中...")

        user_prompt = f"""以下のビジネスアイデア「{service_name}」をファクトチェックし、
誤りを修正した最終版JSONを返してください。

## 確認の優先順位
0. **【最優先・誹謗中傷リスク回避】** competitiveEdge / noveltyNote の文中に実在企業名・サービス名（固有名詞）が含まれていたら必ず削除し、抽象カテゴリ表現（「既存の◯◯」「従来の◯◯」「一般的な◯◯」）に書き換える。例: 「SmartHRは管理が主体だが…」→「既存の人事SaaSは管理が主体だが…」。competitors フィールドの実在名はそのまま残す
1. competitors の全サービスを「サービス名 サービス終了 OR 廃止 OR リブランド」で個別検索
   → 終了済みは削除、リブランド済みは新名称に更新
2. 「{service_name}類似 日本 サービス 2024 2025」を日本語で検索
   → 未記載の重要国産競合があれば追記（最大5社）
3. noveltyNote の「〜は存在しない」「空白地帯」等の表現
   → WebSearchで反証を探し、見つかれば表現を修正しnoveltyスコアを引き下げ
4. problem・scoreComments・whyNow 内の具体的数値・統計
   → 出典確認、見つからなければ定性表現に変換
5. 「義務化」「国内初」「業界初」「補助金の対象」等の強い表現
   → 根拠確認、反証があれば修正
6. whyNow の法令施行年・施行日 → 官公庁一次情報で確認（パターンB・J・Rに注意）
7. patterns の内容がアイデアの収益構造・価値提供と一致するか
   → 不整合なら差し替え
8. noveltyスコア: 類似国産サービスが3社以上存在すれば3以下に修正
9. 全スコア平均が4.0超 → 最も楽観的な1項目を1点引き下げ
10. 全項目同一スコア → 最高値の項目を1点引き下げ
11. whyNow / noveltyNote / strengthNote → 各45〜60字・1文、最新ファクトのみの短文に修正

## ファクトチェック対象JSON
```json
{json.dumps(idea, ensure_ascii=False, indent=2)}
```

修正不要の場合も同一JSONをそのまま返してください。"""

        msg = await with_retry(lambda: ai.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=5000,
            system=PHASE3_SYSTEM,
            tools=[{"type": "web_search_20250305", "name": "web_search"}],
            messages=[{"role": "user", "content": user_prompt}],
        ), label=f"phase3/{theme[:12]}/案{index+1}")

        text = get_text(msg.content)
        result = extract_json(text)

        if result and isinstance(result, dict):
            log.info(f"  [{theme[:15]}] Phase3完了: 案{index+1} → {result.get('serviceName', service_name)}")
            return result

        log.warning(f"  [{theme[:15]}] Phase3: 案{index+1} JSON抽出失敗 — 元データを使用")
        return idea

async def phase3_factcheck_all(ideas: list, theme: str) -> list:
    """全案を並列でファクトチェック（セマフォで同時実行数を制限）"""
    return list(await asyncio.gather(*[
        phase3_factcheck_one(idea, theme, i)
        for i, idea in enumerate(ideas)
    ]))

# ── Phase 4: 評価・最良案選択 ────────────────────────────────────────

async def phase4_select(ideas: list, theme: str) -> dict:
    """ペルソナ適合・意外性・差別化を基準に最良1案を選択"""
    if len(ideas) == 1:
        log.info(f"  [{theme[:15]}] Phase4: 1案のみのためスキップ")
        return ideas[0]

    log.info(f"  [{theme[:15]}] Phase4: {len(ideas)}案から最良を選択中...")

    summaries = "\n\n---\n\n".join([
        f"## 案{i+1}: {idea.get('serviceName', '不明')}\n"
        f"personaFit: {idea.get('personaFit', '未設定')}\n"
        f"novelty:{idea.get('scores',{}).get('novelty',0)} / "
        f"moat:{idea.get('scores',{}).get('moat',0)} / "
        f"feasibility:{idea.get('scores',{}).get('feasibility',0)}\n"
        f"oneLiner: {idea.get('oneLiner','')}\n"
        f"whyNow: {idea.get('whyNow','')}\n"
        f"noveltyNote: {idea.get('noveltyNote','')}\n"
        f"strengthNote: {idea.get('strengthNote','')}"
        for i, idea in enumerate(ideas)
    ])

    user_prompt = f"""テーマ「{theme}」で生成された以下{len(ideas)}案を評価し、最も有望な1案の完全なJSONを返してください。

## 各案のサマリー
{summaries}

## 全案の完全なJSON
```json
{json.dumps(ideas, ensure_ascii=False, indent=2)}
```

選択した案の完全なJSONのみを返してください。選択理由のテキストは不要です。"""

    msg = await with_retry(lambda: ai.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=5000,
        system=PHASE4_SYSTEM,
        messages=[{"role": "user", "content": user_prompt}],
    ), label=f"phase4/{theme[:12]}")

    text = get_text(msg.content)
    selected = extract_json(text)

    if selected and isinstance(selected, dict):
        log.info(f"  [{theme[:15]}] Phase4完了: 選択 → {selected.get('serviceName','不明')}")
        return selected

    log.warning(f"  [{theme[:15]}] Phase4: JSON抽出失敗 — 最初の案を使用")
    return ideas[0]

# ── DB 操作（同期・run_in_executor で呼ぶ） ───────────────────────────

def db_get_max_number() -> int:
    conn = psycopg2.connect(DATABASE_URL)
    try:
        cur = conn.cursor()
        cur.execute('SELECT COALESCE(MAX(number), 0) FROM "Idea"')
        return cur.fetchone()[0]
    finally:
        conn.close()

def db_insert_idea(idea: dict, number: int) -> tuple:
    idea_id = str(uuid.uuid4())
    slug = make_slug(idea, number)
    today = date.today().isoformat()

    conn = psycopg2.connect(DATABASE_URL)
    try:
        cur = conn.cursor()
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
                %s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,
                %s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,
                %s,%s,%s,%s,%s, 0, 0, NOW(), NOW()
            )
        """, (
            idea_id, slug, number,
            idea.get("serviceName", ""),
            idea.get("concept", ""),
            idea.get("target", ""),
            idea.get("problem", ""),
            idea.get("product", ""),
            idea.get("revenueModel", ""),
            idea.get("competitors", ""),
            idea.get("competitiveEdge", ""),
            json.dumps(idea.get("tags", []), ensure_ascii=False),
            idea.get("category", "その他"),
            idea.get("targetIndustry", "全業界"),
            idea.get("targetCustomer", "中小企業"),
            idea.get("investmentScale", "200〜500万円"),
            idea.get("difficulty", "中"),
            json.dumps(idea.get("scores", {}), ensure_ascii=False),
            json.dumps(idea.get("scoreComments", {}), ensure_ascii=False),
            json.dumps(idea.get("trendKeywords", []), ensure_ascii=False),
            idea.get("oneLiner", ""),
            today,
            json.dumps(idea.get("patterns", []), ensure_ascii=False),
            idea.get("whyNow", ""),
            idea.get("noveltyNote", ""),
            idea.get("strengthNote", ""),
            idea.get("patternRationale", ""),
        ))
        conn.commit()
    finally:
        conn.close()

    return idea_id, slug

def db_insert_generation_log(theme: str, idea_id: str, patterns: list):
    session_id = f"batch-{datetime.now().strftime('%Y%m%d')}"
    conn = psycopg2.connect(DATABASE_URL)
    try:
        cur = conn.cursor()
        cur.execute("""
            INSERT INTO "GenerationLog" (
                id, "sessionId", theme, patterns, "newsSourceUrls", "ideaId", "createdAt"
            ) VALUES (%s, %s, %s, %s, %s, %s, NOW())
        """, (
            str(uuid.uuid4()),
            session_id,
            theme,
            json.dumps(patterns, ensure_ascii=False),
            json.dumps([]),
            idea_id,
        ))
        conn.commit()
    finally:
        conn.close()

# ── テーマ1件の処理（4フェーズ + バリデーション） ────────────────────

async def process_theme(theme: str, number: int) -> dict | None:
    log.info(f"\n{'='*60}")
    log.info(f"テーマ: {theme}  (#{number})")
    log.info(f"{'='*60}")

    try:
        # Phase 1: 市場調査（3方向を並列）
        research = await phase1_research(theme)

        # Phase 2: 3案生成
        candidates = await phase2_generate(theme, research)
        if not candidates:
            log.error(f"  [{theme[:15]}] Phase2: 案生成失敗 — スキップ")
            return None

        # Phase 3: 全案を並列ファクトチェック（同時実行数はセマフォで制限）
        log.info(f"  [{theme[:15]}] Phase3: {len(candidates)}案をファクトチェック...")
        checked = await phase3_factcheck_all(candidates, theme)

        # Phase 4: 最良案を選択
        final = await phase4_select(checked, theme)

        # Phase 5: DB INSERT 前の品質バリデーション
        final = validate_and_clean(final, theme)

        # DB保存（asyncio.get_running_loop() を使用）
        loop = asyncio.get_running_loop()
        idea_id, slug = await loop.run_in_executor(None, db_insert_idea, final, number)
        await loop.run_in_executor(
            None, db_insert_generation_log,
            theme, idea_id, final.get("patterns", [])
        )

        log.info(
            f"  [{theme[:15]}] ✅ 完了: "
            f"#{number} {final.get('serviceName','')} (slug: {slug})"
        )
        return {
            "number": number,
            "id": idea_id,
            "slug": slug,
            "serviceName": final.get("serviceName", ""),
        }

    except Exception as e:
        log.error(f"  [{theme[:15]}] ❌ 処理失敗: {e}", exc_info=True)
        return None

# ── メイン ───────────────────────────────────────────────────────────

async def main():
    themes = sys.argv[1:]
    if not themes:
        print("使い方: python generate_ideas.py \"テーマ1\" \"テーマ2\" ...")
        print("例:     python generate_ideas.py \"介護施設の夜間見守り自動化\" \"農業の収穫量予測\"")
        sys.exit(1)

    log.info("AideaSpark アイデア生成パイプライン v2.1 開始")
    log.info(
        f"テーマ数: {len(themes)}件 / "
        f"同時処理: {MAX_CONCURRENT_THEMES}件 / "
        f"1テーマ{CANDIDATES_PER_THEME}案生成 / "
        f"FC同時実行: {MAX_CONCURRENT_FACTCHECKS}件"
    )
    log.info(f"ログ出力先: {_log_filename}")

    loop = asyncio.get_running_loop()
    max_num = await loop.run_in_executor(None, db_get_max_number)
    log.info(f"現在のDB最大number: {max_num}")

    sem = asyncio.Semaphore(MAX_CONCURRENT_THEMES)

    async def guarded(theme: str, number: int):
        async with sem:
            return await process_theme(theme, number)

    tasks = [guarded(theme, max_num + i + 1) for i, theme in enumerate(themes)]
    results = await asyncio.gather(*tasks)

    success = [r for r in results if r]
    failed  = len(themes) - len(success)

    log.info(f"\n{'='*60}")
    log.info("完了サマリー")
    log.info(f"{'='*60}")
    log.info(f"成功: {len(success)}/{len(themes)}件")
    for r in success:
        log.info(f"  #{r['number']} {r['serviceName']} → {r['slug']}")
    if failed:
        log.warning(f"失敗: {failed}件（{_log_filename} を確認してください）")

if __name__ == "__main__":
    asyncio.run(main())
