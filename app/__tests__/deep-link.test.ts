import { resolveDeepLink } from '@/src/lib/deep-link';
import { isAllowedEventLink, parseEventSlugFromUrl, parseMagicLinkToken } from '@/src/lib/slug';

describe('deep link security', () => {
  it('parses memento auth callback', () => {
    expect(parseMagicLinkToken('memento://auth/callback?token=abc')).toBe('abc');
    expect(resolveDeepLink('memento://auth/callback?token=abc')).toEqual({
      type: 'auth',
      token: 'abc',
    });
  });

  it('rejects https auth callback (no open redirect)', () => {
    expect(parseMagicLinkToken('https://evil.com/auth/callback?token=abc')).toBeNull();
  });

  it('rejects javascript urls', () => {
    expect(isAllowedEventLink('javascript:alert(1)')).toBe(false);
    expect(parseEventSlugFromUrl('javascript:alert(1)')).toBeNull();
  });

  it('rejects unknown https hosts', () => {
    expect(parseEventSlugFromUrl('https://evil.com/e/demo')).toBeNull();
  });

  it('rejects slug path traversal', () => {
    expect(parseEventSlugFromUrl('memento://e/../admin')).toBeNull();
  });

  it('allows memento.ge links', () => {
    expect(parseEventSlugFromUrl('https://memento.ge/e/nino-giorgi-2026')).toBe('nino-giorgi-2026');
  });
});
