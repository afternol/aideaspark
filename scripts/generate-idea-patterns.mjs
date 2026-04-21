import * as XLSX from "xlsx";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { mkdirSync } from "fs";

const __dirname = dirname(fileURLToPath(import.meta.url));

// ══════════════════════════════════════════════════════════════════════
// カラーパレット
// ══════════════════════════════════════════════════════════════════════
const C = {
  // ベース
  navyDark:  "0F172A",
  navy:      "1E3A5F",
  navyMid:   "334155",
  navyLight: "475569",
  slate:     "64748B",
  muted:     "94A3B8",
  border:    "CBD5E1",
  bg0:       "FFFFFF",
  bg1:       "F8FAFC",
  bg2:       "F1F5F9",
  text:      "1E293B",
  textSub:   "475569",
  // 優先度
  priH:   "991B1B", priHbg: "FEE2E2", priHmid: "DC2626",
  priM:   "92400E", priMbg: "FEF3C7", priMmid: "D97706",
  priL:   "166534", priLbg: "DCFCE7", priLmid: "16A34A",
  // 難易度
  difH:   "7F1D1D", difHbg: "FFF5F5",
  difM:   "78350F", difMbg: "FFFBEB",
  difL:   "14532D", difLbg: "F0FDF4",
};

// カテゴリ別カラー定義
const CAT = {
  A: { dark:"1D4ED8", mid:"2563EB", light:"DBEAFE", text:"1E3A8A", name:"顧客・市場深掘り型",    icon:"👥" },
  B: { dark:"0369A1", mid:"0284C7", light:"E0F2FE", text:"0C4A6E", name:"テクノロジー先行型",    icon:"⚙️" },
  C: { dark:"9333EA", mid:"A855F7", light:"F3E8FF", text:"581C87", name:"ビジネスモデル革新型",  icon:"💡" },
  D: { dark:"D97706", mid:"F59E0B", light:"FEF3C7", text:"78350F", name:"バリューチェーン変革型", icon:"🔗" },
  E: { dark:"059669", mid:"10B981", light:"D1FAE5", text:"064E3B", name:"エコシステム・プラットフォーム型", icon:"🌐" },
  F: { dark:"DC2626", mid:"EF4444", light:"FEE2E2", text:"7F1D1D", name:"社会課題・規制対応型",  icon:"🏛" },
  G: { dark:"0891B2", mid:"06B6D4", light:"CFFAFE", text:"164E63", name:"グローバル・クロスボーダー型", icon:"🌏" },
  H: { dark:"EA580C", mid:"F97316", light:"FFEDD5", text:"7C2D12", name:"データ・知識資産活用型", icon:"📊" },
  I: { dark:"16A34A", mid:"22C55E", light:"DCFCE7", text:"14532D", name:"既存資産・強み転用型",  icon:"🏆" },
  J: { dark:"7C3AED", mid:"8B5CF6", light:"EDE9FE", text:"4C1D95", name:"未来予測・シナリオ型", icon:"🔭" },
};

// 優先度・難易度ラベル
const PRIO_LABEL = { "高":"◉ 高", "中":"◎ 中", "低":"○ 低" };
const DIFF_LABEL = { "高":"▲ 高", "中":"△ 中", "低":"▽ 低" };

