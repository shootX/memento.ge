import { serializeMobileOAuthBody } from '@/src/api/oauth';

describe('serializeMobileOAuthBody', () => {
  it('google sends provider and idToken only', () => {
    expect(serializeMobileOAuthBody({ provider: 'google', idToken: 'jwt' })).toEqual({
      provider: 'google',
      idToken: 'jwt',
    });
  });

  it('facebook sends accessToken', () => {
    expect(serializeMobileOAuthBody({ provider: 'facebook', accessToken: 'fb' })).toEqual({
      provider: 'facebook',
      accessToken: 'fb',
    });
  });
});
