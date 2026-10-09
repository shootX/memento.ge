import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { statObject } from "@/lib/storage";

export const dynamic = "force-dynamic";

export async function GET() {
  const checks: Record<string, boolean> = { db: false, storage: false, queue: true };
  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.db = true;
  } catch {
    checks.db = false;
  }
  try {
    const probe = process.env.READINESS_STORAGE_PROBE_KEY?.trim();
    if (probe) {
      await statObject(probe);
      checks.storage = true;
    } else {
      checks.storage = true;
    }
  } catch {
    checks.storage = false;
  }
  const ok = checks.db && checks.storage;
  return NextResponse.json({ ok, checks }, { status: ok ? 200 : 503 });
}
