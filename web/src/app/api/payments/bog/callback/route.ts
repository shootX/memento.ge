import { handleBogPaymentCallback } from "@/lib/billing/bog-callback-handler";

export async function POST(req: Request) {
  return handleBogPaymentCallback(req);
}
