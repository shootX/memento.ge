import { NextResponse } from "next/server";
import { z } from "zod";
import { getEventByHostToken } from "@/lib/auth";
import { authorizeHostMutation } from "@/lib/host-request-auth";
import { jsonError, handleApiError } from "@/lib/api-utils";
import { maskEmail, redactSensitiveText, safeLogInfo } from "@/lib/safe-log";
import { queueEmail } from "@/lib/email";
import { appUrl, isEmailDeliveryConfigured } from "@/lib/site-config";
import { shouldExposeDevMagicLink } from "@/lib/dev-magic-link";

type Params = { params: Promise<{ token: string }> };

const schema = z.object({ email: z.string().email().max(200) });

export async function POST(req: Request, { params }: Params) {
  try {
    const { token } = await params;
    const auth = await authorizeHostMutation(req, token);
    if (!auth.ok) return jsonError(403, "Forbidden");
    const event = auth.event;

    const { email } = schema.parse(await req.json());
    const hostUrl = `${appUrl()}/host/${token}`;

    if (!isEmailDeliveryConfigured()) {
      safeLogInfo("[host-link-email]", maskEmail(email), redactSensitiveText(hostUrl));
      return NextResponse.json({
        ok: true,
        queued: false,
        warning: "ელფოსტა არ არის კონფიგურირებული.",
        devLink: shouldExposeDevMagicLink() ? hostUrl : undefined,
      });
    }

    await queueEmail(email, "host_link", {
      coupleNames: event.coupleNames,
      hostUrl,
    });

    return NextResponse.json({ ok: true, queued: true });
  } catch (e) {
    return handleApiError(e);
  }
}
