"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { getPetImage } from "@/lib/pet-growth";

interface StudentData {
  id: string;
  name: string;
  nickname: string | null;
  seatNo: string | null;
  totalPoints: number;
  todayPoints: number;
  level: number;
  mood: number;
  petName: string;
  petStage: string;
  moodEmoji: string;
  moodState: string;
}

interface ClassData {
  name: string;
  code: string;
  teacherName: string;
  schoolName: string | null;
  studentCount: number;
  classTotalToday: number;
  classTotalPoints: number;
  avgLevel: number;
}

interface ScreenData {
  class: ClassData;
  students: StudentData[];
}

const MOOD_COLORS: Record<string, string> = {
  excited: "#10b981",
  happy: "#34d399",
  calm: "#fbbf24",
  tired: "#f97316",
  sad: "#ef4444",
};

const STAGE_COLORS: Record<string, string> = {
  Egg: "from-pink-200/30 via-purple-200/20 to-blue-200/30",
  Baby: "from-green-200/30 via-emerald-200/20 to-teal-200/30",
  Growth: "from-yellow-200/30 via-orange-200/20 to-amber-200/30",
  Evolution: "from-blue-200/30 via-indigo-200/20 to-purple-200/30",
  Rare: "from-rose-200/30 via-fuchsia-200/20 to-violet-200/30",
};

