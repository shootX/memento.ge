import { config } from '@/src/config';

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public body?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export type RequestOptions = {
  method?: string;
  headers?: Record<string, string>;
  body?: BodyInit | null;
  json?: unknown;
  csrfToken?: string;
  bearerToken?: string | null;
  credentials?: RequestCredentials;
};

export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const url = path.startsWith('http') ? path : `${config.apiUrl}${path}`;
  const headers: Record<string, string> = { ...(options.headers ?? {}) };

  if (options.json !== undefined) {
    headers['Content-Type'] = 'application/json';
  }
  if (options.csrfToken) {
    headers['x-csrf-token'] = options.csrfToken;
  }
  if (options.bearerToken) {
    headers.Authorization = `Bearer ${options.bearerToken}`;
  }

  const res = await fetch(url, {
    method: options.method ?? (options.json !== undefined || options.body ? 'POST' : 'GET'),
    headers,
    body: options.json !== undefined ? JSON.stringify(options.json) : options.body,
    credentials: options.credentials ?? 'omit',
  });

  const contentType = res.headers.get('content-type') ?? '';
  const isJson = contentType.includes('application/json');
  const data = isJson ? await res.json().catch(() => ({})) : await res.text();

  if (!res.ok) {
    const msg =
      typeof data === 'object' && data && 'error' in data && typeof (data as { error: unknown }).error === 'string'
        ? (data as { error: string }).error
        : `HTTP ${res.status}`;
    throw new ApiError(msg, res.status, data);
  }

  return data as T;
}
