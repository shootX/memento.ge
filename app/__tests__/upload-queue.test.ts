jest.mock('@/src/config', () => ({
  config: { apiUrl: 'https://test.example', useMockApi: false, deepLinkHost: 'memento.ge' },
}));

import { UploadError, uploadGuestFile } from '@/src/lib/upload-queue';

class MockXHR {
  static instances: MockXHR[] = [];
  upload = { addEventListener: jest.fn() };
  status = 200;
  responseText = '{}';
  private listeners: Record<string, (() => void)[]> = {};

  constructor() {
    MockXHR.instances.push(this);
  }

  addEventListener(event: string, cb: () => void) {
    this.listeners[event] = this.listeners[event] ?? [];
    this.listeners[event].push(cb);
  }

  open() {}
  send() {
    setTimeout(() => {
      this.listeners.load?.forEach((cb) => cb());
    }, 0);
  }
}

describe('uploadGuestFile', () => {
  beforeEach(() => {
    MockXHR.instances = [];
    // @ts-expect-error test mock
    global.XMLHttpRequest = MockXHR;
  });

  it('resolves on HTTP 200', async () => {
    const progress: number[] = [];
    await uploadGuestFile(
      'demo',
      { uri: 'file:///a.jpg', name: 'a.jpg', mimeType: 'image/jpeg' },
      'Guest',
      'guest-key',
      (p) => progress.push(p),
    );
    expect(progress).toContain(100);
  });

  it('throws UploadError on final 4xx', async () => {
    class FailXHR extends MockXHR {
      status = 413;
      responseText = JSON.stringify({ error: 'too big', code: 'FILE_TOO_LARGE', maxBytes: 100 });
    }
    // @ts-expect-error test mock
    global.XMLHttpRequest = FailXHR;

    await expect(
      uploadGuestFile(
        'demo',
        { uri: 'file:///a.jpg', name: 'a.jpg', mimeType: 'image/jpeg' },
        undefined,
        'gk',
        () => {},
        0,
      ),
    ).rejects.toBeInstanceOf(UploadError);
  });
});
