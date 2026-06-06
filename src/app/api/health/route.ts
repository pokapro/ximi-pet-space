import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const start = Date.now();
  const checks: Record<string, string> = {};
  let allOk = true;

  // 1. 环境变量检查
  checks.env = process.env.DATABASE_URL ? "✓" : "✗";

  // 2. 数据库连接检查
  try {
    const result = await prisma.$queryRaw`SELECT 1 as ok`;
    checks.database = "✓";
  } catch (e: unknown) {
    checks.database = `✗ ${e instanceof Error ? e.message : "unknown"}`;
    allOk = false;
  }

  // 3. 用户表可读性检查
  try {
    const count = await prisma.user.count();
    checks.user_table = `✓ (${count} users)`;
  } catch (e: unknown) {
    checks.user_table = `✗ ${e instanceof Error ? e.message : "unknown"}`;
    allOk = false;
  }

  const duration = Date.now() - start;

  return NextResponse.json(
    {
      status: allOk ? "healthy" : "degraded",
      duration: `${duration}ms`,
      timestamp: new Date().toISOString(),
      checks,
    },
    { status: allOk ? 200 : 503 }
  );
}
