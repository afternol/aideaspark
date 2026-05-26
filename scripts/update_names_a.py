"""#1-#19: serviceName / slug / oneLiner / concept(冒頭)一括更新"""
import io, sys, os, psycopg2
if sys.stdout.encoding and sys.stdout.encoding.lower() != "utf-8":
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")
try:
    from dotenv import load_dotenv; load_dotenv()
except ImportError:
    pass

updates = [
    {
        "number": 1,
        "serviceName": "ナイトガードSOC",
        "slug": "nightguard-soc-1",
        "oneLiner": "夜間転倒検知×成果報酬モデルを一体化した介護施設向けSaaS",
        "conceptLead": "【新規性】夜間転倒アラートの遠隔トリアージと成果報酬課金を組み合わせたモデルは国内初。",
    },
    {
        "number": 2,
        "serviceName": "ロスカット・ラボ",
        "slug": "loscut-lab-2",
        "oneLiner": "廃棄予測と当日特売自動生成を一体化し食材ロスを収益に変えるSaaS",
        "conceptLead": "【新規性】廃棄予測AIと特売LP自動生成を組み合わせ「ロスを収益化」する飲食店特化設計は国内初。",
    },
    {
        "number": 3,
        "serviceName": "ショクニンパス",
        "slug": "shokunin-pass-3",
        "oneLiner": "職人メンターと若手をマッチングし技能継承を従量課金で提供するSaaS",
        "conceptLead": "【新規性】熟練職人の技能を「教えた分だけ課金」する従量課金型メンタリングSaaSは建設業で初の試み。",
    },
    {
        "number": 4,
        "serviceName": "CommitGuard",
        "slug": "commit-guard-4",
        "oneLiner": "業務委託の法的リスクを成果保証で引き受ける発注企業向けリーガルSaaS",
        "conceptLead": "【新規性】フリーランス保護法施行後の発注企業リスクを「成果保証」という新モデルで受け持つSaaSは国内初。",
    },
    {
        "number": 5,
        "serviceName": "アグリシールド",
        "slug": "agri-shield-5",
        "oneLiner": "収量データ連動でリアルタイムに気候リスクを自動ヘッジする農業保険SaaS",
        "conceptLead": "【新規性】収量センサーデータと連動してリアルタイムでヘッジ量を自動調整する農業保険は国内初の設計。",
    },
    {
        "number": 6,
        "serviceName": "ナイトアイ",
        "slug": "night-eye-6",
        "oneLiner": "追加センサー不要。カメラのみで夜間転倒・異変をAIが即検知する介護SaaS",
        "conceptLead": "【新規性】専用センサーなし・既存カメラだけでAI転倒検知を実現する点が競合との最大の差別化。",
    },
    {
        "number": 7,
        "serviceName": "フィールドシンク",
        "slug": "field-sync-7",
        "oneLiner": "写真1枚から日報・勤怠・残業を一括生成。残業上限規制も同時対応するSaaS",
        "conceptLead": "【新規性】写真1枚→日報・勤怠・残業記録の一括自動生成と、2024年残業上限規制対応を一体化した中小建設業特化SaaSは国内未登場。",
    },
    {
        "number": 8,
        "serviceName": "在留ナビ",
        "slug": "zairyu-navi-8",
        "oneLiner": "育成就労制度対応テンプレートと行政書士マッチングを統合した外国人HR SaaS",
        "conceptLead": "【新規性】育成就労制度（2027年施行）対応テンプレートと行政書士連携による申請代行を一体化したHR SaaSは国内初。",
    },
    {
        "number": 9,
        "serviceName": "検品AI",
        "slug": "kenpin-ai-9",
        "oneLiner": "設備追加ゼロ。既存カメラをAIに変えるだけで不良検知を実現する製造業SaaS",
        "conceptLead": "【新規性】専用ラインカメラ不要・既存設備のみでAI不良検知を実現する「設備投資ゼロ」モデルが中小製造業の最大の差別化軸。",
    },
    {
        "number": 10,
        "serviceName": "承継ナビAI",
        "slug": "keishoku-navi-ai-10",
        "oneLiner": "事業価値診断から承継戦略・M&Aマッチングまで一気通貫の事業承継SaaS",
        "conceptLead": "【新規性】AI事業価値診断→承継戦略立案→M&Aマッチングを一つのSaaSで完結する設計は国内の事業承継市場で初。",
    },
    {
        "number": 11,
        "serviceName": "副業申告AI",
        "slug": "fukugyou-ai-11",
        "oneLiner": "複数プラットフォームの副業収入を自動集計しe-Tax直送まで完結するアプリ",
        "conceptLead": "【新規性】メルカリ・ストアカ・ランサーズなど複数プラットフォームの収入を自動集計しe-Tax直送まで一気通貫するのは副業特化アプリとして初。",
    },
    {
        "number": 12,
        "serviceName": "学童ナビ",
        "slug": "gakudo-navi-12",
        "oneLiner": "LINE完結で連絡・出欠・料金を一元管理する民間学童保育向けSaaS",
        "conceptLead": "【新規性】保護者への連絡・出欠管理・月謝計算をLINEだけで完結させる民間学童保育特化SaaSは国内で確認できない。",
    },
    {
        "number": 13,
        "serviceName": "歯科リコールAI",
        "slug": "dental-recall-ai-13",
        "oneLiner": "来院パターンをAIが学習し定期検診リマインドで再診率を自動改善する歯科SaaS",
        "conceptLead": "【新規性】患者ごとの来院パターンをAIが学習して最適リマインドタイミングを自動算出する歯科特化設計は国内初。",
    },
    {
        "number": 14,
        "serviceName": "病害虫スキャン",
        "slug": "byogaichu-scan-14",
        "oneLiner": "写真1枚で病害虫診断・収量予測・農薬最適化を同時提案する農業AI",
        "conceptLead": "【新規性】病害虫診断・収量予測・農薬最適化を写真1枚から同時に提案するAI農業サービスは国内に類似なし。",
    },
    {
        "number": 15,
        "serviceName": "職人マッチ",
        "slug": "shokunin-match-15",
        "oneLiner": "施工実績と評価の蓄積で信頼できる職人を継続発注できる建設業SaaS",
        "conceptLead": "【新規性】施工写真・評価・スキルデータを蓄積して「信頼実績で継続発注」という新しい職人マッチングモデルを実現。",
    },
    {
        "number": 16,
        "serviceName": "RecruiterAI",
        "slug": "recruiter-ai-16",
        "oneLiner": "書類選考と一次面接をAIが代替し採用コストを半減させる中小企業向けSaaS",
        "conceptLead": "【新規性】書類選考・一次面接の両方をAIが代替し採用担当者の工数を大幅削減する一体型SaaSは中小企業向けに市場空白がある。",
    },
    {
        "number": 17,
        "serviceName": "ハタラクナビ",
        "slug": "hataraku-navi-17",
        "oneLiner": "法定雇用率管理から定着支援まで一元化する障害者雇用特化のHR SaaS",
        "conceptLead": "【新規性】法定雇用率の管理・報告と、障害者の定着支援プログラムを一つのSaaSで完結する設計は障害者雇用分野で初。",
    },
    {
        "number": 18,
        "serviceName": "訪問ケアAI",
        "slug": "houmon-care-ai-18",
        "oneLiner": "シフト・記録・請求をAIで一体管理する訪問看護ステーション向けSaaS",
        "conceptLead": "【新規性】訪問スケジュール・電子記録・介護保険レセプト請求をAI一体管理する中小訪問看護ステーション特化設計。",
    },
    {
        "number": 19,
        "serviceName": "薬局AI発注",
        "slug": "yakkyoku-ai-19",
        "oneLiner": "AI需要予測で過剰在庫と欠品を同時解消する中小薬局向け自動発注SaaS",
        "conceptLead": "【新規性】過剰在庫と欠品の両方をAI需要予測で同時解消する薬局特化の自動発注SaaSは中小薬局向けに国内未確認。",
    },
]

conn = psycopg2.connect(os.environ["DATABASE_URL"])
try:
    cur = conn.cursor()
    for u in updates:
        cur.execute("""
            UPDATE "Idea"
            SET "serviceName" = %s,
                slug = %s,
                "oneLiner" = %s,
                concept = CONCAT(%s, concept),
                "updatedAt" = NOW()
            WHERE number = %s
        """, (u["serviceName"], u["slug"], u["oneLiner"], u["conceptLead"], u["number"]))
        print(f"#{u['number']} → {u['serviceName']} ({u['slug']})")
    conn.commit()
    print("[完了] #1-#19 更新済み")
finally:
    conn.close()
