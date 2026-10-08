/**
 * Local HTTP mock aligned with docs/MOBILE-API.md for contract tests.
 * Usage: node scripts/mock-api-server.mjs [port]
 */
import http from 'node:http';
import { URL } from 'node:url';

const port = Number(process.argv[2] ?? 3999);

const state = {
  uploads: [],
  payments: new Map(),
};

function json(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(body));
}

function readBody(req) {
  return new Promise((resolve) => {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => {
      const raw = Buffer.concat(chunks).toString('utf8');
      if (!raw) return resolve(null);
      try {
        resolve(JSON.parse(raw));
      } catch {
        resolve(raw);
      }
    });
  });
}

async function handler(req, res) {
  const url = new URL(req.url ?? '/', `http://127.0.0.1:${port}`);
  const path = url.pathname;
  const auth = req.headers.authorization ?? '';

  if (req.method === 'POST' && path === '/api/auth/magic-link') {
    const body = await readBody(req);
    if (!body?.email?.includes('@')) return json(res, 400, { error: 'invalid email' });
    return json(res, 200, { ok: true });
  }

  if (req.method === 'POST' && path === '/api/auth/mobile/login') {
    const body = await readBody(req);
    if (body?.password === 'rate-limit') {
      return json(res, 429, { code: 'RATE_LIMITED', error: 'RATE_LIMITED' });
    }
    if (body?.password !== 'secretpass') {
      return json(res, 401, { error: 'Wrong email or password' });
    }
    return json(res, 200, {
      accessToken: 'password-login-bearer',
      expiresIn: 3600,
      user: { id: 'u-pw', email: body.email },
    });
  }

  if (req.method === 'POST' && path === '/api/auth/mobile/register') {
    const body = await readBody(req);
    if (body?.password === 'rate-limit') {
      return json(res, 429, { code: 'RATE_LIMITED', error: 'RATE_LIMITED' });
    }
    if (!body?.email?.includes('@') || !body?.password || body.password.length < 8) {
      return json(res, 400, { error: 'invalid' });
    }
    return json(res, 200, {
      accessToken: 'password-register-bearer',
      expiresIn: 3600,
      user: { id: 'u-new', email: body.email },
    });
  }

  if (req.method === 'POST' && path === '/api/auth/mobile/verify-code') {
    const body = await readBody(req);
    if (body?.code !== '123456') return json(res, 400, { error: 'invalid code' });
    return json(res, 200, {
      accessToken: 'test-bearer',
      expiresIn: 3600,
      user: { id: 'u1', email: body.email },
    });
  }

  if (req.method === 'POST' && path === '/api/auth/mobile/oauth') {
    const body = await readBody(req);
    if (!body?.provider) return json(res, 400, { error: 'invalid provider' });
    if (body.provider === 'facebook' && body.accessToken === 'pending-fb') {
      return json(res, 409, {
        code: 'OAUTH_LINK_REQUIRED',
        pendingLinkId: 'test-pending-1',
      });
    }
    if (body.idToken === 'bad-id-token') {
      return json(res, 400, { error: 'invalid id token' });
    }
    if (!body.idToken && !body.accessToken) return json(res, 400, { error: 'missing token' });
    return json(res, 200, {
      accessToken: 'oauth-bearer',
      expiresIn: 3600,
      user: { id: 'oauth-1', email: 'oauth@example.com' },
    });
  }

  if (req.method === 'POST' && path === '/api/auth/mobile/oauth/link/start') {
    const body = await readBody(req);
    if (!body?.pendingLinkId || !body?.email?.includes('@')) {
      return json(res, 400, { error: 'invalid' });
    }
    return json(res, 200, { ok: true });
  }

  if (req.method === 'POST' && path === '/api/auth/mobile/oauth/link/verify') {
    const body = await readBody(req);
    if (body?.code !== '123456') return json(res, 400, { error: 'invalid code' });
    return json(res, 200, {
      accessToken: 'oauth-linked-bearer',
      expiresIn: 3600,
      user: { id: 'oauth-1', email: body.email },
    });
  }

  if (req.method === 'POST' && path === '/api/auth/mobile/exchange') {
    const body = await readBody(req);
    if (body?.token !== 'good-token') return json(res, 400, { error: 'invalid token' });
    return json(res, 200, {
      accessToken: 'exchanged-bearer',
      expiresIn: 3600,
      user: { id: 'u1', email: 'host@example.com' },
    });
  }

  if (req.method === 'GET' && path === '/api/auth/me') {
    if (!auth.startsWith('Bearer ')) return json(res, 401, { error: 'unauthorized' });
    if (auth === 'Bearer expired') return json(res, 401, { error: 'token expired' });
    return json(res, 200, { user: { id: 'u1', email: 'host@example.com' } });
  }

  if (req.method === 'GET' && path === '/api/dashboard/events') {
    if (!auth.startsWith('Bearer ')) return json(res, 401, { error: 'unauthorized' });
    return json(res, 200, {
      events: [
        {
          id: 'e1',
          coupleNames: 'ტესტი',
          eventDate: '2026-01-01T00:00:00.000Z',
          isPaid: false,
          hostUrl: `http://127.0.0.1:${port}/host/test-host-token`,
        },
      ],
    });
  }

  const guestMatch = path.match(/^\/api\/guest\/([^/]+)$/);
  if (req.method === 'GET' && guestMatch) {
    const slug = decodeURIComponent(guestMatch[1]);
    if (slug === 'missing') return json(res, 404, { error: 'not found' });
    return json(res, 200, {
      coupleNames: 'ტესტ წყვილი',
      eventDate: '2026-06-01T00:00:00.000Z',
      coverUrl: null,
      canUpload: true,
      isPaid: true,
      isActive: true,
      publicGallery: true,
      gallerySlug: slug,
      limits: { maxBytesPerFile: 104857600, shotsRemaining: 5 },
      disposable: { enabled: true, shotsPerGuest: 5 },
    });
  }

  const uploadMatch = path.match(/^\/api\/guest\/([^/]+)\/upload$/);
  if (req.method === 'POST' && uploadMatch) {
    const slug = uploadMatch[1];
    if (slug === 'slow') {
      await new Promise((r) => setTimeout(r, 50));
    }
    if (slug === 'fail-once') {
      const n = state.uploads.filter((u) => u.slug === slug).length;
      state.uploads.push({ slug, at: Date.now() });
      if (n === 0) {
        res.writeHead(503);
        res.end('temporary');
        return;
      }
    }
    state.uploads.push({ slug, at: Date.now() });
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true }));
    return;
  }

  const hostMatch = path.match(/^\/api\/host\/([^/]+)$/);
  if (req.method === 'GET' && hostMatch) {
    const token = hostMatch[1];
    if (token === 'bad') return json(res, 404, { error: 'not found' });
    return json(res, 200, {
      coupleNames: 'ტესტი',
      eventDate: '2026-06-01T00:00:00.000Z',
      guestUrl: `https://memento.ge/e/demo`,
      hostUrl: `http://127.0.0.1:${port}/host/${token}`,
      slideshowUrl: `http://127.0.0.1:${port}/host/${token}/slideshow`,
      isPaid: false,
      planTier: 'classic',
      coverUrl: null,
      csrfToken: 'csrf-test',
      publicGallery: true,
      disposableEnabled: true,
      shotsPerGuest: 5,
      revealAt: null,
      usage: { uploadCount: 0, maxUploads: 600, priceGel: 99 },
    });
  }

  const galleryMatch = path.match(/^\/api\/gallery\/([^/]+)$/);
  if (req.method === 'GET' && galleryMatch) {
    if (galleryMatch[1] === 'locked') {
      return json(res, 200, { locked: true, coupleNames: 'ჩაკეტილი' });
    }
    return json(res, 200, {
      locked: false,
      coupleNames: 'ტესტი',
      items: [{ id: '1', url: 'https://example.com/1.jpg', guestName: 'ა' }],
    });
  }

  if (req.method === 'POST' && galleryMatch) {
    const body = await readBody(req);
    if (body?.password !== 'secret') return json(res, 403, { error: 'wrong password' });
    return json(res, 200, { locked: false, items: [] });
  }

  const paySessionMatch = path.match(/^\/api\/host\/([^/]+)\/payment\/session$/);
  if (req.method === 'POST' && paySessionMatch) {
    const token = paySessionMatch[1];
    return json(res, 200, {
      checkoutUrl: `http://127.0.0.1:${port}/checkout/${token}`,
      paymentId: 'pay-test-1',
    });
  }

  const payStatusMatch = path.match(/^\/api\/host\/([^/]+)\/payment\/status$/);
  if (req.method === 'GET' && payStatusMatch) {
    const paymentId = url.searchParams.get('paymentId');
    if (paymentId === 'pay-test-1') {
      return json(res, 200, { status: 'paid', isPaid: true });
    }
    return json(res, 200, { status: 'pending', isPaid: false });
  }

  json(res, 404, { error: 'not found' });
}

const server = http.createServer((req, res) => {
  void handler(req, res);
});

server.listen(port, () => {
  console.log(`mock-api listening on ${port}`);
});
