"use client";

import { useRouter } from "next/navigation";

export function LogoutButton() {
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <button className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold" onClick={logout} type="button">
      退出登录
    </button>
  );
}