// ══════════════════════════════════════════════════════════════════════
// 74パターン定義
// ══════════════════════════════════════════════════════════════════════
const patterns = [
  // ─── A. 顧客・市場深掘り型
  { catId:"A", patId:"A-01", patName:"JTBD（Jobs-to-be-Done）分析",
    core:"顧客が「本当に片付けたい仕事」を特定し、既存製品が未解決のまま放置している部分に参入する",
    approach:"① 切替前後の行動・感情・状況を深掘りインタビューで聴取\n② スイッチングイベントを特定\n③ 代替手段をマッピングして競合範囲を再定義\n④ 未解決JTBDのギャップを定量化",
    exOverseas:"Intercom（CRMの「顧客と会話したい」JTBDを再解釈しコミュニケーション基盤へ）\nSnickers「空腹時の自分ではない」キャンペーン（空腹解消JTBDの再発見）",
    exJapan:"クックパッド（「今日の夕飯を決めたい」JTBDに特化）\nメルカリ（「不用品を手軽に現金化したい」JTBDを日常化）",
    moat:"顧客インサイト蓄積・プロダクトマーケットフィット精度", difficulty:"中", priority:"高" },
  { catId:"A", patId:"A-02", patName:"ノンカスタマー分析（Blue Ocean）",
    core:"現在その市場を使っていない層（非顧客）が使わない理由を分析し、新市場を創造する",
    approach:"① 非顧客を3層（近い非顧客・拒絶顧客・未探索顧客）に分類\n② 不使用理由を体系化\n③ 価格・利便性・認知のどの障壁かを特定\n④ 参入コストと市場規模を試算",
    exOverseas:"Cirque du Soleil（サーカス非顧客である大人層を開拓）\nNintendo Wii（ゲーム非ユーザーを獲得）",
    exJapan:"ホットペッパービューティー（ネット予約しない層を開拓）\nスタディサプリ（塾に通えない地方・低所得層を開拓）",
    moat:"新市場の先行者優位・競合不在期間", difficulty:"中", priority:"高" },
  { catId:"A", patId:"A-03", patName:"アンダーサーブド・セグメント探索",
    core:"既存サービスが過剰品質・機能過多になっており、シンプル・低価格・特化型を求める層を狙う",
    approach:"① 既存製品レビューから「使わない機能」を特定\n② 価格感度アンケートを実施\n③ 過剰品質仮説の検証インタビュー\n④ MVP設計と最小機能セット定義",
    exOverseas:"Dollar Shave Club（高機能不要なシェーバー市場）\nCanva（プロ向けデザインツールに不満な一般ユーザー）",
    exJapan:"freee（中小企業向け会計ソフトの簡略化）\nチームスピリット（中堅企業向けERPの簡易版）",
    moat:"コスト構造の優位性・ターゲット特化", difficulty:"低", priority:"高" },
  { catId:"A", patId:"A-04", patName:"破壊的イノベーション（ローエンド参入）",
    core:"高機能・高価格製品が支配する市場に、シンプル版で下位市場から参入し、段階的に上位へ拡張する",
    approach:"① 市場の価格帯・機能をマッピング\n② 下位市場の規模を試算\n③ ローエンドMVPを設計\n④ 段階的アップマーケット戦略を立案",
    exOverseas:"Zoom（高機能Web会議システムへのシンプル代替）\nDropbox（エンタープライズストレージの簡易版）",
    exJapan:"弥生会計（会計士向けソフトの中小企業向け簡易版）\nBASE（EC構築ツールの簡易化）",
    moat:"価格優位性・UX設計の徹底", difficulty:"中", priority:"高" },
  { catId:"A", patId:"A-05", patName:"カスタマージャーニー全体最適化",
    core:"顧客が目標達成までに経験する全ステップを可視化し、最大の摩擦点に絞ってサービスを設計する",
    approach:"① ジャーニーマップを作成（認知→購入→利用→解約）\n② 摩擦点をスコアリング\n③ 競合の代替行動を調査\n④ 最大摩擦点への解決策を設計",
    exOverseas:"Airbnb（宿泊予約の写真・信頼・決済を一気通貫で解決）\nStripe（決済導入の煩雑さを数行のコードで解消）",
    exJapan:"SmartHR（入社手続きの紙→電子化を一括で完結）\nSTORES（ネットショップ開設の全工程を簡略化）",
    moat:"統合体験の差別化・競合の模倣困難性", difficulty:"中", priority:"高" },
  { catId:"A", patId:"A-06", patName:"エスノグラフィック観察",
    core:"顧客の実生活・職場に入り込み、本人も気づいていない潜在課題（アンメットニーズ）を発見する",
    approach:"① フィールドワーク計画を設計\n② 現場観察で日常行動・ワークアラウンドを記録\n③ シャドウインタビューで行動の意図を深掘り\n④ パターンを抽出・仮説化",
    exOverseas:"IDEO（デザインシンキングで医療機器の課題を発見）\nP&G（消費者宅での観察から製品開発）",
    exJapan:"パナソニック（高齢者施設での観察から介護製品を開発）\nヤマト運輸（現場観察から宅急便システムを設計）",
    moat:"顧客理解の深さと独自インサイト", difficulty:"中", priority:"中" },
  { catId:"A", patId:"A-07", patName:"ペルソナ×シチュエーション交差分析",
    core:"複数のペルソナと利用シチュエーションを掛け合わせ、まだ解決されていない組み合わせを特定する",
    approach:"① ペルソナを5〜8種定義\n② シチュエーション軸（時間帯・場所・状態・目的）を定義\n③ 2軸マトリクスで空白セルを発見\n④ 空白セルの市場規模を仮説試算",
    exOverseas:"Uber Eats（外食×自宅滞在シチュエーションの空白）\nSlack（非同期コミュニケーション×リモートワークの空白）",
    exJapan:"出前館（飲食×外出しないシチュエーション）\nTimee（隙間時間×単発就労ニーズ）",
    moat:"特定シチュエーションへの特化と設計の深さ", difficulty:"低", priority:"中" },
  { catId:"A", patId:"A-08", patName:"スイッチングコスト設計",
    core:"顧客が競合へ移りにくくするスイッチングコストを意図的に設計し、長期的なLTVを確保する",
    approach:"① 顧客の移行コスト要素を特定（データ・学習コスト・統合コスト）\n② 統合を意図的に深める設計を実施\n③ 解約データを分析し予防策を設計\n④ スイッチングコストと価格の適正バランスを検証",
    exOverseas:"Salesforce（CRM移行の高コスト化）\nAdobe（クリエイティブデータの囲い込み）",
    exJapan:"freee（会計データの移行コスト）\nSmartHR（人事マスタの蓄積による定着）",
    moat:"データ蓄積・統合深度・学習投資の積み上げ", difficulty:"中", priority:"高" },

  // ─── B. テクノロジー先行型
  { catId:"B", patId:"B-01", patName:"先端技術の産業転用",
    core:"他産業で実証済みの技術を未適用の業界に移植し、新たな価値を生み出す",
    approach:"① 技術ロードマップを調査（Gartner Hype Cycle等）\n② 適用可能な業界候補をリスト化\n③ 転用時のTCOを試算\n④ PoCを設計・実施",
    exOverseas:"Palantir（諜報分析技術を金融・医療へ転用）\nWaymo（自動車産業への自動運転AI転用）",
    exJapan:"PKSHA Technology（自然言語処理を金融・保険業務へ転用）\nソラコム（IoT通信基盤を産業向けに転用）",
    moat:"技術優位性・特許・専門人材の確保", difficulty:"高", priority:"高" },
  { catId:"B", patId:"B-02", patName:"AIによるエキスパート代替・民主化",
    core:"高度な専門家（弁護士・医師・会計士等）の判断をAIで代替・補助し、サービスへのアクセスを民主化する",
    approach:"① 専門業務のプロセスを分解\n② AI代替可能なタスクを特定\n③ 規制・倫理リスクを評価\n④ PoCからβ版を設計",
    exOverseas:"Harvey（法律業務AI）\nNabla（医療AIアシスタント）\nDoNotPay（法的書類の自動生成）",
    exJapan:"LegalForce（契約書レビューAI）\nUbie（症状からの疾患推定AI）\nマネーフォワード（会計処理の自動化）",
    moat:"学習データの蓄積・専門家監修ネットワーク", difficulty:"高", priority:"高" },
  { catId:"B", patId:"B-03", patName:"センサー×IoTによるデータ化",
    core:"アナログ・オフラインの現象をセンサーでデジタル化し、新たなデータビジネスを創出する",
    approach:"① 計測したい現象を特定\n② センサー技術を選定し導入コストを試算\n③ データ収集→分析→価値化ルートを設計\n④ データ販売か自社活用かを判断",
    exOverseas:"Nest（家庭内温度データによるエネルギー最適化）\nSamsara（車両IoTによるフリートマネジメント）",
    exJapan:"Optex（センサーメーカーのスマートシティ展開）\nファナック（工作機械データによる予知保全）",
    moat:"センサーネットワークの規模・データ蓄積量", difficulty:"高", priority:"中" },
  { catId:"B", patId:"B-04", patName:"ブロックチェーン×トラスト設計",
    core:"改ざん不可能な記録が必要な領域（サプライチェーン・著作権・契約等）にブロックチェーンを適用し、信頼コストを削減する",
    approach:"① 信頼コストが高い業界を特定\n② ブロックチェーンの適合性を評価\n③ コンソーシアム形成の可能性を検討\n④ 規制対応を調査",
    exOverseas:"Everledger（ダイヤモンド原産地証明）\nTradeLens（IBM×マースクのサプライチェーン）",
    exJapan:"三菱UFJトラスト（デジタル証券基盤）\nLayerX（法人向けブロックチェーン業務自動化）",
    moat:"ネットワーク参加者数・標準化の主導権", difficulty:"高", priority:"低" },
  { catId:"B", patId:"B-05", patName:"生成AI×ワークフロー自動化",
    core:"LLM・画像生成AIを既存業務ワークフローに組み込み、人的工数を削減するSaaSを構築する",
    approach:"① 高単価・高頻度・定型化されている業務を特定\n② LLMの適合性を評価（精度・コスト・レイテンシ）\n③ 人間のレビューが必要な箇所を設計\n④ API連携を設計",
    exOverseas:"Jasper AI（マーケティングコンテンツ生成）\nGitHub Copilot（コード補完）\nRunway（動画生成）",
    exJapan:"ギブリー（企業向けChatGPT導入支援）\nAI Shift（コールセンターAI）\nSakana AI（AI研究の自動化）",
    moat:"業務特化の学習データ・ワークフロー統合の深度", difficulty:"中", priority:"高" },
  { catId:"B", patId:"B-06", patName:"AR/VR×リアル体験代替・拡張",
    core:"移動・時間・距離のコストが高いリアル体験をAR/VRで代替・拡張し、新たなアクセス価値を生み出す",
    approach:"① 移動コストが高い体験を特定\n② VR再現の技術的実現可能性を評価\n③ ユーザーの代替受容度を調査\n④ ハードウェア普及率と市場参入タイミングを評価",
    exOverseas:"Meta Horizon（VRソーシャル）\nMatterport（不動産バーチャル内覧）\nStrivr（VR企業研修）",
    exJapan:"HIKKY（VRイベント「バーチャルマーケット」）\nスペースリー（不動産VR内覧）",
    moat:"コンテンツ資産・ハードウェアパートナーとの連携", difficulty:"高", priority:"中" },
  { catId:"B", patId:"B-07", patName:"アルゴリズム×マッチング最適化",
    core:"両面市場のマッチング精度をアルゴリズムで高め、既存仲介業者より高い成立率・満足度を実現する",
    approach:"① マッチング市場の非効率を調査（成立率・時間コスト）\n② 特徴量を設計\n③ マッチングアルゴリズムを選定・実装\n④ A/Bテストで精度を継続改善",
    exOverseas:"OkCupid（相性スコアリングによる婚活マッチング）\nThumbtack（地域サービス職人マッチング）",
    exJapan:"エン転職（求人マッチングAI）\nタイミー（スキル×シフトの最適マッチング）",
    moat:"マッチング精度・データ蓄積量", difficulty:"中", priority:"高" },
  { catId:"B", patId:"B-08", patName:"ロボティクス×作業自動化",
    core:"人手不足・高コストの現場作業をロボット・自動化技術で代替し、生産性を向上させる",
    approach:"① 自動化ニーズが高い現場を特定（3K・人手不足・高コスト）\n② ROIを試算（導入コスト÷人件費削減額）\n③ 規制・安全基準を確認\n④ 段階的な自動化ロードマップを設計",
    exOverseas:"Boston Dynamics（産業用ロボット）\nKiva Systems→Amazon Robotics（物流自動化）",
    exJapan:"川崎重工（産業用ロボット）\nMujin（物流ロボット制御）\ninaho（農業収穫ロボット）",
    moat:"ハードウェア特許・ソフトウェア学習データ・導入実績", difficulty:"高", priority:"高" },

  // ─── C. ビジネスモデル革新型
  { catId:"C", patId:"C-01", patName:"サブスクリプション転換",
    core:"買い切り型製品・サービスをサブスクに転換し、LTVを高め予測可能な収益基盤を構築する",
    approach:"① 既存買い切り市場の再購入頻度を調査\n② 顧客の継続利用価値を試算\n③ 価値ベースで価格帯を設定\n④ 解約防止を設計（習慣化・スイッチングコスト）",
    exOverseas:"Adobe Creative Cloud（買い切り→サブスク転換の成功例）\nSalesforce（CRMのSaaS化）",
    exJapan:"トヨタ KINTO（車のサブスク）\nコマツ（建機リース→スマートコンストラクション）",
    moat:"解約コスト・統合深度・LTV最大化設計", difficulty:"中", priority:"高" },
  { catId:"C", patId:"C-02", patName:"フリーミアム→プレミアム転換",
    core:"無料版で大量ユーザーを獲得し、高付加価値機能で有料転換するモデル",
    approach:"① 無料提供で獲得できる価値（データ・ネットワーク）を設計\n② 有料転換のトリガーを特定（利用量・機能制限）\n③ 転換率ベンチマーク（通常2〜5%）を確認\n④ ユニットエコノミクスを試算",
    exOverseas:"Spotify（広告付き無料＋プレミアム）\nDropbox（ストレージ上限による自然なアップグレード誘導）",
    exJapan:"Slack（チャンネル制限で有料化）\nマネーフォワード ME（家計簿→プレミアム）",
    moat:"ネットワーク効果・データ価値・習慣化", difficulty:"中", priority:"高" },
  { catId:"C", patId:"C-03", patName:"マーケットプレイス（仲介手数料型）",
    core:"需要・供給の両サイドを束ね、取引成立に手数料を取るモデル",
    approach:"① 流動性の低い市場を特定\n② 鶏と卵問題の解決策を設計\n③ コールドスタート戦略（先に供給側か需要側か）を決定\n④ 手数料率のベンチマークを確認",
    exOverseas:"Airbnb（宿泊）\neBay（中古品）\nUpwork（フリーランス）",
    exJapan:"メルカリ（C2C物販）\nランサーズ（クラウドソーシング）\nTimeTicket（時間販売）",
    moat:"流動性・信頼スコア・ネットワーク効果", difficulty:"中", priority:"高" },
  { catId:"C", patId:"C-04", patName:"従量課金・成果報酬型",
    core:"固定費を嫌う顧客向けに、利用量・成果に連動した課金設計で参入障壁を下げる",
    approach:"① 顧客の固定費嫌悪・リスク回避志向を調査\n② 成果指標の定義と計測方法を設計\n③ 不正・測定困難への対策を設計\n④ 採算ラインを逆算",
    exOverseas:"AWS（クラウドコンピューティングの従量課金）\nGoogle Ads（クリック課金）",
    exJapan:"freee（プラン別従量課金）\nHENNGE（SaaS従量課金）\nAkindo（成果報酬型採用）",
    moat:"計測精度・顧客ロックイン", difficulty:"中", priority:"中" },
  { catId:"C", patId:"C-05", patName:"バンドリング×アンバンドリング",
    core:"競合が過剰バンドルしている製品を分解して単体販売、または断片化した市場を統合して提供する",
    approach:"① 既存製品の機能利用率を分析\n② 「必要な機能だけほしい」ニーズを調査\n③ アンバンドルの収益性を試算\n④ バンドルの場合は統合コストと難易度を評価",
    exOverseas:"Netflix（ケーブルTV→ストリーミング単体）\nStripe Atlas（法人設立パッケージのバンドル）",
    exJapan:"SmartHR（人事業務のバンドル）\nTimeTree（カレンダー特化のアンバンドル）",
    moat:"ブランド・統合コスト・切替摩擦", difficulty:"中", priority:"中" },
  { catId:"C", patId:"C-06", patName:"クロスサブシダイズ（補完財収益）",
    core:"本体を無料・低価格にして補完財（消耗品・オプション・広告）で収益化する",
    approach:"① 補完財の市場規模を試算\n② 本体の顧客獲得コストを計算\n③ 補完財の粗利を試算\n④ ロックイン設計（本体×補完財の排他性）",
    exOverseas:"Amazon Kindle（端末低価格→電子書籍で収益化）\nGillette（髭剃り本体低価格→替刃で収益化）",
    exJapan:"ネスプレッソ（マシン低価格→カプセルで収益化）\nNintendo（ゲーム機→ソフトで収益化）",
    moat:"本体ロックイン・消耗品シェアの独占", difficulty:"中", priority:"中" },
  { catId:"C", patId:"C-07", patName:"エコシステム収益化（API・プラットフォーム課金）",
    core:"自社の技術・データ・流通をAPIで外部に開放し、利用量や手数料で収益化する",
    approach:"① 自社の差別化資産を棚卸し\n② API化の技術コストを試算\n③ 外部デベロッパーの需要を調査\n④ 価格体系（従量・ライセンス・収益分配）を設計",
    exOverseas:"Stripe（決済API）\nTwilio（SMS・通話API）\nPlaid（金融データAPI）",
    exJapan:"GMOペイメントゲートウェイ（決済API）\nfreee（会計API）",
    moat:"API依存による切替コスト・開発者エコシステム", difficulty:"高", priority:"中" },
  { catId:"C", patId:"C-08", patName:"レベニューシェア×パートナー成功報酬",
    core:"パートナーの成功に連動した報酬設計を行い、エコシステム全体の成長を自社の成長とリンクさせる",
    approach:"① パートナーの成功指標を定義\n② レベニューシェア率の業界ベンチマークを調査\n③ 不正・測定困難事象への対策を設計\n④ パートナー向けダッシュボードを設計",
    exOverseas:"HubSpot（代理店パートナープログラム）\nShopify（アプリ・テーマ販売の収益分配）",
    exJapan:"Salesforce（SIパートナー制度）\nLINE（スタンプクリエイターへの収益分配）",
    moat:"パートナーエコシステムの規模・依存関係", difficulty:"中", priority:"中" },

  // ─── D. バリューチェーン変革型
  { catId:"D", patId:"D-01", patName:"中間業者排除（D2C化）",
    core:"製造→流通→販売の中間マージンを排除し、顧客に直接届けてコストと体験を最適化する",
    approach:"① バリューチェーンの中間コストを計測\n② D2C転換の物流・顧客獲得コストを試算\n③ 顧客データを直接取得する価値を評価\n④ 既存流通との競合リスクを評価",
    exOverseas:"Warby Parker（眼鏡D2C）\nCasper（マットレスD2C）\nDollar Shave Club（髭剃りD2C）",
    exJapan:"ファブリック東京（スーツD2C）\nスノーピーク（アウトドアD2C強化）\nALL YOURS（アパレルD2C）",
    moat:"顧客データ・ブランド・コスト構造", difficulty:"中", priority:"高" },
  { catId:"D", patId:"D-02", patName:"サプライチェーン最適化",
    core:"在庫・輸送・調達の非効率を技術で解決し、コスト削減または納期短縮を付加価値として提供する",
    approach:"① サプライチェーンを可視化しリードタイム・コストを計測\n② ボトルネックを特定\n③ 最適化技術を選定（需要予測AI・ルート最適化等）\n④ ROIを試算",
    exOverseas:"Flexport（フォワーダー×ソフトウェアの融合）\nproject44（輸送可視化SaaS）",
    exJapan:"オプティマインド（配送ルート最適化）\nロジレス（EC物流最適化）",
    moat:"データ蓄積・APIエコシステム", difficulty:"高", priority:"中" },
  { catId:"D", patId:"D-03", patName:"垂直統合（川上〜川下）",
    core:"バリューチェーンの複数工程を内製化してコントロールを強め、品質・コスト・体験を最適化する",
    approach:"① 現在の外部依存コストを計測\n② 垂直統合のCapEx・OpExを試算\n③ 統合による差別化価値を評価\n④ 段階的統合ロードマップを設計",
    exOverseas:"Tesla（バッテリー・ソフトウェア・販売網を内製）\nApple（半導体M1チップを内製）",
    exJapan:"ニトリ（企画・製造・物流・販売の一貫体制）\nユニクロ（SPA：製造小売一体化）",
    moat:"コスト構造・品質管理・スピードの優位性", difficulty:"高", priority:"中" },
  { catId:"D", patId:"D-04", patName:"アウトソーシング需要の取り込み",
    core:"企業がノンコア業務を外部委託したいニーズを捕捉し、専門特化でスケールする",
    approach:"① 企業がアウトソースしたい業務をランキング調査\n② 自社が専門化できる領域を特定\n③ SLAを設計\n④ 他社への横展開を見据えたスケールモデルを試算",
    exOverseas:"Deel（グローバル給与計算アウトソース）\nRippling（HR・ITアウトソース）",
    exJapan:"Chatwork（中小企業ITアウトソース）\nベルシステム24（コールセンターアウトソース）",
    moat:"専門知識・規模の経済・信頼実績", difficulty:"中", priority:"中" },
  { catId:"D", patId:"D-05", patName:"シェアリング×遊休資産活用",
    core:"稼働率の低い資産（不動産・車両・設備・スキル）を他者が使えるようにし、双方に価値を提供する",
    approach:"① 遊休資産の規模を試算（稼働率調査）\n② マッチングの技術的障壁を評価\n③ 保険・法規制リスクを調査\n④ 信頼設計（評価システム等）",
    exOverseas:"Airbnb（空き部屋シェアリング）\nTuro（個人間カーシェア）",
    exJapan:"akippa（空き駐車場シェア）\nスペースマーケット（遊休スペース貸し）\nエニカ（個人間カーシェア）",
    moat:"供給ネットワーク・信頼スコアシステム", difficulty:"中", priority:"高" },
  { catId:"D", patId:"D-06", patName:"製造業のサービス化（サービタイゼーション）",
    core:"製品販売から「製品の成果・稼働」販売へ転換し、継続収益とデータ収集を両立する",
    approach:"① 製品稼働データ収集の技術的実現可能性を評価\n② 成果ベース契約のKPIを定義\n③ 保守・サポート体制を再設計\n④ 既存顧客への移行提案戦略を立案",
    exOverseas:"Rolls-Royce「Power by the Hour」（エンジン稼働時間課金）\nCaterpillar（建機稼働最適化サービス）",
    exJapan:"コマツ「KOMTRAX」（建機IoT稼働管理）\n日立（インフラ機器の稼働保証サービス）",
    moat:"稼働データ蓄積・保守ノウハウ・顧客依存度", difficulty:"高", priority:"中" },
  { catId:"D", patId:"D-07", patName:"リバース・サプライチェーン（回収・循環）",
    core:"使用済み製品の回収→再生→再販の逆方向サプライチェーンを構築し、循環経済型ビジネスを設計する",
    approach:"① 回収可能な製品・素材を特定\n② 回収チャネルを設計（小売連携・郵送・専用BOX）\n③ 再生コストと再販価値の差益を試算\n④ ESG文脈でのブランド価値を評価",
    exOverseas:"Patagonia「Worn Wear」（古着買取→再販）\nRenault（中古部品の再製造）",
    exJapan:"ブックオフ（中古書籍の回収→再販）\nパナソニック（家電リサイクル法対応→素材回収）",
    moat:"回収ネットワーク規模・再生技術・ESGブランド", difficulty:"中", priority:"中" },

  // ─── E. エコシステム・プラットフォーム型
  { catId:"E", patId:"E-01", patName:"ネットワーク効果の設計",
    core:"ユーザーが増えるほど価値が高まる仕組みを設計し、競合が模倣しにくい護城河を構築する",
    approach:"① ネットワーク効果の種類を選定（直接・間接・データ・社会的）\n② 最小有効規模を試算\n③ コールドスタート戦略を設計\n④ ネットワーク効果の強度指標を定義",
    exOverseas:"LinkedIn（職業ネットワーク効果）\nWhatsApp（通信ネットワーク効果）\nWaze（地図データのクラウドソーシング）",
    exJapan:"LINE（通信×決済×コンテンツのエコシステム）\nメルカリ（購買者＝出品者のネットワーク）",
    moat:"ネットワーク規模・スイッチングコスト", difficulty:"高", priority:"高" },
  { catId:"E", patId:"E-02", patName:"データフライホイール構築",
    core:"ユーザーの利用データがサービス精度を高め、それがさらにユーザーを呼ぶ正のフィードバックループを設計する",
    approach:"① データ収集→学習→精度向上→ユーザー増のループを設計\n② 競合との精度ギャップを分析\n③ データ独占の可否を評価\n④ プライバシー規制への対応を設計",
    exOverseas:"Google（検索クエリで精度向上）\nAmazon（購買データで推薦最適化）\nTikTok（視聴データで動画推薦最適化）",
    exJapan:"PayPay（決済データの活用）\nSansan（名刺データによる人脈グラフ構築）",
    moat:"データ蓄積量・アルゴリズム精度", difficulty:"高", priority:"高" },
  { catId:"E", patId:"E-03", patName:"デベロッパーエコシステム構築",
    core:"外部開発者がアプリ・拡張機能を作れる仕組みを提供し、自社なしには成立しないエコシステムを形成する",
    approach:"① デベロッパー向けAPIと報酬を設計\n② サードパーティアプリのユースケースを豊富化\n③ App Store型収益分配を設計\n④ デベロッパー獲得チャネルを整備",
    exOverseas:"Salesforce AppExchange（CRMエコシステム）\nShopify App Store（EC拡張エコシステム）",
    exJapan:"freee（会計API公開）\nkintone（業務アプリプラットフォーム）",
    moat:"デベロッパー数・アプリ数・統合深度", difficulty:"高", priority:"中" },
  { catId:"E", patId:"E-04", patName:"オープンイノベーションプラットフォーム",
    core:"大企業・スタートアップ・研究機関を繋ぐ場を設計し、マッチングと共同開発を促進する",
    approach:"① オープンイノベーション失敗の原因を分析\n② 課題提供者と解決者の役割を整理\n③ マッチングロジックを設計\n④ 成果報酬を設計",
    exOverseas:"InnoCentive（R&D懸賞金プラットフォーム）\nNineSigma（技術マッチングプラットフォーム）",
    exJapan:"Plug and Play Japan（スタートアップ×大企業マッチング）\nSony Innovation Fund（CVC型オープンイノベーション）",
    moat:"大企業ネットワーク・スタートアップ流量", difficulty:"高", priority:"中" },
  { catId:"E", patId:"E-05", patName:"コミュニティ主導型成長（PLG×Community）",
    core:"製品そのものとユーザーコミュニティが相互に価値を高め合うモデル（プロダクト主導成長）",
    approach:"① プロダクトのバイラル係数を測定\n② コミュニティ形成の核を設計\n③ UGC活性化施策を設計\n④ コミュニティ→製品へのフィードバックループを構築",
    exOverseas:"Figma（デザインファイルの共有によるバイラル）\nNotion（テンプレートシェアによるコミュニティ形成）",
    exJapan:"note（クリエイターコミュニティ）\nCAMPFIRE（資金調達コミュニティ）",
    moat:"コミュニティ資産・UGC量", difficulty:"中", priority:"高" },
  { catId:"E", patId:"E-06", patName:"スーパーアプリ化（機能集約）",
    core:"一つのアプリで複数サービスを完結させ、ユーザーの日常生活に不可欠な存在になる",
    approach:"① 既存ユーザーの隣接ニーズを調査\n② 追加機能のUX統合を設計\n③ データ共有による相乗効果を設計\n④ 収益多様化を試算",
    exOverseas:"WeChat（メッセージ→決済→EC→行政手続き）\nGrab（配車→フードデリバリー→金融）",
    exJapan:"LINE（メッセージ→スタンプ→決済→保険）\nPayPay（決済→フード→金融）",
    moat:"ユーザー滞在時間・データ統合・習慣化", difficulty:"高", priority:"中" },
  { catId:"E", patId:"E-07", patName:"両面市場の非対称戦略",
    core:"プラットフォームの一方（供給側）を無料・低価格にして集め、もう一方（需要側）から収益を得る",
    approach:"① 「鶏」と「卵」のどちらが先かを分析\n② 無料側の獲得コストを試算\n③ 収益側の支払意欲を調査\n④ 最小有効規模を設計",
    exOverseas:"Google（ユーザー無料×広告主課金）\nOpenTable（レストラン掲載無料→顧客予約課金）",
    exJapan:"食べログ（ユーザー無料→飲食店掲載課金）\nIndeed（求職者無料→企業掲載課金）",
    moat:"片側の規模が対面側の価値を上昇させる構造", difficulty:"高", priority:"高" },

  // ─── F. 社会課題・規制対応型
  { catId:"F", patId:"F-01", patName:"規制変化の先取り（RegTech）",
    core:"法改正・規制強化を事前に読み、コンプライアンス対応コストを削減するソリューションを提供する",
    approach:"① 官報・パブリックコメント・審議会議事録を継続モニタリング\n② 影響を受ける企業数を試算\n③ コンプライアンスコストの現状を調査\n④ 規制施行前に先行販売",
    exOverseas:"Compliance.ai（規制変化追跡AI）\nTrulioo（KYCコンプライアンス自動化）",
    exJapan:"弁護士ドットコム（電子帳簿保存法対応の電子契約）\nインフォマート（請求書電子化対応）",
    moat:"規制知識の先行蓄積・行政ネットワーク", difficulty:"中", priority:"高" },
  { catId:"F", patId:"F-02", patName:"サステナビリティ×ビジネス化",
    core:"ESG・脱炭素・循環経済の要請を、コスト削減または新収益機会として事業化する",
    approach:"① 企業のCO2排出計測・削減ニーズを定量調査\n② カーボンクレジット市場の規模を調査\n③ ESG開示義務化スケジュールと連動したロードマップを設計\n④ グリーンウォッシュリスクを評価",
    exOverseas:"Pachama（森林カーボンクレジット）\nRubicon（廃棄物管理DX）\nArcadia（再エネ調達SaaS）",
    exJapan:"ゼロボード（CO2排出量可視化SaaS）\nアスエネ（脱炭素経営支援）",
    moat:"データ信頼性・認証機関との連携", difficulty:"中", priority:"高" },
  { catId:"F", patId:"F-03", patName:"少子高齢化×シルバーマーケット",
    core:"高齢者の増加と行動変化を起点に、健康・介護・資産管理・生きがいの課題を解決する",
    approach:"① 高齢者の未充足ニーズを調査（定性・定量）\n② 介護保険適用の可否を評価\n③ 家族・施設・行政との連携を設計\n④ シニア向けUX設計原則を適用",
    exOverseas:"Honor（在宅介護マッチング）\nCarePredict（AI見守りシステム）",
    exJapan:"ウェルモ（介護事業者向けDX）\nSOMPOホールディングス（介護×保険）\niCARE（法人向け健康管理）",
    moat:"信頼・規制対応・介護士ネットワーク", difficulty:"中", priority:"高" },
  { catId:"F", patId:"F-04", patName:"地方創生×デジタル行政",
    core:"地方自治体の業務・住民サービスをデジタル化し、人口減少下でも行政サービス品質を維持する",
    approach:"① 自治体の業務コスト・紙処理量を調査\n② 行政DXの補助金・調達ルールを確認\n③ 実証自治体を確保\n④ 他自治体への横展開戦略を立案",
    exOverseas:"エストニア（電子政府の国家標準化）\nPalantir（米行政データ分析）",
    exJapan:"トラストバンク（ふるさと納税DX）\nグラファー（行政手続きオンライン化）",
    moat:"行政ネットワーク・規制対応・導入実績", difficulty:"高", priority:"中" },
  { catId:"F", patId:"F-05", patName:"メンタルヘルス×デジタルケア",
    core:"精神的健康への社会的関心の高まりを受け、予防・早期介入・継続支援をデジタルで提供する",
    approach:"① 産業保健・医療の課題をヒアリング\n② 医師監修を確保\n③ 保険適用・行政連携の可否を評価\n④ プライバシー規制（個人情報保護法等）に対応",
    exOverseas:"Headspace（瞑想・マインドフルネスアプリ）\nSpring Health（企業向けEAP）",
    exJapan:"iCARE（ストレスチェック→健康管理）\nハピネスプラネット（従業員幸福度計測）",
    moat:"医師監修・エビデンス蓄積・法人契約", difficulty:"中", priority:"高" },
  { catId:"F", patId:"F-06", patName:"フードテック×農業DX",
    core:"食料安全保障・農業人口減少・環境負荷削減を技術で解決し、新たな食の生産・流通を設計する",
    approach:"① 農業工程ごとの人手コストを計測\n② 自動化・センシング技術の農業適用可能性を評価\n③ 規制（農地法・農薬規制）を確認\n④ 輸出市場の可能性を評価",
    exOverseas:"Impossible Foods（代替肉）\nAppHarvest（垂直農場）\nJohn Deere（農機DX）",
    exJapan:"スマートアグリ（農業IoT）\ninaho（野菜収穫ロボット）\nオイシックス（食材サブスク）",
    moat:"技術特許・農家ネットワーク・ブランド", difficulty:"高", priority:"中" },
  { catId:"F", patId:"F-07", patName:"金融包摂（アンバンクト層へのアクセス）",
    core:"銀行口座・ローン・保険にアクセスできない層（低所得者・フリーランス・外国人等）に金融サービスを提供する",
    approach:"① ターゲット層の規模と金融ニーズを調査\n② 代替信用スコアを設計（行動データ活用）\n③ 規制（貸金業法・資金決済法）を確認\n④ リスク管理を設計",
    exOverseas:"M-Pesa（ケニアのモバイル決済）\nTala（新興国スマートフォンローン）\nNubank（ブラジルのデジタルバンク）",
    exJapan:"Paidy（後払い決済）\nネオバンク各社（外国人・フリーランス向け）",
    moat:"代替スコアリング精度・規制対応", difficulty:"高", priority:"中" },
  { catId:"F", patId:"F-08", patName:"教育×スキルアップ民主化",
    core:"高コスト・地理的制約のある教育・スキル習得機会をデジタルで民主化し、学習成果に連動した収益モデルを設計する",
    approach:"① ターゲットのスキルギャップを調査\n② 既存教育コストとの比較で価格を設計\n③ 学習成果の計測・証明方法を設計（資格・ポートフォリオ）\n④ ISA等の収益モデルを検討",
    exOverseas:"Coursera（大学講座のオンライン化）\nDuolingo（語学学習の民主化）",
    exJapan:"スタディサプリ（地方学生向け低価格受験対策）\nProgate（プログラミング入門の民主化）",
    moat:"コンテンツ資産・学習完了率・資格認定ネットワーク", difficulty:"中", priority:"高" },

  // ─── G. グローバル・クロスボーダー型
  { catId:"G", patId:"G-01", patName:"海外実証済みモデルのローカライズ",
    core:"海外で成功したビジネスモデルを日本市場の商習慣・規制・文化に合わせてローカライズする",
    approach:"① 海外成功事例をスキャン（CB Insights・Crunchbase等）\n② 日本市場での類似サービスの有無を確認\n③ ローカライズ要素を特定\n④ 法規制ギャップを調査",
    exOverseas:"Klarna（後払い）\nDuolingo（語学学習）\nCoursera（オンライン教育）",
    exJapan:"Paidy（Klarna型後払い）\nSchoo（Udemy型オンライン学習）\nクックパッド（Allrecipesのローカライズ）",
    moat:"ローカライズの深度・先行者優位", difficulty:"中", priority:"高" },
  { catId:"G", patId:"G-02", patName:"日本発グローバル展開",
    core:"日本国内で磨いたサービス・技術・コンテンツを海外展開し、グローバル市場を獲得する",
    approach:"① 日本固有の強みを棚卸し（品質・アニメ・製造等）\n② ターゲット市場の類似ニーズを調査\n③ 現地化コストとTAMを試算\n④ グローバル展開の先行事例を研究",
    exOverseas:"Spotify（スウェーデン発→グローバル展開）\nSkype（エストニア発→グローバル展開）",
    exJapan:"SmartNews（ニュースアプリの米国進出）\nメルカリ（米国展開）\nカプコン（ゲームのグローバル展開）",
    moat:"日本品質ブランド・先行データ・現地パートナー", difficulty:"高", priority:"中" },
  { catId:"G", patId:"G-03", patName:"越境EC×クロスボーダー取引",
    core:"地理的障壁をデジタルで克服し、海外の売り手と買い手を直接繋げる",
    approach:"① 越境ECの規制・関税・決済障壁を調査\n② ターゲット国の購買力・嗜好データを調査\n③ 物流パートナーを選定\n④ カスタマーサポートの多言語化を設計",
    exOverseas:"Alibaba国際版（中国→世界向け越境EC）\nEtsy（手工芸品の越境EC）",
    exJapan:"BEENOS（越境ECアグリゲーター）\nZenMarket（日本商品の海外販売代行）",
    moat:"物流ネットワーク・多言語対応・決済統合", difficulty:"中", priority:"中" },
  { catId:"G", patId:"G-04", patName:"新興国リープフロッグ戦略",
    core:"インフラが未整備な新興国が既存技術を飛び越えて最新技術を直接採用する現象を活かす",
    approach:"① リープフロッグが起きている技術・国を特定\n② 現地規制・政府方針を調査\n③ 現地パートナー・エージェントを探索\n④ 現地適合のプロダクトを設計",
    exOverseas:"M-Pesa（ケニアの携帯電話決済）\nJumia（アフリカのEC）\nbKash（バングラデシュのモバイルバンキング）",
    exJapan:"KDDI（ミャンマー通信インフラ）\n住友商事（アフリカのモバイルビジネス）",
    moat:"現地政府との関係・インフラ先行投資", difficulty:"高", priority:"中" },
  { catId:"G", patId:"G-05", patName:"インバウンド×文化輸出",
    core:"訪日外国人や海外での日本文化需要を取り込み、文化・観光・コンテンツを事業化する",
    approach:"① インバウンド旅行者の行動データ・ニーズを調査\n② 海外での日本文化コンテンツ需要を調査\n③ 収益化モデルを設計（体験・物販・デジタル）\n④ 多言語・多通貨対応を整備",
    exOverseas:"韓国K-POP（政府×民間×プラットフォーム連携による文化輸出戦略）",
    exJapan:"WAmazing（インバウンド体験EC）\nLive Japan（訪日旅行者向け情報）\nJ-Trip（観光体験予約）",
    moat:"コンテンツ資産・文化的独自性・多言語対応", difficulty:"中", priority:"中" },
  { catId:"G", patId:"G-06", patName:"標準化×現地化の最適バランス設計",
    core:"グローバル展開時に、標準化（スケール効率）と現地化（市場適合）のバランスを最適化する",
    approach:"① 標準化すべきコア機能と現地化すべき要素を分離\n② 現地パートナー活用か自社展開かを判断\n③ 多言語対応の優先順位を設計\n④ 国別KPIを設定",
    exOverseas:"McDonald's（メニュー一部現地化×オペレーション標準化）\nIKEA（デザイン標準化×価格現地化）",
    exJapan:"マネーフォワード（会計は標準化×各国税制は現地化）\nメルカリ（フリマ標準化×決済現地化）",
    moat:"標準化効率と現地密着の複合力", difficulty:"高", priority:"中" },
  { catId:"G", patId:"G-07", patName:"知的財産のライセンス輸出",
    core:"国内で確立した技術・コンテンツ・ブランドのIPを海外にライセンスし、資産軽量型でグローバル収益を得る",
    approach:"① ライセンス可能な自社IP（特許・商標・著作権・ノウハウ）を棚卸し\n② ライセンス需要がある国・産業を調査\n③ ロイヤリティ水準のベンチマークを確認\n④ 契約設計と不正使用対策を整備",
    exOverseas:"ARM Holdings（半導体設計IPのライセンスビジネス）\nDisney（キャラクターIPのグローバルライセンス）",
    exJapan:"任天堂（キャラクターIP）\n東映アニメーション（アニメIPの輸出）\nファナック（数値制御ライセンス）",
    moat:"IP独自性・ライセンス契約ネットワーク", difficulty:"中", priority:"中" },

  // ─── H. データ・知識資産活用型
  { catId:"H", patId:"H-01", patName:"特許・論文軸の事業化",
    core:"特許データベースや学術論文から未活用の技術・知見を発掘し、事業化を設計する",
    approach:"① J-PlatPat・USPTO・Google Patentsで出願動向を分析\n② 大学TLO（技術移転機関）と連携\n③ 実施権取得を交渉\n④ PoC設計から事業化へ展開",
    exOverseas:"Qualcomm（特許ライセンスビジネス）\nARM（設計IPの販売）\nModerna（mRNA特許の活用）",
    exJapan:"産総研発スタートアップ（技術移転）\nTDK（素材特許の事業展開）",
    moat:"特許ポートフォリオ・独自技術", difficulty:"高", priority:"中" },
  { catId:"H", patId:"H-02", patName:"オルタナティブデータのビジネス化",
    core:"衛星画像・SNS投稿・POSデータ・気象データ等の非伝統的データを分析し、意思決定価値を生む",
    approach:"① 利用可能なオルタナティブデータソースを調査\n② データ取得コストと分析コストを試算\n③ 購入意欲のある顧客（機関投資家・大企業戦略部門等）を特定\n④ プライバシー・利用規約を確認",
    exOverseas:"Orbital Insight（衛星画像×小売分析）\nEagle Alpha（オルタナティブデータ取引所）",
    exJapan:"ナウキャスト（POSデータ×経済指標）\nSPEEDA（企業情報データプラットフォーム）",
    moat:"データソースの独自性・分析精度", difficulty:"高", priority:"中" },
  { catId:"H", patId:"H-03", patName:"知識グラフ×推薦エンジン",
    core:"構造化された知識を関係性グラフで表現し、文脈を理解した高精度レコメンデーションを提供する",
    approach:"① 対象ドメインの知識構造を設計\n② エンティティ・関係を定義\n③ グラフDBを選定（Neo4j等）\n④ 推薦精度の評価指標を設計",
    exOverseas:"LinkedIn（職業知識グラフ）\nNetflix（コンテンツ特徴グラフ×視聴履歴）\nGoogle Knowledge Graph",
    exJapan:"Sansan（ビジネス人脈グラフ）\nログリー（コンテンツ推薦エンジン）",
    moat:"知識グラフの規模・精度", difficulty:"高", priority:"中" },
  { catId:"H", patId:"H-04", patName:"業界データ標準化×SaaS",
    core:"業界の非標準化データ（紙・PDF・独自フォーマット）をデジタル化・標準化し、業界全体の効率を向上させる",
    approach:"① 業界のデータ散在状況を調査\n② データ標準化のステークホルダーをマップ\n③ 規格策定のリード可能性を評価\n④ コンソーシアム形成戦略を設計",
    exOverseas:"Veeva Systems（製薬向けCRM・コンプライアンスデータ統合）\nProcore（建設業界データ標準化）",
    exJapan:"Shippio（貿易書類のデジタル化）\nカケハシ（薬局データの標準化）",
    moat:"業界標準策定の主導権・ネットワーク効果", difficulty:"高", priority:"中" },
  { catId:"H", patId:"H-05", patName:"行動データ×予測サービス",
    core:"過去の行動データを機械学習で分析し、将来の行動・需要・リスクを予測して付加価値を提供する",
    approach:"① 予測精度が経営インパクトに直結する業務を特定\n② 学習データ量と予測精度の関係を試算\n③ モデルの解釈可能性要件を確認\n④ 継続学習の仕組みを設計",
    exOverseas:"Palantir Foundry（企業行動データの予測分析）\nC3.ai（産業AI予測）",
    exJapan:"フロムスクラッチ（マーケティングデータ予測）\nPKSHA Technology（金融審査AI）",
    moat:"学習データ量・予測精度・顧客囲い込み", difficulty:"高", priority:"高" },
  { catId:"H", patId:"H-06", patName:"プライバシー強化技術（PET）活用",
    core:"差分プライバシー・連合学習・秘密計算等の技術を使い、個人データを保護しながら分析価値を引き出す",
    approach:"① 活用したいデータの感度を評価\n② 適用可能なPETs技術を選定\n③ 法規制（GDPR・個人情報保護法）の適合を確認\n④ 精度とプライバシーのトレードオフを評価",
    exOverseas:"Apple（差分プライバシーのiOSへの実装）\nGoogle（連合学習をGboard等に実装）",
    exJapan:"富士通（秘密計算の金融データ活用）\nNTTデータ（医療データ連携基盤）",
    moat:"プライバシー技術の先行実装・信頼ブランド", difficulty:"高", priority:"中" },
  { catId:"H", patId:"H-07", patName:"リアルタイムデータ×動的価格設定",
    core:"需要・供給・外部環境のリアルタイムデータを使って価格を動的最適化し、収益を最大化する",
    approach:"① 動的価格設定が受容される市場と条件を特定\n② 価格弾力性を計測\n③ リアルタイムデータソースを設計\n④ 倫理・顧客信頼リスクを評価",
    exOverseas:"Uber（サージプライシング）\nAirbnb（需要予測に基づく動的宿泊価格）",
    exJapan:"JR東日本（オフピーク割引）\n各大手ホテル（動的宿泊価格設定）",
    moat:"リアルタイムデータ優位・価格最適化アルゴリズム", difficulty:"高", priority:"中" },

  // ─── I. 既存資産・強み転用型
  { catId:"I", patId:"I-01", patName:"コア技術の隣接市場展開",
    core:"自社の技術・ノウハウを現在の市場より広い隣接市場に転用し、新たな収益源を創出する",
    approach:"① コア技術の強みを棚卸し\n② 隣接市場を定義（技術×顧客×用途の軸）\n③ 市場規模・競合密度を調査\n④ 転用コストを試算し、パイロット顧客を獲得",
    exOverseas:"Amazon（EC→AWS）\nDyson（掃除機モーター技術→ドライヤー・扇風機）",
    exJapan:"ソニー（エレクトロニクス→金融・音楽）\nシャープ（液晶→医療機器）",
    moat:"技術優位性・ブランド転移・既存顧客基盤", difficulty:"中", priority:"高" },
  { catId:"I", patId:"I-02", patName:"顧客基盤への追加サービス（クロスセル）",
    core:"既存の顧客基盤に対して、信頼関係を活かして関連サービスを追加提供する",
    approach:"① 既存顧客の隣接ニーズをアンケート調査\n② クロスセルの期待LTVを試算\n③ 新サービスの内製か提携かを判断\n④ 導入摩擦を最小化する設計を実施",
    exOverseas:"Apple（Mac→iPhone→Watch→サービス群）\nIntuit（TurboTax→Mint→QuickBooks）",
    exJapan:"楽天（EC→金融→旅行→通信のエコシステム）\nマネーフォワード（会計→HR→法人サービス群）",
    moat:"顧客信頼・データ統合・エコシステムの深さ", difficulty:"低", priority:"高" },
  { catId:"I", patId:"I-03", patName:"遊休資産のプラットフォーム化",
    core:"自社または業界が保有する使われていない資産（データ・設備・ネットワーク）を外部に開放して収益化する",
    approach:"① 自社遊休資産を棚卸し（データ・施設・人材・特許）\n② 外部需要を調査\n③ 収益化モデルを設計（販売・ライセンス・API）\n④ セキュリティ・契約を整備",
    exOverseas:"Amazon（自社物流→FBA）\nAlibaba（ECインフラ→クラウド・決済）",
    exJapan:"NTT（通信インフラ→クラウド）\nJR東日本（駅データ×広告・小売）",
    moat:"資産の希少性・スケール", difficulty:"中", priority:"中" },
  { catId:"I", patId:"I-04", patName:"ブランド×新カテゴリー進出",
    core:"確立されたブランドの信頼・認知を活用して隣接カテゴリーに参入する",
    approach:"① ブランド連想を調査（消費者がどの価値を想起するか）\n② 新カテゴリーでのブランド適合性を評価\n③ ブランド毀損リスクを評価\n④ ライセンシングか自社展開かを比較",
    exOverseas:"Virgin（航空→音楽→金融→宇宙）\nGoogle（検索→メール→スマホ→クラウド）",
    exJapan:"ヤマハ（楽器→バイク→電子機器）\nスターバックス（コーヒー→雑貨・ライフスタイル）",
    moat:"ブランドエクイティ・顧客ロイヤルティ", difficulty:"中", priority:"中" },
  { catId:"I", patId:"I-05", patName:"人的ネットワーク資産の事業化",
    core:"創業者・チームが持つ業界ネットワーク・専門知識を事業の初速として活用する",
    approach:"① チームの人的ネットワークを棚卸し\n② ネットワークが持つ課題・ニーズをヒアリング\n③ 最初の10顧客をネットワークから獲得する計画を立案\n④ スケール時のネットワーク依存からの脱却を設計",
    exOverseas:"LinkedIn（Reid Hoffmanの人脈を活用した初期ユーザー獲得）\nOpenAI（研究者ネットワークの活用）",
    exJapan:"Sansan（経営者ネットワーク→企業向け名刺管理）\nM&Aクラウド（M&A専門家ネットワーク）",
    moat:"人的ネットワーク・信頼関係", difficulty:"低", priority:"高" },
  { catId:"I", patId:"I-06", patName:"M&A×統合後価値創出",
    core:"買収した企業の資産・顧客・技術を自社と統合し、単独では実現できない価値を創出する",
    approach:"① 統合シナジーを定量化（コスト削減＋売上増加）\n② PMI（買収後統合）計画を設計\n③ 文化統合リスクを評価\n④ 統合KPIを設定",
    exOverseas:"Google（YouTube買収→動画広告）\nFacebook（Instagram・WhatsApp買収）",
    exJapan:"リクルート（Indeed買収→グローバル求人）\nZHD（ZOZOTOWNの子会社化）",
    moat:"統合後のシナジー実現能力", difficulty:"高", priority:"中" },

  // ─── J. 未来予測・シナリオ型
  { catId:"J", patId:"J-01", patName:"メガトレンド起点の事業設計",
    core:"人口動態・技術・環境・地政学などの10〜20年単位のメガトレンドを起点に、必然的に生まれる市場を先取りする",
    approach:"① メガトレンドを特定（国連・McKinsey・PwC等のレポートを参照）\n② トレンドの確実性×インパクトを評価\n③ 影響を受ける業界の変化シナリオを設計\n④ 先行投資タイミングを見極める",
    exOverseas:"Tesla（電動化メガトレンドの先取り）\nBeyond Meat（植物性食品トレンドの先取り）",
    exJapan:"ウェルモ（高齢化メガトレンド×介護DX）\nヤフー（インターネット普及メガトレンドの先取り）",
    moat:"先行者優位・市場形成への参与", difficulty:"高", priority:"高" },
  { catId:"J", patId:"J-02", patName:"シナリオプランニング×事業オプション設計",
    core:"複数の未来シナリオを設計し、どのシナリオでも価値を持つ事業オプションを優先して投資する",
    approach:"① 不確実性要因を特定（2×2マトリクス）\n② 4シナリオを記述\n③ 各シナリオで価値のある事業オプションを抽出\n④ ポートフォリオとして投資優先度を決定",
    exOverseas:"Shell（シナリオプランニングの発祥企業）\nAmazon（複数事業の同時並行展開）",
    exJapan:"ソフトバンク（通信×AI×投資のポートフォリオ戦略）\n伊藤忠商事（総合商社の事業多様化）",
    moat:"事業ポートフォリオの柔軟性", difficulty:"高", priority:"中" },
  { catId:"J", patId:"J-03", patName:"ホワイトスペース探索（空白市場発見）",
    core:"既存の競合マップを作成し、まだ誰も参入していない顧客×機能の空白領域を発見する",
    approach:"① 競合の機能×価格×ターゲットをマッピング\n② 既存サービスが提供していない組み合わせを特定\n③ 空白領域の顧客ニーズを調査\n④ 参入コストと市場規模を試算",
    exOverseas:"Notion（Evernote×Confluence×Trelloの空白を統合）\nFigma（デザインコラボレーションの空白）",
    exJapan:"Sansan（名刺管理という空白市場）\nfreee（中小企業向けクラウド会計の空白）",
    moat:"空白への先行参入・カテゴリー創造", difficulty:"中", priority:"高" },
  { catId:"J", patId:"J-04", patName:"カテゴリーキング戦略（Play Bigger）",
    core:"既存カテゴリーに参入するのではなく、新しいカテゴリーを創造してその王者を目指す",
    approach:"① 新カテゴリーを言語化（Category Design Canvas）\n② カテゴリー問題を定義\n③ 「なぜ今、なぜ自社か」の物語を設計\n④ アナリスト・メディアへのカテゴリー啓蒙活動を実施",
    exOverseas:"Salesforce（クラウドCRMカテゴリーの創造）\nUber（ライドシェアカテゴリーの創造）",
    exJapan:"メルカリ（C2Cフリマアプリのカテゴリー創造）\nSmartHR（クラウド人事労務のカテゴリー創造）",
    moat:"カテゴリー定義権・思想的リーダーシップ", difficulty:"高", priority:"高" },
  { catId:"J", patId:"J-05", patName:"アナログ残存領域のデジタル化",
    core:"デジタル化が遅れている業界・業務に特化し、DX推進の受け皿となるサービスを構築する",
    approach:"① デジタル化率が低い業界を特定（建設・農業・医療・士業等）\n② デジタル化を阻む真の障壁を調査\n③ 規制対応・業界慣行を理解\n④ リテラシーを考慮したUXを設計",
    exOverseas:"Procore（建設業DX）\nVeeva Systems（製薬業DX）",
    exJapan:"freee（中小企業会計DX）\nSmartHR（人事DX）\nカオナビ（タレントマネジメントDX）",
    moat:"業界知識・規制対応・現場オペレーションとの統合", difficulty:"中", priority:"高" },
  { catId:"J", patId:"J-06", patName:"制度・社会設計の再構築",
    core:"社会制度や業界慣行のひずみ（非効率・不公平・不透明）を起点に、制度そのものを再設計する視点で事業化する",
    approach:"① 制度的な非効率・不公平を可視化\n② 利害関係者をマップ\n③ 規制変更・ロビイングの可能性を評価\n④ 政府・NPO・市場の複合モデルを設計",
    exOverseas:"Wise（銀行の隠れコストを可視化し低コスト送金を実現）\nRobinhood（証券手数料のゼロ化）",
    exJapan:"弁護士ドットコム（法律サービスの非透明さを解消）\nLIFULL（住宅情報の透明化）",
    moat:"社会的正当性・規制対応・メディア露出", difficulty:"高", priority:"中" },
  { catId:"J", patId:"J-07", patName:"コンバージェンス型（産業融合）",
    core:"異なる産業の技術・市場・顧客が融合するタイミングを捉え、その交差点に事業を設計する",
    approach:"① 異なる産業のトレンドが交差する「融合点」を特定\n② 各産業プレイヤーの動向を分析\n③ 融合によって生まれる新しい価値を仮説化\n④ 先行する融合事例を研究",
    exOverseas:"Peloton（フィットネス×エンタメ×ソフトウェア）\nTesla（自動車×エネルギー×AI）",
    exJapan:"ソニー（エンタメ×テクノロジー×金融の融合）\nトヨタ（都市×モビリティ×AIのWoven City）",
    moat:"融合点の早期定義・複合ケイパビリティ", difficulty:"高", priority:"高" },
  { catId:"J", patId:"J-08", patName:"ダークホース産業の先行投資",
    core:"現在は小規模だが、技術コスト低下や規制変化によって急拡大する可能性のある産業に先行する",
    approach:"① 技術コスト曲線を分析（太陽光・バッテリー等のラーニングカーブ）\n② 規制変化を予測（法改正スケジュール）\n③ 先行プレイヤーをフォロー\n④ リスク分散投資を設計",
    exOverseas:"SolarCity（太陽光普及前の先行参入）\nWaymo（自動運転の先行投資）",
    exJapan:"ソフトバンク（太陽光発電事業）\nテラモーターズ（EV先行投資）",
    moat:"先行者優位・技術ラーニングカーブの内部化", difficulty:"高", priority:"中" },
];

