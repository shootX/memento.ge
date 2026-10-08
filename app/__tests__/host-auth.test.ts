import { hostMutationAuth } from '@/src/api/host-auth';

describe('hostMutationAuth', () => {
  it('prefers Bearer when logged in', () => {
    expect(hostMutationAuth('secret', 'jwt', 'csrf')).toEqual({ bearerToken: 'jwt' });
  });

  it('uses HostToken + CSRF for host-secret clients', () => {
    expect(hostMutationAuth('secret', null, 'csrf')).toEqual({
      hostToken: 'secret',
      csrfToken: 'csrf',
    });
  });
});
