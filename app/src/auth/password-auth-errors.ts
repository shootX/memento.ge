import { ApiError } from '@/src/api/http';

export type PasswordAuthErrorKind = 'wrong_credentials' | 'rate_limited' | 'generic';

export function classifyPasswordAuthError(err: unknown): PasswordAuthErrorKind {
  if (!(err instanceof ApiError)) return 'generic';
  if (err.status === 401) return 'wrong_credentials';
  if (err.status === 429) return 'rate_limited';
  const body = err.body as { code?: string } | undefined;
  if (body?.code === 'RATE_LIMITED') return 'rate_limited';
  return 'generic';
}
