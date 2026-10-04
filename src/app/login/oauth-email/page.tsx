import { Suspense } from "react";
import OAuthEmailClient from "./oauth-email-client";

export default function OAuthEmailPage() {
  return (
    <Suspense fallback={null}>
      <OAuthEmailClient />
    </Suspense>
  );
}
