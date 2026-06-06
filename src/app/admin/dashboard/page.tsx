import { prisma } from "@/lib/prisma";
import { requireAdminUser } from "@/lib/session";
import Link from "next/link";
import { LogoutButton } from "@/components/logout-button";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const admin = await requireAdminUser();

  const [teacherCount, classCount, studentCount, pointCount] = await Promise.all([
    prisma.user.count({ where: { role: "Teacher" } }),
    prisma.class.count({ where: { isActive: true } }),
    prisma.student.count({ where: { isActive: true } }),
    prisma.pointLog.count(),
  ]);

  const expiringSoon = await prisma.user.count({
    where: {
      role: "Teacher",
      status: "Active",
      subscription: {
        expiresAt: {
          lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          gte: new Date(),
        },
      },
    },
  });

  const pendingCount = await prisma.user.count({
    where: { role: "Teacher", status: "Pending" },
  });

  return (
    <main className="min-h-screen bg-[#f7f6f2] px-6 py-8">
      <section className="mx-auto max-w-7xl">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-emerald-700">平台管理后台</p>
            <h1 className="mt-1 text-3xl font-black">平台概览</h1>
            <p className="mt-2 text-slate-600">管理员：{admin.name}</p>
          </div>
          <LogoutButton />
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["👩‍🏫 老师", teacherCount],
            ["🏫 班级", classCount],
            ["👥 学生", studentCount],
            ["📊 积分", pointCount],
          ].map(([label, value]) => (
            <div key={String(label)} className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-sm text-slate-500">{label}</p>
              <p className="mt-2 text-4xl font-black">{value}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-6">
            <p className="text-sm text-amber-700">⏰ 即将到期（7天内）</p>
            <p className="mt-2 text-3xl font-black text-amber-900">{expiringSoon}</p>
          </div>
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-6">
            <p className="text-sm text-blue-700">⏳ 待开通老师</p>
            <p className="mt-2 text-3xl font-black text-blue-900">{pendingCount}</p>
          </div>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <Link href="/admin" className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm transition hover:border-emerald-300">
            <p className="text-2xl">👩‍🏫</p>
            <h2 className="mt-3 font-bold">老师账号管理</h2>
            <p className="mt-1 text-sm text-slate-500">开通、续期、暂停老师账号</p>
          </Link>
          <Link href="/admin/subscriptions" className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm transition hover:border-emerald-300">
            <p className="text-2xl">📅</p>
            <h2 className="mt-3 font-bold">使用期限管理</h2>
            <p className="mt-1 text-sm text-slate-500">查看和管理所有使用期限</p>
          </Link>
          <Link href="/admin/logs" className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm transition hover:border-emerald-300">
            <p className="text-2xl">📋</p>
            <h2 className="mt-3 font-bold">操作日志</h2>
            <p className="mt-1 text-sm text-slate-500">查看平台操作记录</p>
          </Link>
        </div>
      </section>
    </main>
  );
}
