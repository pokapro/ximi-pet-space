import { evaluateTeacherAccess, teacherAccessMessage } from "@/lib/access";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { LogoutButton } from "@/components/logout-button";
import Link from "next/link";
import { getMoodEmoji, getMoodState } from "@/lib/pet-growth";

export const dynamic = "force-dynamic";

export default async function TeacherPage() {
  const user = await requireUser();
  const access = evaluateTeacherAccess({
    role: user.role,
    status: user.status,
    expiresAt: user.subscription?.expiresAt,
  });

  if (!access.allowed) {
    return (
      <main className="min-h-screen bg-[#f7f6f2] px-6 py-10">
        <section className="mx-auto max-w-3xl rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
          <p className="text-sm font-semibold text-emerald-700">西米老师的宠物空间</p>
          <h1 className="mt-2 text-3xl font-black text-slate-900">教师功能暂不可用</h1>
          <p className="mt-4 rounded-md bg-amber-50 px-4 py-3 text-amber-800">
            {teacherAccessMessage(access.reason)}
          </p>
          <dl className="mt-6 grid gap-4 text-sm sm:grid-cols-2">
            <div className="rounded-md bg-slate-50 p-4">
              <dt className="text-slate-500">账号状态</dt>
              <dd className="mt-1 font-bold">{user.status}</dd>
            </div>
            <div className="rounded-md bg-slate-50 p-4">
              <dt className="text-slate-500">到期时间</dt>
              <dd className="mt-1 font-bold">
                {user.subscription?.expiresAt ? user.subscription.expiresAt.toLocaleString("zh-CN") : "尚未设置"}
              </dd>
            </div>
          </dl>
          <div className="mt-6">
            <LogoutButton />
          </div>
        </section>
      </main>
    );
  }

  const classes = await prisma.class.findMany({
    where: { teacherId: user.id, isActive: true },
    include: {
      _count: { select: { students: true } },
      students: {
        where: { isActive: true },
        orderBy: { totalPoints: "desc" },
        take: 3,
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);

  const todayTotal = await prisma.pointLog.aggregate({
    where: {
      class: { teacherId: user.id },
      revertedAt: null,
      createdAt: { gte: todayStart, lt: todayEnd },
    },
    _sum: { points: true },
  });

  return (
    <main className="min-h-screen bg-[#f7f6f2] px-6 py-8">
      <section className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-emerald-700">西米老师的宠物空间</p>
            <h1 className="mt-1 text-3xl font-black">欢迎回来，{user.name}</h1>
            <p className="mt-2 text-slate-600">
              使用期限到 {user.subscription?.expiresAt?.toLocaleString("zh-CN") ?? "未设置"}。
            </p>
          </div>
          <LogoutButton />
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["📚 班级", classes.length],
            ["👥 学生", classes.reduce((a, c) => a + c._count.students, 0)],
            ["📊 今日积分", todayTotal._sum.points ?? 0],
            ["⭐ 平均等级", classes.length > 0
              ? classes.length > 0
                ? Math.round(
                    classes
                      .flatMap((c) => c.students)
                      .reduce((a, s) => a + s.level, 0) /
                      Math.max(1, classes.flatMap((c) => c.students).length)
                  )
                : 1
              : 0],
          ].map(([label, value]) => (
            <div key={String(label)} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm text-slate-500">{label}</p>
              <p className="mt-2 text-3xl font-black">{value}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/teacher/classes"
            className="rounded-md bg-emerald-700 px-5 py-3 font-bold text-white shadow-sm"
          >
            + 班级管理
          </Link>
        </div>

        {classes.length === 0 ? (
          <div className="mt-8 rounded-lg border border-dashed border-slate-300 bg-white p-10 text-center">
            <p className="text-4xl">🏫</p>
            <h2 className="mt-4 text-xl font-bold text-slate-700">还没有班级</h2>
            <p className="mt-2 text-slate-500">创建第一个班级，开始管理你的学生宠物吧。</p>
            <Link
              href="/teacher/classes/new"
              className="mt-6 inline-block rounded-md bg-emerald-700 px-6 py-3 font-bold text-white"
            >
              创建班级
            </Link>
          </div>
        ) : (
          <div className="mt-8 grid gap-6 sm:grid-cols-2">
            {classes.map((cls) => {
              const topStudent = cls.students[0];
              return (
                <div key={cls.id} className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-bold">{cls.name}</h3>
                      <p className="mt-1 text-sm text-slate-500">
                        {cls._count.students} 名学生 · 班级码 {cls.code}
                      </p>
                    </div>
                    <Link
                      href={`/teacher/classes/${cls.id}/points`}
                      className="rounded-md bg-emerald-100 px-3 py-2 text-sm font-semibold text-emerald-800"
                    >
                      加减分
                    </Link>
                  </div>

                  {topStudent ? (
                    <div className="mt-4 rounded-md bg-[#f7f6f2] p-3">
                      <p className="text-xs text-slate-500">积分最高</p>
                      <div className="mt-1 flex items-center gap-2">
                        <span>{getMoodEmoji(topStudent.mood)}</span>
                        <span className="font-bold">{topStudent.name}</span>
                        <span className="ml-auto text-sm text-slate-600">{topStudent.totalPoints} 分</span>
                      </div>
                    </div>
                  ) : null}

                  <div className="mt-4 flex flex-wrap gap-2">
                    <Link
                      href={`/teacher/classes/${cls.id}/students`}
                      className="text-sm text-emerald-700 underline"
                    >
                      学生列表
                    </Link>
                    <Link
                      href={`/teacher/classes/${cls.id}/rules`}
                      className="text-sm text-emerald-700 underline"
                    >
                      行为规则
                    </Link>
                    <Link
                      href={`/teacher/classes/${cls.id}/stats`}
                      className="text-sm text-emerald-700 underline"
                    >
                      统计
                    </Link>
                    <Link
                      href={`/teacher/classes/${cls.id}/screen-settings`}
                      className="text-sm text-emerald-700 underline"
                    >
                      大屏
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
