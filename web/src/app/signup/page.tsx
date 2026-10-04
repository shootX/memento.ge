import { AuthPasswordForm } from "@/components/auth-password-form";
import { isEmailDeliveryConfigured, oauthProviderFlags } from "@/lib/site-config";

export default function SignupPage() {
  return (
    <AuthPasswordForm
      mode="signup"
      oauthProviders={oauthProviderFlags()}
      magicLinkEnabled={false}
    />
  );
}
