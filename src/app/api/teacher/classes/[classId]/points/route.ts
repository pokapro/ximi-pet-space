import { prisma } from "@/lib/prisma";
import { requireApiTeacher } from "@/lib/require-teacher";
import { jsonError } from "@/lib/validation";
import { recalcStudentPoints } from "@/lib/points";
import { experienceForLevel, getStageByLevel, randomPetName, moodAfterDelta } from "@/lib/pet-growth";
const getStage = getStageByLevel;

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

  const url = new URL(_request.url);
  const studentId = url.searchParams.get("studentId");
  const limit = Math.min(Number(url.searchParams.get("limit") ?? 50), 200);

  const logs = await prisma.pointLog.findMany({
    where: { classId, ...(studentId ? { studentId } : {}), revertedAt: null },
    include: {
      student: { select: { name: true } },
      rule: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return Response.json({ ok: true, logs });
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
  const studentId = String(body?.studentId ?? "");
  const points = Number(body?.points ?? 0);
  const ruleId = String(body?.ruleId ?? "").trim() || null;
  const reason = String(body?.reason ?? "").trim();
  const remark = String(body?.remark ?? "").trim() || null;

  if (!studentId || points === 0) return jsonError("请指定学生和分值");

  const student = await prisma.student.findFirst({
    where: { id: studentId, classId },
  });
  if (!student) return jsonError("学生不存在", 404);

  // 扣分时减少心情
  const moodDelta = points < 0 ? Math.max(-20, Math.floor(points / 2)) : Math.min(10, Math.floor(points / 2));

  // 创建积分流水
  const log = await prisma.pointLog.create({
    data: {
      studentId,
      classId,
      ruleId,
      operatorId: auth.user.id,
      source: "Teacher",
      points,
      reason: reason || (ruleId ? "" : points > 0 ? "老师加分" : "老师扣分"),
      moodDelta,
    },
  });

  // 更新学生积分和心情
  await prisma.student.update({
    where: { id: studentId },
    data: {
      mood: Math.max(0, Math.min(100, student.mood + moodDelta)),
    },
  });

  // 重新计算今天的积分
  const { totalPoints } = await recalcStudentPoints(studentId);

  // 先获取完整学生数据（包含之前更新后的字段）
  const updatedStudent = await prisma.student.findUnique({ where: { id: studentId } });

  // 经验值 = 总积分（积分转化为经验）
  // 检查是否应该升级
  let didLevelUp = false;
  let newLevel = updatedStudent!.level;
  let newStage = updatedStudent!.petStage;

  while (totalPoints >= experienceForLevel(newLevel)) {
    // 升一级
    newLevel++;
    const stage = getStage(newLevel);
    const newName = stage !== newStage ? randomPetName(stage) : updatedStudent!.petName;
    newStage = stage;

    await prisma.petEvolution.create({
      data: {
        studentId,
        fromLevel: newLevel - 1,
        toLevel: newLevel,
        fromStage: newStage,
        toStage: stage,
        petName: newName,
        fromPetName: updatedStudent!.petName,
      },
    });
    didLevelUp = true;
  }

  if (didLevelUp) {
    await prisma.student.update({
      where: { id: studentId },
      data: {
        level: newLevel,
        petStage: newStage,
        petName: randomPetName(newStage),
        experience: totalPoints,
      },
    });
  } else {
    await prisma.student.update({
      where: { id: studentId },
      data: { experience: totalPoints },
    });
  }

  await prisma.auditLog.create({
    data: {
      actorId: auth.user.id,
      action: "PointChange",
      targetType: "Student",
      targetId: studentId,
      detail: { points, reason, studentName: student.name },
    },
  });

  return Response.json({
    ok: true,
    log,
    student: {
      ...(await prisma.student.findUnique({ where: { id: studentId } })),
      levelUp: didLevelUp,
    },
  });
}

// 撤销最近一条积分
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ classId: string }> },
) {
  const auth = await requireApiTeacher();
  if (auth.error) return auth.error;

  const { classId } = await params;
  const body = await request.json().catch(() => null);
  const logId = String(body?.logId ?? "");

  const log = await prisma.pointLog.findFirst({
    where: { id: logId, classId },
  });
  if (!log) return jsonError("积分流水记录不存在", 404);

  // 撤销：标记已撤销，恢复心情
  await prisma.pointLog.update({
    where: { id: logId },
    data: { revertedAt: new Date() },
  });

  // 恢复心情
  const student = await prisma.student.findUnique({ where: { id: log.studentId } });
  if (student) {
    await prisma.student.update({
      where: { id: log.studentId },
      data: { mood: Math.max(0, Math.min(100, student.mood - log.moodDelta)) },
    });
  }

  await recalcStudentPoints(log.studentId);

  return Response.json({ ok: true, message: "已撤销" });
}