// ══════════════════════════════════════════════════════════════════════
// セルビルダー
// ══════════════════════════════════════════════════════════════════════
const hairBorder = (col="CBD5E1") => ({ style:"hair",  color:{ rgb:col } });
const thinBorder = (col="94A3B8") => ({ style:"thin",  color:{ rgb:col } });
const medBorder  = (col="475569") => ({ style:"medium",color:{ rgb:col } });

const bAll = (fn, col) => ({ top:fn(col), bottom:fn(col), left:fn(col), right:fn(col) });

function cell(v, bg, fg, sz, bold, halign, valign, wrap, borderFn, borderCol) {
  return {
    v: v ?? "", t:"s",
    s: {
      fill: { fgColor:{ rgb: bg || "FFFFFF" } },
      font: { bold: bold||false, color:{ rgb: fg||"1E293B" }, sz: sz||10 },
      alignment: { horizontal: halign||"left", vertical: valign||"top", wrapText: wrap!==false },
      border: bAll(borderFn||hairBorder, borderCol||"E2E8F0"),
    }
  };
}

function enc(r,c) { return XLSX.utils.encode_cell({r,c}); }
function set(ws, r, c, cellObj) { ws[enc(r,c)] = cellObj; }
function merge(ws, r1, c1, r2, c2) {
  ws["!merges"] = ws["!merges"] || [];
  ws["!merges"].push({ s:{r:r1,c:c1}, e:{r:r2,c:c2} });
}
function setRef(ws, rows, cols) {
  ws["!ref"] = XLSX.utils.encode_range({ s:{r:0,c:0}, e:{r:rows,c:cols} });
}

