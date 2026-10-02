/** In-memory magic-link tokens for Playwright (plain token is never stored in DB). */
const links = new Map<string, { token: string; verifyUrl: string; expiresAt: number }>();

export function rememberE2eMagicLink(email: string, token: string, verifyUrl: string, expiresAt: Date) {
  if (!process.env.E2E_SECRET) return;
  links.set(email.toLowerCase(), {
    token,
    verifyUrl,
    expiresAt: expiresAt.getTime(),
  });
}

export function getE2eMagicLink(email: string) {
  const row = links.get(email.toLowerCase());
  if (!row) return null;
  if (row.expiresAt < Date.now()) {
    links.delete(email.toLowerCase());
    return null;
  }
  return row;
}
