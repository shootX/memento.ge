import { NextResponse } from "next/server";
import { z } from "zod";
import { getEventByHostToken } from "@/lib/auth";
import { verifyHostCsrf } from "@/lib/session";
import { jsonError } from "@/lib/api-utils";
import { queueEmail } from "@/lib/email";
import { appUrl, isEmailDeliveryConfigured } from "@/lib/site-config";

type Params = { params: Promise<{ token: string }> };

const schema = z.object({ email: z.string().email().max(200) });

export async function POST(req: Request, { params }: Params) {
  const { token } = await params;
  if (!(await verifyHostCsrf(token, req.headers.get("x-csrf-token")))) {
    return jsonError(403, "Forbidden");
  }
  const event = await getEventByHostToken(token);
  if (!event) return jsonError(404, "Not found");

  const { email } = schema.parse(await req.json());
  const hostUrl = `${appUrl()}/host/${token}`;

  if (!isEmailDeliveryConfigured()) {
    console.info("[host-link-email]", email, hostUrl);
    return NextResponse.json({
      ok: true,
      queued: false,
      warning: "ელფოსტა არ არის კონფიგურირებული — ლინკი ლოგშია.",
      devLink: hostUrl,
    });
  }

  await queueEmail(email, "host_link", {
    coupleNames: event.coupleNames,
    hostUrl,
  });

  return NextResponse.json({ ok: true, queued: true });
}