// ── 共通ヘッダーセル
function hdr(v, bg, fg, sz) {
  return cell(v, bg||"0F172A", fg||"FFFFFF", sz||11, true, "center", "center", true, thinBorder, "334155");
}

// ── 優先度セル
function priCell(val) {
  const m = {
    "高":{ label:"◉  高", fg:C.priH, bg:C.priHbg },
    "中":{ label:"◎  中", fg:C.priM, bg:C.priMbg },
    "低":{ label:"○  低", fg:C.priL, bg:C.priLbg },
  };
  const d = m[val]||{ label:val, fg:"1E293B", bg:"FFFFFF" };
  return cell(d.label, d.bg, d.fg, 10, true, "center", "center", false, hairBorder, "E2E8F0");
}

// ── 難易度セル
function difCell(val) {
  const m = {
    "高":{ label:"▲  高", fg:"7F1D1D", bg:"FFF0F0" },
    "中":{ label:"△  中", fg:"78350F", bg:"FFFBEB" },
    "低":{ label:"▽  低", fg:"14532D", bg:"F0FFF4" },
  };
  const d = m[val]||{ label:val, fg:"1E293B", bg:"FFFFFF" };
  return cell(d.label, d.bg, d.fg, 10, true, "center", "center", false, hairBorder, "E2E8F0");
}

