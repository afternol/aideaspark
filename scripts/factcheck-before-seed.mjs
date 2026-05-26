/**
 * factcheck-before-seed.mjs  v1.0
 *
 * 目的: バッチ生成したアイデアをDB投入（seed）前にWebSearchで自動ファクトチェックし、
 *       確実な誤りを修正した上でファクトチェックレポートを生成する。
 *
 * 使い方:
 *   node scripts/factcheck-before-seed.mjs --file scripts/generated/ph1_SaaS.json
 *   node scripts/factcheck-before-seed.mjs --file scripts/generated/batch_101_120.json
 *   node scripts/factcheck-before-seed.mjs --ts-range 201 210   # ideas.ts の指定ID範囲
 *
 * 出力:
 *   scripts/factcheck-report-{timestamp}.json  修正内容と確認済み事実のレポート
 *   入力ファイル（JSON または ideas.ts）を直接修正する
 */

import Anthropic from "@anthropic-ai/sdk";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import "dotenv/config";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ── エラーパターン集（learnings.md から蒸留） ─────────────────────────────
const ERROR_PATTERNS = `
【必ず確認すべきエラーパターン一覧】

A. 廃止・終了済みサービスの競合欄混入
   - 例: Reduce Go(2021年終了), LINEスマート投資(2022年終了), ペットみるん(2020年終了),
         STRUCTIONSITE(DroneDeploy買収), Savioke(Relay Robotics買収に改名),
         Shelf Engine(Crisp買収), みんなの法人保険(実在不明)
   - 確認方法: サービス名 + "サービス終了" or "廃止" or "閉鎖" で検索

B. 義務化・施行年の誤り（生成AIの学習データ混濁が原因）
   - 例: HACCP義務化「2024年」→正しくは2021年6月
   - 例: 高校金融教育「2025年義務化」→正しくは2022年度学習指導要領で必修化
   - 例: 種苗法「2025年完全施行」→正しくは2022年4月完全施行
   - 確認方法: 「〇〇 義務化 施行 年」で検索し一次ソース確認

C. 統計数値の誤り（食材ロス率・企業数・人口等）
   - 例: 食材ロス率「15〜30%」→正しくは「3〜5%」
   - 例: 教員数「90万人」→正しくは「66万人」
   - 確認方法: 統計数値は省庁公式サイト・調査機関で確認

D. 市場規模の時点・出所誤り
   - 調査年と対象年の混同（矢野経済研究所等は前年市場規模を発表）
   - 現在値と将来予測値、国内と世界の数値混在
   - 例: 睡眠市場「2030年2,162億円」→正しくは「2027年160億円（矢野経済研究所）」
   - 対策: 「○○年調査・○○年市場規模・国内/世界」の3軸を明記

E. 企業名・サービス名の誤記・リブランド未反映
   - GVA assist → OLGA（2024年11月リブランド）
   - Holmes → ContractS CLM（旧Holmes）
   - LegalForce（製品名は継続・会社名はLegalOn Technologies）
   - Nuance DAX → Dragon Copilot（2025年3月リブランド）
   - PayPay資産運用 → PayPay証券（2026年2月）
   - カレコ → 三井のカーシェアーズ（2024年2月）
   - HiPro Biz → HiPro Direct
   - Spotify for Podcasters → Spotify for Creators（2024年11月）
   - 確認方法: サービス名 + "2024 OR 2025 OR 2026 リブランド OR 名称変更" で検索

F. EU規制・国際規制の日程誤り
   - EU CSDDD: Omnibus I改正で2028年7月転置・2029年7月適用に延期（対象70%削減）
   - GDPR「2024年特定強化」→2018年施行の継続適用が正確（2024年強化策は存在しない）
   - 確認方法: EU規制は欧州委員会公式サイトで最新情報確認

G. 法令の根拠条文・命令名の誤記
   - 例: 人的資本開示義務の根拠「金融商品取引法改正」→正しくは「企業内容等の開示に関する内閣府令改正」
   - 法律改正と省令・政令・内閣府令改正の混同
   - 確認方法: 法令名 + 施行日 + 条文で検索

H. ハードウェア製品のEOL（製造終了）
   - HoloLens 2: 2024年10月製造終了・2024年12月販売在庫終了
   - Meta Quest Pro: 2024年3月販売終了
   - 確認方法: ハードウェア製品名 + "EOL OR 製造終了 OR 販売終了" で検索

I. 架空サービス・企業名の競合欄混入
   - 「ディスカバー農業」「横浜生命保険」「BAONZ（正しくはBATONZ）」等
   - 確認方法: 固有名詞は必ず公式サイトの存在をWebSearchで確認

J. 和暦→西暦換算ミス（令和6年=2024年、令和7年=2025年）
   - 例: 「令和6年4月施行」を「2026年4月施行予定」と誤記
   - 確認方法: 和暦年号は「令和X年 = 平成X+88年 = 西暦X+2018年」で換算確認

K. 料金・価格の非公開サービスへの具体額記述
   - LegalForce/OLGA等は料金非公開なのに「月額XX万円超」と記載
   - 確認方法: サービス名 + "料金" で検索し非公開なら定性表現に変更

L. 外食への法令義務化の誤適用
   - 食品表示法のアレルゲン表示義務は容器包装食品が対象（外食は対象外）
   - 確認方法: 法令名 + 対象範囲 で検索

M. 倍率と増加率の混同
   - 「前年度比131%増」と「前年度比131%（=1.31倍）」は全く異なる
   - 確認方法: 原文の表現を確認し正確に記述

N. 農業関連法の改正年・名称混濁
   - 正式名称は「食料・農業・農村基本法」（「農業基本法」は旧法の通称）
   - 2024年6月施行（「2025年改正農業基本法」は二重の誤り）
   - 確認方法: 農林水産省公式サイトで確認

O. 競合の「できないこと」記述の陳腐化
   - 「〇〇機能を持たない」系は競合の機能追加で陳腐化しやすい
   - 確認方法: 競合サービス名 + "新機能 2024 OR 2025 OR 2026" で検索

P. 架空の政府補助金・事業名
   - 例:「スマート農業実装推進事業」は存在しない（実在: スマート農業実証プロジェクト）
   - 確認方法: 事業名 + "農林水産省 OR 経済産業省 OR 国土交通省" で検索

Q. 同一アイデア内の数値矛盾
   - 複数フィールドに同一指標が異なる値で記述されているケース
   - 確認方法: アイデア内の数値を横断比較

R. 3年/周期改定制度の中間年記述誤り
   - 介護報酬改定は3年ごと（2021→2024→2027年）。「2025年改定」は存在しない
   - 診療報酬・診療報酬改定は2年ごと
   - 確認方法: 「〇〇報酬 改定年度 スケジュール」で検索
`;

