export type Locale = 'ka' | 'en' | 'ru';

export type AuthUser = {
  id: string;
  email: string;
};

export type GuestEventInfo = {
  coupleNames: string;
  eventDate: string;
  coverUrl?: string | null;
  canUpload: boolean;
  isPaid: boolean;
  isActive: boolean;
  inTrial?: boolean;
  publicGallery?: boolean;
  gallerySlug?: string;
  branding?: { logoUrl?: string };
  limits: {
    maxBytesPerFile: number;
    shotsRemaining?: number | null;
  };
  disposable?: {
    enabled: boolean;
    shotsPerGuest: number;
  } | null;
};

export type GalleryItem = {
  id: string;
  url: string;
  thumbUrl?: string;
  guestName?: string;
  mimeType?: string;
  highlight?: boolean;
  status?: string;
};

export type HostBootstrap = {
  coupleNames: string;
  eventDate: string;
  guestUrl: string;
  hostUrl: string;
  slideshowUrl: string;
  isPaid: boolean;
  planTier: string;
  coverUrl?: string | null;
  csrfToken: string;
  customSlug?: string | null;
  publicGallery: boolean;
  disposableEnabled: boolean;
  shotsPerGuest: number;
  revealAt?: string | null;
  moderateUploads?: boolean;
  usage: {
    uploadCount: number;
    maxUploads: number;
    priceGel: number;
  };
};

export type HostMediaItem = GalleryItem;

export type GuestbookMessage = {
  id: string;
  guestName?: string;
  body: string;
  status?: string;
};

export type DashboardEvent = {
  id: string;
  coupleNames: string;
  eventDate: string;
  isPaid: boolean;
  hostUrl?: string;
};

export type CreateEventResponse = {
  hostUrl: string;
  guestUrl?: string;
  error?: string;
};

export type ApiErrorBody = {
  error?: string;
  code?: string;
  maxBytes?: number;
};
