import { ApiError } from '@/src/api/http';
import type {
  AuthSession,
  AuthUser,
  CreateEventResponse,
  DashboardEvent,
  GuestEventInfo,
  HostBootstrap,
  HostMediaItem,
  GuestbookMessage,
  MobileOAuthRequest,
} from '@/src/api/types';

const mockUser: AuthUser = { id: 'mock-user', email: 'host@example.com' };

const mockGuestEvent: GuestEventInfo = {
  coupleNames: 'ნინო & გიორგი',
  eventDate: '2026-06-14T00:00:00.000Z',
  coverUrl: 'https://qr.socialsave.cc/seed-samples/wedding-4.jpg',
  canUpload: true,
  isPaid: true,
  isActive: true,
  publicGallery: true,
  gallerySlug: 'demo',
  limits: { maxBytesPerFile: 104857600, shotsRemaining: 3 },
  disposable: { enabled: true, shotsPerGuest: 5 },
};

const mockHost: HostBootstrap = {
  coupleNames: 'ნინო & გიორგი',
  eventDate: '2026-06-14T00:00:00.000Z',
  guestUrl: 'https://memento.ge/e/demo',
  hostUrl: 'https://qr.socialsave.cc/host/mock-token-abc',
  slideshowUrl: 'https://qr.socialsave.cc/host/mock-token-abc/slideshow',
  isPaid: false,
  planTier: 'classic',
  coverUrl: 'https://qr.socialsave.cc/seed-samples/wedding-4.jpg',
  csrfToken: 'mock-csrf',
  publicGallery: true,
  disposableEnabled: true,
  shotsPerGuest: 5,
  revealAt: null,
  usage: { uploadCount: 12, maxUploads: 600, priceGel: 99 },
};

const mockMedia: HostMediaItem[] = [
  {
    id: '1',
    url: 'https://qr.socialsave.cc/seed-samples/wedding-2.jpg',
    thumbUrl: 'https://qr.socialsave.cc/seed-samples/wedding-2.jpg',
    guestName: 'მარიამი',
    mimeType: 'image/jpeg',
  },
  {
    id: '2',
    url: 'https://qr.socialsave.cc/seed-samples/wedding-6.jpg',
    thumbUrl: 'https://qr.socialsave.cc/seed-samples/wedding-6.jpg',
    guestName: 'გიორგი',
    mimeType: 'image/jpeg',
    highlight: true,
  },
];

export const mockApi = {
  authMe: async () => ({ user: mockUser }),
  sendMagicLink: async () => ({ ok: true }),
  verifyCode: async (code: string) => {
    if (code === '000000') throw new Error('invalid');
    return { accessToken: 'mock-bearer-token', expiresIn: 2592000, user: mockUser };
  },
  dashboardEvents: async (): Promise<{ events: DashboardEvent[] }> => ({
    events: [
      {
        id: 'evt-1',
        coupleNames: mockHost.coupleNames,
        eventDate: mockHost.eventDate,
        isPaid: mockHost.isPaid,
        hostUrl: mockHost.hostUrl,
      },
    ],
  }),
  createEvent: async (): Promise<CreateEventResponse> => ({
    hostUrl: mockHost.hostUrl,
    guestUrl: mockHost.guestUrl,
  }),
  guestInfo: async (slug: string): Promise<GuestEventInfo> => ({
    ...mockGuestEvent,
    gallerySlug: slug === 'demo' ? 'demo' : slug,
  }),
  gallery: async () => ({
    locked: false,
    coupleNames: mockGuestEvent.coupleNames,
    items: mockMedia.map((m) => ({ url: m.url, thumbUrl: m.thumbUrl, guestName: m.guestName })),
  }),
  hostGet: async (): Promise<HostBootstrap> => mockHost,
  hostMedia: async () => ({ items: mockMedia }),
  hostGuestbook: async (): Promise<{ items: GuestbookMessage[] }> => ({
    items: [{ id: 'gb1', guestName: 'ანა', body: 'გილოცავთ! 💚', status: 'approved' }],
  }),
  uploadGuest: async () => ({ ok: true }),
  exchangeMobileOAuth: async (body: MobileOAuthRequest): Promise<AuthSession> => {
    if (body.provider === 'facebook' && body.accessToken === 'mock-facebook-pending') {
      throw new ApiError('OAUTH_LINK_REQUIRED', 409, {
        code: 'OAUTH_LINK_REQUIRED',
        pendingLinkId: 'mock-pl-1',
      });
    }
    if (body.idToken === 'invalid-token') {
      throw new ApiError('invalid id token', 400, { error: 'invalid id token' });
    }
    const email = body.provider === 'apple' ? 'apple-id@privaterelay.appleid.com' : mockUser.email;
    return {
      accessToken: `mock-oauth-${body.provider}`,
      expiresIn: 2592000,
      user: { id: `oauth-${body.provider}`, email },
    };
  },
  startOAuthLink: async (_pendingLinkId: string, _email: string) => ({ ok: true }),
  verifyOAuthLink: async (_pendingLinkId: string, email: string, code: string): Promise<AuthSession> => {
    if (code === '000000') throw new ApiError('invalid code', 400, { error: 'invalid code' });
    return { accessToken: 'mock-oauth-linked', expiresIn: 2592000, user: { id: 'oauth-fb', email } };
  },
};
