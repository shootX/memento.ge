import { AuthPasswordForm } from "@/components/auth-password-form";
import { isEmailDeliveryConfigured, oauthProviderFlags } from "@/lib/site-config";

export default function LoginPage() {
  return (
    <AuthPasswordForm
      mode="login"
      oauthProviders={oauthProviderFlags()}
      magicLinkEnabled={isEmailDeliveryConfigured()}
    />
  );
}
