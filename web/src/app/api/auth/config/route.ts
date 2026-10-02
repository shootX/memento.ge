import { NextResponse } from "next/server";
import { isEmailDeliveryConfigured, isGoogleOAuthConfigured } from "@/lib/site-config";

export async function GET() {
  return NextResponse.json({
    google: isGoogleOAuthConfigured(),
    email: isEmailDeliveryConfigured(),
  });
}
