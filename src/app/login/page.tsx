import { AuthEmailForm } from "@/components/auth-email-form";
import { oauthProviderFlags } from "@/lib/site-config";

export default function LoginPage() {
  return <AuthEmailForm mode="login" oauthProviders={oauthProviderFlags()} />;
}