// ── フィールド別チェック優先度 ─────────────────────────────────
const HIGH_PRIORITY_FIELDS = ['competitors', 'whyNow', 'noveltyNote', 'competitiveEdge', 'scoreComments'];
const MEDIUM_PRIORITY_FIELDS = ['problem', 'concept', 'revenueModel', 'strengthNote'];

// ── 対象アイデアの読み込み ──────────────────────────────────────
function loadIdeasFromJson(filePath) {
  const raw = readFileSync(filePath, 'utf8');
  return JSON.parse(raw);
}

function loadIdeasFromTsRange(startId, endId) {
  const tsPath = join(ROOT, 'src/data/mock/ideas.ts');
  const src = readFileSync(tsPath, 'utf-8');
  const cleaned = src
    .replace(/import type.*?\n/g, '')
    .replace(/import.*?from.*?\n/g, '')
    .replace(/export const mockIdeas(?::\s*BusinessIdea\[\])?\s*=/, 'const mockIdeas =');
  const mockIdeas = new Function(cleaned + '\nreturn mockIdeas;')();
  return mockIdeas.filter(i => {
    const num = parseInt(i.id.replace('idea-', ''));
    return num >= startId && num <= endId;
  });
}

// ── アイデアのファクトチェックプロンプト生成 ──────────────────────
function buildFactcheckPrompt(ideas) {
  const ideaSummaries = ideas.map(idea => {
    const sc = typeof idea.scoreComments === 'object'
      ? Object.entries(idea.scoreComments).map(([k,v]) => `  ${k}: ${v}`).join('\n')
      : idea.scoreComments;
    return `
【${idea.id}: ${idea.serviceName}】
category: ${idea.category}
problem: ${idea.problem}
competitors: ${idea.competitors}
competitiveEdge: ${idea.competitiveEdge}
whyNow: ${(idea).whyNow ?? '(なし)'}
noveltyNote: ${(idea).noveltyNote ?? '(なし)'}
strengthNote: ${(idea).strengthNote ?? '(なし)'}
scoreComments:
${sc}
`.trim();
  }).join('\n\n---\n\n');

  return `あなたは日本のビジネス市場に精通したファクトチェッカーです。
以下の${ideas.length}件のビジネスアイデアについて、WebSearchを使って徹底的にファクトチェックを実施してください。

${ERROR_PATTERNS}

【チェック対象アイデア】
${ideaSummaries}

【実施手順】
1. 各アイデアの以下を特定し、WebSearchで検証してください:
   - competitorsに含まれる全サービス名（廃止・リブランド・架空でないか）
   - whyNowの法令施行年・統計数値・市場動向（正確かつ最新か）
   - noveltyNoteの「〇〇は存在しない」「〇〇はできない」という主張（今も正確か）
   - whyNow / noveltyNote / strengthNote が45〜60文字・1文で、最新公開情報に基づく事実のみか
   - competitiveEdgeの競合への言及（企業名・機能・料金が正確か）
   - scoreCommentsの統計数値（出典・時点が正確か）

2. 上記エラーパターンA〜Rに照らして確認してください。

3. 検索は具体的に実施してください:
   - 競合サービス名: "[サービス名] サービス終了 OR 廃止 OR リブランド 2023 OR 2024 OR 2025 OR 2026"
   - 法令施行年: "[法令名] 施行日 施行年"
   - 統計数値: "[統計の内容] [省庁名] 最新"

4. インサイトカード3項目の補正:
   - whyNow / noveltyNote / strengthNote は各45〜60文字・1文に圧縮してください
   - WebSearchで確認できた最新公開情報、現存競合、実際の仕組みに基づく記述だけ残してください
   - 根拠が取れない数値・法令名・競合差分・優位性は削除または定性表現にしてください
   - 「存在しない」「空白地帯」「国内初」「唯一」「急増」など未検証断定は禁止です

【出力形式】
以下のJSON形式で回答してください（コードブロック内に）:

{
  "results": [
    {
      "id": "idea-XXX",
      "serviceName": "サービス名",
      "checks": [
        {
          "field": "フィールド名",
          "issue": "発見した誤り・問題点（具体的に）",
          "original": "現在の記述（該当箇所のみ）",
          "correction": "修正後の記述",
          "source": "確認したURL・ソース名",
          "pattern": "該当するエラーパターン（A〜R）",
          "severity": "high/medium/low"
        }
      ],
      "confirmed": [
        "正確と確認した主要事実（1文ずつ）"
      ]
    }
  ]
}

誤りが見つからない場合は checks を空配列にして、confirmed に確認済み事実を記述してください。
架空サービス・廃止サービスは severity: high で必ず報告してください。
数値・法令年の誤りも severity: high または medium で報告してください。`;
}

