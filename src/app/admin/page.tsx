import { prisma } from "@/lib/prisma";
import { requireAdminUser } from "@/lib/session";
import { AdminTeacherActions } from "@/components/admin-teacher-actions";
import { LogoutButton } from "@/components/logout-button";
import Link from "next/link";

export const dynamic = "force-dynamic";

function statusBadge(status: string) {
  const styles: Record<string, string> = {
    Pending: "bg-amber-100 text-amber-800",
    Active: "bg-emerald-100 text-emerald-800",
    Suspended: "bg-red-100 text-red-800",
    Expired: "bg-slate-100 text-slate-500",
  };
  const labels: Record<string, string> = {
    Pending: "待开通",
    Active: "正常",
    Suspended: "已暂停",
    Expired: "已到期",
  };

  return (
    <span className={`inline-block rounded-md px-2 py-1 text-xs font-semibold ${styles[status] ?? "bg-slate-100"}`}>
      {labels[status] ?? status}
    </span>
  );
}

export default async function AdminPage() {
  const admin = await requireAdminUser();
  const teachers = await prisma.user.findMany({
    where: { role: "Teacher" },
    include: {
      subscription: true,
      _count: { select: { classes: true } },
    },
    orderBy: [{ createdAt: "desc" }],
  });

  return (
    <main className="min-h-screen bg-[#f7f6f2] px-4 py-6 md:px-6 md:py-8">
      <section className="mx-auto max-w-7xl">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <Link href="/admin/dashboard" className="text-sm text-emerald-700 underline">&larr; 平台概览</Link>
            <h1 className="mt-1 text-3xl font-black">老师账号管理</h1>
            <p className="mt-1 text-slate-500">共 {teachers.length} 位老师</p>
          </div>
          <LogoutButton />
        </div>

        <div className="mt-6 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          {/* 表头 */}
          <div className="hidden border-b border-slate-200 bg-slate-50 p-4 md:grid md:grid-cols-[1.2fr_1fr_0.8fr_1.2fr_0.5fr_1.5fr] md:gap-4 md:text-sm md:font-bold md:text-slate-600">
            <span>老师</span>
            <span>手机号</span>
            <span>状态</span>
            <span>使用期限</span>
            <span>班级</span>
            <span>操作</span>
          </div>

          {teachers.length === 0 ? (
            <div className="p-8 text-center text-slate-500">还没有老师注册。</div>
          ) : (
            teachers.map((t) => (
              <div
                key={t.id}
                className="border-b border-slate-100 p-4 last:border-b-0 md:grid md:grid-cols-[1.2fr_1fr_0.8fr_1.2fr_0.5fr_1.5fr] md:items-center md:gap-4"
              >
                <div className="mb-2 md:mb-0">
                  <p className="font-bold">{t.name}</p>
                  <p className="text-xs text-slate-400">
                    {new Date(t.createdAt).toLocaleDateString("zh-CN")}
                  </p>
                </div>
                <p className="mb-2 md:mb-0">{t.phone}</p>
                <div className="mb-2 md:mb-0">{statusBadge(t.status)}</div>
                <p className="mb-2 text-sm text-slate-600 md:mb-0">
                  {t.subscription?.expiresAt
                    ? t.subscription.expiresAt.toLocaleString("zh-CN")
                    : "未设置"}
                </p>
                <p className="mb-2 md:mb-0">{t._count.classes}</p>
                <AdminTeacherActions teacherId={t.id} />
              </div>
            ))
          )}
        </div>
      </section>
    </main>
  );
}
