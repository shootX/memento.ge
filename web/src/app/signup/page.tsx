import { AuthEmailForm } from "@/components/auth-email-form";
import { oauthProviderFlags } from "@/lib/site-config";

export default function SignupPage() {
  return <AuthEmailForm mode="signup" oauthProviders={oauthProviderFlags()} />;
}
