const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres:Bcgconsultant347@db.oszprtmhokcqajxvtfnt.supabase.co:5432/postgres'
});

// ファクトチェック結果に基づく修正データ
// 修正対象:
// #111 PayNext: GMO掛け払いはAIリアルタイム与信を実際に提供しており「強みがない」は不正確
// #113 コツコツ: PayPay資産運用→PayPay証券へ2026年2月9日に名称変更済み

const updates = [
  {
    number: 111,
    field: 'competitiveEdge',
    oldValue: 'Paid（ラクーンHD）は請求書後払い管理が主体でAIリアルタイム与信審査と即時入金の組み合わせは持たない。GMOPGはGMOペイメントサービス経由でBtoB「GMO掛け払い」も提供しているが、AIリアルタイム与信審査と中小企業向け取引データ型与信に強みがない。本サービスは取引データを活用したAI与信の速度と中小BtoB特化の設計が差別化。',
    newValue: 'Paid（ラクーンHD）は請求書後払い管理が主体でAIリアルタイム与信審査と即時入金の組み合わせは持たない。GMOPGはGMOペイメントサービス経由でBtoB「GMO掛け払い」も提供しており、リアルタイム与信（数秒）と機械学習ベースのAI与信エンジンを実装しているが、受発注プラットフォームへの深いAPI統合と即時入金・60日後払いの同時提供という組み合わせは対象外。本サービスは受発注データ連動の与信設計と売り手即時入金・買い手後払いの一体型BNPLモデルが差別化。',
    reason: 'GMO掛け払いはリアルタイム与信・機械学習AI与信を実際に提供。「強みがない」は不正確なため修正。'
  },
  {
    number: 113,
    field: 'competitors',
    oldValue: 'PayPay証券（旧PayPay資産運用）、FOLIO（ROBOPRO）、SBI証券ミニ株',
    newValue: 'PayPay証券（旧PayPay資産運用、2026年2月よりミニアプリ名称変更）、FOLIO（ROBOPRO）、SBI証券ミニ株',
    reason: 'PayPay資産運用は2026年2月9日にPayPayミニアプリ名称がPayPay証券に変更。既存表記は大筋正確だが変更時期を明記。'
  },
  {
    number: 113,
    field: 'competitiveEdge',
    oldValue: 'PayPay証券（旧PayPay資産運用）はPayPay残高の運用・積立が主体で消費データ分析による最適積立額の自動計算は持たない。FOLIOはテーマ投資を2024年6月に終了しROBOPRO（投資一任型）に特化しており、消費データ分析による自動積立設計は持たない。本サービスは消費→貯蓄→投資の行動データを統合したAI最適化が差別化軸で、Z世代のSNS共有欲求に応えたUXが口コミ拡散を促す。',
    newValue: 'PayPay証券（旧PayPay資産運用、2026年2月よりPayPayミニアプリ名称変更）はPayPay残高の運用・積立が主体で消費データ分析による最適積立額の自動計算は持たない。FOLIOはテーマ投資を2024年6月に終了しROBOPRO（投資一任型）に特化しており、消費データ分析による自動積立設計は持たない。本サービスは消費→貯蓄→投資の行動データを統合したAI最適化が差別化軸で、Z世代のSNS共有欲求に応えたUXが口コミ拡散を促す。',
    reason: 'PayPay資産運用→PayPay証券の名称変更（2026年2月）を明記。'
  }
];

async function run() {
  await client.connect();
  console.log('DB接続成功');

  // まず現在のデータを確認
  console.log('\n--- 修正対象の現在値確認 ---');
  for (const update of updates) {
    const res = await client.query(
      `SELECT number, "serviceName", "competitors", "competitiveEdge" FROM "Idea" WHERE number = $1`,
      [update.number]
    );
    if (res.rows.length > 0) {
      const row = res.rows[0];
      console.log(`\n#${update.number} ${row.serviceName}`);
      if (update.field === 'competitors') {
        console.log(`  competitors (現在): ${row.competitors}`);
      } else {
        console.log(`  competitiveEdge (現在): ${row.competitiveEdge?.substring(0, 100)}...`);
      }
    }
  }

  // 実際の更新処理
  console.log('\n--- DB更新実行 ---');

  // #111: competitiveEdge更新
  const update111 = updates[0];
  const res111 = await client.query(
    `UPDATE "Idea" SET "competitiveEdge" = $1, "updatedAt" = NOW() WHERE number = $2 RETURNING number, "serviceName"`,
    [update111.newValue, update111.number]
  );
  if (res111.rows.length > 0) {
    console.log(`✓ #${res111.rows[0].number} ${res111.rows[0].serviceName}: competitiveEdge 更新完了`);
    console.log(`  理由: ${update111.reason}`);
  }

  // #113: competitors更新
  const update113c = updates[1];
  const res113c = await client.query(
    `UPDATE "Idea" SET "competitors" = $1, "updatedAt" = NOW() WHERE number = $2 RETURNING number, "serviceName"`,
    [update113c.newValue, update113c.number]
  );
  if (res113c.rows.length > 0) {
    console.log(`✓ #${res113c.rows[0].number} ${res113c.rows[0].serviceName}: competitors 更新完了`);
  }

  // #113: competitiveEdge更新
  const update113e = updates[2];
  const res113e = await client.query(
    `UPDATE "Idea" SET "competitiveEdge" = $1, "updatedAt" = NOW() WHERE number = $2 RETURNING number, "serviceName"`,
    [update113e.newValue, update113e.number]
  );
  if (res113e.rows.length > 0) {
    console.log(`✓ #${res113e.rows[0].number} ${res113e.rows[0].serviceName}: competitiveEdge 更新完了`);
    console.log(`  理由: ${update113e.reason}`);
  }

  // 更新後の確認
  console.log('\n--- 更新後確認 ---');
  for (const num of [111, 113]) {
    const res = await client.query(
      `SELECT number, "serviceName", "competitors", "competitiveEdge", "updatedAt" FROM "Idea" WHERE number = $1`,
      [num]
    );
    if (res.rows.length > 0) {
      const row = res.rows[0];
      console.log(`\n#${row.number} ${row.serviceName} (updatedAt: ${row.updatedAt})`);
      console.log(`  competitors: ${row.competitors}`);
      console.log(`  competitiveEdge: ${row.competitiveEdge?.substring(0, 150)}...`);
    }
  }

  await client.end();
  console.log('\nDB接続終了');
}

run().catch(err => {
  console.error('エラー:', err);
  client.end();
  process.exit(1);
});
