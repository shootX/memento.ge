import { CameraView, useCameraPermissions } from 'expo-camera';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import * as Network from 'expo-network';
import { useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  AppState,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { PrimaryButton, Screen } from '@/src/components/ui';
import { CameraControlButton } from '@/src/components/guest/CameraControlButton';
import { ShutterButton } from '@/src/components/guest/ShutterButton';
import { SEED } from '@/src/constants/images';
import { DEMO_GUEST_KEY, isDemoSlug } from '@/src/lib/demo';
import {
  clearUploadQueue,
  createIdempotencyKey,
  loadUploadQueue,
  saveUploadQueue,
  snapshotToQueueItems,
  stageUploadFile,
} from '@/src/lib/upload-persist';
import { type QueueItem, runUploadQueue } from '@/src/lib/upload-queue';
import { colors } from '@/src/theme/colors';
import { fonts } from '@/src/theme/typography';

export default function GuestCameraScreen() {
  const { slug, guestName, guestKey, preview } = useLocalSearchParams<{
    slug: string;
    guestName?: string;
    guestKey: string;
    preview?: string;
  }>();
  const { t } = useTranslation();
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const [flash, setFlash] = useState<'off' | 'on'>('off');
  const [facing, setFacing] = useState<'back' | 'front'>('back');
  const [queue, setQueue] = useState<QueueItem[]>(() =>
    preview === 'upload'
      ? [
          {
            id: 'p1',
            idempotencyKey: 'preview-p1',
            file: {
              uri: SEED.photo1,
              name: 'wedding-2.jpg',
              mimeType: 'image/jpeg',
            },
            status: 'uploading',
            progress: 64,
          },
          {
            id: 'p2',
            idempotencyKey: 'preview-p2',
            file: {
              uri: SEED.photo2,
              name: 'wedding-6.jpg',
              mimeType: 'image/jpeg',
            },
            status: 'done',
            progress: 100,
          },
        ]
      : [],
  );
  const [uploading, setUploading] = useState(preview === 'upload');
  const [done, setDone] = useState(false);
  const uploadingRef = useRef(false);
  const queueRef = useRef(queue);

  useEffect(() => {
    queueRef.current = queue;
  }, [queue]);

  const guestKeyResolved = guestKey || (isDemoSlug(slug) ? DEMO_GUEST_KEY : '');
  const pending = useMemo(() => queue.filter((q) => q.status !== 'done'), [queue]);

  const persistQueue = useCallback(
    async (items: QueueItem[]) => {
      if (preview === 'upload') return;
      await saveUploadQueue(
        { slug, guestName: guestName ?? '', guestKey: guestKeyResolved },
        items,
      );
    },
    [slug, guestName, guestKeyResolved, preview],
  );

  useEffect(() => {
    if (preview === 'upload') return;
    void loadUploadQueue(slug).then((snap) => {
      if (!snap) return;
      const restored = snapshotToQueueItems(snap);
      if (restored.length) setQueue(restored);
    });
  }, [slug, preview]);

  const startUpload = useCallback(async () => {
    if (!queueRef.current.length || preview === 'upload' || uploadingRef.current) return;
    uploadingRef.current = true;
    setUploading(true);
    const items = [...queueRef.current];
    const update = (id: string, patch: Partial<QueueItem>) => {
      setQueue((prev) => {
        const next = prev.map((item) => (item.id === id ? { ...item, ...patch } : item));
        queueRef.current = next;
        void persistQueue(next);
        return next;
      });
    };
    const gk = guestKeyResolved;
    await runUploadQueue(items, slug, guestName ?? '', gk, update, 3);
    uploadingRef.current = false;
    setUploading(false);
    setDone(true);
    const remaining = queueRef.current.filter((i) => i.status !== 'done');
    if (remaining.length === 0) await clearUploadQueue(slug);
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [slug, guestName, guestKeyResolved, preview, persistQueue]);

  useEffect(() => {
    if (preview === 'upload') return;
    const onActive = (state: string) => {
      if (state === 'active' && pending.length > 0) void startUpload();
    };
    const sub = AppState.addEventListener('change', onActive);
    return () => sub.remove();
  }, [pending.length, preview, startUpload]);

  useEffect(() => {
    if (preview === 'upload') return;
    const timer = setInterval(() => {
      void Network.getNetworkStateAsync().then((net) => {
        if (net.isConnected && net.isInternetReachable !== false && pending.length > 0) {
          void startUpload();
        }
      });
    }, 8000);
    return () => clearInterval(timer);
  }, [pending.length, preview, startUpload]);

  const enqueueFiles = async (assets: ImagePicker.ImagePickerAsset[]) => {
    const items: QueueItem[] = [];
    for (const a of assets) {
      const idempotencyKey = createIdempotencyKey();
      const stagedUri =
        preview === 'upload'
          ? a.uri
          : await stageUploadFile(a.uri, idempotencyKey);
      items.push({
        id: `${Date.now()}-${a.assetId ?? Math.random()}`,
        idempotencyKey,
        file: {
          uri: stagedUri,
          name: a.fileName ?? `photo-${Date.now()}.jpg`,
          mimeType: a.mimeType ?? 'image/jpeg',
        },
        status: 'pending',
        progress: 0,
      });
    }
    setQueue((prev) => {
      const next = [...prev, ...items];
      queueRef.current = next;
      void persistQueue(next);
      return next;
    });
    setDone(false);
  };

  const pickGallery = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images', 'videos'],
      allowsMultipleSelection: true,
      quality: 1,
    });
    if (!res.canceled) await enqueueFiles(res.assets);
  };

  const takePhoto = async () => {
    if (Platform.OS === 'web') {
      await pickGallery();
      return;
    }
    const photo = await cameraRef.current?.takePictureAsync({ quality: 1 });
    if (photo?.uri) {
      await enqueueFiles([
        {
          uri: photo.uri,
          width: photo.width,
          height: photo.height,
          fileName: `capture-${Date.now()}.jpg`,
          mimeType: 'image/jpeg',
        },
      ]);
    }
  };

  const showCamera = permission?.granted && Platform.OS !== 'web';

  if (!showCamera && !permission?.granted) {
    return (
      <Screen testID="camera-permission">
        <Text style={styles.permHint}>{t('cameraPermission')}</Text>
        <PrimaryButton label={t('grantPermission')} onPress={() => void requestPermission()} />
        <Pressable
          onPress={() => void pickGallery()}
          style={styles.permGallery}
          accessibilityRole="button"
          accessibilityLabel={t('gallery')}
        >
          <Text style={styles.sideBtn}>{t('gallery')}</Text>
        </Pressable>
      </Screen>
    );
  }

  return (
    <View style={styles.root} testID="guest-camera">
      {showCamera ? (
        <CameraView ref={cameraRef} style={styles.viewfinder} facing={facing} flash={flash} />
      ) : (
        <Image source={{ uri: SEED.cover }} style={styles.viewfinder} contentFit="cover" />
      )}

      <View style={styles.pill}>
        <Text style={styles.pillText}>{t('shotsLeft')}: {pending.length || 3}</Text>
      </View>

      {queue.length > 0 && (
        <View style={styles.queue} testID="upload-queue">
          {queue.map((item) => (
            <View key={item.id} style={styles.thumbWrap}>
              <Image source={{ uri: item.file.uri }} style={styles.thumb} contentFit="cover" />
              <View style={[styles.bar, { width: `${item.progress}%` }]} />
            </View>
          ))}
        </View>
      )}

      <View style={styles.controls}>
        <Pressable
          onPress={() => void pickGallery()}
          style={styles.galleryHit}
          accessibilityRole="button"
          accessibilityLabel={t('gallery')}
        >
          <Text style={styles.sideBtn}>{t('gallery')}</Text>
        </Pressable>
        <ShutterButton label={t('takePhoto')} onPress={() => void takePhoto()} />
        <View style={styles.rightCol}>
          <CameraControlButton
            icon="camera-reverse-outline"
            label={t('flip')}
            onPress={() => {
              setFacing((f) => (f === 'back' ? 'front' : 'back'));
              void Haptics.selectionAsync();
            }}
          />
          <CameraControlButton
            icon={flash === 'on' ? 'flash-outline' : 'flash-off-outline'}
            label={flash === 'on' ? t('flashOn') : t('flashOff')}
            active={flash === 'on'}
            onPress={() => {
              setFlash((f) => (f === 'off' ? 'on' : 'off'));
              void Haptics.selectionAsync();
            }}
          />
        </View>
      </View>

      {queue.length > 0 && !uploading && !done && preview !== 'upload' && (
        <Pressable
          style={styles.uploadFab}
          onPress={() => void startUpload()}
          accessibilityRole="button"
          accessibilityLabel={t('upload')}
        >
          <Text style={styles.uploadFabText}>{t('upload')}</Text>
        </Pressable>
      )}
      {uploading && <ActivityIndicator style={styles.spinner} color={colors.lime} />}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  viewfinder: { ...StyleSheet.absoluteFill },
  pill: {
    position: 'absolute',
    top: 16,
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(196,255,13,0.4)',
    zIndex: 2,
  },
  pillText: { color: colors.lime, fontFamily: fonts.bodyMedium, fontWeight: '800', fontSize: 12 },
  queue: {
    position: 'absolute',
    bottom: 120,
    left: 16,
    flexDirection: 'row',
    gap: 8,
    zIndex: 2,
  },
  thumbWrap: { width: 56, height: 56, borderRadius: 10, overflow: 'hidden' },
  thumb: { width: '100%', height: '100%' },
  bar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    height: 3,
    backgroundColor: colors.lime,
  },
  controls: {
    position: 'absolute',
    bottom: 28,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 24,
    zIndex: 2,
  },
  galleryHit: { minWidth: 44, minHeight: 44, justifyContent: 'center', alignItems: 'center' },
  sideBtn: {
    color: colors.fg,
    fontFamily: fonts.bodyMedium,
    fontWeight: '700',
    fontSize: 13,
    width: 72,
    textAlign: 'center',
  },
  rightCol: { flexDirection: 'row', gap: 4, alignItems: 'flex-end' },
  uploadFab: {
    position: 'absolute',
    bottom: 100,
    alignSelf: 'center',
    backgroundColor: colors.lime,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 999,
    zIndex: 2,
    minHeight: 44,
    justifyContent: 'center',
  },
  uploadFabText: { color: colors.limeOn, fontWeight: '800', fontFamily: fonts.bodyMedium },
  spinner: { position: 'absolute', bottom: 100, alignSelf: 'center' },
  permHint: { color: colors.fg, marginBottom: 12, fontFamily: fonts.bodyMedium, fontWeight: '700' },
  permGallery: { marginTop: 16, alignSelf: 'center', minHeight: 44, justifyContent: 'center' },
});
