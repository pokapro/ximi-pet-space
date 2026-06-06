import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { evaluateTeacherAccess, teacherAccessMessage } from "@/lib/access";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function ScreenSettingsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: classId } = await params;
  const user = await requireUser();
  const access = evaluateTeacherAccess({ role: user.role, status: user.status, expiresAt: user.subscription?.expiresAt });
  if (!access.allowed) return <BlockedPage message={teacherAccessMessage(access.reason)} />;

  const cls = await prisma.class.findFirst({
    where: { id: classId, teacherId: user.id },
  });
  if (!cls) return <div className="p-8 text-center text-slate-500">班级不存在</div>;

  const screenUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3001"}/classroom/${cls.code}/screen`;

  return (
    <main className="min-h-screen bg-[#f7f6f2] px-6 py-8">
      <section className="mx-auto max-w-3xl">
        <div>
          <Link href="/teacher/classes" className="text-sm text-emerald-700 underline">&larr; 返回</Link>
          <h1 className="mt-2 text-3xl font-black">大屏设置</h1>
        </div>

        <div className="mt-8 space-y-6">
          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold">班级大屏地址</h2>
            <p className="mt-2 text-sm text-slate-500">
              在教室电脑浏览器中打开这个网址，或扫码投屏。
            </p>
            <div className="mt-4 flex items-center gap-3">
              <input
                readOnly
                value={screenUrl}
                className="flex-1 rounded-md border border-slate-300 bg-slate-50 px-4 py-3 text-sm"
                onClick={(e) => (e.target as HTMLInputElement).select()}
              />
              <Link
                href={`/classroom/${cls.code}/screen`}
                target="_blank"
                className="rounded-md bg-emerald-700 px-5 py-3 font-bold text-white"
              >
                打开大屏
              </Link>
            </div>
          </div>

          <div className="rounded-lg border border-amber-200 bg-amber-50 p-6">
            <h2 className="text-lg font-bold text-amber-900">💡 使用提示</h2>
            <ul className="mt-3 space-y-2 text-sm text-amber-800">
              <li>• 大屏页面会自动刷新数据，用于教室大屏或投影展示。</li>
              <li>• 按键盘 F11 可进入全屏模式（浏览器）。</li>
              <li>• 每位学生的大屏码和查询码在「学生管理」页面查看。</li>
              <li>• 学生可以扫描大屏上的二维码查看自己的宠物。</li>
            </ul>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold">查询码</h2>
            <p className="mt-2 text-sm text-slate-500">
              学生查询页路径：<code className="rounded bg-slate-100 px-2 py-1 text-emerald-700">/s/[学生查询码]</code>
            </p>
            <p className="mt-1 text-sm text-slate-500">
              每个学生的查询码在「学生管理」页面查看。
            </p>
          </div>
        </div>
      </section>
    </main>
  );
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
