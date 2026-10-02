import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { PrimaryButton, GhostButton } from '@/src/components/ui';
import { SEED } from '@/src/constants/images';
import { colors } from '@/src/theme/colors';
import { fonts } from '@/src/theme/typography';

export default function HomeScreen() {
  const { t } = useTranslation();
  const steps = [
    { icon: '📷', title: t('step1Title'), sub: t('step1Short') },
    { icon: '⬆️', title: t('step2Title'), sub: t('step2Short') },
    { icon: '✨', title: t('step3Title'), sub: t('step3Short') },
  ];

  return (
    <View style={styles.root}>
      <Image source={{ uri: SEED.hero }} style={StyleSheet.absoluteFill} contentFit="cover" />
      <LinearGradient colors={['rgba(0,0,0,0.35)', 'rgba(13,13,15,0.92)', colors.bg]} style={StyleSheet.absoluteFill} />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.mark}>{t('appNameMark')}</Text>
        <Text style={styles.headline}>{t('homeHeadline')}</Text>

        <View style={styles.cta}>
          <PrimaryButton label={t('homeGuestCta')} onPress={() => router.push('/scan')} />
          <GhostButton label={t('homeHostCta')} onPress={() => router.push('/host/login')} />
        </View>

        <Text style={styles.how}>{t('howItWorks')}</Text>
        <View style={styles.steps}>
          {steps.map((s) => (
            <View key={s.title} style={styles.step}>
              <Text style={styles.stepIcon}>{s.icon}</Text>
              <Text style={styles.stepTitle}>{s.title}</Text>
              <Text style={styles.stepSub}>{s.sub}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  scroll: { paddingHorizontal: 24, paddingTop: 56, paddingBottom: 40 },
  mark: {
    color: colors.lime,
    fontFamily: fonts.display,
    fontSize: 34,
    fontWeight: '800',
  },
  headline: {
    color: colors.fg,
    fontFamily: fonts.display,
    fontSize: 26,
    lineHeight: 34,
    fontWeight: '700',
    marginTop: 16,
  },
  cta: { marginTop: 28, gap: 12 },
  how: {
    marginTop: 36,
    color: colors.muted,
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  steps: { flexDirection: 'row', gap: 10, marginTop: 14 },
  step: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    minHeight: 100,
  },
  stepIcon: { fontSize: 22 },
  stepTitle: {
    color: colors.fg,
    fontFamily: fonts.bodyMedium,
    fontWeight: '700',
    marginTop: 8,
    fontSize: 13,
  },
  stepSub: { color: colors.muted, fontSize: 11, marginTop: 4, lineHeight: 15 },
});
