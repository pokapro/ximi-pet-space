"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type AuthFormProps = {
  mode: "login" | "register";
};

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    const formData = new FormData(event.currentTarget);
    const response = await fetch(`/api/auth/${mode}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(Object.fromEntries(formData)),
    });
    const data = await response.json();

    setLoading(false);
    if (!response.ok) {
      setMessage(data.message ?? "提交失败，请稍后再试");
      return;
    }

    router.push(data.redirectTo ?? "/teacher");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {mode === "register" ? (
        <label className="block">
          <span className="text-sm font-semibold text-slate-700">老师姓名</span>
          <input
            className="mt-2 w-full rounded-md border border-slate-300 bg-white px-3 py-3 outline-none focus:border-emerald-700"
            name="name"
            placeholder="例如：西米老师"
          />
        </label>
      ) : null}
      <label className="block">
        <span className="text-sm font-semibold text-slate-700">手机号</span>
        <input
          className="mt-2 w-full rounded-md border border-slate-300 bg-white px-3 py-3 outline-none focus:border-emerald-700"
          name="phone"
          inputMode="numeric"
          autoComplete="tel"
          placeholder="请输入 11 位手机号"
          required
        />
      </label>
      <label className="block">
        <span className="text-sm font-semibold text-slate-700">密码</span>
        <input
          className="mt-2 w-full rounded-md border border-slate-300 bg-white px-3 py-3 outline-none focus:border-emerald-700"
          name="password"
          type="password"
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          placeholder="至少 8 位"
          required
        />
      </label>
      {message ? <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{message}</p> : null}
      <button
        className="w-full rounded-md bg-emerald-700 px-4 py-3 font-bold text-white disabled:cursor-not-allowed disabled:bg-slate-400"
        disabled={loading}
        type="submit"
      >
        {loading ? "正在提交..." : mode === "login" ? "登录" : "提交注册"}
      </button>
    </form>
  );
}
