import { handleBogPaymentCallback } from "@/lib/billing/bog-callback-handler";
import { logBogDeprecatedCallbackPath } from "@/lib/bog-callback-deprecation";

/** Legacy callback path — canonical: `/api/payments/bog/callback`. */
export async function POST(req: Request) {
  logBogDeprecatedCallbackPath();
  return handleBogPaymentCallback(req);
}
