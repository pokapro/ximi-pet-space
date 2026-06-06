import { prisma } from "@/lib/prisma";
import { createTemporaryPassword, hashPassword } from "@/lib/password";
import { getCurrentUser } from "@/lib/session";
import { jsonError } from "@/lib/validation";

async function requireApiAdmin() {
  const user = await getCurrentUser();
  if (!user || (user.role !== "SuperAdmin" && user.role !== "Admin")) {
    return null;
  }

  return user;
}

export async function GET() {
  const admin = await requireApiAdmin();
  if (!admin) {
    return jsonError("没有管理员权限", 403);
  }

  const teachers = await prisma.user.findMany({
    where: { role: "Teacher" },
    include: {
      subscription: true,
      _count: { select: { classes: true } },
    },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
  });

  return Response.json({
    ok: true,
    teachers: teachers.map((teacher) => ({
      id: teacher.id,
      phone: teacher.phone,
      name: teacher.name,
      status: teacher.status,
      expiresAt: teacher.subscription?.expiresAt ?? null,
      subscriptionStatus: teacher.subscription?.status ?? "Pending",
      classCount: teacher._count.classes,
      createdAt: teacher.createdAt,
      lastLoginAt: teacher.lastLoginAt,
    })),
  });
}

export async function PATCH(request: Request) {
  const admin = await requireApiAdmin();
  if (!admin) {
    return jsonError("没有管理员权限", 403);
  }

  const body = await request.json().catch(() => null);
  const teacherId = String(body?.teacherId ?? "");
  const action = String(body?.action ?? "");

  const teacher = await prisma.user.findUnique({
    where: { id: teacherId },
    include: { subscription: true },
  });

  if (!teacher || teacher.role !== "Teacher") {
    return jsonError("老师账号不存在", 404);
  }

  if (action === "open") {
    const days = Number(body?.days ?? 30);
    const expiresAt = new Date(Date.now() + Math.max(days, 1) * 24 * 60 * 60 * 1000);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: teacher.id },
        data: {
          status: "Active",
          subscription: {
            upsert: {
              create: { status: "Active", startsAt: new Date(), expiresAt },
              update: { status: "Active", startsAt: teacher.subscription?.startsAt ?? new Date(), expiresAt },
            },
          },
        },
      }),
      prisma.auditLog.create({
        data: {
          actorId: admin.id,
          action: "OpenTeacher",
          targetType: "User",
          targetId: teacher.id,
          detail: { days, expiresAt: expiresAt.toISOString() },
        },
      }),
    ]);

    return Response.json({ ok: true, message: "老师账号已开通" });
  }

  if (action === "suspend") {
    await prisma.$transaction([
      prisma.user.update({
        where: { id: teacher.id },
        data: {
          status: "Suspended",
          subscription: {
            upsert: {
              create: { status: "Suspended" },
              update: { status: "Suspended" },
            },
          },
        },
      }),
      prisma.auditLog.create({
        data: {
          actorId: admin.id,
          action: "SuspendTeacher",
          targetType: "User",
          targetId: teacher.id,
        },
      }),
    ]);

    return Response.json({ ok: true, message: "老师账号已暂停" });
  }

  if (action === "renew") {
    const days = Number(body?.days ?? 30);
    const base = teacher.subscription?.expiresAt && teacher.subscription.expiresAt > new Date()
      ? teacher.subscription.expiresAt
      : new Date();
    const expiresAt = new Date(base.getTime() + Math.max(days, 1) * 24 * 60 * 60 * 1000);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: teacher.id },
        data: {
          status: "Active",
          subscription: {
            upsert: {
              create: { status: "Active", startsAt: new Date(), expiresAt },
              update: { status: "Active", expiresAt },
            },
          },
        },
      }),
      prisma.auditLog.create({
        data: {
          actorId: admin.id,
          action: "RenewTeacher",
          targetType: "User",
          targetId: teacher.id,
          detail: { days, expiresAt: expiresAt.toISOString() },
        },
      }),
    ]);

    return Response.json({ ok: true, message: "老师账号已续期" });
  }

  if (action === "reset-password") {
    const temporaryPassword = createTemporaryPassword();
    await prisma.$transaction([
      prisma.user.update({
        where: { id: teacher.id },
        data: {
          passwordHash: await hashPassword(temporaryPassword),
        },
      }),
      prisma.auditLog.create({
        data: {
          actorId: admin.id,
          action: "ResetPassword",
          targetType: "User",
          targetId: teacher.id,
        },
      }),
    ]);

    return Response.json({ ok: true, message: "密码已重置", temporaryPassword });
  }

  return jsonError("不支持的管理员操作");
}
