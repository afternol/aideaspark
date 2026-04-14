"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface IdeaSummary {
  id: string;
  number: number;
  slug: string;
  serviceName: string;
  category: string;
  publishedAt: string;
  views: number;
  bookmarks: number;
}

export default function AdminPage() {
  const router = useRouter();
  const [ideas, setIdeas] = useState<IdeaSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    id: "", slug: "", number: "", serviceName: "", concept: "", target: "",
    problem: "", product: "", revenueModel: "", competitors: "", competitiveEdge: "",
    tags: "", category: "", targetIndustry: "", targetCustomer: "", investmentScale: "",
    difficulty: "", oneLiner: "", publishedAt: "", inspirationSource: "",
    scores: '{"novelty":3,"marketSize":3,"profitability":3,"growth":3,"feasibility":3,"moat":3}',
    scoreComments: '{"novelty":"","marketSize":"","profitability":"","growth":"","feasibility":"","moat":""}',
    trendKeywords: "[]",
  });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetch("/api/admin/ideas")
      .then((r) => {
        if (r.status === 403) {
          setError("管理者権限がありません。ADMIN_EMAIL が設定されているか確認してください。");
          setLoading(false);
          return null;
        }
        return r.json();
      })
      .then((data) => {
        if (data && Array.isArray(data)) setIdeas(data);
        setLoading(false);
      })
      .catch(() => {
        setError("データ取得に失敗しました");
        setLoading(false);
      });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setSuccess("");
    setError("");

    let tags, scores, scoreComments, trendKeywords;
    try {
      tags = form.tags ? form.tags.split(",").map((t) => t.trim()).filter(Boolean) : [];
      scores = JSON.parse(form.scores);
      scoreComments = JSON.parse(form.scoreComments);
      trendKeywords = JSON.parse(form.trendKeywords);
    } catch {
      setError("JSON形式が不正です（scores/scoreComments/trendKeywords）");
      setSubmitting(false);
      return;
    }

    const res = await fetch("/api/admin/ideas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, number: Number(form.number), tags, scores, scoreComments, trendKeywords }),
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "追加に失敗しました");
    } else {
      setSuccess(`✅ 追加完了: ${data.serviceName} (${data.id})`);
      setIdeas((prev) => [...prev, data]);
      // フォームリセット（id/slug/number/serviceName のみ）
      setForm((f) => ({ ...f, id: "", slug: "", number: "", serviceName: "" }));
    }
    setSubmitting(false);
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`「${name}」を削除しますか？関連データ（コメント・リアクション等）もすべて削除されます。`)) return;
    const res = await fetch("/api/admin/ideas", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (res.ok) {
      setIdeas((prev) => prev.filter((i) => i.id !== id));
    }
  }

  const field = (key: keyof typeof form, label: string, placeholder = "", multi = false) => (
    <div>
      <label className="block text-sm font-medium text-zinc-300 mb-1">{label}</label>
      {multi ? (
        <textarea
          className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-white text-sm h-20 resize-y"
          value={form[key]}
          onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
          placeholder={placeholder}
        />
      ) : (
        <input
          className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-white text-sm"
          value={form[key]}
          onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
          placeholder={placeholder}
        />
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold">AideaSpark 管理画面</h1>
          <button onClick={() => router.push("/")} className="text-sm text-zinc-400 hover:text-white">
            ← サイトに戻る
          </button>
        </div>

        {error && (
          <div className="bg-red-900/50 border border-red-700 rounded p-4 mb-6 text-red-300">
            {error}
          </div>
        )}

        {/* アイデア一覧 */}
        <section className="mb-10">
          <h2 className="text-lg font-semibold mb-4">アイデア一覧（{ideas.length}件）</h2>
          {loading ? (
            <p className="text-zinc-400">読み込み中...</p>
          ) : (
            <div className="overflow-x-auto rounded border border-zinc-800">
              <table className="w-full text-sm">
                <thead className="bg-zinc-900">
                  <tr>
                    {["#", "ID", "サービス名", "カテゴリ", "公開日", "閲覧", "保存", "操作"].map((h) => (
                      <th key={h} className="px-3 py-2 text-left text-zinc-400 font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {ideas.map((idea) => (
                    <tr key={idea.id} className="border-t border-zinc-800 hover:bg-zinc-900/50">
                      <td className="px-3 py-2 text-zinc-400">{idea.number}</td>
                      <td className="px-3 py-2 font-mono text-xs text-zinc-400">{idea.id}</td>
                      <td className="px-3 py-2 font-medium">{idea.serviceName}</td>
                      <td className="px-3 py-2 text-zinc-400">{idea.category}</td>
                      <td className="px-3 py-2 text-zinc-400">{idea.publishedAt}</td>
                      <td className="px-3 py-2 text-zinc-400">{idea.views}</td>
                      <td className="px-3 py-2 text-zinc-400">{idea.bookmarks}</td>
                      <td className="px-3 py-2">
                        <button
                          onClick={() => handleDelete(idea.id, idea.serviceName)}
                          className="text-red-400 hover:text-red-300 text-xs"
                        >
                          削除
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* アイデア追加フォーム */}
        <section>
          <h2 className="text-lg font-semibold mb-4">新しいアイデアを追加</h2>
          {success && (
            <div className="bg-green-900/50 border border-green-700 rounded p-4 mb-4 text-green-300">
              {success}
            </div>
          )}
          <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
            {field("id", "ID *", "idea-021")}
            {field("slug", "Slug *", "service-name-jp")}
            {field("number", "番号 *", "21")}
            {field("serviceName", "サービス名 *", "〇〇サービス")}
            {field("oneLiner", "ワンライナー", "一言で表すと？")}
            {field("category", "カテゴリ", "SaaS / マーケットプレイス等")}
            {field("targetIndustry", "対象業界", "製造業 / 小売 等")}
            {field("targetCustomer", "対象顧客", "中小企業 / 個人事業主 等")}
            {field("investmentScale", "投資規模", "小（〜100万円）/ 中 / 大")}
            {field("difficulty", "難易度", "低 / 中 / 高")}
            {field("publishedAt", "公開日", "2026-04-14")}
            {field("tags", "タグ（カンマ区切り）", "AI,SaaS,B2B")}
            <div className="col-span-2">{field("concept", "コンセプト", "", true)}</div>
            <div className="col-span-2">{field("target", "ターゲット", "", true)}</div>
            <div className="col-span-2">{field("problem", "解決する課題", "", true)}</div>
            <div className="col-span-2">{field("product", "プロダクト", "", true)}</div>
            <div className="col-span-2">{field("revenueModel", "収益モデル", "", true)}</div>
            <div className="col-span-2">{field("competitors", "競合", "", true)}</div>
            <div className="col-span-2">{field("competitiveEdge", "競合優位性", "", true)}</div>
            <div className="col-span-2">{field("inspirationSource", "インスピレーション元（任意）", "")}</div>
            <div className="col-span-2">{field("scores", "スコア (JSON)", "", true)}</div>
            <div className="col-span-2">{field("scoreComments", "スコアコメント (JSON)", "", true)}</div>
            <div className="col-span-2">{field("trendKeywords", "トレンドキーワード (JSON配列)", '["AI","自動化"]')}</div>

            <div className="col-span-2">
              <button
                type="submit"
                disabled={submitting}
                className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 px-6 py-3 rounded font-medium transition-colors"
              >
                {submitting ? "追加中..." : "アイデアを追加"}
              </button>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}
