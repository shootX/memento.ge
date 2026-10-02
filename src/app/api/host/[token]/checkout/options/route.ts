import { NextResponse } from "next/server";
import { getEventByHostToken } from "@/lib/auth";
import { jsonError } from "@/lib/api-utils";
import { listPaymentProviderOptions } from "@/lib/billing/payment-providers";
import { paymentMockEnabled } from "@/lib/billing/payment-mock";
import { manualPayConfigured } from "@/lib/site-config";

type Params = { params: Promise<{ token: string }> };

export async function GET(_req: Request, { params }: Params) {
  const { token } = await params;
  const event = await getEventByHostToken(token);
  if (!event) return jsonError(404, "Not found");

  return NextResponse.json({
    providers: listPaymentProviderOptions(),
    manualPay: manualPayConfigured(),
    mock: paymentMockEnabled(),
  });
}
