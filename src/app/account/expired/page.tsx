import { getCurrentUser } from "@/lib/session";
import { redirect } from "next/navigation";
import { LogoutButton } from "@/components/logout-button";

export const dynamic = "force-dynamic";

export default async function ExpiredPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f7f6f2] px-6">
      <section className="w-full max-w-md rounded-lg border border-red-200 bg-white p-8 text-center shadow-sm">
        <p className="text-6xl">⌛</p>
        <h1 className="mt-6 text-2xl font-black text-slate-900">账号已到期</h1>
        <p className="mt-4 leading-7 text-slate-600">
          你的使用期限已结束，无法继续管理班级和学生。
          <br />
          请联系管理员续期。
        </p>
        <div className="mt-6 space-y-3">
          <div className="rounded-md bg-slate-50 p-3 text-sm text-slate-500">
            <p>到期时间：
              {user.subscription?.expiresAt?.toLocaleString("zh-CN") ?? "未知"}
            </p>
          </div>
          <LogoutButton />
        </div>
      </section>
    </main>
  );
}
