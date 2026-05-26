const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:Bcgconsultant347@db.oszprtmhokcqajxvtfnt.supabase.co:6543/postgres',
  ssl: { rejectUnauthorized: false }
});

async function main() {
  const client = await pool.connect();
  try {
    // -----------------------------------------------
    // idea-101: competitors の旧名称表記を修正
    // 「OLGA（旧GVA assist）」→「OLGA（旧GVA）」
    // 理由: OLGAは2024年11月1日にGVA TECH社の統合プラットフォーム「GVA」全体（GVA manage/
    //       GVA assist/GVA Contract Management の3製品）から改称されたもの。
    //       「旧GVA assist」は一モジュールの名称にすぎず、正確な旧ブランド名は「GVA」。
    // -----------------------------------------------
    console.log('Updating idea-101 competitors...');
    const r101 = await client.query(
      `UPDATE "Idea" SET "competitors" = $1, "updatedAt" = NOW() WHERE number = $2 RETURNING number`,
      [
        'LegalForce、ContractS CLM（旧Holmes）、OLGA（旧GVA）',
        101
      ]
    );
    console.log('idea-101 updated:', r101.rows);

    // -----------------------------------------------
    // idea-107: competitors を全面修正
    // 旧値: エムスリー、JMDC、MedPeer
    // 新値: エムスリーデジカル（M3 Digikar）、Nuance DAX（Microsoft）、SOAP NOTE AI
    // 理由: エムスリー（製薬マーケ・医師情報サイト）、JMDC（医療ビッグデータ分析）、
    //       MedPeer（医師コミュニティ）はいずれも「診察音声→SOAPカルテ自動生成」の
    //       競合サービスを提供していない。競合として適切なのは：
    //       ・エムスリーデジカル: クラウド電子カルテでAI音声入力・学習機能を持つ直接競合
    //       ・Nuance DAX（Microsoft）: 医師向けAI音声アンビエント記録の国際標準製品
    //       ・SOAP NOTE AI: 診察→SOAP変換の新興AIサービス
    // -----------------------------------------------
    console.log('Updating idea-107 competitors...');
    const r107_comp = await client.query(
      `UPDATE "Idea" SET "competitors" = $1, "updatedAt" = NOW() WHERE number = $2 RETURNING number`,
      [
        'エムスリーデジカル（M3 Digikar）、Nuance DAX（Microsoft）、SOAP NOTE AI',
        107
      ]
    );
    console.log('idea-107 competitors updated:', r107_comp.rows);

    // idea-107: competitiveEdge も修正（旧competitors名称を参照していたため）
    console.log('Updating idea-107 competitiveEdge...');
    const r107_edge = await client.query(
      `UPDATE "Idea" SET "competitiveEdge" = $1, "updatedAt" = NOW() WHERE number = $2 RETURNING number`,
      [
        'エムスリーデジカルはAI学習による入力補助・テンプレート提案が中心で、診察会話からのリアルタイムSOAP構造化は機能範囲外。Nuance DAX（Microsoft）は英語圏主体で国内電子カルテ（ORCA・Medicom）との連携が未整備。国内クリニック向けの日本語医療音声認識×既存電子カルテ連携×SOAP自動生成を一体提供する設計が差別化軸。',
        107
      ]
    );
    console.log('idea-107 competitiveEdge updated:', r107_edge.rows);

    // idea-107: noveltyNote も修正
    console.log('Updating idea-107 noveltyNote...');
    const r107_novelty = await client.query(
      `UPDATE "Idea" SET "noveltyNote" = $1, "updatedAt" = NOW() WHERE number = $2 RETURNING number`,
      [
        'エムスリーデジカルはAI入力予測・テンプレートが主体で、診察音声からのリアルタイムSOAP生成機能は持たない。Nuance DAX等の海外製品は国内電子カルテ連携・日本語医療用語対応が未整備。国内クリニック向け日本語特化の診察音声→SOAP自動構造化は国内で先行事例が少なく差別化余地が大きい。',
        107
      ]
    );
    console.log('idea-107 noveltyNote updated:', r107_novelty.rows);

    console.log('\nAll updates completed successfully!');
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
