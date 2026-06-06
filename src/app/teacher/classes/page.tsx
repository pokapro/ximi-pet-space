import { requireUser } from "@/lib/session";
import { evaluateTeacherAccess, teacherAccessMessage } from "@/lib/access";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { LogoutButton } from "@/components/logout-button";

export const dynamic = "force-dynamic";

export default async function ClassListPage() {
  const user = await requireUser();
  const access = evaluateTeacherAccess({
    role: user.role,
    status: user.status,
    expiresAt: user.subscription?.expiresAt,
  });

  if (!access.allowed) return <BlockedPage message={teacherAccessMessage(access.reason)} />;

  const classes = await prisma.class.findMany({
    where: { teacherId: user.id, isActive: true },
    include: { _count: { select: { students: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <main className="min-h-screen bg-[#f7f6f2] px-6 py-8">
      <section className="mx-auto max-w-4xl">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <Link href="/teacher" className="text-sm text-emerald-700 underline">&larr; 返回工作台</Link>
            <h1 className="mt-2 text-3xl font-black">班级管理</h1>
            <p className="mt-1 text-slate-500">共 {classes.length} 个班级</p>
          </div>
          <div className="flex gap-3">
            <LogoutButton />
            <Link href="/teacher/classes/new" className="rounded-md bg-emerald-700 px-4 py-2 font-bold text-white">
              + 新建班级
            </Link>
          </div>
        </div>

        <div className="mt-8 space-y-4">
          {classes.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-300 bg-white p-10 text-center">
              <p className="text-4xl">🏫</p>
              <p className="mt-4 text-slate-500">还没有班级，点击上方新建。</p>
            </div>
          ) : classes.map((cls) => (
            <div key={cls.id} className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h3 className="text-xl font-bold">{cls.name}</h3>
                  <p className="mt-1 text-sm text-slate-500">
                    班级码：{cls.code} · {cls._count.students} 名学生
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link href={`/teacher/classes/${cls.id}/students`} className="rounded-md bg-slate-100 px-3 py-2 text-sm font-semibold">
                    学生
                  </Link>
                  <Link href={`/teacher/classes/${cls.id}/points`} className="rounded-md bg-emerald-100 px-3 py-2 text-sm font-semibold text-emerald-800">
                    加减分
                  </Link>
                  <Link href={`/teacher/classes/${cls.id}/rules`} className="rounded-md bg-slate-100 px-3 py-2 text-sm font-semibold">
                    规则
                  </Link>
                  <Link href={`/teacher/classes/${cls.id}/screen-settings`} className="rounded-md bg-slate-100 px-3 py-2 text-sm font-semibold">
                    大屏
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

function BlockedPage({ message }: { message: string }) {
  return (
    <main className="min-h-screen bg-[#f7f6f2] px-6 py-10">
      <section className="mx-auto max-w-3xl rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-black text-slate-900">功能暂不可用</h1>
        <p className="mt-4 rounded-md bg-amber-50 px-4 py-3 text-amber-800">{message}</p>
      </section>
    </main>
  );
}
