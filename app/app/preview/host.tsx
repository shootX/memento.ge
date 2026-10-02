import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { Badge, GhostButton, PrimaryButton } from '@/src/components/ui';
import { colors } from '@/src/theme/colors';

const media = [
  { id: '1', url: 'https://qr.socialsave.cc/seed-samples/wedding-1.jpg', guestName: 'მარიამი' },
  { id: '2', url: 'https://qr.socialsave.cc/seed-samples/wedding-6.jpg', guestName: 'გიორგი' },
];

export default function PreviewHostScreen() {
  const { t } = useTranslation();
  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.scroll} testID="host-ready">
      <View style={styles.hero}>
        <Image
          source={{ uri: 'https://qr.socialsave.cc/seed-samples/wedding-4.jpg' }}
          style={styles.cover}
          contentFit="cover"
        />
        <LinearGradient colors={['transparent', colors.bg]} style={styles.heroGrad} />
        <View style={styles.heroText}>
          <Badge color={colors.amber}>გადაუხდელი</Badge>
          <Text style={styles.couple}>ნინო & გიორგი</Text>
          <Text style={styles.meta}>14 ივნისი, 2026 · 12/600</Text>
        </View>
      </View>
      <Animated.View entering={FadeInUp} style={styles.body}>
        <PrimaryButton label={t('pay')} onPress={() => {}} />
        <GhostButton label={t('slideshow')} onPress={() => {}} />
        <Text style={styles.section}>{t('album')}</Text>
        <View style={styles.grid}>
          {media.map((m) => (
            <View key={m.id} style={styles.tile}>
              <Image source={{ uri: m.url }} style={styles.img} contentFit="cover" />
              <Text style={styles.guest}>{m.guestName}</Text>
            </View>
          ))}
        </View>
      </Animated.View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  scroll: { paddingBottom: 40 },
  hero: { height: 280 },
  cover: { ...StyleSheet.absoluteFill },
  heroGrad: { position: 'absolute', left: 0, right: 0, bottom: 0, height: '70%' },
  heroText: { position: 'absolute', left: 20, right: 20, bottom: 20 },
  couple: { color: colors.fg, fontSize: 28, fontWeight: '900', marginTop: 10 },
  meta: { color: colors.muted, marginTop: 6 },
  body: { padding: 20, gap: 10 },
  section: { color: colors.fg, fontWeight: '800', fontSize: 18, marginTop: 8 },
  grid: { flexDirection: 'row', gap: 10 },
  tile: { flex: 1, borderRadius: 16, overflow: 'hidden' },
  img: { width: '100%', aspectRatio: 3 / 4 },
  guest: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    color: '#fff',
    padding: 6,
    backgroundColor: 'rgba(0,0,0,0.55)',
    fontWeight: '700',
    fontSize: 11,
  },
});
