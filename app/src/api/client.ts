import { config } from '@/src/config';
import { serializeMobileOAuthBody } from '@/src/api/oauth';
import { apiFetch } from '@/src/api/http';
import { hostMutationAuth } from '@/src/api/host-auth';
import { mockApi } from '@/src/api/mock';
import type {
  AuthSession,
  AuthUser,
  MobileOAuthLinkVerifyRequest,
  MobileOAuthRequest,
  MobilePasswordLoginRequest,
  MobilePasswordRegisterRequest,
  CreateEventResponse,
  DashboardEvent,
  GuestEventInfo,
  GuestbookMessage,
  HostBootstrap,
  HostMediaItem,
  PaymentSession,
  PaymentStatus,
  PushSubscribeInput,
} from '@/src/api/types';

export type MementoClient = {
  getAuthMe: (bearerToken: string) => Promise<{ user: AuthUser | null }>;
  sendMagicLink: (email: string) => Promise<{ warning?: string }>;
  exchangeMagicToken: (token: string) => Promise<AuthSession>;
  verifyLoginCode: (email: string, code: string) => Promise<AuthSession>;
  mobilePasswordLogin: (email: string, password: string) => Promise<AuthSession>;
  mobilePasswordRegister: (input: MobilePasswordRegisterRequest) => Promise<AuthSession>;
  exchangeMobileOAuth: (body: MobileOAuthRequest) => Promise<AuthSession>;
  startOAuthLink: (pendingLinkId: string, email: string) => Promise<{ ok: true }>;
  verifyOAuthLink: (
    pendingLinkId: string,
    email: string,
    code: string,
  ) => Promise<AuthSession>;
  listMyEvents: (bearerToken: string) => Promise<DashboardEvent[]>;
  createEvent: (input: {
    coupleNames: string;
    eventDate: string;
    planTier: string;
    ownerEmail?: string;
    coverUri?: string;
    bearerToken?: string | null;
  }) => Promise<CreateEventResponse>;
  getGuestEvent: (slug: string, guestKey: string) => Promise<GuestEventInfo>;
  getGallery: (slug: string, password?: string) => Promise<{
    locked: boolean;
    coupleNames?: string;
    items: { id?: string; url: string; thumbUrl?: string; guestName?: string }[];
  }>;
  postGuestbook: (slug: string, body: { guestName?: string; body: string }) => Promise<void>;
  getHost: (token: string) => Promise<HostBootstrap>;
  getHostMedia: (token: string) => Promise<HostMediaItem[]>;
  getHostGuestbook: (token: string) => Promise<GuestbookMessage[]>;
  deleteHostMedia: (
    token: string,
    mediaId: string,
    csrfToken: string,
    bearerToken?: string | null,
  ) => Promise<void>;
  patchHostMedia: (
    token: string,
    mediaId: string,
    csrfToken: string,
    highlight: boolean,
    bearerToken?: string | null,
  ) => Promise<void>;
  patchHostSettings: (
    token: string,
    csrfToken: string,
    settings: Record<string, unknown>,
    bearerToken?: string | null,
  ) => Promise<void>;
  createPaymentSession: (
    hostToken: string,
    returnUrl: string,
    bearerToken?: string | null,
  ) => Promise<PaymentSession>;
  getPaymentStatus: (
    hostToken: string,
    paymentId: string,
    bearerToken?: string | null,
  ) => Promise<PaymentStatus>;
  subscribePush: (
    hostToken: string,
    input: PushSubscribeInput,
    bearerToken?: string | null,
    csrfToken?: string,
  ) => Promise<void>;
  getPaymentUrl: (hostToken: string) => string;
  getSlideshowUrl: (hostToken: string) => string;
  getQrImageUrl: (hostToken: string, template: string) => string;
};

function mockEnabled() {
  return config.useMockApi;
}

