import { useTranslation } from 'react-i18next';
import { FlatList, Image, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { ShutterButton } from '@/src/components/guest/ShutterButton';
import { GhostButton, PrimaryButton } from '@/src/components/ui';
import { colors } from '@/src/theme/colors';

const queue = [
  {
    id: '1',
    uri: 'https://qr.socialsave.cc/seed-samples/wedding-1.jpg',
    progress: 64,
  },
  {
    id: '2',
    uri: 'https://qr.socialsave.cc/seed-samples/wedding-6.jpg',
    progress: 100,
  },
];

export default function PreviewUploadScreen() {
  const { t } = useTranslation();
  return (
    <View style={styles.root} testID="guest-camera">
      <Image
        source={{ uri: 'https://qr.socialsave.cc/seed-samples/wedding-4.jpg' }}
        style={styles.camera}
      />
      <View style={styles.panel}>
        <Animated.View entering={FadeIn} testID="upload-queue">
          <Text style={styles.queueTitle}>{t('upload')} · 1/2</Text>
          <FlatList
            horizontal
            data={queue}
            keyExtractor={(i) => i.id}
            renderItem={({ item }) => (
              <View style={styles.thumbWrap}>
                <Image source={{ uri: item.uri }} style={styles.thumb} />
                <View style={[styles.bar, { width: `${item.progress}%` }]} />
                <Text style={styles.progress}>{item.progress}%</Text>
              </View>
            )}
          />
        </Animated.View>
        <View style={styles.controls}>
          <GhostButton label={t('gallery')} onPress={() => {}} />
          <ShutterButton onPress={() => {}} />
          <PrimaryButton label={t('upload')} onPress={() => {}} />
        </View>
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
  queueTitle: { color: colors.fg, fontWeight: '800', marginBottom: 8 },
  controls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  thumbWrap: { marginRight: 8, width: 72, height: 72 },
  thumb: { width: 72, height: 72, borderRadius: 12 },
  bar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    height: 4,
    backgroundColor: colors.lime,
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
});