// ── カテゴリバナーセル
function catBanner(catId) {
  const c = CAT[catId];
  return cell(
    `  ${catId}.  ${c.name}`,
    c.dark, "FFFFFF", 12, true, "left", "center", false, medBorder, c.dark
  );
}

// ══════════════════════════════════════════════════════════════════════
// Sheet 1: カバー
// ══════════════════════════════════════════════════════════════════════
function buildCover() {
  const ws = {};
  const COLS = 7;
  let r = 0;

  // ── タイトルブロック
  const titleRows = [
    { v:"新規事業アイデア生成フレームワーク", bg:"0F172A", fg:"F8FAFC", sz:20 },
    { v:"Business Idea Generation Framework  v3.0", bg:"0F172A", fg:"60A5FA", sz:12 },
    { v:"74パターン × 10大分類　｜　発掘アプローチ・海外事例・日本事例 完全収録", bg:"1E3A5F", fg:"CBD5E1", sz:11 },
  ];
  for (const { v, bg, fg, sz } of titleRows) {
    set(ws, r, 0, cell(v, bg, fg, sz, true, "center", "center", false, medBorder, "334155"));
    merge(ws, r, 0, r, COLS - 1);
    r++;
  }
  r++;

  // ── 統計ボックス（6列）
  const statCols = 6;
  const hiCount = patterns.filter(p=>p.priority==="高").length;
  const mdCount = patterns.filter(p=>p.priority==="中").length;
  const loCount = patterns.filter(p=>p.priority==="低").length;
  const cats = {};
  for (const p of patterns) {
    if (!cats[p.catId]) cats[p.catId]={name:p.catName,list:[]};
    cats[p.catId].list.push(p);
  }
  const stats = [
    { label:"総パターン数",  val:`${patterns.length}`,      fg:"60A5FA", bg:"0F172A" },
    { label:"大分類数",      val:`${Object.keys(cats).length}`, fg:"34D399", bg:"064E3B" },
    { label:"優先度：高",    val:`${hiCount} 件`,           fg:"FCA5A5", bg:"7F1D1D" },
    { label:"優先度：中",    val:`${mdCount} 件`,           fg:"FDE68A", bg:"78350F" },
    { label:"優先度：低",    val:`${loCount} 件`,           fg:"A7F3D0", bg:"14532D" },
    { label:"作成日",        val:"2026-04-14",              fg:"E2E8F0", bg:"1E293B" },
  ];
  // ラベル行
  for (let c=0; c<statCols; c++) {
    set(ws, r, c, cell(stats[c].label, stats[c].bg, "94A3B8", 9, false, "center", "center", false, thinBorder, "334155"));
  }
  r++;
  // 値行
  for (let c=0; c<statCols; c++) {
    set(ws, r, c, cell(stats[c].val, stats[c].bg, stats[c].fg, 16, true, "center", "center", false, thinBorder, "334155"));
  }
  r += 2;

  // ── 大分類テーブル
  set(ws, r, 0, cell("▌  大分類一覧（10カテゴリー）", "1E3A5F", "F1F5F9", 12, true, "left", "center", false, medBorder, "334155"));
  merge(ws, r, 0, r, COLS - 1);
  r++;

  const catHdrs = ["ID", "大分類名", "パターン数", "高優先", "中優先", "低優先", "代表アプローチ"];
  const catHdrBg = ["0F172A","0F172A","0F172A","7F1D1D","78350F","14532D","0F172A"];
  for (let c=0; c<catHdrs.length; c++) {
    set(ws, r, c, cell(catHdrs[c], catHdrBg[c], "FFFFFF", 10, true, "center", "center", true, thinBorder, "334155"));
  }
  r++;

  for (const [catId, { name, list }] of Object.entries(cats)) {
    const cc = CAT[catId];
    const hi = list.filter(p=>p.priority==="高").length;
    const md = list.filter(p=>p.priority==="中").length;
    const lo = list.filter(p=>p.priority==="低").length;
    const rep = list.find(p=>p.priority==="高")?.patName || list[0].patName;
    const vals = [catId, name, list.length, hi, md, lo, rep];
    for (let c=0; c<vals.length; c++) {
      const isId = c===0;
      const isNum = c>=2 && c<=5;
      set(ws, r, c, cell(
        String(vals[c]),
        isId ? cc.dark : cc.light,
        isId ? "FFFFFF" : cc.text,
        isId ? 12 : 10,
        isId, isNum ? "center" : "left", "center", true,
        thinBorder, cc.dark
      ));
    }
    r++;
  }
  r++;

  // ── 使い方
  set(ws, r, 0, cell("▌  このフレームワークの使い方", "1E3A5F", "F1F5F9", 12, true, "left", "center", false, medBorder, "334155"));
  merge(ws, r, 0, r, COLS - 1);
  r++;

  const steps = [
    "①  【全パターン一覧】シートで74パターンを俯瞰し、自社の状況に合った大分類・パターンを選定する",
    "②  各パターンの「発掘・調査・検討アプローチ（①〜④）」欄に沿って順番に調査・検討を進める",
    "③  「ビジネス事例（海外）」「ビジネス事例（日本）」を参考に、自社への転用と差別化ポイントを検討する",
    "④  【優先度マトリクス】シートで「高優先×低難易度」から優先順に取り組むパターンを絞り込む",
    "⑤  複数のパターンを掛け合わせることで、より独自性の高いアイデアを創出できる",
  ];
  const stepColors = ["DBEAFE","D1FAE5","FEF3C7","FCE7F3","EDE9FE"];
  const stepFgColors = ["1E3A8A","064E3B","78350F","831843","4C1D95"];
  for (let i=0; i<steps.length; i++) {
    set(ws, r, 0, cell(steps[i], stepColors[i], stepFgColors[i], 10, false, "left", "center", true, hairBorder, "CBD5E1"));
    merge(ws, r, 0, r, COLS - 1);
    r++;
  }

  ws["!cols"] = [{wch:10},{wch:26},{wch:10},{wch:8},{wch:8},{wch:8},{wch:40}];
  ws["!rows"] = [
    {hpt:46},{hpt:22},{hpt:28},{hpt:28},{hpt:8},
    {hpt:22},{hpt:26},
    ...Object.keys(cats).map(()=>({hpt:24})),
    {hpt:8},{hpt:26},
    ...steps.map(()=>({hpt:28})),
  ];
  setRef(ws, r, COLS - 1);
  return ws;
}

