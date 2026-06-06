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

  const logs = await prisma.auditLog.findMany({
    ...(action ? { where: { action: action as any } } : {}),
    include: { actor: { select: { name: true, role: true } } },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return Response.json({ ok: true, logs });
}
