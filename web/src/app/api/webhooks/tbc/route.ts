import { handleTbcPaymentCallback } from "@/lib/billing/tbc-callback-handler";

export async function POST(req: Request) {
  return handleTbcPaymentCallback(req);
}