// ══════════════════════════════════════════════════════════════════════
// Sheet 2: 全パターン一覧
// ══════════════════════════════════════════════════════════════════════
function buildMain() {
  const ws = {};
  const NCOLS = 11;

  // ヘッダー行
  const hdrs = [
    "No.", "パターンID", "パターン名",
    "コアロジック", "発掘・調査・検討アプローチ（①②③④）",
    "ビジネス事例（海外）", "ビジネス事例（日本）",
    "競争優位・護城河（モート）", "難易度", "優先度"
  ];
  // ヘッダーはcolspan対応のため catId列を先に作る -> 実は11列にする
  const hdrs11 = ["No.", "大分類", "パターンID", "パターン名",
    "コアロジック", "発掘・調査・検討アプローチ（①②③④）",
    "ビジネス事例（海外）", "ビジネス事例（日本）",
    "競争優位・護城河（モート）", "難易度", "優先度"];
  for (let c=0; c<hdrs11.length; c++) {
    set(ws, 0, c, hdr(hdrs11[c]));
  }

  let r = 1;
  let no = 1;
  let prevCatId = "";

  for (const p of patterns) {
    const cc = CAT[p.catId];

    // カテゴリバナー行（カテゴリが変わるとき）
    if (p.catId !== prevCatId) {
      set(ws, r, 0, catBanner(p.catId));
      merge(ws, r, 0, r, NCOLS - 1);
      ws["!rows"] = ws["!rows"] || [{ hpt:32 }];
      ws["!rows"].push({ hpt:26 });
      r++;
      prevCatId = p.catId;
    }

    // 背景色: 薄いカテゴリ色を明るさで交互
    const rowBg = no % 2 === 1 ? cc.light : "FFFFFF";
    const textFg = cc.text;

    // No.
    set(ws, r, 0, cell(String(no), "F8FAFC", "94A3B8", 9, false, "center", "center", false, hairBorder, "E2E8F0"));
    // 大分類（短いID+色帯）
    set(ws, r, 1, cell(p.catId, cc.dark, "FFFFFF", 11, true, "center", "center", false, thinBorder, cc.dark));
    // パターンID
    set(ws, r, 2, cell(p.patId, rowBg, cc.mid, 10, true, "center", "top", false, hairBorder, "E2E8F0"));
    // パターン名
    set(ws, r, 3, cell(p.patName, rowBg, textFg, 10, true, "left", "top", true, hairBorder, "E2E8F0"));
    // コアロジック
    set(ws, r, 4, cell(p.core, rowBg, textFg, 9, false, "left", "top", true, hairBorder, "E2E8F0"));
    // アプローチ
    set(ws, r, 5, cell(p.approach, rowBg, "0F172A", 9, false, "left", "top", true, hairBorder, "E2E8F0"));
    // 海外事例
    set(ws, r, 6, cell(p.exOverseas, rowBg, "1D4ED8", 9, false, "left", "top", true, hairBorder, "E2E8F0"));
    // 日本事例
    set(ws, r, 7, cell(p.exJapan, rowBg, "DC2626", 9, false, "left", "top", true, hairBorder, "E2E8F0"));
    // モート
    set(ws, r, 8, cell(p.moat, rowBg, textFg, 9, false, "left", "top", true, hairBorder, "E2E8F0"));
    // 難易度
    set(ws, r, 9, difCell(p.difficulty));
    // 優先度
    set(ws, r, 10, priCell(p.priority));

    ws["!rows"] = ws["!rows"] || [];
    ws["!rows"].push({ hpt:90 });
    r++;
    no++;
  }

  ws["!cols"] = [
    {wch:5},{wch:6},{wch:10},{wch:26},
    {wch:44},{wch:52},
    {wch:44},{wch:40},
    {wch:32},{wch:9},{wch:9}
  ];
  if (!ws["!rows"]) ws["!rows"] = [];
  ws["!rows"][0] = { hpt:34 };

  ws["!freeze"] = { xSplit:0, ySplit:1 };
  ws["!autofilter"] = { ref: XLSX.utils.encode_range({s:{r:0,c:0},e:{r:0,c:NCOLS-1}}) };
  setRef(ws, r - 1, NCOLS - 1);
  return ws;
}

