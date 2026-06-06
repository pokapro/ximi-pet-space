import Link from "next/link";
import { getCurrentUser } from "@/lib/session";

export default async function Home() {
  const user = await getCurrentUser();
  const dashboardHref = user?.role === "SuperAdmin" || user?.role === "Admin" ? "/admin" : "/teacher";

  return (
    <main className="min-h-screen bg-[#f7f6f2] px-6 py-8 text-slate-900">
      <section className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl flex-col justify-between">
        <nav className="flex items-center justify-between">
          <div>
            <p className="text-sm text-emerald-700">班级电子宠物平台</p>
            <h1 className="text-2xl font-bold">西米老师的宠物空间</h1>
          </div>
          <div className="flex gap-3">
            {user ? (
              <Link className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white" href={dashboardHref}>
                进入工作台
              </Link>
            ) : (
              <>
                <Link className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold" href="/login">
                  登录
                </Link>
                <Link className="rounded-md bg-emerald-700 px-4 py-2 text-sm font-semibold text-white" href="/register">
                  老师注册
                </Link>
              </>
            )}
          </div>
        </nav>

        <div className="grid gap-8 py-16 md:grid-cols-[1.1fr_0.9fr] md:items-center">
          <div>
            <p className="mb-4 inline-flex rounded-md bg-emerald-100 px-3 py-1 text-sm font-semibold text-emerald-800">
              用积分养成班级宠物
            </p>
            <h2 className="max-w-3xl text-4xl font-black leading-tight md:text-6xl">
              把每天的课堂表现，变成孩子看得见的成长反馈。
            </h2>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
              老师用手机号注册，管理员开通后即可管理班级、学生、行为积分和宠物成长。当前版本已具备账号、权限和使用期限基础闭环。
            </p>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <div className="grid grid-cols-2 gap-4">
              {[
                ["老师注册", "默认待开通"],
                ["管理员后台", "开通/暂停/续期"],
                ["期限校验", "到期自动拦截"],
                ["云端数据库", "PostgreSQL + Prisma"],
              ].map(([title, body]) => (
                <div key={title} className="rounded-md bg-[#f7f6f2] p-4">
                  <p className="font-bold">{title}</p>
                  <p className="mt-2 text-sm text-slate-600">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
