import { prisma } from "@/lib/prisma";
import { jsonError } from "@/lib/validation";
import { getMoodEmoji, getMoodState, STAGE_NAMES } from "@/lib/pet-growth";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ studentCode: string }> },
) {
  const { studentCode } = await params;

  const student = await prisma.student.findUnique({
    where: { code: studentCode },
    include: {
      class: {
        include: {
          teacher: { select: { name: true } },
        },
      },
      evolutions: { orderBy: { createdAt: "desc" } },
      interactions: { orderBy: { createdAt: "desc" }, take: 10 },
    },
  });

  if (!student || !student.isActive) return jsonError("学生不存在", 404);

  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);

  const todayLogs = await prisma.pointLog.findMany({
    where: {
      studentId: student.id,
      revertedAt: null,
      createdAt: { gte: todayStart, lt: todayEnd },
    },
    include: { rule: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });

  const recentLogs = await prisma.pointLog.findMany({
    where: { studentId: student.id, revertedAt: null },
    include: { rule: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
    take: 30,
  });

  return Response.json({
    ok: true,
    student: {
      ...student,
      moodEmoji: getMoodEmoji(student.mood),
      moodState: getMoodState(student.mood),
      stageName: STAGE_NAMES[student.petStage],
      className: student.class.name,
      teacherName: student.class.teacher.name,
      schoolName: null,
    },
    todayLogs,
    recentLogs,
    evolutions: student.evolutions,
  });
}
