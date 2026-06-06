import { prisma } from "@/lib/prisma";
import { requireAdminUser } from "@/lib/session";
import Link from "next/link";
import { LogoutButton } from "@/components/logout-button";

export const dynamic = "force-dynamic";

export default async function SubscriptionsPage() {
  await requireAdminUser();

  const subscriptions = await prisma.subscription.findMany({
    include: {
      user: { select: { name: true, phone: true } },
    },
    orderBy: [{ status: "asc" }, { expiresAt: "asc" }],
  });

  const now = new Date();
  const active = subscriptions.filter(s => s.status === "Active");
  const expiring = active.filter(s => s.expiresAt && s.expiresAt.getTime() <= now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const expired = subscriptions.filter(s => s.status === "Expired" || (s.expiresAt && s.expiresAt.getTime() <= now.getTime()));
  const pending = subscriptions.filter(s => s.status === "Pending");

  return (
    <main className="min-h-screen bg-[#f7f6f2] px-6 py-8">
      <section className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <Link href="/admin/dashboard" className="text-sm text-emerald-700 underline">&larr; 返回</Link>
            <h1 className="mt-1 text-3xl font-black">使用期限</h1>
          </div>
          <LogoutButton />
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-4">
          {[
            ["✅ 正常", active.length],
            ["⏰ 即将到期", expiring.length],
            ["⌛ 已到期", expired.length],
            ["⏳ 待开通", pending.length],
          ].map(([label, value]) => (
            <div key={String(label)} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm text-slate-500">{label}</p>
              <p className="mt-2 text-3xl font-black">{value}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 bg-slate-50 p-4 text-sm font-bold text-slate-600 md:grid md:grid-cols-[1fr_1fr_1fr_1.5fr_1fr] md:gap-4">
            <span>老师</span>
            <span>状态</span>
            <span>开始时间</span>
            <span>到期时间</span>
            <span>备注</span>
          </div>
          {subscriptions.length === 0 ? (
            <div className="p-8 text-center text-slate-500">暂无数据</div>
          ) : subscriptions.map((s) => (
            <div key={s.id} className="border-b border-slate-100 p-4 last:border-b-0 md:grid md:grid-cols-[1fr_1fr_1fr_1.5fr_1fr] md:items-center md:gap-4">
              <p className="font-bold">{s.user.name}</p>
              <p>{statusLabel(s.status)}</p>
              <p className="text-sm">{s.startsAt?.toLocaleDateString("zh-CN") ?? "未设置"}</p>
              <p className={`text-sm ${s.expiresAt && s.expiresAt.getTime() <= now.getTime() ? "text-red-600" : ""}`}>
                {s.expiresAt?.toLocaleString("zh-CN") ?? "未设置"}
              </p>
              <p className="text-sm text-slate-500">{s.note ?? ""}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

function statusLabel(status: string) {
  const labels: Record<string, string> = {
    Pending: "⏳ 待开通",
    Active: "✅ 正常",
    Suspended: "🚫 已暂停",
    Expired: "⌛ 已到期",
  };
  return labels[status] ?? status;
}
