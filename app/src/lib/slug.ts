export function parseEventSlugFromUrl(url: string): string | null {
  const trimmed = url.trim();
  try {
    const withProto = trimmed.includes('://') ? trimmed : `https://${trimmed}`;
    const u = new URL(withProto);
    if (u.protocol === 'memento:' && u.hostname === 'e') {
      const slug = u.pathname.replace(/^\//, '');
      if (slug) return decodeURIComponent(slug);
    }
    const parts = u.pathname.split('/').filter(Boolean);
    const eIdx = parts.indexOf('e');
    if (eIdx >= 0 && parts[eIdx + 1]) return decodeURIComponent(parts[eIdx + 1]);
    if (parts[0] === 'e' && parts[1]) return decodeURIComponent(parts[1]);
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
