import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { jsonError } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user || (user.role !== "SuperAdmin" && user.role !== "Admin")) {
    return jsonError("没有管理员权限", 403);
  }

  const url = new URL(request.url);
  const limit = Math.min(Number(url.searchParams.get("limit") ?? 100), 500);
  const action = url.searchParams.get("action") as string | null;

  let logs: Record<string, unknown>[];
  if (action) {
    logs = await prisma.$queryRawUnsafe<Record<string, unknown>[]>(
      `SELECT al.*, u.name as "actorName", u.role as "actorRole"
       FROM "AuditLog" al
       LEFT JOIN "User" u ON u.id = al."actorId"
       WHERE al.action = $1
       ORDER BY al."createdAt" DESC
       LIMIT $2`,
      action, limit
    );
  } else {
    logs = await prisma.$queryRawUnsafe<Record<string, unknown>[]>(
      `SELECT al.*, u.name as "actorName", u.role as "actorRole"
       FROM "AuditLog" al
       LEFT JOIN "User" u ON u.id = al."actorId"
       ORDER BY al."createdAt" DESC
       LIMIT $1`,
      limit
    );
  }

  return Response.json({ ok: true, logs });
}
