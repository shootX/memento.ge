import { config } from '@/src/config';
import { apiFetch } from '@/src/api/http';
import { mockApi } from '@/src/api/mock';
import type {
  AuthUser,
  CreateEventResponse,
  DashboardEvent,
  GuestEventInfo,
  GuestbookMessage,
  HostBootstrap,
  HostMediaItem,
} from '@/src/api/types';

export type MementoClient = {
  getAuthMe: (bearerToken?: string | null) => Promise<{ user: AuthUser | null }>;
  sendMagicLink: (email: string) => Promise<{ warning?: string }>;
  verifyLoginCode: (email: string, code: string) => Promise<{ accessToken: string; user: AuthUser }>;
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
  postGuestbook: (
    slug: string,
    body: { guestName?: string; body: string },
  ) => Promise<void>;
  getHost: (token: string) => Promise<HostBootstrap>;
  getHostMedia: (token: string) => Promise<HostMediaItem[]>;
  getHostGuestbook: (token: string) => Promise<GuestbookMessage[]>;
  deleteHostMedia: (token: string, mediaId: string, csrfToken: string) => Promise<void>;
  patchHostMedia: (
    token: string,
    mediaId: string,
    csrfToken: string,
    highlight: boolean,
  ) => Promise<void>;
  patchHostSettings: (
    token: string,
    csrfToken: string,
    settings: Record<string, unknown>,
  ) => Promise<void>;
  getPaymentUrl: (hostToken: string) => string;
  getSlideshowUrl: (hostToken: string) => string;
  getQrImageUrl: (hostToken: string, template: string) => string;
};

function shouldMock(path: 'auth' | 'dashboard' | 'all'): boolean {
  if (config.useMockApi) return true;
  return path === 'auth' || path === 'dashboard';
}

export function createLiveClient(): MementoClient {
  return {
    async getAuthMe(bearerToken) {
      if (shouldMock('auth') && !bearerToken) return mockApi.authMe();
      try {
        return await apiFetch('/api/auth/me', {
          bearerToken: bearerToken ?? undefined,
          credentials: bearerToken ? 'omit' : 'include',
        });
      } catch {
        if (bearerToken) return { user: null };
        return mockApi.authMe();
      }
    },

    async sendMagicLink(email) {
      if (shouldMock('auth')) {
        await mockApi.sendMagicLink();
        return {};
      }
      return apiFetch('/api/auth/magic-link', { method: 'POST', json: { email } });
    },

    async verifyLoginCode(email, code) {
      if (shouldMock('auth')) return mockApi.verifyCode(code);
      return apiFetch('/api/auth/mobile/verify-code', {
        method: 'POST',
        json: { email, code },
      });
    },

    async listMyEvents(bearerToken) {
      if (shouldMock('dashboard')) {
        const r = await mockApi.dashboardEvents();
        return r.events;
      }
      try {
        const r = await apiFetch<{ events: DashboardEvent[] }>('/api/dashboard/events', {
          bearerToken,
        });
        return r.events ?? [];
      } catch {
        const r = await mockApi.dashboardEvents();
        return r.events;
      }
    },

    async createEvent(input) {
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

      if (shouldMock('dashboard') && !input.bearerToken) {
        return mockApi.createEvent();
      }

      try {
        return await apiFetch<CreateEventResponse>('/api/events', {
          method: 'POST',
          body: form,
          bearerToken: input.bearerToken,
          credentials: input.bearerToken ? 'omit' : 'include',
        });
      } catch (e) {
        if (config.useMockApi) return mockApi.createEvent();
        throw e;
      }
    },

    async getGuestEvent(slug, guestKey) {
      if (config.useMockApi && slug === 'demo') return mockApi.guestInfo(slug);
      return apiFetch<GuestEventInfo>(
        `/api/guest/${encodeURIComponent(slug)}?guestKey=${encodeURIComponent(guestKey)}`,
      );
    },

    async getGallery(slug, password) {
      if (config.useMockApi) return mockApi.gallery();
      if (password) {
        await apiFetch(`/api/gallery/${encodeURIComponent(slug)}`, {
          method: 'POST',
          json: { password },
        });
      }
      return apiFetch(`/api/gallery/${encodeURIComponent(slug)}`);
    },

    async postGuestbook(slug, body) {
      if (config.useMockApi) return;
      await apiFetch(`/api/guest/${encodeURIComponent(slug)}/guestbook`, {
        method: 'POST',
        json: body,
      });
    },

    async getHost(token) {
      if (config.useMockApi && token.startsWith('mock')) return mockApi.hostGet();
      return apiFetch<HostBootstrap>(`/api/host/${encodeURIComponent(token)}`);
    },

    async getHostMedia(token) {
      if (config.useMockApi && token.startsWith('mock')) {
        const r = await mockApi.hostMedia();
        return r.items;
      }
      const r = await apiFetch<{ items: HostMediaItem[] }>(
        `/api/host/${encodeURIComponent(token)}/media`,
      );
      return r.items ?? [];
    },

    async getHostGuestbook(token) {
      if (config.useMockApi && token.startsWith('mock')) {
        const r = await mockApi.hostGuestbook();
        return r.items;
      }
      const r = await apiFetch<{ items: GuestbookMessage[] }>(
        `/api/host/${encodeURIComponent(token)}/guestbook`,
      );
      return r.items ?? [];
    },

    async deleteHostMedia(token, mediaId, csrfToken) {
      if (config.useMockApi && token.startsWith('mock')) return;
      await apiFetch(`/api/host/${encodeURIComponent(token)}/media/${mediaId}`, {
        method: 'DELETE',
        csrfToken,
      });
    },

    async patchHostMedia(token, mediaId, csrfToken, highlight) {
      if (config.useMockApi && token.startsWith('mock')) return;
      await apiFetch(`/api/host/${encodeURIComponent(token)}/media/${mediaId}`, {
        method: 'PATCH',
        csrfToken,
        json: { highlight },
      });
    },

    async patchHostSettings(token, csrfToken, settings) {
      if (config.useMockApi && token.startsWith('mock')) return;
      await apiFetch(`/api/host/${encodeURIComponent(token)}/settings`, {
        method: 'PATCH',
        csrfToken,
        json: settings,
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
