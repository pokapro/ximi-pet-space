import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { jsonError } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || (user.role !== "SuperAdmin" && user.role !== "Admin")) {
    return jsonError("没有管理员权限", 403);
  }

  const [teacherCount, classCount, studentCount, pointCount, expiringSoon, todayActions] = await Promise.all([
    prisma.user.count({ where: { role: "Teacher" } }),
    prisma.class.count({ where: { isActive: true } }),
    prisma.student.count({ where: { isActive: true } }),
    prisma.pointLog.count(),
    prisma.user.count({
      where: {
        role: "Teacher",
        status: "Active",
        subscription: {
          expiresAt: {
            lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            gte: new Date(),
          },
        },
      },
    }),
    prisma.auditLog.count({
      where: {
        createdAt: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
        },
      },
    }),
  ]);

  return Response.json({
    ok: true,
    stats: {
      teacherCount,
      classCount,
      studentCount,
      pointCount,
      expiringSoon,
      todayActions,
    },
  });
}
