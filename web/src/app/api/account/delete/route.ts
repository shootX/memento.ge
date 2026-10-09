import { NextResponse } from "next/server";
import { getUserFromSession, clearUserCookie } from "@/lib/user-session";
import { deleteUserAccount } from "@/lib/account-deletion";
import { z } from "zod";

const schema = z.object({ confirm: z.literal(true) });

export async function POST(req: Request) {
  const user = await getUserFromSession();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  let body: z.infer<typeof schema>;
  try {
    body = schema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "confirm required" }, { status: 400 });
  }
  if (!body.confirm) {
    return NextResponse.json({ error: "confirm required" }, { status: 400 });
  }
  await deleteUserAccount(user.id);
  await clearUserCookie();
  return NextResponse.json({ ok: true });
}
