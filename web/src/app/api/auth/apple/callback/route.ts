import { handleOAuthCallback } from "@/lib/oauth/callback-handler";

export async function POST(req: Request) {
  const form = await req.formData();
  return handleOAuthCallback("apple", req, {
    code: form.get("code")?.toString() ?? null,
    state: form.get("state")?.toString() ?? null,
    error: form.get("error")?.toString() ?? null,
    userJson: form.get("user")?.toString() ?? null,
  });
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  return handleOAuthCallback("apple", req, {
    code: url.searchParams.get("code"),
    state: url.searchParams.get("state"),
    error: url.searchParams.get("error"),
  });
}
