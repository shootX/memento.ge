import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import Animated, { FadeIn } from 'react-native-reanimated';
import { GhostButton, PrimaryButton, Screen } from '@/src/components/ui';
import { ShutterButton } from '@/src/components/guest/ShutterButton';
import { DEMO_GUEST_KEY, isDemoSlug } from '@/src/lib/demo';
import { type QueueItem, runUploadQueue } from '@/src/lib/upload-queue';
import { colors } from '@/src/theme/colors';

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
  const [queue, setQueue] = useState<QueueItem[]>(() =>
    preview === 'upload'
      ? [
          {
            id: 'p1',
            file: {
              uri: 'https://qr.socialsave.cc/seed-samples/wedding-1.jpg',
              name: 'wedding-1.jpg',
              mimeType: 'image/jpeg',
            },
            status: 'uploading',
            progress: 64,
          },
          {
            id: 'p2',
            file: {
              uri: 'https://qr.socialsave.cc/seed-samples/wedding-6.jpg',
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

  const pending = useMemo(() => queue.filter((q) => q.status !== 'done'), [queue]);

  const enqueueFiles = (assets: ImagePicker.ImagePickerAsset[]) => {
    const items: QueueItem[] = assets.map((a) => ({
      id: `${Date.now()}-${a.assetId ?? Math.random()}`,
      file: {
        uri: a.uri,
        name: a.fileName ?? `photo-${Date.now()}.jpg`,
        mimeType: a.mimeType ?? 'image/jpeg',
      },
      status: 'pending',
      progress: 0,
    }));
    setQueue((prev) => [...prev, ...items]);
    setDone(false);
  };

  const pickGallery = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images', 'videos'],
      allowsMultipleSelection: true,
      quality: 1,
    });
    if (!res.canceled) enqueueFiles(res.assets);
  };

  const takePhoto = async () => {
    if (Platform.OS === 'web') {
      await pickGallery();
      return;
    }
    const photo = await cameraRef.current?.takePictureAsync({ quality: 1 });
    if (photo?.uri) {
      enqueueFiles([
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

  const startUpload = async () => {
    if (!queue.length || preview === 'upload') return;
    setUploading(true);
    const update = (id: string, patch: Partial<QueueItem>) => {
      setQueue((prev) => prev.map((item) => (item.id === id ? { ...item, ...patch } : item)));
    };
    const gk = guestKey || (isDemoSlug(slug) ? DEMO_GUEST_KEY : '');
    await runUploadQueue(queue, slug, guestName ?? '', gk, update, 3);
    setUploading(false);
    setDone(true);
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const showCamera = permission?.granted && Platform.OS !== 'web';

  if (!showCamera && !permission?.granted) {
    return (
      <Screen testID="camera-permission">
        <Text style={styles.hint}>{t('takePhoto')}</Text>
        <PrimaryButton label="ნებართვა" onPress={() => void requestPermission()} />
        <GhostButton label={t('gallery')} onPress={() => void pickGallery()} />
      </Screen>
    );
  }

  return (
    <View style={styles.root} testID="guest-camera">
      {showCamera ? (
        <CameraView ref={cameraRef} style={styles.camera} facing="back" flash={flash} />
      ) : (
        <Image
          source={{ uri: 'https://qr.socialsave.cc/seed-samples/wedding-4.jpg' }}
          style={styles.camera}
        />
      )}

      <View style={styles.topHud}>
        <Pressable
          onPress={() => {
            setFlash((f) => (f === 'off' ? 'on' : 'off'));
            void Haptics.selectionAsync();
          }}
          style={styles.flashBtn}
        >
          <Text style={styles.flashText}>{flash === 'on' ? '⚡ ON' : '⚡ OFF'}</Text>
        </Pressable>
      </View>

      <View style={styles.panel}>
        {queue.length > 0 && (
          <Animated.View entering={FadeIn} testID="upload-queue">
            <Text style={styles.queueTitle} numberOfLines={1}>
              {t('upload')} · {pending.length}/{queue.length}
            </Text>
            <FlatList
              horizontal
              data={queue}
              keyExtractor={(i) => i.id}
              renderItem={({ item }) => (
                <View style={styles.thumbWrap}>
                  <Image source={{ uri: item.file.uri }} style={styles.thumb} />
                  <View style={[styles.bar, { width: `${item.progress}%` }]} />
                  <Text style={styles.progress}>{item.progress}%</Text>
                </View>
              )}
            />
          </Animated.View>
        )}

        <View style={styles.controls}>
          <GhostButton label={t('gallery')} onPress={() => void pickGallery()} />
          <ShutterButton onPress={() => void takePhoto()} />
          {queue.length > 0 ? (
            <PrimaryButton
              label={uploading ? '…' : t('upload')}
              disabled={uploading || preview === 'upload'}
              onPress={() => void startUpload()}
            />
          ) : (
            <View style={{ width: 88 }} />
          )}
        </View>
        {uploading && <ActivityIndicator color={colors.lime} />}
        {done && !uploading && (
          <PrimaryButton label={t('uploadMore')} onPress={() => setQueue([])} />
        )}
        <GhostButton label={t('album')} onPress={() => router.push(`/gallery/${slug}`)} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  camera: { flex: 1 },
  topHud: { position: 'absolute', top: 16, right: 16, zIndex: 2 },
  flashBtn: {
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  flashText: { color: colors.lime, fontWeight: '800', fontSize: 12 },
  panel: {
    backgroundColor: colors.bgElevated,
    padding: 16,
    gap: 10,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  queueTitle: { color: colors.fg, fontWeight: '800', marginBottom: 8 },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  thumbWrap: { marginRight: 8, position: 'relative', width: 72, height: 72 },
  thumb: { width: 72, height: 72, borderRadius: 12 },
  bar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    height: 4,
    backgroundColor: colors.lime,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  progress: {
    position: 'absolute',
    top: 4,
    right: 4,
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 4,
    borderRadius: 4,
  },
  hint: { color: colors.fg, marginBottom: 12, fontWeight: '700' },
});
