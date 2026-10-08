import { NextResponse } from "next/server";
import { getAdminDatabaseSnapshot } from "@/lib/admin-database-explorer";
import { getAdminTokenFromCookies, validateAdminSession } from "@/lib/session";
import { jsonError } from "@/lib/api-utils";

export async function GET() {
  const token = await getAdminTokenFromCookies();
  if (!(await validateAdminSession(token))) {
    return jsonError(401, "Unauthorized");
  }
  const snapshot = await getAdminDatabaseSnapshot();
  return NextResponse.json(snapshot);
}