export function createLiveClient(): MementoClient {
  return {
    async getAuthMe(bearerToken) {
      if (mockEnabled()) return mockApi.authMe();
      return apiFetch('/api/auth/me', { bearerToken });
    },

    async sendMagicLink(email) {
      if (mockEnabled()) {
        await mockApi.sendMagicLink();
        return {};
      }
      return apiFetch('/api/auth/magic-link', {
        method: 'POST',
        json: {
          email,
          client: 'mobile',
          redirectUri: config.authRedirectUri,
        },
      });
    },

    async exchangeMagicToken(token) {
      if (mockEnabled()) return mockApi.verifyCode('123456');
      return apiFetch<AuthSession>('/api/auth/mobile/exchange', {
        method: 'POST',
        json: { token },
      });
    },

    async verifyLoginCode(email, code) {
      if (mockEnabled()) return mockApi.verifyCode(code);
      return apiFetch<AuthSession>('/api/auth/mobile/verify-code', {
        method: 'POST',
        json: { email, code },
      });
    },

    async mobilePasswordLogin(email, password) {
      if (mockEnabled()) return mockApi.mobilePasswordLogin(email, password);
      const json: MobilePasswordLoginRequest = { email, password };
      return apiFetch<AuthSession>('/api/auth/mobile/login', { method: 'POST', json });
    },

    async mobilePasswordRegister(input) {
      if (mockEnabled()) return mockApi.mobilePasswordRegister(input);
      return apiFetch<AuthSession>('/api/auth/mobile/register', { method: 'POST', json: input });
    },

    async exchangeMobileOAuth(body) {
      if (mockEnabled()) return mockApi.exchangeMobileOAuth(body);
      const json = serializeMobileOAuthBody(body);
      return apiFetch<AuthSession>('/api/auth/mobile/oauth', {
        method: 'POST',
        json,
      });
    },

    async startOAuthLink(pendingLinkId, email) {
      if (mockEnabled()) {
        await mockApi.startOAuthLink(pendingLinkId, email);
        return { ok: true };
      }
      return apiFetch<{ ok: true }>('/api/auth/mobile/oauth/link/start', {
        method: 'POST',
        json: { pendingLinkId, email },
      });
    },

    async verifyOAuthLink(pendingLinkId, email, code) {
      if (mockEnabled()) return mockApi.verifyOAuthLink(pendingLinkId, email, code);
      const payload: MobileOAuthLinkVerifyRequest = { pendingLinkId, email, code };
      return apiFetch<AuthSession>('/api/auth/mobile/oauth/link/verify', {
        method: 'POST',
        json: payload,
      });
    },

    async listMyEvents(bearerToken) {
      if (mockEnabled()) return (await mockApi.dashboardEvents()).events;
      const r = await apiFetch<{ events: DashboardEvent[] }>('/api/dashboard/events', {
        bearerToken,
      });
      return r.events ?? [];
    },

    async createEvent(input) {
      if (mockEnabled()) return mockApi.createEvent();

      const form = new FormData();
      form.append('coupleNames', input.coupleNames);
      form.append('eventDate', new Date(input.eventDate).toISOString());
      form.append('planTier', input.planTier);
      if (input.ownerEmail) form.append('ownerEmail', input.ownerEmail);
      if (input.coverUri) {
        form.append('cover', {
          uri: input.coverUri,
          name: 'cover.jpg',
          type: 'image/jpeg',
        } as unknown as Blob);
      }

      return apiFetch<CreateEventResponse>('/api/events', {
        method: 'POST',
        body: form,
        bearerToken: input.bearerToken ?? undefined,
      });
    },

    async getGuestEvent(slug, guestKey) {
      if (mockEnabled()) return mockApi.guestInfo(slug);
      return apiFetch<GuestEventInfo>(
        `/api/guest/${encodeURIComponent(slug)}?guestKey=${encodeURIComponent(guestKey)}`,
      );
    },

    async getGallery(slug, password) {
      if (mockEnabled()) return mockApi.gallery();
      if (password) {
        await apiFetch(`/api/gallery/${encodeURIComponent(slug)}`, {
          method: 'POST',
          json: { password },
        });
      }
      return apiFetch(`/api/gallery/${encodeURIComponent(slug)}`);
    },

    async postGuestbook(slug, body) {
      if (mockEnabled()) return;
      await apiFetch(`/api/guest/${encodeURIComponent(slug)}/guestbook`, {
        method: 'POST',
        json: body,
      });
    },

    async getHost(token) {
      if (mockEnabled()) return mockApi.hostGet();
      return apiFetch<HostBootstrap>(`/api/host/${encodeURIComponent(token)}`);
    },

    async getHostMedia(token) {
      if (mockEnabled()) return (await mockApi.hostMedia()).items;
      const r = await apiFetch<{ items: HostMediaItem[] }>(
        `/api/host/${encodeURIComponent(token)}/media`,
      );
      return r.items ?? [];
    },

    async getHostGuestbook(token) {
      if (mockEnabled()) return (await mockApi.hostGuestbook()).items;
      const r = await apiFetch<{ items: GuestbookMessage[] }>(
        `/api/host/${encodeURIComponent(token)}/guestbook`,
      );
      return r.items ?? [];
    },

    async deleteHostMedia(token, mediaId, csrfToken, bearerToken) {
      if (mockEnabled()) return;
      await apiFetch(`/api/host/${encodeURIComponent(token)}/media/${mediaId}`, {
        method: 'DELETE',
        ...hostMutationAuth(token, bearerToken, csrfToken),
      });
    },

    async patchHostMedia(token, mediaId, csrfToken, highlight, bearerToken) {
      if (mockEnabled()) return;
      await apiFetch(`/api/host/${encodeURIComponent(token)}/media/${mediaId}`, {
        method: 'PATCH',
        ...hostMutationAuth(token, bearerToken, csrfToken),
        json: { highlight },
      });
    },

    async patchHostSettings(token, csrfToken, settings, bearerToken) {
      if (mockEnabled()) return;
      await apiFetch(`/api/host/${encodeURIComponent(token)}/settings`, {
        method: 'PATCH',
        ...hostMutationAuth(token, bearerToken, csrfToken),
        json: settings,
      });
    },

    async createPaymentSession(hostToken, returnUrl, bearerToken) {
      if (mockEnabled()) {
        return {
          checkoutUrl: `${config.apiUrl}/host/${hostToken}/pay?source=app`,
          paymentId: 'mock-pay-1',
        };
      }
      return apiFetch<PaymentSession>(
        `/api/host/${encodeURIComponent(hostToken)}/payment/session`,
        {
          method: 'POST',
          ...hostMutationAuth(hostToken, bearerToken),
          json: { returnUrl },
        },
      );
    },

    async getPaymentStatus(hostToken, paymentId, bearerToken) {
      if (mockEnabled()) return { status: 'pending', isPaid: false };
      return apiFetch<PaymentStatus>(
        `/api/host/${encodeURIComponent(hostToken)}/payment/status?paymentId=${encodeURIComponent(paymentId)}`,
        hostMutationAuth(hostToken, bearerToken),
      );
    },

    async subscribePush(hostToken, input, bearerToken, csrfToken) {
      if (mockEnabled()) return;
      await apiFetch(`/api/host/${encodeURIComponent(hostToken)}/push/subscribe`, {
        method: 'POST',
        ...hostMutationAuth(hostToken, bearerToken, csrfToken),
        json: input,
      });
    },

    getPaymentUrl(hostToken) {
      return `${config.apiUrl}/host/${encodeURIComponent(hostToken)}/pay?source=app`;
    },

    getSlideshowUrl(hostToken) {
      return `${config.apiUrl}/host/${encodeURIComponent(hostToken)}/slideshow`;
    },

    getQrImageUrl(hostToken, template) {
      return `${config.apiUrl}/api/host/${encodeURIComponent(hostToken)}/qr?template=${template}&format=png`;
    },
  };
}

export const api = createLiveClient();