// ══════════════════════════════════════════════════════════════════════
// Sheet 3: 大分類別サマリー
// ══════════════════════════════════════════════════════════════════════
function buildSummary() {
  const ws = {};

  const hdrs = ["ID","大分類名","件数","高優先","中優先","低優先","高難易","中難易","低難易","高優先パターン（例）"];
  const hdrBgs = ["0F172A","0F172A","1E293B","7F1D1D","78350F","14532D","7F1D1D","78350F","14532D","0F172A"];
  for (let c=0;c<hdrs.length;c++) {
    set(ws, 0, c, cell(hdrs[c], hdrBgs[c], "FFFFFF", 10, true, "center", "center", true, thinBorder, "334155"));
  }

  const cats = {};
  for (const p of patterns) {
    if (!cats[p.catId]) cats[p.catId]={name:p.catName,list:[]};
    cats[p.catId].list.push(p);
  }

  let r = 1;
  for (const [catId, {name, list}] of Object.entries(cats)) {
    const cc = CAT[catId];
    const hi = list.filter(p=>p.priority==="高").length;
    const md = list.filter(p=>p.priority==="中").length;
    const lo = list.filter(p=>p.priority==="低").length;
    const dhi = list.filter(p=>p.difficulty==="高").length;
    const dmd = list.filter(p=>p.difficulty==="中").length;
    const dlo = list.filter(p=>p.difficulty==="低").length;
    const reps = list.filter(p=>p.priority==="高").map(p=>p.patName).join("、");

    set(ws,r,0,cell(catId,cc.dark,"FFFFFF",13,true,"center","center",false,thinBorder,cc.dark));
    set(ws,r,1,cell(name,cc.light,cc.text,10,true,"left","center",false,thinBorder,cc.dark));
    set(ws,r,2,cell(String(list.length),cc.light,cc.dark,12,true,"center","center",false,hairBorder,"E2E8F0"));
    set(ws,r,3,cell(String(hi),"FEE2E2","991B1B",12,true,"center","center",false,hairBorder,"E2E8F0"));
    set(ws,r,4,cell(String(md),"FEF3C7","92400E",12,true,"center","center",false,hairBorder,"E2E8F0"));
    set(ws,r,5,cell(String(lo),"DCFCE7","166534",12,true,"center","center",false,hairBorder,"E2E8F0"));
    set(ws,r,6,cell(String(dhi),"FFF0F0","7F1D1D",11,false,"center","center",false,hairBorder,"E2E8F0"));
    set(ws,r,7,cell(String(dmd),"FFFBEB","78350F",11,false,"center","center",false,hairBorder,"E2E8F0"));
    set(ws,r,8,cell(String(dlo),"F0FFF4","14532D",11,false,"center","center",false,hairBorder,"E2E8F0"));
    set(ws,r,9,cell(reps,cc.light,cc.text,9,false,"left","center",true,hairBorder,"E2E8F0"));
    r++;
  }

  // 合計行
  set(ws,r,0,cell("合計","0F172A","FFFFFF",11,true,"center","center",false,thinBorder,"334155"));
  set(ws,r,1,cell("全10大分類","1E293B","E2E8F0",10,true,"left","center",false,thinBorder,"334155"));
  set(ws,r,2,cell(String(patterns.length),"1E293B","60A5FA",14,true,"center","center",false,thinBorder,"334155"));
  [3,4,5,6,7,8].forEach(c=>{
    const vals = [
      patterns.filter(p=>p.priority==="高").length,
      patterns.filter(p=>p.priority==="中").length,
      patterns.filter(p=>p.priority==="低").length,
      patterns.filter(p=>p.difficulty==="高").length,
      patterns.filter(p=>p.difficulty==="中").length,
      patterns.filter(p=>p.difficulty==="低").length,
    ];
    set(ws,r,c,cell(String(vals[c-3]),"1E293B","E2E8F0",12,true,"center","center",false,thinBorder,"334155"));
  });
  set(ws,r,9,cell("","1E293B","E2E8F0",10,false,"left","center",false,thinBorder,"334155"));

  ws["!cols"]=[{wch:8},{wch:26},{wch:8},{wch:8},{wch:8},{wch:8},{wch:8},{wch:8},{wch:8},{wch:56}];
  ws["!rows"]=[{hpt:34},...Object.keys(cats).map(()=>({hpt:28})),{hpt:28}];
  ws["!freeze"]={xSplit:0,ySplit:1};
  setRef(ws,r,9);
  return ws;
}

