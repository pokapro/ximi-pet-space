"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";

interface StudentDetail {
  id: string;
  name: string;
  totalPoints: number;
  level: number;
  mood: number;
  petName: string;
  petStage: string;
  moodEmoji: string;
  moodState: string;
  stageName: string;
  className: string;
  teacherName: string;
  experience: number;
}

interface PointLog {
  id: string;
  points: number;
  reason: string;
  createdAt: string;
  rule: { name: string } | null;
}

interface Evolution {
  id: string;
  fromLevel: number;
  toLevel: number;
  fromStage: string;
  toStage: string;
  petName: string;
  createdAt: string;
}

interface Interaction {
  id: string;
  type: string;
  moodDelta: number;
  createdAt: string;
}

export default function StudentQueryPage() {
  const params = useParams<{ studentCode: string }>();
  const [student, setStudent] = useState<StudentDetail | null>(null);
  const [logs, setLogs] = useState<PointLog[]>([]);
  const [evolutions, setEvolutions] = useState<Evolution[]>([]);
  const [todayLogs, setTodayLogs] = useState<PointLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [interacting, setInteracting] = useState(false);
  const [interactMsg, setInteractMsg] = useState("");
  const [activeTab, setActiveTab] = useState<"pet" | "points" | "evolve">("pet");

  const loadData = useCallback(async () => {
    try {
      const res = await fetch(`/api/s/${params.studentCode}`);
      const json = await res.json();
      if (json.ok) {
        setStudent(json.student);
        setTodayLogs(json.todayLogs);
        setLogs(json.recentLogs);
        setEvolutions(json.evolutions);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [params.studentCode]);

  useEffect(() => {
    const timer = setTimeout(() => loadData(), 0);
    return () => clearTimeout(timer);
  }, [loadData]);

  async function interact(type: string) {
    if (!student || interacting) return;
    setInteracting(true);
    setInteractMsg("");
    try {
      const res = await fetch(`/api/teacher/students/${student.id}/interactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
      });
      const json = await res.json();
      if (json.ok) {
        const delta = json.interaction.moodDelta;
        setInteractMsg(delta > 0 ? `❤️ 心情 +${delta}` : "互动完成");
        loadData();
        setTimeout(() => setInteractMsg(""), 2000);
      }
    } finally {
      setInteracting(false);
    }
  }

  if (loading) return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-purple-50 via-white to-emerald-50">
      <p className="animate-pulse text-xl text-emerald-700">加载中...</p>
    </div>
  );

  if (!student) return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-purple-50 via-white to-emerald-50">
      <div className="text-center">
        <p className="text-6xl">😢</p>
        <p className="mt-4 text-xl text-slate-600">没有找到这个学生</p>
      </div>
    </div>
  );

  const expForNext = student.level * 10;
  const expProgress = Math.min(100, Math.floor((student.experience / Math.max(1, expForNext)) * 100));

  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-emerald-50 px-4 py-8">
      <section className="mx-auto max-w-2xl">
        {/* 宠物卡片 */}
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-lg">
          <div className="text-center">
            <div className="text-7xl">{getStageSkin(student.petStage)}</div>
            <p className="mt-2 text-3xl">{student.moodEmoji}</p>
            <h1 className="mt-4 text-2xl font-black">{student.petName}</h1>
            <p className="text-slate-500">
              {student.name} 的宠物 · {student.className}
            </p>

            <div className="mt-6 flex items-center justify-center gap-4">
              <div className="rounded-full bg-emerald-100 px-4 py-1 text-sm font-bold text-emerald-800">
                Lv.{student.level} {student.stageName}
              </div>
              <div className="rounded-full bg-amber-100 px-4 py-1 text-sm font-bold text-amber-800">
                🐱 {student.totalPoints} 分
              </div>
            </div>

            {/* 经验条 */}
            <div className="mt-6">
              <div className="flex justify-between text-xs text-slate-500">
                <span>经验 {student.experience}</span>
                <span>下一级 {expForNext}</span>
              </div>
              <div className="mt-1 h-3 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600 transition-all"
                  style={{ width: `${expProgress}%` }}
                />
              </div>
            </div>

            {/* 心情条 */}
            <div className="mt-4">
              <div className="flex justify-between text-xs text-slate-500">
                <span>心情</span>
                <span>{student.mood}</span>
              </div>
              <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${student.mood}%`,
                    backgroundColor: student.mood >= 60 ? "#10b981" : student.mood >= 30 ? "#f59e0b" : "#ef4444",
                  }}
                />
              </div>
            </div>
          </div>

          {/* 互动按钮 */}
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            {[
              ["Pat", "摸摸", "🤚"],
              ["Feed", "喂食", "🍎"],
              ["Greet", "打招呼", "👋"],
              ["Encourage", "鼓励", "💪"],
            ].map(([type, label, icon]) => (
              <button
                key={type}
                onClick={() => interact(type)}
                disabled={interacting}
                className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-5 py-3 font-semibold transition hover:bg-emerald-50 hover:border-emerald-300 disabled:opacity-50"
              >
                <span>{icon}</span>
                {label}
              </button>
            ))}
          </div>
          {interactMsg && (
            <p className="mt-4 text-center font-semibold text-emerald-700">{interactMsg}</p>
          )}
        </div>

        {/* Tabs: 最近积分 / 进化历史 */}
        <div className="mt-6 flex gap-1 rounded-lg bg-slate-100 p-1">
          {[
            ["pet", "🐱 宠物"],
            ["points", "📊 积分"],
            ["evolve", "🦋 进化"],
          ].map(([key, label]) => (
            <button
              key={key}
              onClick={() => setActiveTab(key as typeof activeTab)}
              className={`flex-1 rounded-md py-2 text-sm font-semibold transition ${
                activeTab === key ? "bg-white shadow-sm" : "text-slate-500"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* 今日积分 */}
        {activeTab === "pet" && (
          <div className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="font-bold text-lg">📅 今日记录</h2>
            {todayLogs.length === 0 ? (
              <p className="mt-3 text-slate-400">今天还没有积分记录</p>
            ) : (
              <div className="mt-3 space-y-2">
                {todayLogs.map((log) => (
                  <div key={log.id} className="flex items-center justify-between rounded-md bg-slate-50 p-3">
                    <span className={log.points > 0 ? "text-emerald-700 font-bold" : "text-red-700 font-bold"}>
                      {log.points > 0 ? "+" : ""}{log.points}
                    </span>
                    <span className="text-sm">{log.rule?.name ?? log.reason}</span>
                    <span className="text-xs text-slate-400">
                      {new Date(log.createdAt).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 积分流水 */}
        {activeTab === "points" && (
          <div className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="font-bold text-lg">📊 最近积分</h2>
            {logs.length === 0 ? (
              <p className="mt-3 text-slate-400">暂无积分记录</p>
            ) : (
              <div className="mt-3 space-y-2">
                {logs.slice(0, 20).map((log) => (
                  <div key={log.id} className="flex items-center justify-between rounded-md bg-slate-50 p-3">
                    <span className={log.points > 0 ? "text-emerald-700 font-bold" : "text-red-700 font-bold"}>
                      {log.points > 0 ? "+" : ""}{log.points}
                    </span>
                    <span className="text-sm">{log.rule?.name ?? log.reason}</span>
                    <span className="text-xs text-slate-400">
                      {new Date(log.createdAt).toLocaleDateString("zh-CN", { month: "2-digit", day: "2-digit" })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 进化历史 */}
        {activeTab === "evolve" && (
          <div className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="font-bold text-lg">🦋 进化历程</h2>
            {evolutions.length === 0 ? (
              <div className="mt-6 text-center">
                <p className="text-4xl">🥚</p>
                <p className="mt-3 text-slate-400">宠物还在蛋里，继续加油获得积分吧！</p>
              </div>
            ) : (
              <div className="mt-3 space-y-3">
                {evolutions.slice(0, 10).map((ev) => (
                  <div key={ev.id} className="flex items-center gap-4 rounded-md bg-slate-50 p-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-lg">
                      {getStageSkin(ev.toStage)}
                    </div>
                    <div>
                      <p className="font-semibold">
                        Lv.{ev.fromLevel} → Lv.{ev.toLevel}
                      </p>
                      <p className="text-xs text-slate-500">{ev.petName}</p>
                    </div>
                    <span className="ml-auto text-xs text-slate-400">
                      {new Date(ev.createdAt).toLocaleDateString("zh-CN")}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 老师寄语 */}
        <div className="mt-6 text-center text-sm text-slate-400">
          <p>{student.teacherName} · {student.className}</p>
        </div>
      </section>
    </main>
  );
}

function getStageSkin(stage: string): string {
  const skins: Record<string, string> = {
    Egg: "🥚",
    Baby: "🐣",
    Growth: "🐻",
    Evolution: "🦋",
    Rare: "🌟",
  };
  return skins[stage] ?? "🥚";
}
