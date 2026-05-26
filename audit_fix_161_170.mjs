import pg from 'pg';
const pool = new pg.Pool({ connectionString: 'postgresql://postgres:Bcgconsultant347@db.oszprtmhokcqajxvtfnt.supabase.co:5432/postgres' });

const fixes = [];

// #161 ContractFlow: competitors「GVA assist」→「OLGA（旧GVA assist）」
// GVA assistは2024年11月1日にOLGAへ名称変更済み
const fix161 = await pool.query(
  `UPDATE "Idea" SET competitors = $1, "updatedAt" = NOW() WHERE number = $2 RETURNING number, competitors`,
  ['OLGA（旧GVA assist）、LegalForce、Hubble、Contract One', 161]
);
fixes.push({ number: 161, field: 'competitors', result: fix161.rows[0] });

// #163 M&Aルーム: competitiveEdgeの「BAONZ」→「BATONZ」（誤記修正）
const fix163 = await pool.query(
  `UPDATE "Idea" SET "competitiveEdge" = $1, "updatedAt" = NOW() WHERE number = $2 RETURNING number, "competitiveEdge"`,
  ['BATONZやM&A総合研究所はM&Aマッチング仲介が主機能でDDプロセス支援ツールとしての機能が薄い。M&Aルームは「DDを乗り越えるためのバーチャルデータルーム」に特化し、マッチング後の最難関プロセスを支援することで現存の仲介業者を補完する独自ポジションを取る。', 163]
);
fixes.push({ number: 163, field: 'competitiveEdge', result: fix163.rows[0] });

// #165 IPGuardian: competitiveEdgeの「TOCotobox」→「Cotobox」（誤記修正）
const fix165 = await pool.query(
  `UPDATE "Idea" SET "competitiveEdge" = $1, "updatedAt" = NOW() WHERE number = $2 RETURNING number, "competitiveEdge"`,
  ['J-PlatPatは自分で調べるための無料ツールで自動監視機能がない。Cotoboxは商標出願支援に特化しており取得後の侵害監視には対応していない。IPGuardianは取得後の「守る」フェーズに特化し、侵害発見→弁理士対応まで自動化することで知財の維持管理を月額で完結させる。', 165]
);
fixes.push({ number: 165, field: 'competitiveEdge', result: fix165.rows[0] });

// #169 KeiretsuCheck: whyNowの犯罪収益移転防止法記述を正確な内容に修正
// 実際：2024年改正は4士業への確認義務追加が主
const fix169 = await pool.query(
  `UPDATE "Idea" SET "whyNow" = $1, "updatedAt" = NOW() WHERE number = $2 RETURNING number, "whyNow"`,
  ['改正犯罪収益移転防止法（2024年施行）で士業4業種（司法書士・行政書士・公認会計士・税理士）への本人確認・疑わしい取引届出義務が追加され、2027年改正でさらに本人確認手法の厳格化が予定されるなど、マネーロンダリング対策義務の対象と水準が段階的に強化されている。これまで実施していなかった業種でも反社チェック・KYCへの対応ニーズが急増している。LLMとWebスクレイピング技術の組み合わせで複数情報源の横断検索と結果整合が自動化でき、人手依存の調査プロセスを月額数万円のSaaSで代替できるコスト構造になった。', 169]
);
fixes.push({ number: 169, field: 'whyNow', result: fix169.rows[0] });

console.log('=== 修正完了 ===');
fixes.forEach(f => {
  console.log(`#${f.number} ${f.field}: 更新OK`);
});

await pool.end();
