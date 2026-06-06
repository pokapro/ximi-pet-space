import { prisma } from "@/lib/prisma";
import { requireApiTeacher } from "@/lib/require-teacher";
import { jsonError } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ classId: string }> },
) {
  const auth = await requireApiTeacher();
  if (auth.error) return auth.error;

  const { classId } = await params;
  const cls = await prisma.class.findFirst({
    where: { id: classId, teacherId: auth.user.id },
  });
  if (!cls) return jsonError("班级不存在", 404);

  const rules = await prisma.behaviorRule.findMany({
    where: {
      OR: [
        { classId, isActive: true },
        { classId: null, teacherId: auth.user.id, isActive: true },
      ],
    },
    orderBy: [{ category: "asc" }, { points: "desc" }],
  });

  return Response.json({ ok: true, rules });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ classId: string }> },
) {
  const auth = await requireApiTeacher();
  if (auth.error) return auth.error;

  const { classId } = await params;
  const cls = await prisma.class.findFirst({
    where: { id: classId, teacherId: auth.user.id },
  });
  if (!cls) return jsonError("班级不存在", 404);

  const body = await request.json().catch(() => null);
  const name = String(body?.name ?? "").trim();
  const points = Number(body?.points ?? 0);
  if (!name) return jsonError("请输入行为名称");

  const rule = await prisma.behaviorRule.create({
    data: {
      teacherId: auth.user.id,
      classId,
      name,
      points,
      category: points >= 0 ? "Positive" : "Negative",
      icon: body?.icon ?? "star",
      color: body?.color ?? (points >= 0 ? "#16a34a" : "#dc2626"),
    },
  });

  return Response.json({ ok: true, rule });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ classId: string }> },
) {
  const auth = await requireApiTeacher();
  if (auth.error) return auth.error;

  const { classId } = await params;
  const body = await request.json().catch(() => null);
  const ruleId = String(body?.ruleId ?? "");

  const rule = await prisma.behaviorRule.findFirst({
    where: { id: ruleId, classId, teacherId: auth.user.id },
  });
  if (!rule) return jsonError("行为规则不存在", 404);

  await prisma.behaviorRule.update({
    where: { id: ruleId },
    data: { isActive: false },
  });

  return Response.json({ ok: true, message: "规则已删除" });
}
