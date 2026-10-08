import { Image } from 'expo-image';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';
import { CameraControlButton } from '@/src/components/guest/CameraControlButton';
import { ShutterButton } from '@/src/components/guest/ShutterButton';
import { SEED } from '@/src/constants/images';
import { colors } from '@/src/theme/colors';
import { fonts } from '@/src/theme/typography';

const queue = [
  { id: '1', uri: SEED.photo1, progress: 64 },
  { id: '2', uri: SEED.photo2, progress: 100 },
];

export default function PreviewUploadScreen() {
  const { t } = useTranslation();

  return (
    <View style={styles.root} testID="guest-camera">
      <Image source={{ uri: SEED.cover }} style={styles.viewfinder} contentFit="cover" />
      <View style={styles.pill}>
        <Text style={styles.pillText}>{t('shotsLeft')}: 3</Text>
      </View>

      <View style={styles.queue} testID="upload-queue">
        {queue.map((item) => (
          <View key={item.id} style={styles.thumbWrap}>
            <Image source={{ uri: item.uri }} style={styles.thumb} contentFit="cover" />
            <View style={[styles.bar, { width: `${item.progress}%` }]} />
          </View>
        ))}
      </View>

      <View style={styles.controls}>
        <Text style={styles.sideBtn}>{t('gallery')}</Text>
        <ShutterButton onPress={() => {}} />
        <View style={styles.rightCol}>
          <CameraControlButton icon="camera-reverse-outline" label={t('flip')} onPress={() => {}} />
          <CameraControlButton icon="flash-off-outline" label={t('flashOff')} onPress={() => {}} />
        </View>
      </View>
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
  },
  pillText: { color: colors.lime, fontFamily: fonts.bodyMedium, fontWeight: '800', fontSize: 12 },
  queue: {
    position: 'absolute',
    bottom: 120,
    left: 16,
    flexDirection: 'row',
    gap: 8,
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
  },
  sideBtn: {
    color: colors.fg,
    fontFamily: fonts.bodyMedium,
    fontWeight: '700',
    fontSize: 13,
    width: 72,
    textAlign: 'center',
  },
  rightCol: { flexDirection: 'row', gap: 4, alignItems: 'flex-end' },
});
