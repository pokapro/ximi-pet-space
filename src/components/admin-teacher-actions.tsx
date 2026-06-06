"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type AdminTeacherActionsProps = {
  teacherId: string;
};

export function AdminTeacherActions({ teacherId }: AdminTeacherActionsProps) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [loadingAction, setLoadingAction] = useState("");

  async function runAction(action: string, days?: number) {
    setLoadingAction(action);
    setMessage("");
    const response = await fetch("/api/admin/teachers", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ teacherId, action, days }),
    });
    const data = await response.json();
    setLoadingAction("");

    if (!response.ok) {
      setMessage(data.message ?? "操作失败");
      return;
    }

    setMessage(data.temporaryPassword ? `临时密码：${data.temporaryPassword}` : data.message);
    router.refresh();
  }

  const disabled = Boolean(loadingAction);

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <button
          className="rounded-md bg-emerald-700 px-3 py-2 text-sm font-semibold text-white disabled:bg-slate-400"
          disabled={disabled}
          onClick={() => runAction("open", 30)}
          type="button"
        >
          开通30天
        </button>
        <button
          className="rounded-md bg-slate-900 px-3 py-2 text-sm font-semibold text-white disabled:bg-slate-400"
          disabled={disabled}
          onClick={() => runAction("renew", 30)}
          type="button"
        >
          续期30天
        </button>
        <button
          className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-800 disabled:bg-slate-100"
          disabled={disabled}
          onClick={() => runAction("suspend")}
          type="button"
        >
          暂停
        </button>
        <button
          className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold disabled:bg-slate-100"
          disabled={disabled}
          onClick={() => runAction("reset-password")}
          type="button"
        >
          重置密码
        </button>
      </div>
      {message ? <p className="text-sm font-semibold text-emerald-700">{message}</p> : null}
    </div>
  );
}
