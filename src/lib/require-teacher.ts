import { getCurrentUser } from "./session";
import { evaluateTeacherAccess } from "./access";
import { jsonError } from "./validation";

export async function requireApiTeacher() {
  const user = await getCurrentUser();
  if (!user) {
    return { error: jsonError("请先登录", 401) };
  }

  if (user.role !== "Teacher") {
    return { error: jsonError("没有老师权限", 403) };
  }

  const access = evaluateTeacherAccess({
    role: user.role,
    status: user.status,
    expiresAt: user.subscription?.expiresAt,
  });

  if (!access.allowed) {
    return { error: jsonError(access.reason === "Pending" ? "账号正在等待开通" : "账号已到期或已暂停", 403) };
  }

  return { user, error: null };
}
