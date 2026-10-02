import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { Badge, GhostButton, PrimaryButton } from '@/src/components/ui';
import { SEED } from '@/src/constants/images';
import { colors } from '@/src/theme/colors';
import { fonts } from '@/src/theme/typography';

const media = [
  { id: '1', url: SEED.photo1, guestName: 'მარიამი' },
  { id: '2', url: SEED.photo2, guestName: 'გიორგი' },
  { id: '3', url: SEED.photo3, guestName: 'ანა' },
  { id: '4', url: SEED.cover, guestName: 'ლუკა' },
  { id: '5', url: SEED.photo2, guestName: 'ნინო' },
  { id: '6', url: SEED.photo1, guestName: 'გიორგი' },
];

export default function PreviewHostScreen() {
  const { t } = useTranslation();
  const stats = [
    { label: t('statPhotos'), value: '12' },
    { label: t('statGuests'), value: '48' },
    { label: t('statDays'), value: '90' },
  ];

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.scroll} testID="host-ready">
      <View style={styles.hero}>
        <Image source={{ uri: SEED.cover }} style={styles.cover} contentFit="cover" />
        <LinearGradient colors={['transparent', colors.bg]} style={styles.heroGrad} />
        <View style={styles.heroText}>
          <Badge color={colors.amber}>{t('unpaid')}</Badge>
          <Text style={styles.couple}>ნინო & გიორგი</Text>
          <Text style={styles.meta}>14 ივნისი, 2026</Text>
        </View>
      </View>

      <Animated.View entering={FadeInUp} style={styles.body}>
        <View style={styles.stats}>
          {stats.map((s) => (
            <View key={s.label} style={styles.statCard}>
              <Text style={styles.statVal}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        <View style={styles.qrCard}>
          <Text style={styles.qrTitle}>{t('qrCardTitle')}</Text>
          <Text style={styles.qrHint}>{t('qrCardHint')}</Text>
          <View style={styles.qrBox} />
          <GhostButton label={t('share')} onPress={() => {}} />
        </View>

        <PrimaryButton label={t('pay')} onPress={() => {}} />
        <GhostButton label={t('slideshow')} onPress={() => {}} />

        <Text style={styles.section}>{t('album')}</Text>
        <View style={styles.grid}>
          {media.map((m) => (
            <View key={m.id} style={styles.tile}>
              <Image source={{ uri: m.url }} style={styles.img} contentFit="cover" />
              <Text style={styles.guest} numberOfLines={1}>{m.guestName}</Text>
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
  hero: { height: 240 },
  cover: { ...StyleSheet.absoluteFill },
  heroGrad: { position: 'absolute', left: 0, right: 0, bottom: 0, height: '70%' },
  heroText: { position: 'absolute', left: 20, right: 20, bottom: 16 },
  couple: { color: colors.fg, fontFamily: fonts.display, fontSize: 26, fontWeight: '800', marginTop: 8 },
  meta: { color: colors.muted, marginTop: 4, fontFamily: fonts.body },
  body: { padding: 20, gap: 12 },
  stats: { flexDirection: 'row', gap: 8 },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    alignItems: 'center',
  },
  statVal: { color: colors.lime, fontFamily: fonts.display, fontSize: 22, fontWeight: '800' },
  statLabel: { color: colors.muted, fontSize: 11, marginTop: 4, fontFamily: fonts.body },
  qrCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    gap: 8,
  },
  qrTitle: { color: colors.fg, fontFamily: fonts.bodyMedium, fontWeight: '800' },
  qrHint: { color: colors.muted, fontSize: 13, fontFamily: fonts.body },
  qrBox: {
    height: 120,
    borderRadius: 12,
    backgroundColor: colors.bgElevated,
    borderWidth: 1,
    borderColor: colors.lime,
  },
  section: { color: colors.fg, fontFamily: fonts.display, fontSize: 18, marginTop: 8 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tile: {
    width: '31.5%',
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: colors.surface,
  },
  img: { width: '100%', aspectRatio: 3 / 4 },
  guest: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    color: '#fff',
    fontSize: 9,
    padding: 4,
    backgroundColor: 'rgba(0,0,0,0.55)',
    fontFamily: fonts.bodyMedium,
  },
});
