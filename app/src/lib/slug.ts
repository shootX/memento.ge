const SLUG_RE = /^[a-z0-9-]{2,40}$/;

const ALLOWED_HTTPS_HOSTS = new Set(['memento.ge', 'www.memento.ge', 'qr.socialsave.cc']);

function normalizeSlug(raw: string): string | null {
  const slug = raw.trim().toLowerCase();
  if (!SLUG_RE.test(slug)) return null;
  if (slug.includes('..') || slug.includes('/')) return null;
  return slug;
}

/** Rejects javascript:/data: and unknown https hosts (deep-link open-redirect guard). */
export function isAllowedEventLink(url: string): boolean {
  const trimmed = url.trim();
  if (!trimmed || trimmed.includes('..')) return false;
  const lower = trimmed.toLowerCase();
  if (lower.startsWith('javascript:') || lower.startsWith('data:') || lower.startsWith('vbscript:')) {
    return false;
  }
  if (!trimmed.includes('://')) {
    return SLUG_RE.test(trimmed);
  }
  try {
    const u = new URL(trimmed.includes('://') ? trimmed : `https://${trimmed}`);
    if (u.protocol === 'memento:') return true;
    if (u.protocol === 'https:') return ALLOWED_HTTPS_HOSTS.has(u.hostname);
    return false;
  } catch {
    return false;
  }
}

export function parseEventSlugFromUrl(url: string): string | null {
  if (!isAllowedEventLink(url)) return null;

  const trimmed = url.trim();
  try {
    const withProto = trimmed.includes('://') ? trimmed : `https://${trimmed}`;
    const u = new URL(withProto);
    if (u.protocol === 'memento:' && u.hostname === 'e') {
      const slug = u.pathname.replace(/^\//, '').split('/')[0];
      if (slug) return normalizeSlug(decodeURIComponent(slug));
    }
    const parts = u.pathname.split('/').filter(Boolean);
    const eIdx = parts.indexOf('e');
    if (eIdx >= 0 && parts[eIdx + 1]) return normalizeSlug(decodeURIComponent(parts[eIdx + 1]));
    if (parts[0] === 'e' && parts[1]) return normalizeSlug(decodeURIComponent(parts[1]));
  } catch {
    /* fall through */
  }
  if (/^[a-z0-9-]{2,40}$/i.test(trimmed)) return trimmed.toLowerCase();
  return null;
}

export function extractHostTokenFromUrl(url: string): string | null {
  try {
    const u = new URL(url.includes('://') ? url : `https://${url}`);
    const parts = u.pathname.split('/').filter(Boolean);
    const hIdx = parts.indexOf('host');
    if (hIdx >= 0 && parts[hIdx + 1]) return parts[hIdx + 1];
  } catch {
    return null;
  }
  return null;
}

/** Magic-link callback must use app scheme only. */
export function parsePayCompleteDeepLink(
  url: string,
): { hostToken: string; paymentId?: string } | null {
  try {
    const u = new URL(url.includes('://') ? url : `memento://${url}`);
    if (u.protocol !== 'memento:' || u.hostname !== 'host') return null;
    const segments = u.pathname.split('/').filter(Boolean);
    if (segments.length < 2 || segments[1] !== 'pay-complete') return null;
    const hostToken = segments[0];
    if (!hostToken || hostToken.length > 128) return null;
    const paymentId = u.searchParams.get('paymentId')?.trim() || undefined;
    return { hostToken, paymentId };
  } catch {
    return null;
  }
}

export function parseMagicLinkToken(url: string): string | null {
  try {
    const u = new URL(url.includes('://') ? url : `memento://${url}`);
    if (u.protocol !== 'memento:') return null;
    if (u.hostname !== 'auth' || u.pathname !== '/callback') return null;
    const token = u.searchParams.get('token')?.trim();
    if (!token || token.length > 512) return null;
    return token;
  } catch {
    return null;
  }
}
