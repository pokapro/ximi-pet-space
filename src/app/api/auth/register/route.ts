import { prisma } from "@/lib/prisma";
import { hashPassword, validatePassword } from "@/lib/password";
import { isValidChinaMobile, jsonError, normalizePhone } from "@/lib/validation";
import { signSession, setSessionCookie } from "@/lib/session";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const phone = normalizePhone(String(body?.phone ?? ""));
  const password = String(body?.password ?? "");
  const name = String(body?.name ?? "").trim() || "新老师";

  if (!isValidChinaMobile(phone)) {
    return jsonError("请输入有效的 11 位手机号");
  }

  if (!validatePassword(password)) {
    return jsonError("密码至少需要 8 位");
  }

  const existed = await prisma.user.findUnique({ where: { phone } });
  if (existed) {
    return jsonError("这个手机号已经注册，请直接登录", 409);
  }

  const user = await prisma.user.create({
    data: {
      phone,
      name,
      passwordHash: await hashPassword(password),
      role: "Teacher",
      status: "Pending",
      subscription: {
        create: {
          status: "Pending",
          note: "老师自助注册，等待管理员开通",
        },
      },
      auditLogs: {
        create: {
          action: "Register",
          targetType: "User",
          detail: { phone },
        },
      },
    },
  });

  const token = await signSession({ userId: user.id, role: user.role });
  const response = NextResponse.json({
    ok: true,
    message: "注册成功，账号正在等待管理员开通",
    redirectTo: "/teacher",
  });
  setSessionCookie(response, token);

  return response;
}
