import { handleOAuthCallback } from "@/lib/oauth/callback-handler";

export async function GET(req: Request) {
  const url = new URL(req.url);
  return handleOAuthCallback("facebook", req, {
    code: url.searchParams.get("code"),
    state: url.searchParams.get("state"),
    error: url.searchParams.get("error"),
  });
}
