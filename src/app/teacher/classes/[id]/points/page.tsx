"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";

interface Student {
  id: string;
  name: string;
  seatNo: string | null;
  totalPoints: number;
  level: number;
  petName: string;
  mood: number;
  petStage: string;
}

interface BehaviorRule {
  id: string;
  name: string;
  points: number;
  category: string;
  icon: string;
  color: string;
}

interface PointLog {
  id: string;
  studentId: string;
  points: number;
  reason: string;
  createdAt: string;
  student: { name: string };
  rule: { name: string } | null;
}

export default function PointsPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [students, setStudents] = useState<Student[]>([]);
  const [rules, setRules] = useState<BehaviorRule[]>([]);
  const [logs, setLogs] = useState<PointLog[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [quickPoints, setQuickPoints] = useState(0);
  const [activeTab, setActiveTab] = useState<"students" | "students-list" | "logs">("students");
  const [classInfo, setClassInfo] = useState({ name: "", code: "" });

  const loadAll = useCallback(() => {
    setLoading(true);
    Promise.all([
      fetch(`/api/teacher/classes/${params.id}/students`).then(r => r.json()),
      fetch(`/api/teacher/classes/${params.id}/rules`).then(r => r.json()),
      fetch(`/api/teacher/classes/${params.id}/points`).then(r => r.json()),
    ]).then(([sData, rData, lData]) => {
      if (sData.ok) setStudents(sData.students);
      if (rData.ok) setRules(rData.rules);
      if (lData.ok) setLogs(lData.logs);
    }).finally(() => setLoading(false));
  }, [params.id]);

  useEffect(() => { loadAll(); }, [loadAll]);

  async function addPoints(studentId: string, points: number, ruleId?: string) {
    setMessage("");
    const rule = rules.find(r => r.id === ruleId);
    const body: Record<string, unknown> = { studentId, points };
    if (ruleId) body.ruleId = ruleId;
    if (!ruleId) body.reason = points > 0 ? "自定义加分" : "自定义扣分";

    const res = await fetch(`/api/teacher/classes/${params.id}/points`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (data.ok) {
      loadAll();
    } else {
      setMessage(data.message ?? "操作失败");
    }
  }

  async function quickAddPoints(studentId: string) {
    if (quickPoints === 0) return;
    await addPoints(studentId, quickPoints);
    setQuickPoints(0);
  }

  async function revertLog(logId: string) {
    const res = await fetch(`/api/teacher/classes/${params.id}/points`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ logId }),
    });
    const data = await res.json();
    if (data.ok) loadAll();
  }

  const positiveRules = rules.filter(r => r.category === "Positive" && r.points > 0);
  const negativeRules = rules.filter(r => r.category === "Negative" && r.points < 0);

  if (loading) return (
    <main className="min-h-screen bg-[#f7f6f2] flex items-center justify-center">
      <p className="text-slate-500">加载中...</p>
    </main>
  );

  return (
    <main className="min-h-screen bg-[#f7f6f2] px-4 py-6 md:px-6 md:py-8">
      <section className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm text-emerald-700 underline cursor-pointer" onClick={() => router.push("/teacher")}>
              &larr; 返回工作台
            </p>
            <h1 className="mt-2 text-3xl font-black">加减分</h1>
            <p className="mt-1 text-slate-500">{students.length} 名学生 · {rules.length} 条规则</p>
          </div>
        </div>

        {message && (
          <div className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-700">{message}</div>
        )}

        {/* 行为规则快捷区 */}
        <div className="mt-6 space-y-3">
          {positiveRules.length > 0 && (
            <div className="rounded-lg border border-emerald-200 bg-white p-4 shadow-sm">
              <p className="mb-3 text-sm font-bold text-emerald-800">👍 正向行为</p>
              <div className="flex flex-wrap gap-2">
                {positiveRules.map((rule) => (
                  <button
                    key={rule.id}
                    onClick={() => {
                      if (selectedStudent) {
                        addPoints(selectedStudent, rule.points, rule.id);
                      } else {
                        setMessage("请先点击一个学生再选择行为");
                      }
                    }}
                    className="rounded-full bg-emerald-100 px-4 py-2 text-sm font-bold text-emerald-800 transition hover:bg-emerald-200"
                    style={{ borderColor: rule.color, borderWidth: 2 }}
                  >
                    +{rule.points} {rule.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {negativeRules.length > 0 && (
            <div className="rounded-lg border border-red-200 bg-white p-4 shadow-sm">
              <p className="mb-3 text-sm font-bold text-red-800">👎 扣分行为</p>
              <div className="flex flex-wrap gap-2">
                {negativeRules.map((rule) => (
                  <button
                    key={rule.id}
                    onClick={() => {
                      if (selectedStudent) {
                        addPoints(selectedStudent, rule.points, rule.id);
                      } else {
                        setMessage("请先点击一个学生再选择行为");
                      }
                    }}
                    className="rounded-full bg-red-50 px-4 py-2 text-sm font-bold text-red-800 transition hover:bg-red-100"
                    style={{ borderColor: rule.color, borderWidth: 2 }}
                  >
                    {rule.points} {rule.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 学生网格 */}
        <div className="mt-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold">学生列表</h2>
            {selectedStudent && (
              <div className="flex gap-2 items-center">
                <span className="text-sm text-emerald-700 font-semibold">已选：{students.find(s => s.id === selectedStudent)?.name}</span>
                <input
                  type="number"
                  value={quickPoints || ""}
                  onChange={(e) => setQuickPoints(Number(e.target.value))}
                  className="w-20 rounded-md border border-slate-300 px-3 py-1 text-center"
                  placeholder="分值"
                />
                <button onClick={() => selectedStudent && quickAddPoints(selectedStudent)} className="rounded-md bg-slate-900 px-3 py-1 text-sm font-semibold text-white">
                  自定义
                </button>
              </div>
            )}
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {students.map((s) => (
              <button
                key={s.id}
                onClick={() => setSelectedStudent(s.id === selectedStudent ? null : s.id)}
                className={`rounded-lg border-2 p-4 text-left transition ${
                  selectedStudent === s.id
                    ? "border-emerald-500 bg-emerald-50 shadow-md"
                    : "border-slate-200 bg-white shadow-sm hover:border-emerald-300"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-xl">{getMoodEmoji(s.mood)}</span>
                  <div>
                    <p className="font-bold text-sm">{s.name}</p>
                    <p className="text-xs text-slate-500">Lv.{s.level} · {s.totalPoints}分</p>
                  </div>
                </div>
                <p className="mt-1 text-xs text-slate-400">{s.petName}</p>
              </button>
            ))}
          </div>
        </div>

        {/* 积分流水 */}
        <div className="mt-8">
          <h2 className="text-lg font-bold">最近流水</h2>
          <div className="mt-3 space-y-2">
            {logs.slice(0, 20).map((log) => {
              const student = students.find(s => s.id === log.studentId);
              return (
                <div key={log.id} className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-3">
                  <div className="flex items-center gap-3">
                    <span className={`text-lg font-bold ${log.points > 0 ? "text-emerald-700" : "text-red-700"}`}>
                      {log.points > 0 ? "+" : ""}{log.points}
                    </span>
                    <div>
                      <p className="text-sm font-semibold">{student?.name ?? "未知"}</p>
                      <p className="text-xs text-slate-500">{log.rule?.name ?? log.reason}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400">{new Date(log.createdAt).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })}</span>
                    <button onClick={() => revertLog(log.id)} className="text-xs text-red-500 underline">撤销</button>
                  </div>
                </div>
              );
            })}
            {logs.length === 0 && <p className="text-center text-slate-400 py-4">暂无积分流水</p>}
          </div>
        </div>
      </section>
    </main>
  );
}

function getMoodEmoji(mood: number): string {
  if (mood >= 80) return "🤩";
  if (mood >= 60) return "😄";
  if (mood >= 40) return "😊";
  if (mood >= 20) return "😴";
  return "😢";
}
