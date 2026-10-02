import { extractHostTokenFromUrl, parseEventSlugFromUrl } from '@/src/lib/slug';

describe('parseEventSlugFromUrl', () => {
  it('parses https universal link', () => {
    expect(parseEventSlugFromUrl('https://memento.ge/e/nino-giorgi-2026')).toBe('nino-giorgi-2026');
  });

  it('parses custom scheme', () => {
    expect(parseEventSlugFromUrl('memento://e/demo')).toBe('demo');
  });

  it('parses bare slug', () => {
    expect(parseEventSlugFromUrl('demo')).toBe('demo');
  });
});

describe('extractHostTokenFromUrl', () => {
  it('extracts host token', () => {
    expect(extractHostTokenFromUrl('https://qr.socialsave.cc/host/abc123xyz')).toBe('abc123xyz');
  });
});
