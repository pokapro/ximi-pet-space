import { prisma } from "@/lib/prisma";
import { requireApiTeacher } from "@/lib/require-teacher";
import { jsonError } from "@/lib/validation";
import { recalcStudentPoints } from "@/lib/points";
import { randomBytes } from "crypto";
import { randomPetName, getStageByLevel } from "@/lib/pet-growth";

export const dynamic = "force-dynamic";

function generateStudentCode(): string {
  return randomBytes(5).toString("base64url").slice(0, 8);
}

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

  const students = await prisma.student.findMany({
    where: { classId, isActive: true },
    orderBy: [{ totalPoints: "desc" }, { name: "asc" }],
  });

  return Response.json({ ok: true, students });
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
  if (!name) return jsonError("请输入学生姓名");

  const seatNo = String(body?.seatNo ?? "").trim() || undefined;

  const student = await prisma.student.create({
    data: {
      classId,
      name,
      seatNo,
      code: generateStudentCode(),
      petName: randomPetName("Egg"),
    },
  });

  await prisma.auditLog.create({
    data: {
      actorId: auth.user.id,
      action: "CreateStudent",
      targetType: "Student",
      targetId: student.id,
      detail: { className: cls.name, studentName: name },
    },
  });

  return Response.json({ ok: true, student });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ classId: string }> },
) {
  const auth = await requireApiTeacher();
  if (auth.error) return auth.error;

  const { classId } = await params;
  const body = await request.json().catch(() => null);
  const studentId = String(body?.studentId ?? "");
  const name = String(body?.name ?? "").trim();

  const student = await prisma.student.findFirst({
    where: { id: studentId, classId, class: { teacherId: auth.user.id } },
  });
  if (!student) return jsonError("学生不存在", 404);

  const update: Record<string, unknown> = {};
  if (name) update.name = name;
  if (body?.seatNo !== undefined) update.seatNo = String(body.seatNo).trim() || null;

  const updated = await prisma.student.update({
    where: { id: studentId },
    data: update,
  });

  return Response.json({ ok: true, student: updated });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ classId: string }> },
) {
  const auth = await requireApiTeacher();
  if (auth.error) return auth.error;

  const { classId } = await params;
  const body = await request.json().catch(() => null);
  const studentId = String(body?.studentId ?? "");

  const student = await prisma.student.findFirst({
    where: { id: studentId, classId, class: { teacherId: auth.user.id } },
  });
  if (!student) return jsonError("学生不存在", 404);

  await prisma.student.update({
    where: { id: studentId },
    data: { isActive: false },
  });

  return Response.json({ ok: true, message: "学生已删除" });
}

// 批量导入学生
export async function PUT(
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
  const names: string[] = body?.names ?? [];
  if (!Array.isArray(names) || names.length === 0) return jsonError("请提供学生名单");

  const students = await prisma.$transaction(
    names.map((n) =>
      prisma.student.create({
        data: {
          classId,
          name: String(n).trim(),
          code: generateStudentCode(),
          petName: randomPetName("Egg"),
        },
      })
    )
  );

  await prisma.auditLog.create({
    data: {
      actorId: auth.user.id,
      action: "CreateStudent",
      targetType: "Student",
      detail: { className: cls.name, count: students.length },
    },
  });

  return Response.json({ ok: true, count: students.length, students });
}
