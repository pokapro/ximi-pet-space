"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { getPetImage, STAGE_NAMES, PetStage } from "@/lib/pet-growth";

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

const MOOD_BG: Record<string, string> = {
  excited: "from-rose-400 to-pink-500",
  happy: "from-emerald-400 to-green-500",
  calm: "from-amber-400 to-yellow-500",
  tired: "from-orange-400 to-amber-600",
  sad: "from-blue-400 to-indigo-500",
};

const MOOD_COLORS: Record<string, string> = {
  excited: "#f43f5e",
  happy: "#10b981",
  calm: "#f59e0b",
  tired: "#f97316",
  sad: "#6366f1",
};

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
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-emerald-50">
      <p className="animate-pulse text-xl text-emerald-600">🐾 加载中...</p>
    </div>
  );

  if (!student) return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-emerald-50">
      <div className="text-center">
        <p className="text-6xl">😢</p>
        <p className="mt-4 text-xl text-slate-600">没有找到这个学生</p>
      </div>
    </div>
  );

  const expForNext = student.level * 10;
  const expProgress = Math.min(100, Math.floor((student.experience / Math.max(1, expForNext)) * 100));
  const moodBg = MOOD_BG[student.moodState] ?? "from-slate-400 to-slate-500";

  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-emerald-50 px-4 py-6">
      <section className="mx-auto max-w-2xl">
        {/* 宠物卡片 */}
        <div className="overflow-hidden rounded-3xl bg-white shadow-xl ring-1 ring-slate-200/50">
          {/* 宠物图片区 */}
          <div className={`bg-gradient-to-br ${moodBg} p-8 text-center`}>
            <div className="mx-auto flex h-56 w-56 items-center justify-center sm:h-64 sm:w-64">
              <img
                src={getPetImage(student.petStage as PetStage)}
                alt={student.petName}
                className="h-full w-full object-contain drop-shadow-2xl"
              />
            </div>
            <h1 className="mt-4 text-3xl font-black text-white drop-shadow-sm">{student.petName}</h1>
            <p className="text-lg text-white/80">
              {student.name} 的{STAGE_NAMES[student.petStage as PetStage] ?? student.petStage}
            </p>
            <p className="mt-1 text-sm text-white/60">{student.className}</p>
          </div>

          {/* 数据区 */}
          <div className="p-6">
            {/* 等级 + 积分 */}
            <div className="-mt-16 flex justify-center gap-6">
              <div className="rounded-2xl bg-white px-6 py-3 shadow-lg ring-1 ring-slate-100">
                <p className="text-xs text-slate-400">等级</p>
                <p className="text-2xl font-black text-emerald-600">Lv.{student.level}</p>
                <p className="text-xs text-slate-400">{student.stageName}</p>
              </div>
              <div className="rounded-2xl bg-white px-6 py-3 shadow-lg ring-1 ring-slate-100">
                <p className="text-xs text-slate-400">积分</p>
                <p className="text-2xl font-black text-amber-500">{student.totalPoints}</p>
                <p className="text-xs text-slate-400">总分</p>
              </div>
              <div className="rounded-2xl bg-white px-6 py-3 shadow-lg ring-1 ring-slate-100">
                <p className="text-xs text-slate-400">心情</p>
                <p className="text-2xl">✿</p>
                <p className="text-xs text-slate-400">{student.mood}/100</p>
              </div>
            </div>

            {/* 经验条 */}
            <div className="mt-6">
              <div className="flex justify-between text-xs text-slate-500">
                <span>经验值</span>
                <span>{student.experience}/{expForNext}</span>
              </div>
              <div className="mt-1 h-3 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600 transition-all duration-500"
                  style={{ width: `${expProgress}%` }}
                />
              </div>
            </div>

            {/* 心情条 */}
            <div className="mt-3">
              <div className="flex justify-between text-xs text-slate-500">
                <span>心情</span>
                <span>{student.moodEmoji} {student.mood}</span>
              </div>
              <div className="mt-1 h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${student.mood}%`,
                    backgroundColor: MOOD_COLORS[student.moodState] ?? "#6b7280",
                  }}
                />
              </div>
            </div>

            {/* 互动按钮 — 触屏友好 */}
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
                  className="flex min-h-[48px] items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-6 py-3 text-base font-semibold shadow-sm transition active:scale-95 active:bg-emerald-100 disabled:opacity-50"
                >
                  <span className="text-xl">{icon}</span>
                  {label}
                </button>
              ))}
            </div>
            {interactMsg && (
              <p className="mt-4 text-center text-lg font-bold text-emerald-700 animate-bounce">{interactMsg}</p>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-6 flex gap-1 rounded-2xl bg-slate-100 p-1.5">
          {[
            ["pet", "🐱 今日"],
            ["points", "📊 积分"],
            ["evolve", "🦋 进化"],
          ].map(([key, label]) => (
            <button
              key={key}
              onClick={() => setActiveTab(key as typeof activeTab)}
              className={`min-h-[44px] flex-1 rounded-xl py-2.5 text-sm font-bold transition active:scale-95 ${
                activeTab === key ? "bg-white text-emerald-700 shadow-sm" : "text-slate-500"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* 今日记录 */}
        {activeTab === "pet" && (
          <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-black text-slate-700">📅 今日记录</h2>
            {todayLogs.length === 0 ? (
              <p className="mt-4 text-center text-slate-400">今天还没有积分记录</p>
            ) : (
              <div className="mt-4 space-y-3">
                {todayLogs.map((log) => (
                  <div key={log.id} className="flex items-center justify-between rounded-xl bg-slate-50 p-4">
                    <span className={`text-xl font-black ${log.points > 0 ? "text-emerald-600" : "text-red-500"}`}>
                      {log.points > 0 ? "+" : ""}{log.points}
                    </span>
                    <span className="text-sm font-medium">{log.rule?.name ?? log.reason}</span>
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
          <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-black text-slate-700">📊 最近积分</h2>
            {logs.length === 0 ? (
              <p className="mt-4 text-center text-slate-400">暂无积分记录</p>
            ) : (
              <div className="mt-4 space-y-3">
                {logs.slice(0, 20).map((log) => (
                  <div key={log.id} className="flex items-center justify-between rounded-xl bg-slate-50 p-4">
                    <span className={`text-xl font-black ${log.points > 0 ? "text-emerald-600" : "text-red-500"}`}>
                      {log.points > 0 ? "+" : ""}{log.points}
                    </span>
                    <span className="text-sm font-medium">{log.rule?.name ?? log.reason}</span>
                    <span className="text-xs text-slate-400">
                      {new Date(log.createdAt).toLocaleDateString("zh-CN", { month: "2-digit", day: "2-digit" })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 进化历程 */}
        {activeTab === "evolve" && (
          <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-black text-slate-700">🦋 进化历程</h2>
            {evolutions.length === 0 ? (
              <div className="mt-8 text-center">
                <img
                  src={getPetImage("Egg")}
                  alt="蛋"
                  className="mx-auto h-32 w-32 object-contain opacity-60"
                />
                <p className="mt-4 text-slate-400">宠物还在蛋里，继续加油获得积分吧！</p>
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                {evolutions.slice(0, 10).map((ev) => (
                  <div key={ev.id} className="flex items-center gap-4 rounded-xl bg-slate-50 p-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100">
                      <img
                        src={getPetImage(ev.toStage as PetStage)}
                        alt={ev.toStage}
                        className="h-12 w-12 object-contain"
                      />
                    </div>
                    <div>
                      <p className="font-bold text-slate-700">
                        Lv.{ev.fromLevel} → Lv.{ev.toLevel}
                      </p>
                      <p className="text-xs text-slate-500">{ev.petName} · {STAGE_NAMES[ev.toStage as PetStage] ?? ev.toStage}</p>
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

        {/* 老师信息 */}
        <div className="mt-6 text-center text-sm text-slate-400">
          <p>{student.teacherName} · {student.className}</p>
        </div>
      </section>
    </main>
  );
}
