import { prisma } from "@/lib/prisma";
import { requireApiTeacher } from "@/lib/require-teacher";
import { jsonError, normalizePhone } from "@/lib/validation";
import { randomBytes } from "crypto";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireApiTeacher();
  if (auth.error) return auth.error;

  const classes = await prisma.class.findMany({
    where: { teacherId: auth.user.id, isActive: true },
    include: { _count: { select: { students: true } } },
    orderBy: { createdAt: "desc" },
  });

  return Response.json({ ok: true, classes });
}

function generateClassCode(): string {
  return randomBytes(4).toString("hex").slice(0, 8);
}

export async function POST(request: Request) {
  const auth = await requireApiTeacher();
  if (auth.error) return auth.error;

  const body = await request.json().catch(() => null);
  const name = String(body?.name ?? "").trim();
  if (!name) return jsonError("请输入班级名称");

  const cls = await prisma.class.create({
    data: {
      teacherId: auth.user.id,
      name,
      code: generateClassCode(),
    },
  });

  await prisma.auditLog.create({
    data: {
      actorId: auth.user.id,
      action: "CreateClass",
      targetType: "Class",
      targetId: cls.id,
      detail: { name },
    },
  });

  return Response.json({ ok: true, class: cls });
}

export async function PATCH(request: Request) {
  const auth = await requireApiTeacher();
  if (auth.error) return auth.error;

  const body = await request.json().catch(() => null);
  const classId = String(body?.classId ?? "");
  const name = String(body?.name ?? "").trim();

  const cls = await prisma.class.findFirst({
    where: { id: classId, teacherId: auth.user.id },
  });
  if (!cls) return jsonError("班级不存在", 404);
  if (!name) return jsonError("请输入班级名称");

  const updated = await prisma.class.update({
    where: { id: classId },
    data: { name },
  });

  return Response.json({ ok: true, class: updated });
}

export async function DELETE(request: Request) {
  const auth = await requireApiTeacher();
  if (auth.error) return auth.error;

  const body = await request.json().catch(() => null);
  const classId = String(body?.classId ?? "");

  const cls = await prisma.class.findFirst({
    where: { id: classId, teacherId: auth.user.id },
  });
  if (!cls) return jsonError("班级不存在", 404);

  await prisma.class.update({
    where: { id: classId },
    data: { isActive: false },
  });

  return Response.json({ ok: true, message: "班级已删除" });
}
