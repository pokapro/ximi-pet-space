import { clearSessionCookie } from "@/lib/session";
import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json({ ok: true, redirectTo: "/login" });
  clearSessionCookie(response);
  return response;
}
