import { prisma } from "./prisma";

export function todayRange(): { start: Date; end: Date } {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  return { start, end };
}

export async function recalcStudentPoints(studentId: string) {
  const { start } = todayRange();
  const todayEnd = new Date(start.getTime() + 24 * 60 * 60 * 1000);

  const [totalResult, todayResult] = await Promise.all([
    prisma.pointLog.aggregate({
      where: { studentId, revertedAt: null },
      _sum: { points: true },
    }),
    prisma.pointLog.aggregate({
      where: {
        studentId,
        revertedAt: null,
        createdAt: { gte: start, lt: todayEnd },
      },
      _sum: { points: true },
    }),
  ]);

  const totalPoints = totalResult._sum.points ?? 0;
  const todayPoints = todayResult._sum.points ?? 0;

  await prisma.student.update({
    where: { id: studentId },
    data: { totalPoints, todayPoints },
  });

  return { totalPoints, todayPoints };
}
