const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:Bcgconsultant347@db.oszprtmhokcqajxvtfnt.supabase.co:6543/postgres',
  ssl: { rejectUnauthorized: false }
});

async function main() {
  const client = await pool.connect();
  try {
    // -----------------------------------------------
    // #147 NikuTrace: competitors 修正
    // 「日本政策金融公庫の産地証明制度」→ 日本政策金融公庫は産地証明制度を運営していない
    // 正確には農林水産省がGI認証・デジタルトレーサビリティを推進している
    // -----------------------------------------------
    console.log('Updating #147 NikuTrace competitors...');
    const r147 = await client.query(
      `UPDATE "Idea" SET "competitors" = $1, "updatedAt" = NOW() WHERE number = $2 RETURNING number, "serviceName"`,
      [
        'AgriOpen（農業トレーサビリティ）、IBMFood Trust、農林水産省のGI認証・デジタルトレーサビリティ推進施策',
        147
      ]
    );
    console.log('#147 更新結果:', r147.rows);

    // -----------------------------------------------
    // #150 SmartCanteen: competitors 修正
    // 「ドコモヘルスケア（従業員健康管理）」
    // → ドコモ・ヘルスケア株式会社は2020年4月1日にNTTドコモに吸収合併・解散済み
    // → 現在のサービス名称は「NTTドコモ・dヘルスケア」が正確
    // -----------------------------------------------
    console.log('Updating #150 SmartCanteen competitors...');
    const r150c = await client.query(
      `UPDATE "Idea" SET "competitors" = $1, "updatedAt" = NOW() WHERE number = $2 RETURNING number, "serviceName"`,
      [
        'NTTドコモ・dヘルスケア（従業員健康管理）、カロミル（食事記録アプリ）、リロクラブ（福利厚生SaaS）',
        150
      ]
    );
    console.log('#150 competitors 更新結果:', r150c.rows);

    // -----------------------------------------------
    // #150 SmartCanteen: competitiveEdge 修正
    // 「ドコモヘルスケアは活動量計連動が主体」→「NTTドコモのdヘルスケアは」に修正
    // -----------------------------------------------
    console.log('Updating #150 SmartCanteen competitiveEdge...');
    const r150e = await client.query(
      `UPDATE "Idea" SET "competitiveEdge" = $1, "updatedAt" = NOW() WHERE number = $2 RETURNING number, "serviceName"`,
      [
        'カロミルは個人の自主記録が前提で企業が集団として分析する機能がなく、SmartCanteenは社食POSデータを自動取得して企業が医療費削減効果を定量化できるという点が存在しない。NTTドコモのdヘルスケアは活動量計・歩数管理が主体で食事データ自動解析の機能が弱い。',
        150
      ]
    );
    console.log('#150 competitiveEdge 更新結果:', r150e.rows);

    // -----------------------------------------------
    // #150 SmartCanteen: noveltyNote 修正
    // 「ドコモヘルスケアは歩数・活動量の」→「NTTドコモのdヘルスケアは歩数・活動量の」に修正
    // -----------------------------------------------
    console.log('Updating #150 SmartCanteen noveltyNote...');
    const r150n = await client.query(
      `UPDATE "Idea" SET "noveltyNote" = $1, "updatedAt" = NOW() WHERE number = $2 RETURNING number, "serviceName"`,
      [
        'カロミルは個人が自主記録するアプリであり、企業が組織として社食POSデータを自動収集し部署別の健康リスクを可視化するという点が存在しない。NTTドコモのdヘルスケアは歩数・活動量のウェアラブルデータが主体で社食の食事データを自動解析して医療費削減効果を測定するという機能が不在。',
        150
      ]
    );
    console.log('#150 noveltyNote 更新結果:', r150n.rows);

    console.log('\n全更新処理が完了しました。');

  } catch (err) {
    console.error('エラー:', err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

main();
