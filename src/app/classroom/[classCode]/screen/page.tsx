"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";

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

export default function ClassroomScreen() {
  const params = useParams<{ classCode: string }>();
  const [data, setData] = useState<ScreenData | null>(null);
  const [loading, setLoading] = useState(true);
  const [fullscreen, setFullscreen] = useState(false);
  const [sortBy, setSortBy] = useState<"points" | "level" | "name" | "today">("points");
  const [celebrations, setCelebrations] = useState<string[]>([]);

  const loadData = useCallback(async () => {
    try {
      const res = await fetch(`/api/classroom/${params.classCode}`);
      const json = await res.json();
      if (json.ok) {
        // 检测是否有新积分变化（做闪动效果）
        setData(json);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [params.classCode]);

  useEffect(() => {
    loadData();
    // 每10秒自动刷新
    const interval = setInterval(loadData, 10000);
    return () => clearInterval(interval);
  }, [loadData]);

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
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-emerald-950 via-slate-900 to-emerald-900">
      <p className="text-2xl text-emerald-400 animate-pulse">加载中...</p>
    </div>
  );

  if (!data) return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-emerald-950 via-slate-900 to-emerald-900">
      <p className="text-2xl text-white">班级不存在</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-950 via-slate-900 to-emerald-900 p-6 text-white">
      {/* 顶部 */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-4xl font-black tracking-tight">{data.class.name}</h1>
          <p className="mt-2 text-lg text-emerald-300">
            {data.class.teacherName}
            {data.class.schoolName ? ` · ${data.class.schoolName}` : ""}
          </p>
        </div>
        <div className="flex items-center gap-6">
          <div className="text-center">
            <p className="text-sm text-emerald-300">今日积分</p>
            <p className="text-3xl font-black text-yellow-400">
              {data.class.classTotalToday > 0 ? "+" : ""}{data.class.classTotalToday}
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-emerald-300">班级等级</p>
            <p className="text-3xl font-black">Lv.{data.class.avgLevel}</p>
          </div>
          <button
            onClick={toggleFullscreen}
            className="rounded-md border border-emerald-600/30 bg-white/10 px-4 py-2 text-sm backdrop-blur hover:bg-white/20"
          >
            {fullscreen ? "退出全屏" : "全屏"}
          </button>
        </div>
      </div>

      {/* 排序切换 */}
      <div className="mt-6 flex flex-wrap gap-2">
        {[
          ["points", "🏆 积分"],
          ["today", "🔥 今日"],
          ["level", "⭐ 等级"],
          ["name", "📝 姓名"],
        ].map(([key, label]) => (
          <button
            key={key}
            onClick={() => setSortBy(key as typeof sortBy)}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
              sortBy === key
                ? "bg-emerald-500 text-white"
                : "bg-white/10 text-emerald-200 hover:bg-white/20"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {todayPositives > 0 && (
        <div className="mt-4 rounded-full bg-yellow-500/20 px-4 py-2 text-sm text-yellow-300 inline-block">
          🎉 {todayPositives} 位同学今日获得加分
        </div>
      )}

      {/* 学生卡片网格 */}
      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        {sortedStudents.map((s, i) => {
          const isTop3 = i < 3 && sortBy === "points";
          return (
            <div
              key={s.id}
              className={`rounded-xl border p-4 text-center transition-all ${
                isTop3
                  ? "border-yellow-400/50 bg-gradient-to-b from-yellow-500/20 to-slate-800/50 shadow-lg shadow-yellow-500/10"
                  : s.todayPoints > 0
                    ? "border-emerald-500/30 bg-slate-800/50"
                    : "border-slate-700/50 bg-slate-800/30"
              }`}
            >
              <p className="text-4xl">{s.moodEmoji}</p>
              <div className="mt-2 text-3xl">{getStageSkin(s.petStage)}</div>
              <p className="mt-2 text-lg font-bold truncate">{s.name}</p>
              {s.seatNo && <p className="text-xs text-slate-400">座号 {s.seatNo}</p>}
              <p className="mt-1 text-xs text-emerald-300">{s.petName}</p>
              <div className="mt-2 flex items-center justify-center gap-2">
                <span className="rounded-md bg-emerald-600/30 px-2 py-0.5 text-xs font-bold text-emerald-300">
                  Lv.{s.level}
                </span>
                <span className="text-lg font-bold text-yellow-400">{s.totalPoints}</span>
              </div>
              {s.todayPoints !== 0 && (
                <p className={`mt-1 text-sm font-bold ${s.todayPoints > 0 ? "text-green-400" : "text-red-400"}`}>
                  {s.todayPoints > 0 ? "+" : ""}{s.todayPoints}
                </p>
              )}
              {/* 心情条 */}
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-700">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${Math.max(0, Math.min(100, s.mood))}%`,
                    backgroundColor: s.mood >= 60 ? "#10b981" : s.mood >= 30 ? "#f59e0b" : "#ef4444",
                  }}
                />
              </div>
              {isTop3 && (
                <p className="mt-1 text-xs text-yellow-400">
                  {i === 0 ? "🥇" : i === 1 ? "🥈" : "🥉"}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* 底部信息 */}
      <div className="mt-8 text-center text-sm text-slate-500">
        <p>共 {data.class.studentCount} 名学生 · 总积分 {data.class.classTotalPoints} · 自动刷新中</p>
        <p className="mt-1">按 F 键切换全屏</p>
      </div>
    </div>
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
