const GOOGLE_AUTH = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO = "https://www.googleapis.com/oauth2/v3/userinfo";

export function googleAuthUrl(state: string): string | null {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const redirect = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google/callback`;
  if (!clientId) return null;
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirect,
    response_type: "code",
    scope: "openid email profile",
    state,
    prompt: "select_account",
  });
  return `${GOOGLE_AUTH}?${params}`;
}

export async function exchangeGoogleCode(code: string) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirect = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google/callback`;
  if (!clientId || !clientSecret) throw new Error("Google OAuth not configured");

  const res = await fetch(GOOGLE_TOKEN, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirect,
      grant_type: "authorization_code",
    }),
  });
  if (!res.ok) throw new Error("Token exchange failed");
  const tokens = (await res.json()) as { access_token: string };

  const profileRes = await fetch(GOOGLE_USERINFO, {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });
  if (!profileRes.ok) throw new Error("Profile fetch failed");
  return (await profileRes.json()) as {
    sub: string;
    email: string;
    name?: string;
    picture?: string;
  };
}
