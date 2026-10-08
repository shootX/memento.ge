import { notifyUnauthorized, setUnauthorizedHandler } from '@/src/lib/auth-http';

describe('auth-http', () => {
  it('calls unauthorized handler once per burst', () => {
    const fn = jest.fn();
    setUnauthorizedHandler(fn);
    notifyUnauthorized();
    notifyUnauthorized();
    expect(fn).toHaveBeenCalledTimes(1);
    setUnauthorizedHandler(null);
  });
});
