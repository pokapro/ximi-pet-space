import Link from "next/link";
import { AuthForm } from "@/components/auth-form";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f7f6f2] px-6 py-10">
      <section className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold text-emerald-700">西米老师的宠物空间</p>
        <h1 className="mt-2 text-3xl font-black text-slate-900">账号登录</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">老师和管理员都使用手机号登录。</p>
        <div className="mt-8">
          <AuthForm mode="login" />
        </div>
        <p className="mt-6 text-center text-sm text-slate-600">
          还没有账号？
          <Link className="font-semibold text-emerald-700" href="/register">
            去注册
          </Link>
        </p>
      </section>
    </main>
  );
}
