import type { RequestOptions } from '@/src/api/http';

/** Host mutation auth per MOBILE-API §6: Bearer (owner) or HostToken (secret). */
export function hostMutationAuth(
  hostSecret: string,
  bearerToken?: string | null,
  csrfToken?: string,
): Pick<RequestOptions, 'bearerToken' | 'hostToken' | 'csrfToken'> {
  if (bearerToken) {
    return { bearerToken };
  }
  return {
    hostToken: hostSecret,
    csrfToken,
  };
}
