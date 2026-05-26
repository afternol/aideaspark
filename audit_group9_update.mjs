import pg from 'pg';

const pool = new pg.Pool({
  connectionString: 'postgresql://postgres:Bcgconsultant347@db.oszprtmhokcqajxvtfnt.supabase.co:6543/postgres'
});

async function runUpdates() {
  const client = await pool.connect();
  try {
    // ===== #181 SiteWalkXR =====
    // StructionSiteは2022年にDroneDeployに買収され、2024年11月にDroneDeploy Groundへ完全統合・終了
    // Autodesk BIM 360は正式名称がAutodesk Construction Cloudに変更（2021年〜）

    const newCompetitors181 = 'DroneDeploy（旧StructionSite統合先）、トプコン（建設測量機器）、フォトラス（点群管理SaaS）、Autodesk Construction Cloud';

    const newCompetitiveEdge181 = 'Autodesk Construction Cloud（旧BIM 360）は設計・施工管理の総合プラットフォームだが、現場での差分自動検出とARグラスによるリアルタイム遠隔立会いの組み合わせは提供しておらず、SiteWalkXRは「手戻りゼロ」に特化した一点突破が可能。';

    const newNoveltyNote181 = 'フォトラスは点群データ管理に強みを持つが、設計BIMとの自動差分アラートおよびリアルタイムXR遠隔立会い機能は提供していない。Autodesk Construction Cloud（旧BIM 360）は施工管理の広範な機能を持つが、現場でのARグラス活用を前提とした遠隔立会いワークフローが存在しない。';

    await client.query(
      'UPDATE "Idea" SET competitors = $1, "competitiveEdge" = $2, "noveltyNote" = $3, "updatedAt" = NOW() WHERE number = $4',
      [newCompetitors181, newCompetitiveEdge181, newNoveltyNote181, 181]
    );
    console.log('✅ #181 SiteWalkXR updated');

    // ===== #183 FitMirrorAR =====
    // scoreComments.marketSize: 「国内アパレル市場は10兆円超」→8兆円台が正確
    // （矢野経済研究所調査: 2022年8.06兆円、2023年8.36兆円）

    const idea183 = await client.query('SELECT "scoreComments" FROM "Idea" WHERE number = $1', [183]);
    const sc183 = idea183.rows[0].scoreComments;
    sc183.marketSize = '国内アパレル総小売市場は8兆円台（矢野経済研究所2023年調査: 8.36兆円）でDX投資余地が大きい';

    await client.query(
      'UPDATE "Idea" SET "scoreComments" = $1, "updatedAt" = NOW() WHERE number = $2',
      [JSON.stringify(sc183), 183]
    );
    console.log('✅ #183 FitMirrorAR updated');

    // ===== #184 FactoryTwinOS =====
    // whyNow: Microsoft HoloLens 2は2024年12月に販売終了・2025年2月ハードウェア開発撤退確定
    // 「価格下落」の事実と現状に齟齬があるため更新

    const newWhyNow184 = '経済産業省のスマートファクトリー推進政策と2030年カーボンニュートラル目標が重なり、製造業のデジタル化投資が加速している。Meta Quest ProによるVR設備の法人調達コストが現実的になった。なお、Microsoft HoloLens 2は2024年12月に販売終了・2025年2月にMicrosoftがハードウェア開発から撤退しており、MR活用においては代替デバイス（Meta Quest等）の選定が前提となっている。';

    await client.query(
      'UPDATE "Idea" SET "whyNow" = $1, "updatedAt" = NOW() WHERE number = $2',
      [newWhyNow184, 184]
    );
    console.log('✅ #184 FactoryTwinOS updated');

    console.log('\n全更新完了');
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

runUpdates();
