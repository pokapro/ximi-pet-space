import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/password";
import { isValidChinaMobile, jsonError, normalizePhone } from "@/lib/validation";
import { signSession, setSessionCookie } from "@/lib/session";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const phone = normalizePhone(String(body?.phone ?? ""));
  const password = String(body?.password ?? "");

  if (!isValidChinaMobile(phone) || !password) {
    return jsonError("手机号或密码不正确", 401);
  }

  const user = await prisma.user.findUnique({ where: { phone } });
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return jsonError("手机号或密码不正确", 401);
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      lastLoginAt: new Date(),
      auditLogs: {
        create: {
          action: "Login",
          targetType: "User",
          targetId: user.id,
          detail: { phone },
        },
      },
    },
  });

  const token = await signSession({ userId: user.id, role: user.role });
  const redirectTo = user.role === "SuperAdmin" || user.role === "Admin" ? "/admin" : "/teacher";
  const response = NextResponse.json({ ok: true, redirectTo });
  setSessionCookie(response, token);

  return response;
}
