import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { evaluateTeacherAccess, teacherAccessMessage } from "@/lib/access";
import { getMoodEmoji } from "@/lib/pet-growth";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function StatsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: classId } = await params;
  const user = await requireUser();
  const access = evaluateTeacherAccess({ role: user.role, status: user.status, expiresAt: user.subscription?.expiresAt });
  if (!access.allowed) return <BlockedPage message={teacherAccessMessage(access.reason)} />;

  const cls = await prisma.class.findFirst({
    where: { id: classId, teacherId: user.id },
    include: {
      students: { where: { isActive: true }, orderBy: { totalPoints: "desc" } },
      behaviorRules: { where: { isActive: true } },
    },
  });
  if (!cls) return <div className="p-8 text-center text-slate-500">班级不存在</div>;

  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);

  const todayLogs = await prisma.pointLog.groupBy({
    by: ["studentId"],
    where: { classId, revertedAt: null, createdAt: { gte: todayStart, lt: todayEnd } },
    _sum: { points: true },
  });

  const todayPointsMap: Record<string, number> = {};
  for (const log of todayLogs) todayPointsMap[log.studentId] = log._sum.points ?? 0;

  const studentsWithToday = cls.students.map(s => ({
    ...s,
    todayPoints: todayPointsMap[s.id] ?? 0,
  }));

  const sortedByToday = [...studentsWithToday].sort((a, b) => b.todayPoints - a.todayPoints);
  const levelDist = cls.students.reduce((acc, s) => {
    const stage = s.petStage;
    acc[stage] = (acc[stage] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <main className="min-h-screen bg-[#f7f6f2] px-6 py-8">
      <section className="mx-auto max-w-5xl">
        <div className="flex items-start justify-between">
          <div>
            <Link href="/teacher/classes" className="text-sm text-emerald-700 underline">&larr; 返回</Link>
            <h1 className="mt-2 text-3xl font-black">{cls.name} 统计</h1>
          </div>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["学生总数", cls.students.length, "👥"],
            ["行为规则", cls.behaviorRules.length, "📋"],
            ["班级总积分", cls.students.reduce((a, s) => a + s.totalPoints, 0), "⭐"],
            ["平均等级", cls.students.length > 0 ? Math.round(cls.students.reduce((a, s) => a + s.level, 0) / cls.students.length) : 0, "📈"],
          ].map(([label, value, icon]) => (
            <div key={String(label)} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm text-slate-500">{icon} {label}</p>
              <p className="mt-2 text-3xl font-black">{value}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold">🏆 积分榜</h2>
            <div className="mt-4 space-y-2">
              {studentsWithToday.slice(0, 10).map((s, i) => (
                <div key={s.id} className="flex items-center justify-between rounded-md bg-slate-50 p-3">
                  <div className="flex items-center gap-3">
                    <span className="w-6 font-bold text-slate-400">#{i + 1}</span>
                    <span>{getMoodEmoji(s.mood)}</span>
                    <span className="font-semibold">{s.name}</span>
                    <span className="text-xs text-slate-400">Lv.{s.level}</span>
                  </div>
                  <span className="font-bold text-emerald-700">{s.totalPoints} 分</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold">🔥 今日活跃</h2>
            <div className="mt-4 space-y-2">
              {sortedByToday.filter(s => s.todayPoints !== 0).slice(0, 10).map((s, i) => (
                <div key={s.id} className="flex items-center justify-between rounded-md bg-amber-50 p-3">
                  <div className="flex items-center gap-3">
                    <span className="w-6 font-bold text-amber-400">#{i + 1}</span>
                    <span>{getMoodEmoji(s.mood)}</span>
                    <span className="font-semibold">{s.name}</span>
                  </div>
                  <span className="font-bold text-amber-700">{s.todayPoints > 0 ? "+" : ""}{s.todayPoints}</span>
                </div>
              ))}
              {sortedByToday.filter(s => s.todayPoints === 0).length === cls.students.length && (
                <p className="text-sm text-slate-400">今天还没有积分记录</p>
              )}
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold">📊 等级分布</h2>
            <div className="mt-4 space-y-2">
              {Object.entries(levelDist).map(([stage, count]) => (
                <div key={stage} className="flex items-center justify-between rounded-md bg-slate-50 p-2">
                  <span className="font-semibold">{stageLabel(stage)}</span>
                  <div className="flex items-center gap-2">
                    <div className="h-2 rounded-full bg-emerald-500" style={{ width: `${(count / cls.students.length) * 200}px` }} />
                    <span className="text-sm text-slate-500">{count} 人</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold">😔 待关注学生</h2>
            <div className="mt-4 space-y-2">
              {studentsWithToday.filter(s => s.mood < 30).map(s => (
                <div key={s.id} className="flex items-center justify-between rounded-md bg-red-50 p-3">
                  <div className="flex items-center gap-3">
                    <span>{getMoodEmoji(s.mood)}</span>
                    <span className="font-semibold">{s.name}</span>
                  </div>
                  <span className="text-sm text-red-600">心情 {s.mood}</span>
                </div>
              ))}
              {studentsWithToday.filter(s => s.mood < 30).length === 0 && (
                <p className="text-sm text-slate-400">所有学生心情都很好 🎉</p>
              )}
            </div>
          </div>
        </div>

        <Link
          href={`/classroom/${cls.code}/screen`}
          target="_blank"
          className="mt-8 inline-block rounded-md bg-emerald-700 px-6 py-3 font-bold text-white shadow-sm"
        >
          📺 查看大屏
        </Link>
      </section>
    </main>
  );
}

function stageLabel(stage: string): string {
  const labels: Record<string, string> = { Egg: "🥚 蛋", Baby: "🐣 幼体", Growth: "🌱 成长期", Evolution: "🦋 进化期", Rare: "🌟 稀有" };
  return labels[stage] ?? stage;
}

function BlockedPage({ message }: { message: string }) {
  return (
    <main className="min-h-screen bg-[#f7f6f2] px-6 py-10">
      <section className="mx-auto max-w-3xl rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-black">功能暂不可用</h1>
        <p className="mt-4 rounded-md bg-amber-50 px-4 py-3 text-amber-800">{message}</p>
      </section>
    </main>
  );
}
