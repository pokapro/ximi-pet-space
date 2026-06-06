"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewClassPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);

    const res = await fetch("/api/teacher/classes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim() }),
    });

    const data = await res.json();
    setLoading(false);

    if (data.ok) {
      router.push(`/teacher/classes/${data.class.id}/students`);
      router.refresh();
    }
  }

  return (
    <main className="min-h-screen bg-[#f7f6f2] px-6 py-10">
      <section className="mx-auto max-w-lg">
        <h1 className="text-3xl font-black">新建班级</h1>
        <form onSubmit={onSubmit} className="mt-8 space-y-4">
          <label className="block">
            <span className="text-sm font-semibold text-slate-700">班级名称</span>
            <input
              className="mt-2 w-full rounded-md border border-slate-300 bg-white px-4 py-3 outline-none focus:border-emerald-700"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例如：一年级一班"
              required
            />
          </label>
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading || !name.trim()}
              className="rounded-md bg-emerald-700 px-6 py-3 font-bold text-white disabled:bg-slate-400"
            >
              {loading ? "创建中..." : "创建班级"}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="rounded-md border border-slate-300 bg-white px-6 py-3 font-semibold"
            >
              取消
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}