// ══════════════════════════════════════════════════════════════════════
// Sheet 4: 優先度マトリクス
// ══════════════════════════════════════════════════════════════════════
function buildMatrix() {
  const ws = {};

  const hdrs = ["順位","パターンID","パターン名","大分類","優先度","難易度","競争優位・護城河（モート）","コアロジック"];
  const hdrBgs = ["0F172A","0F172A","0F172A","0F172A","7F1D1D","7F1D1D","0F172A","0F172A"];
  for (let c=0;c<hdrs.length;c++) {
    set(ws,0,c,cell(hdrs[c],hdrBgs[c],"FFFFFF",10,true,"center","center",true,thinBorder,"334155"));
  }

  const prioOrd={"高":0,"中":1,"低":2};
  const diffOrd={"低":0,"中":1,"高":2};
  const sorted=[...patterns].sort((a,b)=>{
    if(prioOrd[a.priority]!==prioOrd[b.priority]) return prioOrd[a.priority]-prioOrd[b.priority];
    return diffOrd[a.difficulty]-diffOrd[b.difficulty];
  });

  let prevPrio = "";
  let r = 1;
  let no = 1;

  for (const p of sorted) {
    const cc = CAT[p.catId];

    // 優先度グループバナー
    if (p.priority !== prevPrio) {
      const prioMeta = {
        "高":{ bg:"7F1D1D", label:"◉  優先度：高　（積極的に取り組む推奨パターン）" },
        "中":{ bg:"78350F", label:"◎  優先度：中　（リソースに応じて検討するパターン）" },
        "低":{ bg:"14532D", label:"○  優先度：低　（長期・補完的に活用するパターン）" },
      };
      const m = prioMeta[p.priority];
      set(ws,r,0,cell(m.label, m.bg, "FFFFFF", 11, true, "left", "center", false, medBorder, m.bg));
      merge(ws,r,0,r,7);
      ws["!rows"] = ws["!rows"] || [{hpt:34}];
      ws["!rows"].push({hpt:24});
      r++;
      prevPrio = p.priority;
    }

    const rowBg = no%2===1 ? cc.light : "FFFFFF";
    set(ws,r,0,cell(String(no),"F8FAFC","94A3B8",9,false,"center","center",false,hairBorder,"E2E8F0"));
    set(ws,r,1,cell(p.patId,rowBg,cc.mid,10,true,"center","top",false,hairBorder,"E2E8F0"));
    set(ws,r,2,cell(p.patName,rowBg,cc.text,10,true,"left","top",true,hairBorder,"E2E8F0"));
    set(ws,r,3,cell(p.catId,cc.dark,"FFFFFF",11,true,"center","center",false,thinBorder,cc.dark));
    set(ws,r,4,priCell(p.priority));
    set(ws,r,5,difCell(p.difficulty));
    set(ws,r,6,cell(p.moat,rowBg,cc.text,9,false,"left","top",true,hairBorder,"E2E8F0"));
    set(ws,r,7,cell(p.core,rowBg,"0F172A",9,false,"left","top",true,hairBorder,"E2E8F0"));
    ws["!rows"] = ws["!rows"] || [];
    ws["!rows"].push({hpt:36});
    r++;
    no++;
  }

  ws["!cols"]=[{wch:6},{wch:10},{wch:26},{wch:6},{wch:9},{wch:9},{wch:34},{wch:46}];
  if (!ws["!rows"]) ws["!rows"]=[];
  ws["!rows"][0]={hpt:34};
  ws["!freeze"]={xSplit:0,ySplit:1};
  ws["!autofilter"]={ref:XLSX.utils.encode_range({s:{r:0,c:0},e:{r:0,c:7}})};
  setRef(ws,r-1,7);
  return ws;
}

// ══════════════════════════════════════════════════════════════════════
// 出力
// ══════════════════════════════════════════════════════════════════════
const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, buildCover(),   "概要・使い方");
XLSX.utils.book_append_sheet(wb, buildMain(),    "全パターン一覧");
XLSX.utils.book_append_sheet(wb, buildSummary(), "大分類別サマリー");
XLSX.utils.book_append_sheet(wb, buildMatrix(),  "優先度マトリクス");

const outDir = join(__dirname, "..", "docs");
mkdirSync(outDir, { recursive: true });
const outPath = join(outDir, "idea-generation-patterns.xlsx");
XLSX.writeFile(wb, outPath, { bookType:"xlsx", cellStyles:true });
console.log(`✅ 出力完了: ${outPath}`);
console.log(`   パターン数: ${patterns.length}件`);
