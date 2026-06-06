import { getCurrentUser } from "@/lib/session";
import { redirect } from "next/navigation";
import { LogoutButton } from "@/components/logout-button";

export const dynamic = "force-dynamic";

export default async function SuspendedPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f7f6f2] px-6">
      <section className="w-full max-w-md rounded-lg border border-red-300 bg-white p-8 text-center shadow-sm">
        <p className="text-6xl">🚫</p>
        <h1 className="mt-6 text-2xl font-black text-slate-900">账号已暂停</h1>
        <p className="mt-4 leading-7 text-slate-600">
          你的账号已被管理员暂停使用。
          <br />
          请联系管理员了解具体情况并申请恢复。
        </p>
        <div className="mt-6">
          <LogoutButton />
        </div>
      </section>
    </main>
  );
}
