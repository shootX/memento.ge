import { NextResponse } from "next/server";
import {
  isAppleOAuthConfigured,
  isEmailDeliveryConfigured,
  isFacebookOAuthConfigured,
  isGoogleOAuthConfigured,
} from "@/lib/site-config";

export async function GET() {
  return NextResponse.json({
    google: isGoogleOAuthConfigured(),
    facebook: isFacebookOAuthConfigured(),
    apple: isAppleOAuthConfigured(),
    email: isEmailDeliveryConfigured(),
    magicLink: isEmailDeliveryConfigured(),
  });
}
