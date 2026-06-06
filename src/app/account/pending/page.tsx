import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { redirect } from "next/navigation";
import { LogoutButton } from "@/components/logout-button";

export const dynamic = "force-dynamic";

export default async function PendingPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.status !== "Pending") redirect("/teacher");

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f7f6f2] px-6">
      <section className="w-full max-w-md rounded-lg border border-amber-200 bg-white p-8 text-center shadow-sm">
        <p className="text-6xl">⏳</p>
        <h1 className="mt-6 text-2xl font-black text-slate-900">等待管理员开通</h1>
        <p className="mt-4 leading-7 text-slate-600">
          你的账号已注册成功，目前处于待开通状态。
          <br />
          请联系管理员开通使用权限。
        </p>
        <div className="mt-6 space-y-3">
          <div className="rounded-md bg-slate-50 p-3 text-sm text-slate-500">
            <p>注册手机号：{user.phone}</p>
            <p>注册姓名：{user.name}</p>
          </div>
          <LogoutButton />
        </div>
      </section>
    </main>
  );
}
