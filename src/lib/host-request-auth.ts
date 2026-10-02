import { getEventByHostToken } from "@/lib/auth";
import { e2eRequestAuthorized } from "@/lib/e2e-bypass";
import { verifyHostCsrf } from "@/lib/session";
import { requireEventOwner } from "@/lib/user-session";
import { getUserFromBearerToken, parseBearerToken } from "@/lib/mobile-access-token";
import type { Event } from "@/generated/prisma/client";

function parseHostTokenAuth(req: Request, expectedHostToken: string): boolean {
  const header = req.headers.get("authorization");
  if (!header) return false;
  const m = /^HostToken\s+(\S+)\s*$/i.exec(header);
  return m?.[1] === expectedHostToken;
}

export async function authorizeHostMutation(
  req: Request,
  hostToken: string,
): Promise<{ ok: true; event: Event } | { ok: false }> {
  const event = await getEventByHostToken(hostToken);
  if (!event) return { ok: false };

  if (e2eRequestAuthorized(req)) return { ok: true, event };

  if (parseHostTokenAuth(req, hostToken)) return { ok: true, event };

  const bearer = parseBearerToken(req);
  if (bearer) {
    const user = await getUserFromBearerToken(bearer);
    if (user) {
      const owned = await requireEventOwner(event.id, user.id);
      if (owned) return { ok: true, event };
    }
  }

  if (await verifyHostCsrf(hostToken, req.headers.get("x-csrf-token"))) {
    return { ok: true, event };
  }

  return { ok: false };
}
