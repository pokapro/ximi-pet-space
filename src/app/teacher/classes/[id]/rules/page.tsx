"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

interface BehaviorRule {
  id: string;
  name: string;
  points: number;
  category: string;
  icon: string;
  color: string;
}

export default function RulesPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [rules, setRules] = useState<BehaviorRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [points, setPoints] = useState(2);
  const [color, setColor] = useState("#16a34a");

  function loadRules() {
    setLoading(true);
    fetch(`/api/teacher/classes/${params.id}/rules`)
      .then(r => r.json())
      .then(data => { if (data.ok) setRules(data.rules); })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    const timer = setTimeout(() => loadRules(), 0);
    return () => clearTimeout(timer);
  }, [params.id]);

  async function addRule() {
    if (!name.trim()) return;
    const res = await fetch(`/api/teacher/classes/${params.id}/rules`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), points, color }),
    });
    const data = await res.json();
    if (data.ok) {
      setName("");
      setPoints(2);
      loadRules();
    }
  }

  async function deleteRule(id: string) {
    if (!confirm("确定删除这条规则？")) return;
    await fetch(`/api/teacher/classes/${params.id}/rules`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ruleId: id }),
    });
    loadRules();
  }

  const positive = rules.filter(r => r.category === "Positive");
  const negative = rules.filter(r => r.category === "Negative");

  return (
    <main className="min-h-screen bg-[#f7f6f2] px-6 py-8">
      <section className="mx-auto max-w-4xl">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm text-emerald-700 underline cursor-pointer" onClick={() => router.push("/teacher/classes")}>
              &larr; 返回班级
            </p>
            <h1 className="mt-2 text-3xl font-black">行为规则</h1>
          </div>
        </div>

        <div className="mt-6 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold">添加规则</h2>
          <div className="mt-4 flex flex-wrap gap-3 items-end">
            <label className="flex-1 min-w-[200px]">
              <span className="text-sm text-slate-600">行为名称</span>
              <input
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="主动回答问题"
              />
            </label>
            <label>
              <span className="text-sm text-slate-600">分值</span>
              <input
                type="number"
                className="mt-1 w-24 rounded-md border border-slate-300 px-3 py-2"
                value={points}
                onChange={(e) => setPoints(Number(e.target.value))}
              />
            </label>
            <label>
              <span className="text-sm text-slate-600">颜色</span>
              <input
                type="color"
                className="mt-1 block h-10 w-16 cursor-pointer rounded-md border border-slate-300"
                value={color}
                onChange={(e) => setColor(e.target.value)}
              />
            </label>
            <button
              onClick={addRule}
              disabled={!name.trim()}
              className="rounded-md bg-emerald-700 px-5 py-2.5 font-semibold text-white disabled:bg-slate-400"
            >
              添加
            </button>
          </div>
        </div>

        {loading ? (
          <p className="mt-6 text-center text-slate-500">加载中...</p>
        ) : (
          <div className="mt-6 grid gap-6 md:grid-cols-2">
            <div>
              <h3 className="mb-3 text-lg font-bold text-emerald-800">👍 加分规则</h3>
              <div className="space-y-2">
                {positive.length === 0 && <p className="text-sm text-slate-400">暂无加分规则</p>}
                {positive.map(r => (
                  <div key={r.id} className="flex items-center justify-between rounded-lg border border-emerald-200 bg-white p-3">
                    <div className="flex items-center gap-3">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold text-white" style={{ backgroundColor: r.color }}>
                        +{r.points}
                      </span>
                      <span className="font-semibold">{r.name}</span>
                    </div>
                    <button onClick={() => deleteRule(r.id)} className="text-xs text-red-500 underline">删除</button>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h3 className="mb-3 text-lg font-bold text-red-800">👎 扣分规则</h3>
              <div className="space-y-2">
                {negative.length === 0 && <p className="text-sm text-slate-400">暂无扣分规则</p>}
                {negative.map(r => (
                  <div key={r.id} className="flex items-center justify-between rounded-lg border border-red-200 bg-white p-3">
                    <div className="flex items-center gap-3">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold text-white" style={{ backgroundColor: r.color }}>
                        {r.points}
                      </span>
                      <span className="font-semibold">{r.name}</span>
                    </div>
                    <button onClick={() => deleteRule(r.id)} className="text-xs text-red-500 underline">删除</button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
