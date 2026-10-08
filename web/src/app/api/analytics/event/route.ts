import { NextResponse } from "next/server";
import { recordAnalyticsEvent } from "@/lib/analytics";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(1).max(40),
  payload: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).optional(),
});

export async function POST(req: Request) {
  let body: z.infer<typeof schema>;
  try {
    body = schema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }
  await recordAnalyticsEvent(body.name, body.payload ?? {});
  return NextResponse.json({ ok: true });
}
