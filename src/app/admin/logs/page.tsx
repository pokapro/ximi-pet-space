import { prisma } from "@/lib/prisma";
import { requireAdminUser } from "@/lib/session";
import Link from "next/link";
import { LogoutButton } from "@/components/logout-button";

export const dynamic = "force-dynamic";

const ACTION_LABELS: Record<string, string> = {
  Register: "注册",
  Login: "登录",
  Logout: "登出",
  OpenTeacher: "开通老师",
  SuspendTeacher: "暂停老师",
  RenewTeacher: "续期老师",
  ResetPassword: "重置密码",
  CreateClass: "创建班级",
  CreateStudent: "导入学生",
  PointChange: "加减分",
};

export default async function LogsPage() {
  await requireAdminUser();

  const logs = await prisma.auditLog.findMany({
    include: { actor: { select: { name: true, role: true } } },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return (
    <main className="min-h-screen bg-[#f7f6f2] px-6 py-8">
      <section className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <Link href="/admin/dashboard" className="text-sm text-emerald-700 underline">&larr; 返回</Link>
            <h1 className="mt-1 text-3xl font-black">操作日志</h1>
            <p className="mt-1 text-slate-500">最近 200 条操作</p>
          </div>
          <LogoutButton />
        </div>

        <div className="mt-6 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="hidden border-b border-slate-200 bg-slate-50 p-4 text-sm font-bold text-slate-600 md:grid md:grid-cols-[1fr_1fr_1fr_1.5fr] md:gap-4">
            <span>时间</span>
            <span>操作者</span>
            <span>操作</span>
            <span>详情</span>
          </div>
          {logs.length === 0 ? (
            <div className="p-8 text-center text-slate-500">暂无日志</div>
          ) : logs.map((l) => (
            <div key={l.id} className="border-b border-slate-100 p-4 last:border-b-0 md:grid md:grid-cols-[1fr_1fr_1fr_1.5fr] md:items-center md:gap-4">
              <p className="text-sm text-slate-500">
                {new Date(l.createdAt).toLocaleString("zh-CN")}
              </p>
              <p className="font-semibold">{l.actor?.name ?? "系统"} <span className="text-xs text-slate-400">({l.actor?.role})</span></p>
              <p>{ACTION_LABELS[l.action] ?? l.action}</p>
              <p className="text-sm text-slate-600">{JSON.stringify(l.detail)}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
