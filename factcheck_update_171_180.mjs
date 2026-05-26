import pg from 'pg';

const pool = new pg.Pool({
  connectionString: 'postgresql://postgres:Bcgconsultant347@db.oszprtmhokcqajxvtfnt.supabase.co:5432/postgres'
});

async function main() {
  const client = await pool.connect();

  try {
    console.log('=== #171-180 ファクトチェック修正開始 ===\n');

    // #171 FanYield
    // competitors: QuickWorkは日本のインフルエンサー向け分析ツールではなくSalesNow（営業リスト）のサービス
    // FANBOXは公式APIを外部開放していない（非公式のみ）
    // → competitors修正: QuickWorkを削除または説明を修正
    //   さらにwhyNowの「FANBOXなど主要プラットフォームのAPI整備が進み」は事実と異なる
    await client.query(
      `UPDATE "Idea" SET
        competitors = $1,
        "whyNow" = $2,
        "updatedAt" = NOW()
      WHERE number = 171`,
      [
        'Sprout Social、FANBOX（ファンクラブ機能のみ・API非公開）、QuickWork（ワークフロー自動化ツール・インフルエンサー分析専業ではない）',
        'VTuber市場の市場規模が急成長しMCN・事務所の組織化が加速する中、データドリブンな収益管理の需要が初めて事業規模に達した。YouTubeなど主要プラットフォームのAPIは整備されているが、FANBOXは公式APIを外部開放しておらず、横断データ統合には技術的課題も残るタイミングである。'
      ]
    );
    console.log('#171 FanYield: competitors・whyNow修正完了');

    // #172 ジンDAO
    // Stripe Connectは日本で利用可能だが「手数料なし」ではない
    // Stripe Connectの日本向けの手数料は存在し、「手数料なしに近い」は誇張
    // Stripe Connectは日本でExpressアカウント等でConnect利用可能だが手数料0.25%+固定費等発生
    await client.query(
      `UPDATE "Idea" SET
        "whyNow" = $1,
        "updatedAt" = NOW()
      WHERE number = 172`,
      [
        'コロナ禍以降に定着したデジタル同人配信の慣行と、Z世代クリエイターの「収益化したいが手続きが面倒」という需要が交差するタイミングになった。Stripe Connectが日本でも利用可能で収益自動分配を実装できる環境が整った（ただしConnect手数料は発生）。'
      ]
    );
    console.log('#172 ジンDAO: whyNow修正完了（Stripe手数料の誤記を修正）');

    // #173 LiveCoach
    // TikTok Shopの日本本格展開は「2024年末〜」ではなく「2025年6月30日」
    await client.query(
      `UPDATE "Idea" SET
        "whyNow" = $1,
        "updatedAt" = NOW()
      WHERE number = 173`,
      [
        'TikTok Shopの日本展開（2025年6月30日〜）でライブコマース参入者が急増し、差別化のためのパフォーマンス向上ニーズが爆発的に高まっている。同時に音声LLMのレイテンシが実用水準（200ms以下）に達し、配信中リアルタイム介入が初めて技術的に実現可能になった。'
      ]
    );
    console.log('#173 LiveCoach: whyNow修正完了（TikTok Shop開始時期を2025年6月30日に修正）');

    // #174 PromptGuild
    // 政府の生成AIガイドラインは「企業側のAI活用責任が明確化」という表現は概ね正しい
    // 正式名称は「AI事業者ガイドライン（第1.1版）」（総務省・経産省、2025年3月）
    // 行政向けは「行政の進化と革新のための生成AIの調達・利活用に係るガイドライン」
    // 「企業側のAI活用責任を明確化」はAI事業者ガイドラインで適切
    // competitors: Claude.ai Teamsはプロンプトマーケットプレイスの競合ではなく、説明が不適切
    await client.query(
      `UPDATE "Idea" SET
        "whyNow" = $1,
        competitors = $2,
        "updatedAt" = NOW()
      WHERE number = 174`,
      [
        'ChatGPT・Claude等の普及で生成AI導入企業数が急増する一方、プロンプト品質のばらつきが業務効率の決定要因になってきた。総務省・経産省の「AI事業者ガイドライン（第1.1版）」（2025年3月）で企業側のAI活用責任が明確化され、品質保証付きプロンプトへの需要が急速に高まっている。',
        'PromptBase（海外・個人向けプロンプトマーケット）、Marketplacesとしてnote（プロンプト販売）、企業向けAIツール各社'
      ]
    );
    console.log('#174 PromptGuild: whyNow・competitors修正完了（ガイドライン正式名称追加、Claude.ai Teams削除）');

    // #175 ミミパス
    // Voicyは招待制ではなく「審査制」（応募→審査）が正しい
    // 2024年末から推薦枠（審査なし）も開始
    await client.query(
      `UPDATE "Idea" SET
        competitors = $1,
        "updatedAt" = NOW()
      WHERE number = 175`,
      [
        'Patreon、Voicy（審査制の音声配信・招待制ではない）、Spotify for Podcasters、note'
      ]
    );
    console.log('#175 ミミパス: competitors修正完了（Voicyを招待制→審査制に修正）');

    // #176 ClipLicense
    // FANYは吉本興業のエンタメ総合プラットフォーム
    // ゲーム実況・一般切り抜きのライセンス管理機能は持っていない
    // FANYはチケット・物販・ファンクラブ・動画配信が主な機能
    // competitor説明に「切り抜きライセンス管理」という機能は持っていないため誤解を招く
    await client.query(
      `UPDATE "Idea" SET
        competitors = $1,
        "updatedAt" = NOW()
      WHERE number = 176`,
      [
        'FANY（吉本興業のエンタメ総合プラットフォーム・チケット/ファンクラブ中心で切り抜きライセンス管理機能はなし）、YouTube Studio、BitStar（MCN）'
      ]
    );
    console.log('#176 ClipLicense: competitors修正完了（FANYの機能説明を正確化）');

    // #177 クリエイター保険
    // 「横浜生命保険」は実在しない保険会社
    // フリーナンスはGMOクリエイターズネットワーク運営だったが2025年7月にfreeeに移管
    // 現在は「FREENANCE by freee」が正式名称
    await client.query(
      `UPDATE "Idea" SET
        competitors = $1,
        "updatedAt" = NOW()
      WHERE number = 177`,
      [
        'フリーランス協会（フリーランス向け保険）、フリーナンス（FREENANCE by freee・2025年7月よりfreee運営）、各損保会社のフリーランス向け商品'
      ]
    );
    console.log('#177 クリエイター保険: competitors修正完了（横浜生命保険削除・フリーナンスの正式名称更新）');

    // #178 DesignDrop
    // Figma APIは2024年ではなく2018年からすでに外部公開済み
    // 「外部開放（2024年）」は事実ではなくwhyNow修正が必要
    // 2024年に追加されたのはCode Connect、Code Generation API等の新機能
    await client.query(
      `UPDATE "Idea" SET
        "whyNow" = $1,
        "updatedAt" = NOW()
      WHERE number = 178`,
      [
        'Figma APIは2018年から外部公開されており、2024年にCode ConnectやCode Generation APIなど新機能が追加されたことでデザインツール連携の可能性がさらに広がった。Canvaの法人利用拡大により、デザインツールをSaaSとして再販するエコシステムが技術的に現実的になり、SNS更新頻度の増加でブランド一貫性を保ちながらデザインを量産できるテンプレートへの需要が爆発している。'
      ]
    );
    console.log('#178 DesignDrop: whyNow修正完了（Figma API外部開放時期を2018年に修正）');

    // #179 まちクリエイター / #180 SkillStream
    // 主要競合（YOUTRUST, JOIN, Udemy, Zenn, Twitch）は2025-2026年も稼働中
    // ローカルワークスも稼働中
    // 修正不要
    console.log('#179 まちクリエイター: 競合サービス（YOUTRUST/JOIN/ローカルワークス）は2025-2026年も稼働確認済み。修正なし');
    console.log('#180 SkillStream: 競合サービス（Udemy/Twitch/Zenn）は2025-2026年も稼働確認済み。修正なし');

    console.log('\n=== 全更新完了 ===');

    // 確認
    const check = await client.query(
      `SELECT number, "serviceName", "whyNow", competitors, "updatedAt" FROM "Idea" WHERE number BETWEEN 171 AND 180 ORDER BY number`
    );
    console.log('\n=== 更新後の確認 ===');
    for (const row of check.rows) {
      console.log(`\n#${row.number} ${row.serviceName}`);
      console.log(`  whyNow: ${row.whyNow?.substring(0, 100)}...`);
      console.log(`  competitors: ${row.competitors}`);
      console.log(`  updatedAt: ${row.updatedAt}`);
    }

  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(console.error);
