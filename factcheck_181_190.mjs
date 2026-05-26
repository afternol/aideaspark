import pg from 'pg';

const pool = new pg.Pool({
  connectionString: 'postgresql://postgres:Bcgconsultant347@db.oszprtmhokcqajxvtfnt.supabase.co:5432/postgres'
});

async function main() {
  const client = await pool.connect();

  try {
    // まず対象レコードの現在値を確認
    console.log('=== 現在の値を確認 ===');
    const res = await client.query(`
      SELECT number, "serviceName", "whyNow", "competitors", "scoreComments"
      FROM "Idea"
      WHERE number BETWEEN 181 AND 190
      ORDER BY number
    `);

    for (const row of res.rows) {
      console.log(`\n--- #${row.number} ${row.serviceName} ---`);
      console.log('whyNow:', row.whyNow?.substring(0, 100));
      console.log('competitors:', row.competitors?.substring(0, 100));
      console.log('scoreComments:', JSON.stringify(row.scoreComments)?.substring(0, 200));
    }

    console.log('\n=== 修正を実行 ===');

    // #181 SiteWalkXR: STRUCTIONSITEはDroneDeployに買収済みのため修正
    await client.query(`
      UPDATE "Idea"
      SET "competitors" = REPLACE("competitors", 'STRUCTIONSITE', 'DroneDeploy（StructionSite統合済）'),
          "updatedAt" = NOW()
      WHERE number = 181
    `);
    console.log('#181: STRUCTIONSITE → DroneDeploy（StructionSite統合済）に修正');

    // #184 FactoryTwinOS: Microsoft HoloLens 2は2024年10月に製造終了・販売終了のため修正
    const row184 = await client.query(`SELECT "whyNow" FROM "Idea" WHERE number = 184`);
    const whyNow184 = row184.rows[0].whyNow;
    if (whyNow184 && whyNow184.includes('Microsoft HoloLens 2の価格下落')) {
      const newWhyNow184 = whyNow184.replace(
        'Meta Quest ProやMicrosoft HoloLens 2の価格下落で法人調達コストが現実的になった',
        'Meta Quest 3など企業向けXRデバイスの普及拡大（※Microsoft HoloLens 2は2024年10月に製造終了・2027年末でサポート終了予定）'
      );
      await client.query(`
        UPDATE "Idea"
        SET "whyNow" = $1, "updatedAt" = NOW()
        WHERE number = 184
      `, [newWhyNow184]);
      console.log('#184: whyNow内のHoloLens 2説明を修正（製造終了事実を反映）');
    } else {
      console.log('#184: whyNow パターンが見つかりませんでした。手動確認要:', whyNow184?.substring(0, 150));
    }

    // #182 ケアVRアカデミー: scoreComments.marketSizeの「38万人超」を確認・修正
    // 厚生労働省の第8期計画では2025年に約32万人不足が正式推計。
    // 38万人は古い別推計（第7期以前）。正確には「約32万人（厚労省第8期計画）」が正確
    const row182 = await client.query(`SELECT "scoreComments" FROM "Idea" WHERE number = 182`);
    const sc182 = row182.rows[0].scoreComments;
    console.log('#182 scoreComments確認:', JSON.stringify(sc182)?.substring(0, 300));
    if (sc182 && sc182.marketSize && sc182.marketSize.includes('38万人')) {
      const newSc182 = { ...sc182, marketSize: sc182.marketSize.replace('38万人超', '約32万人（厚生労働省第8期介護保険事業計画推計）') };
      await client.query(`
        UPDATE "Idea"
        SET "scoreComments" = $1, "updatedAt" = NOW()
        WHERE number = 182
      `, [JSON.stringify(newSc182)]);
      console.log('#182: marketSize 38万人超 → 約32万人（厚生労働省第8期推計）に修正');
    }

    // #183 FitMirrorAR: アパレル市場「10兆円超」→「約8.5兆円」に修正
    const row183 = await client.query(`SELECT "scoreComments" FROM "Idea" WHERE number = 183`);
    const sc183 = row183.rows[0].scoreComments;
    console.log('#183 scoreComments確認:', JSON.stringify(sc183)?.substring(0, 300));
    if (sc183 && sc183.marketSize && sc183.marketSize.includes('10兆円超')) {
      const newSc183 = { ...sc183, marketSize: sc183.marketSize.replace('国内アパレル市場は10兆円超', '国内アパレル市場は約8.5兆円（矢野経済研究所 2024年調査）') };
      await client.query(`
        UPDATE "Idea"
        SET "scoreComments" = $1, "updatedAt" = NOW()
        WHERE number = 183
      `, [JSON.stringify(newSc183)]);
      console.log('#183: marketSize 10兆円超 → 約8.5兆円（矢野経済研究所2024年）に修正');
    }

    // #186 SafeAR Walk: 「全国1700自治体」→「1,741（2024年10月現在）」に修正
    const row186 = await client.query(`SELECT "scoreComments" FROM "Idea" WHERE number = 186`);
    const sc186 = row186.rows[0].scoreComments;
    console.log('#186 scoreComments確認:', JSON.stringify(sc186)?.substring(0, 300));
    if (sc186 && sc186.marketSize && sc186.marketSize.includes('1700自治体')) {
      const newSc186 = { ...sc186, marketSize: sc186.marketSize.replace('全国1700自治体', '全国1,741市区町村（2024年10月現在、総務省）') };
      await client.query(`
        UPDATE "Idea"
        SET "scoreComments" = $1, "updatedAt" = NOW()
        WHERE number = 186
      `, [JSON.stringify(newSc186)]);
      console.log('#186: marketSize 1700自治体 → 1,741市区町村（2024年10月）に修正');
    }

    // #189 メニューAR: 「60万店超」の確認 → 令和3年経済センサスでは約55万店
    // 「60万店超」は過去データ（H21年 67万件）で現在は減少。令和3年は約55万店が正確
    const row189 = await client.query(`SELECT "scoreComments" FROM "Idea" WHERE number = 189`);
    const sc189 = row189.rows[0].scoreComments;
    console.log('#189 scoreComments確認:', JSON.stringify(sc189)?.substring(0, 300));
    if (sc189 && sc189.marketSize && sc189.marketSize.includes('60万店超')) {
      const newSc189 = { ...sc189, marketSize: sc189.marketSize.replace('全国飲食店数は60万店超', '全国飲食店数は約55万店（令和3年経済センサス活動調査）') };
      await client.query(`
        UPDATE "Idea"
        SET "scoreComments" = $1, "updatedAt" = NOW()
        WHERE number = 189
      `, [JSON.stringify(newSc189)]);
      console.log('#189: marketSize 60万店超 → 約55万店（令和3年経済センサス）に修正');
    }

    // #184 competitors: HoloLens 2の修正（競合リストにも記述がある場合）
    const row184c = await client.query(`SELECT "competitors" FROM "Idea" WHERE number = 184`);
    console.log('#184 competitors確認:', row184c.rows[0].competitors?.substring(0, 200));

    // #185 competitors: Minto（旧ツクルバVR）の修正確認
    const row185 = await client.query(`SELECT "competitors" FROM "Idea" WHERE number = 185`);
    const comp185 = row185.rows[0].competitors;
    console.log('#185 competitors確認:', comp185?.substring(0, 200));
    // MintoとツクルバVRは別会社。ツクルバはco-ba等のコワーキング会社で、VRとは無関係。
    // Mintoはマンガ・IP系コンテンツプロデュース会社。両者は無関係。
    // competitors記述が誤りと判断し修正
    if (comp185 && comp185.includes('Minto（旧ツクルバVR）')) {
      const newComp185 = comp185.replace('Minto（旧ツクルバVR）', 'Minto（マンガIP・メタバースアバタープロジェクト）');
      await client.query(`
        UPDATE "Idea"
        SET "competitors" = $1, "updatedAt" = NOW()
        WHERE number = 185
      `, [newComp185]);
      console.log('#185: Minto（旧ツクルバVR）→ Minto（マンガIP・メタバースアバタープロジェクト）に修正（ツクルバはコワーキング会社で無関係）');
    }

    // #190 バーチャル部活: 不登校生徒数の確認・修正
    // 文科省最新（令和6年度=2024年度調査、2025年10月公表）では35万3,970人（過去最多）
    const row190 = await client.query(`SELECT "whyNow" FROM "Idea" WHERE number = 190`);
    const whyNow190 = row190.rows[0].whyNow;
    console.log('#190 whyNow確認:', whyNow190?.substring(0, 200));
    // 「2024年の不登校生徒数が過去最多を更新し続け」は正確（2024年度も35万人超で過去最多）
    // 「文部科学省が『デジタル活用不登校支援』を政策の柱に明記」→COCOLOプランおよび教育DXロードマップで明記されているため概ね正確

    console.log('\n=== 修正完了。最終確認 ===');
    const final = await client.query(`
      SELECT number, "serviceName", "whyNow", "competitors", "scoreComments"
      FROM "Idea"
      WHERE number BETWEEN 181 AND 190
      ORDER BY number
    `);
    for (const row of final.rows) {
      console.log(`\n--- #${row.number} ${row.serviceName} ---`);
      console.log('whyNow:', row.whyNow?.substring(0, 120));
      console.log('competitors:', row.competitors?.substring(0, 120));
      console.log('scoreComments:', JSON.stringify(row.scoreComments)?.substring(0, 200));
    }

  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(console.error);