// ── JSON文字列の抽出 ──────────────────────────────────────────
function extractJson(text) {
  const match = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (match) return match[1];
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start !== -1 && end !== -1) return text.slice(start, end + 1);
  return null;
}

// ── JSON/TSファイルへの修正適用 ─────────────────────────────────
function applyFixesToJson(filePath, fixes) {
  const ideas = JSON.parse(readFileSync(filePath, 'utf8'));
  let applied = 0;
  for (const fix of fixes) {
    const idea = ideas.find(i => i.id === fix.id);
    if (!idea) continue;
    for (const check of fix.checks) {
      if (check.severity === 'high' || check.severity === 'medium') {
        if (check.field && check.original && check.correction && idea[check.field]) {
          const before = idea[check.field];
          idea[check.field] = before.replace(check.original, check.correction);
          if (idea[check.field] !== before) {
            console.log(`  ✏ ${fix.id}.${check.field}: [${check.pattern}] ${check.issue.slice(0, 60)}...`);
            applied++;
          }
        }
      }
    }
  }
  writeFileSync(filePath, JSON.stringify(ideas, null, 2), 'utf8');
  return applied;
}

function applyFixesToTs(fixes) {
  const tsPath = join(ROOT, 'src/data/mock/ideas.ts');
  let src = readFileSync(tsPath, 'utf8');
  let applied = 0;
  for (const fix of fixes) {
    for (const check of fix.checks) {
      if ((check.severity === 'high' || check.severity === 'medium') && check.original && check.correction) {
        if (src.includes(check.original)) {
          src = src.replace(check.original, check.correction);
          console.log(`  ✏ ${fix.id}.${check.field}: [${check.pattern}] ${check.issue.slice(0, 60)}...`);
          applied++;
        }
      }
    }
  }
  writeFileSync(tsPath, src, 'utf8');
  return applied;
}

// ── バッチ処理（3件ずつ） ─────────────────────────────────────
const BATCH_SIZE = 3;

async function factcheckBatch(ideas) {
  const prompt = buildFactcheckPrompt(ideas);
  console.log(`  → ${ideas.map(i => i.id).join(', ')} を検証中...`);

  const msg = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 8000,
    tools: [{ type: 'web_search_20250305', name: 'web_search' }],
    messages: [{ role: 'user', content: prompt }],
  });

  const textBlocks = msg.content.filter(b => b.type === 'text').map(b => b.text).join('\n');
  const jsonStr = extractJson(textBlocks);
  if (!jsonStr) {
    console.warn('  ⚠ JSON抽出失敗 — テキスト全文:');
    console.warn(textBlocks.slice(0, 500));
    return { results: ideas.map(i => ({ id: i.id, serviceName: i.serviceName, checks: [], confirmed: [] })) };
  }

  try {
    return JSON.parse(jsonStr);
  } catch (e) {
    console.warn('  ⚠ JSONパースエラー:', e.message);
    return { results: ideas.map(i => ({ id: i.id, serviceName: i.serviceName, checks: [], confirmed: [] })) };
  }
}

