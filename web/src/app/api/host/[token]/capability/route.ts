import { NextResponse } from "next/server";
import { authorizeHostMutation } from "@/lib/host-request-auth";
import { jsonError } from "@/lib/api-utils";
import {
  revokeHostCapability,
  rotateHostCapabilityToken,
} from "@/lib/host-token";
import { appUrl } from "@/lib/site-config";
import { z } from "zod";

type Params = { params: Promise<{ token: string }> };

const bodySchema = z.object({
  action: z.enum(["rotate", "revoke"]),
});

export async function POST(req: Request, { params }: Params) {
  const { token } = await params;
  const auth = await authorizeHostMutation(req, token);
  if (!auth.ok) return jsonError(403, "Invalid CSRF");
  const event = auth.event;

  let body: z.infer<typeof bodySchema>;
  try {
    body = bodySchema.parse(await req.json());
  } catch {
    return jsonError(400, "Invalid body");
  }

  if (body.action === "revoke") {
    await revokeHostCapability(event.id);
    return NextResponse.json({ ok: true, revoked: true });
  }

  const newToken = await rotateHostCapabilityToken(event.id);
  const base = appUrl();
  return NextResponse.json({
    ok: true,
    hostToken: newToken,
    hostUrl: `${base}/host/${newToken}`,
  });
}
