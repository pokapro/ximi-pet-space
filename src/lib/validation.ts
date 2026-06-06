export function normalizePhone(phone: string) {
  return phone.trim().replace(/\s+/g, "");
}

export function isValidChinaMobile(phone: string) {
  return /^1[3-9]\d{9}$/.test(phone);
}

export function jsonError(message: string, status = 400) {
  return Response.json({ ok: false, message }, { status });
}