export default function ClassroomScreen() {
  const params = useParams<{ classCode: string }>();
  const [data, setData] = useState<ScreenData | null>(null);
  const [loading, setLoading] = useState(true);
  const [fullscreen, setFullscreen] = useState(false);
  const [sortBy, setSortBy] = useState<"points" | "level" | "name" | "today">("points");
  const [selectedStudent, setSelectedStudent] = useState<StudentData | null>(null);

  const loadData = useCallback(async () => {
    try {
      const res = await fetch(`/api/classroom/${params.classCode}`);
      const json = await res.json();
      if (json.ok) {
        setData(json);
      }
    } catch (e) {
      console.error(e);
    }
  }, [params.classCode]);

  useEffect(() => {
    const timer = setTimeout(() => loadData().then(() => setLoading(false)), 0);
    return () => clearTimeout(timer);
  }, [loadData]);

  // 实时刷新：10秒间隔
  useEffect(() => {
    const interval = setInterval(loadData, 10000);
    return () => clearInterval(interval);
  }, [loadData]);

  // 全屏切换 F 键
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "f" || e.key === "F") {
        toggleFullscreen();
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setFullscreen(false);
    }
  }

  const sortedStudents = data
    ? [...data.students].sort((a, b) => {
        if (sortBy === "points") return b.totalPoints - a.totalPoints;
        if (sortBy === "today") return b.todayPoints - a.todayPoints;
        if (sortBy === "level") return b.level - a.level;
        return a.name.localeCompare(b.name, "zh-CN");
      })
    : [];

  const todayPositives = data?.students.filter(s => s.todayPoints > 0).length ?? 0;

  if (loading) return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-emerald-950 via-slate-900 to-emerald-950">
      <p className="animate-pulse text-3xl text-emerald-400">🐾 加载中...</p>
    </div>
  );

  if (!data) return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-emerald-950 via-slate-900 to-emerald-950">
      <p className="text-3xl text-white">班级不存在</p>
    </div>
  );

  // ---- 学生弹窗详情 ----
  if (selectedStudent) {
    const stage = selectedStudent.petStage as keyof typeof STAGE_COLORS;
    const moodColor = MOOD_COLORS[selectedStudent.moodState] ?? "#6b7280";
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
        onClick={() => setSelectedStudent(null)}
      >
        <div
          className={`w-full max-w-md rounded-3xl bg-gradient-to-b ${STAGE_COLORS[stage] ?? "from-slate-700/80"} to-slate-800/90 p-8 text-center backdrop-blur-xl`}
          onClick={e => e.stopPropagation()}
        >
          {/* 大宠物图片 */}
          <div className="mx-auto flex h-64 w-64 items-center justify-center">
            <img
              src={getPetImage(selectedStudent.petStage as any)}
              alt={selectedStudent.petName}
              className="h-full w-full object-contain drop-shadow-2xl"
            />
          </div>

          <h2 className="mt-4 text-3xl font-black text-white">{selectedStudent.name}</h2>
          <p className="text-xl text-emerald-300">{selectedStudent.petName}</p>
          {selectedStudent.seatNo && (
            <p className="text-base text-slate-400">座号 {selectedStudent.seatNo}</p>
          )}

          {/* 等级 + 积分 */}
          <div className="mt-6 flex justify-center gap-8">
            <div className="rounded-2xl bg-white/10 px-6 py-3">
              <p className="text-sm text-slate-400">等级</p>
              <p className="text-3xl font-black text-emerald-400">Lv.{selectedStudent.level}</p>
            </div>
            <div className="rounded-2xl bg-white/10 px-6 py-3">
              <p className="text-sm text-slate-400">积分</p>
              <p className="text-3xl font-black text-yellow-400">{selectedStudent.totalPoints}</p>
            </div>
          </div>

          {/* 心情 */}
          <div className="mt-6">
            <div className="flex items-center justify-center gap-2">
              <span className="text-4xl">{selectedStudent.moodEmoji}</span>
              <span className="text-lg text-slate-300">心情</span>
            </div>
            <div className="mx-auto mt-2 h-3 w-full max-w-xs overflow-hidden rounded-full bg-slate-700">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${selectedStudent.mood}%`, backgroundColor: moodColor }}
              />
            </div>
            <p className="mt-1 text-sm text-slate-400">{selectedStudent.mood}/100</p>
          </div>

          {/* 今日积分 */}
          {selectedStudent.todayPoints !== 0 && (
            <p className={`mt-4 text-2xl font-bold ${selectedStudent.todayPoints > 0 ? "text-green-400" : "text-red-400"}`}>
              {selectedStudent.todayPoints > 0 ? "⬆" : "⬇"} 今日
              {selectedStudent.todayPoints > 0 ? "+" : ""}{selectedStudent.todayPoints}
            </p>
          )}

          {/* 大触屏关闭按钮 */}
          <button
            className="mt-8 w-full rounded-2xl bg-white/20 py-4 text-xl font-bold text-white backdrop-blur-sm active:bg-white/30"
            onClick={() => setSelectedStudent(null)}
          >
            关闭
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen touch-manipulation bg-gradient-to-br from-emerald-950 via-slate-900 to-emerald-950 p-4 text-white select-none sm:p-6">
      {/* 顶部 */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-3xl font-black tracking-tight sm:text-4xl">{data.class.name}</h1>
          <p className="mt-1 text-base text-emerald-300 sm:text-lg">
            {data.class.teacherName}
            {data.class.schoolName ? ` · ${data.class.schoolName}` : ""}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-center">
            <p className="text-xs text-emerald-300 sm:text-sm">今日</p>
            <p className="text-2xl font-black text-yellow-400 sm:text-3xl">
              {data.class.classTotalToday > 0 ? "+" : ""}{data.class.classTotalToday}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-emerald-300 sm:text-sm">平均</p>
            <p className="text-2xl font-black sm:text-3xl">Lv.{data.class.avgLevel}</p>
          </div>
          {/* 全屏按钮 — 触屏友好大按钮 */}
          <button
            onClick={toggleFullscreen}
            className="min-h-[48px] min-w-[80px] rounded-xl border border-emerald-600/30 bg-white/10 px-5 py-3 text-base backdrop-blur active:bg-white/20"
          >
            {fullscreen ? "⛶ 退出" : "⛶ 全屏"}
          </button>
        </div>
      </div>

      {/* 排序 — 大触屏按钮 */}
      <div className="mt-4 flex flex-wrap gap-3">
        {[
          ["points", "🏆 积分榜"],
          ["today", "🔥 今日榜"],
          ["level", "⭐ 等级榜"],
          ["name", "📝 按姓名"],
        ].map(([key, label]) => (
          <button
            key={key}
            onClick={() => setSortBy(key as typeof sortBy)}
            className={`min-h-[48px] rounded-full px-6 py-3 text-base font-bold transition active:scale-95 ${
              sortBy === key
                ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/30"
                : "bg-white/10 text-emerald-200 hover:bg-white/20"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {todayPositives > 0 && (
        <div className="mt-4 inline-block rounded-full bg-yellow-500/20 px-5 py-2 text-sm text-yellow-300">
          🎉 今日 {todayPositives} 位同学获得加分
        </div>
      )}

      {/* 学生网格 — 触屏卡片 */}
      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        {sortedStudents.map((s, i) => {
          const isTop3 = i < 3 && sortBy === "points";
          const stage = s.petStage as keyof typeof STAGE_COLORS;
          return (
            <button
              key={s.id}
              onClick={() => setSelectedStudent(s)}
              className={`touch-manipulation rounded-2xl border p-4 text-center transition-all active:scale-95 ${
                isTop3
                  ? "border-yellow-400/50 bg-gradient-to-b from-yellow-500/15 to-slate-800/50 shadow-lg shadow-yellow-500/10"
                  : s.todayPoints > 0
                    ? "border-emerald-500/30 bg-slate-800/50"
                    : "border-slate-700/50 bg-slate-800/30"
              }`}
            >
              {/* 宠物图片 */}
              <div className={`mx-auto flex h-24 w-24 items-center justify-center rounded-2xl bg-gradient-to-b ${STAGE_COLORS[stage] ?? "from-slate-700/50"} to-slate-800/50`}>
                <img
                  src={getPetImage(s.petStage as any, i)}
                  alt={s.petName}
                  className="h-20 w-20 object-contain drop-shadow-lg"
                />
              </div>
              <p className="mt-2 text-base font-bold truncate">{s.name}</p>
              {s.seatNo && <p className="text-xs text-slate-400">#{s.seatNo}</p>}
              <p className="mt-0.5 text-xs text-emerald-300 truncate">{s.petName}</p>
              <div className="mt-2 flex items-center justify-center gap-2">
                <span className="rounded-lg bg-emerald-600/30 px-2.5 py-1 text-xs font-bold text-emerald-300">
                  Lv.{s.level}
                </span>
                <span className="text-lg font-black text-yellow-400">{s.totalPoints}</span>
              </div>
              {s.todayPoints !== 0 && (
                <p className={`mt-1 text-sm font-bold ${s.todayPoints > 0 ? "text-green-400" : "text-red-400"}`}>
                  {s.todayPoints > 0 ? "↑" : "↓"}{s.todayPoints}
                </p>
              )}
              {/* 心情条 */}
              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-700">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.max(0, Math.min(100, s.mood))}%`,
                    backgroundColor: MOOD_COLORS[s.moodState] ?? "#6b7280",
                  }}
                />
              </div>
              {isTop3 && (
                <p className="mt-1 text-lg">
                  {i === 0 ? "🥇" : i === 1 ? "🥈" : "🥉"}
                </p>
              )}
            </button>
          );
        })}
      </div>

      {/* 底部 */}
      <div className="mt-8 text-center text-sm text-slate-500">
        <p>{data.class.studentCount} 名学生 · 总积分 {data.class.classTotalPoints} · 实时更新</p>
        <p className="mt-1">👆 点击学生查看详情 · 按 F 全屏</p>
      </div>
    </div>
  );
}
