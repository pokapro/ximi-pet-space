export type UserRole = "SuperAdmin" | "Admin" | "Teacher" | "Student" | "PublicViewer";
export type UserStatus = "Pending" | "Active" | "Suspended" | "Expired";
export type TeacherAccessReason = "Active" | "Pending" | "Suspended" | "Expired" | "Forbidden";

type TeacherAccessInput = {
  role: UserRole;
  status: UserStatus;
  expiresAt?: Date | null;
  now?: Date;
};

export function evaluateTeacherAccess({
  role,
  status,
  expiresAt,
  now = new Date(),
}: TeacherAccessInput): { allowed: boolean; reason: TeacherAccessReason } {
  if (role !== "Teacher") {
    return { allowed: false, reason: "Forbidden" };
  }

  if (status === "Pending") {
    return { allowed: false, reason: "Pending" };
  }

  if (status === "Suspended") {
    return { allowed: false, reason: "Suspended" };
  }

  if (status === "Expired" || (expiresAt && expiresAt.getTime() <= now.getTime())) {
    return { allowed: false, reason: "Expired" };
  }

  return { allowed: true, reason: "Active" };
}

export function teacherAccessMessage(reason: TeacherAccessReason) {
  const messages: Record<TeacherAccessReason, string> = {
    Active: "账号可正常使用",
    Pending: "账号正在等待管理员开通",
    Suspended: "账号已暂停，请联系管理员",
    Expired: "账号使用期限已到期，请联系管理员续期",
    Forbidden: "当前账号无权访问教师功能",
  };

  return messages[reason];
}
