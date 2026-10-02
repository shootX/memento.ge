import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, FlatList, Image, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { GhostButton, PrimaryButton, Screen, Subtitle } from '@/src/components/ui';
import { type QueueItem, runUploadQueue } from '@/src/lib/upload-queue';
import { colors } from '@/src/theme/colors';

export default function GuestCameraScreen() {
  const { slug, guestName, guestKey } = useLocalSearchParams<{
    slug: string;
    guestName?: string;
    guestKey: string;
  }>();
  const { t } = useTranslation();
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [uploading, setUploading] = useState(false);
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
    if (!queue.length) return;
    setUploading(true);
    const update = (id: string, patch: Partial<QueueItem>) => {
      setQueue((prev) => prev.map((item) => (item.id === id ? { ...item, ...patch } : item)));
    };
    await runUploadQueue(queue, slug, guestName ?? '', guestKey, update, 3);
    setUploading(false);
    setDone(true);
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  if (!permission?.granted) {
    return (
      <Screen>
        <Subtitle>{t('takePhoto')}</Subtitle>
        <PrimaryButton label="ნებართვა" onPress={() => void requestPermission()} />
      </Screen>
    );
  }

  return (
    <View style={styles.root}>
      <CameraView ref={cameraRef} style={styles.camera} facing="back" />
      <View style={styles.panel}>
        <Subtitle>{pending.length ? `${pending.length} ფაილი` : t('takePhoto')}</Subtitle>
        <View style={styles.row}>
          <PrimaryButton label={t('takePhoto')} onPress={() => void takePhoto()} />
          <GhostButton label={t('gallery')} onPress={() => void pickGallery()} />
        </View>
        {queue.length > 0 && (
          <>
            <FlatList
              horizontal
              data={queue}
              keyExtractor={(i) => i.id}
              renderItem={({ item }) => (
                <View style={styles.thumbWrap}>
                  <Image source={{ uri: item.file.uri }} style={styles.thumb} />
                  <Text style={styles.progress}>{item.progress}%</Text>
                </View>
              )}
            />
            <PrimaryButton
              label={uploading ? '…' : t('upload')}
              disabled={uploading}
              onPress={() => void startUpload()}
            />
          </>
        )}
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
  panel: {
    backgroundColor: colors.bgElevated,
    padding: 16,
    gap: 10,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  row: { flexDirection: 'row', gap: 10 },
  thumbWrap: { marginRight: 8, position: 'relative' },
  thumb: { width: 64, height: 64, borderRadius: 12 },
  progress: {
    position: 'absolute',
    bottom: 2,
    right: 4,
    color: colors.lime,
    fontSize: 10,
    fontWeight: '800',
  },
});
