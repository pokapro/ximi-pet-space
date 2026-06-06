import { prisma } from "@/lib/prisma";
import { jsonError } from "@/lib/validation";
import { getMoodEmoji, getMoodState } from "@/lib/pet-growth";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ classCode: string }> },
) {
  const { classCode } = await params;

  const cls = await prisma.class.findUnique({
    where: { code: classCode },
    include: {
      teacher: { select: { name: true } },
      students: {
        where: { isActive: true },
        orderBy: [{ totalPoints: "desc" }, { name: "asc" }],
      },
      behaviorRules: {
        where: { isActive: true },
        select: { id: true, name: true, points: true, category: true, icon: true, color: true },
      },
    },
  });

  if (!cls) return jsonError("班级不存在", 404);

  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);

  // 获取今日积分
  const todayLogs = await prisma.pointLog.groupBy({
    by: ["studentId"],
    where: {
      classId: cls.id,
      revertedAt: null,
      createdAt: { gte: todayStart, lt: todayEnd },
    },
    _sum: { points: true },
  });

  const todayPointsMap: Record<string, number> = {};
  for (const log of todayLogs) {
    todayPointsMap[log.studentId] = log._sum.points ?? 0;
  }

  const students = cls.students.map((s) => ({
    ...s,
    todayPoints: todayPointsMap[s.id] ?? 0,
    moodEmoji: getMoodEmoji(s.mood),
    moodState: getMoodState(s.mood),
  }));

  const classTotalToday = Object.values(todayPointsMap).reduce((a, b) => a + b, 0);
  const classTotalPoints = cls.students.reduce((a, s) => a + s.totalPoints, 0);
  const avgLevel = cls.students.length > 0
    ? Math.round(cls.students.reduce((a, s) => a + s.level, 0) / cls.students.length)
    : 1;

  return Response.json({
    ok: true,
    class: {
      id: cls.id,
      name: cls.name,
      code: cls.code,
      teacherName: cls.teacher.name,
      schoolName: null,
      studentCount: cls.students.length,
      classTotalToday,
      classTotalPoints,
      avgLevel,
    },
    students,
    rules: cls.behaviorRules,
  });
}
