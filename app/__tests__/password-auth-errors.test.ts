jest.mock('@/src/config', () => ({
  config: {
    apiUrl: 'https://test.example',
    useMockApi: false,
    deepLinkHost: 'memento.ge',
    authRedirectUri: 'memento://auth/callback',
  },
}));

import { ApiError } from '@/src/api/http';
import { classifyPasswordAuthError } from '@/src/auth/password-auth-errors';

describe('classifyPasswordAuthError', () => {
  it('maps 401 to wrong_credentials', () => {
    expect(classifyPasswordAuthError(new ApiError('Wrong email or password', 401))).toBe(
      'wrong_credentials',
    );
  });

  it('maps 429 to rate_limited', () => {
    expect(classifyPasswordAuthError(new ApiError('RATE_LIMITED', 429, { code: 'RATE_LIMITED' }))).toBe(
      'rate_limited',
    );
  });

  it('maps unknown to generic', () => {
    expect(classifyPasswordAuthError(new Error('x'))).toBe('generic');
  });
});
