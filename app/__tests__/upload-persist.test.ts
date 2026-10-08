jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: { setItem: jest.fn(), getItem: jest.fn(), removeItem: jest.fn() },
}));
jest.mock('expo-file-system/legacy', () => ({
  cacheDirectory: 'file:///cache/',
  getInfoAsync: jest.fn(),
  makeDirectoryAsync: jest.fn(),
  copyAsync: jest.fn(),
}));

import { snapshotToQueueItems } from '@/src/lib/upload-persist';

describe('upload-persist', () => {
  it('restores pending items and resets uploading to pending', () => {
    const items = snapshotToQueueItems({
      slug: 'demo',
      guestName: 'ა',
      guestKey: 'gk',
      items: [
        {
          id: '1',
          idempotencyKey: 'k1',
          localUri: 'file:///a.jpg',
          name: 'a.jpg',
          mimeType: 'image/jpeg',
          status: 'uploading',
          progress: 40,
        },
        {
          id: '2',
          idempotencyKey: 'k2',
          localUri: 'file:///b.jpg',
          name: 'b.jpg',
          mimeType: 'image/jpeg',
          status: 'done',
          progress: 100,
        },
      ],
    });
    expect(items).toHaveLength(1);
    expect(items[0].status).toBe('pending');
    expect(items[0].idempotencyKey).toBe('k1');
  });
});
