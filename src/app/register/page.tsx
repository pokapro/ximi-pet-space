import Link from "next/link";
import { AuthForm } from "@/components/auth-form";

export default function RegisterPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f7f6f2] px-6 py-10">
      <section className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold text-emerald-700">西米老师的宠物空间</p>
        <h1 className="mt-2 text-3xl font-black text-slate-900">老师注册</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          注册后默认为老师账号，状态为待开通。管理员开通并设置使用期限后才能进入教师功能。
        </p>
        <div className="mt-8">
          <AuthForm mode="register" />
        </div>
        <p className="mt-6 text-center text-sm text-slate-600">
          已经有账号？
          <Link className="font-semibold text-emerald-700" href="/login">
            去登录
          </Link>
        </p>
      </section>
    </main>
  );
}