// ── メイン ──────────────────────────────────────────────────
async function main() {
  const args = process.argv.slice(2);
  const fileArg = args.find((_, i) => args[i - 1] === '--file');
  const tsRangeStart = parseInt(args.find((_, i) => args[i - 1] === '--ts-range') ?? '0');
  const tsRangeEnd = parseInt(args.find((_, i) => args[i - 2] === '--ts-range') ?? '0');

  let ideas = [];
  let sourceMode = 'json';
  let sourcePath = '';

  if (fileArg) {
    sourcePath = join(ROOT, fileArg.startsWith('scripts/') ? fileArg : `scripts/generated/${fileArg}`);
    if (!existsSync(sourcePath)) {
      console.error(`ファイルが見つかりません: ${sourcePath}`);
      process.exit(1);
    }
    ideas = loadIdeasFromJson(sourcePath);
    sourceMode = 'json';
    console.log(`📂 ${sourcePath} から ${ideas.length} 件読み込み`);
  } else if (tsRangeStart > 0) {
    ideas = loadIdeasFromTsRange(tsRangeStart, tsRangeEnd || tsRangeStart + 9);
    sourceMode = 'ts';
    console.log(`📂 ideas.ts から ${ideas.length} 件（id-${String(tsRangeStart).padStart(3,'0')}〜${String(tsRangeEnd || tsRangeStart+9).padStart(3,'0')}）読み込み`);
  } else {
    console.log('使い方:');
    console.log('  node scripts/factcheck-before-seed.mjs --file scripts/generated/ph1_SaaS.json');
    console.log('  node scripts/factcheck-before-seed.mjs --ts-range 201 210');
    process.exit(0);
  }

  const allResults = [];
  let totalIssues = 0;
  let totalFixed = 0;

  console.log(`\n🔍 ファクトチェック開始 — ${ideas.length} 件 / バッチサイズ ${BATCH_SIZE}`);
  console.log('='.repeat(60));

  for (let i = 0; i < ideas.length; i += BATCH_SIZE) {
    const batch = ideas.slice(i, i + BATCH_SIZE);
    console.log(`\n[${i + 1}〜${Math.min(i + BATCH_SIZE, ideas.length)} / ${ideas.length}]`);

    let result;
    try {
      result = await factcheckBatch(batch);
    } catch (e) {
      console.error(`  ❌ API エラー: ${e.message}`);
      continue;
    }

    for (const r of result.results || []) {
      const highSeverity = (r.checks || []).filter(c => c.severity === 'high');
      const medSeverity  = (r.checks || []).filter(c => c.severity === 'medium');
      totalIssues += r.checks?.length ?? 0;
      console.log(`  ${r.id} (${r.serviceName}): 問題${r.checks?.length ?? 0}件 (高${highSeverity.length}件/中${medSeverity.length}件), 確認済み${r.confirmed?.length ?? 0}件`);
      for (const c of highSeverity) {
        console.log(`    🔴 [${c.pattern}] ${c.field}: ${c.issue}`);
      }
      for (const c of medSeverity) {
        console.log(`    🟡 [${c.pattern}] ${c.field}: ${c.issue}`);
      }
    }
    allResults.push(...(result.results || []));

    // レート制限対策
    if (i + BATCH_SIZE < ideas.length) {
      await new Promise(r => setTimeout(r, 2000));
    }
  }

  // 修正の適用
  console.log('\n' + '='.repeat(60));
  console.log('📝 修正を適用中...');

  const fixableResults = allResults.filter(r => r.checks?.some(c => c.severity === 'high' || c.severity === 'medium'));
  if (fixableResults.length > 0) {
    if (sourceMode === 'json') {
      totalFixed = applyFixesToJson(sourcePath, fixableResults);
    } else {
      totalFixed = applyFixesToTs(fixableResults);
    }
  }

  // レポート生成
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const report = {
    generatedAt: new Date().toISOString(),
    source: sourceMode === 'json' ? sourcePath : 'ideas.ts',
    totalIdeas: ideas.length,
    totalIssues,
    totalFixed,
    results: allResults,
  };
  const reportPath = join(__dirname, `factcheck-report-${timestamp}.json`);
  writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf8');

  console.log('\n' + '='.repeat(60));
  console.log(`✅ 完了`);
  console.log(`   総件数   : ${ideas.length} 件`);
  console.log(`   問題検出 : ${totalIssues} 件`);
  console.log(`   自動修正 : ${totalFixed} 件`);
  console.log(`   レポート : ${reportPath}`);
  console.log('='.repeat(60));
  console.log('\n次のステップ: npx tsx prisma/seed.ts');
}

main().catch(e => {
  console.error('Fatal error:', e);
  process.exit(1);
});
