import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { jsonError } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || (user.role !== "SuperAdmin" && user.role !== "Admin")) {
    return jsonError("没有管理员权限", 403);
  }

  const settings = await prisma.systemSetting.findMany();

  const result: Record<string, unknown> = {};
  for (const s of settings) {
    result[s.key] = s.value;
  }

  return Response.json({ ok: true, settings: result });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user || (user.role !== "SuperAdmin" && user.role !== "Admin")) {
    return jsonError("没有管理员权限", 403);
  }

  const body = await request.json().catch(() => null);
  const key = String(body?.key ?? "").trim();
  if (!key) return jsonError("请输入配置键");

  const setting = await prisma.systemSetting.upsert({
    where: { key },
    create: { key, value: body?.value ?? null, updatedById: user.id },
    update: { value: body?.value ?? null, updatedById: user.id },
  });

  return Response.json({ ok: true, setting });
}
