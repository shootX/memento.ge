import { startOAuthFlow } from "@/lib/oauth/start-flow";

export async function GET(req: Request) {
  return startOAuthFlow("apple", req);
}
