import { getUserFromSession } from "@/lib/user-session";
import {
  getUserFromBearerToken,
  parseBearerToken,
  type MobileAuthUser,
} from "@/lib/mobile-access-token";

export type AuthenticatedUser = MobileAuthUser;

/** Cookie session (web) or Bearer mobile access token. */
export async function getUserFromRequest(req: Request): Promise<AuthenticatedUser | null> {
  const bearer = parseBearerToken(req);
  if (bearer) {
    const fromBearer = await getUserFromBearerToken(bearer);
    if (fromBearer) return fromBearer;
  }
  return getUserFromSession();
}
