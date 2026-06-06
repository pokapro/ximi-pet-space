import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { jsonError } from "@/lib/validation";
import { moodAfterDelta, getStageByLevel, INTERACTION_MODIFIERS } from "@/lib/pet-growth";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ studentId: string }> },
) {
  const { studentId } = await params;

  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: { class: { select: { teacherId: true } } },
  });
  if (!student) return jsonError("学生不存在", 404);

  const interactions = await prisma.petInteraction.findMany({
    where: { studentId },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return Response.json({ ok: true, interactions });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ studentId: string }> },
) {
  const { studentId } = await params;

  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: { class: { select: { teacherId: true } } },
  });
  if (!student) return jsonError("学生不存在", 404);

  const body = await request.json().catch(() => null);
  const type = String(body?.type ?? "Pat");
  const validTypes = ["Pat", "Feed", "Greet", "Encourage"];

  if (!validTypes.includes(type)) return jsonError("不支持的互动类型");

  const moodDelta = INTERACTION_MODIFIERS[type] ?? 1;

  const interaction = await prisma.petInteraction.create({
    data: {
      studentId,
      type: type as "Pat" | "Feed" | "Greet" | "Encourage",
      moodDelta,
    },
  });

  await prisma.student.update({
    where: { id: studentId },
    data: {
      mood: moodAfterDelta(student.mood, moodDelta),
    },
  });

  return Response.json({ ok: true, interaction });
}
