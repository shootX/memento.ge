import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInRight, FadeOutLeft } from 'react-native-reanimated';
import { Card, GhostButton, PrimaryButton, Screen, Subtitle, Title } from '@/src/components/ui';
import { colors } from '@/src/theme/colors';

const slides = [
  { titleKey: 'onboarding1Title', bodyKey: 'onboarding1Body', accent: colors.lime },
  { titleKey: 'onboarding2Title', bodyKey: 'onboarding2Body', accent: colors.sky },
  { titleKey: 'onboarding3Title', bodyKey: 'onboarding3Body', accent: colors.amber },
] as const;

export default function OnboardingScreen() {
  const { t } = useTranslation();
  const [idx, setIdx] = useState(0);
  const slide = slides[idx];

  return (
    <Screen>
      <Animated.View entering={FadeInRight} exiting={FadeOutLeft} key={idx}>
        <Card style={{ ...styles.card, borderColor: slide.accent }}>
          <View style={[styles.dot, { backgroundColor: slide.accent }]} />
          <Title>{t(slide.titleKey)}</Title>
          <Subtitle>{t(slide.bodyKey)}</Subtitle>
        </Card>
      </Animated.View>

      <View style={styles.dots}>
        {slides.map((_, i) => (
          <View key={i} style={[styles.pager, i === idx && styles.pagerActive]} />
        ))}
      </View>

      <View style={styles.actions}>
        {idx < slides.length - 1 ? (
          <>
            <PrimaryButton label={t('next')} onPress={() => setIdx((v) => v + 1)} />
            <GhostButton label={t('skip')} onPress={() => router.replace('/')} />
          </>
        ) : (
          <PrimaryButton label={t('start')} onPress={() => router.replace('/scan')} />
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { marginTop: 40, minHeight: 220 },
  dot: { width: 10, height: 10, borderRadius: 5, marginBottom: 12 },
  dots: { flexDirection: 'row', gap: 8, marginTop: 24, justifyContent: 'center' },
  pager: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.border },
  pagerActive: { width: 24, backgroundColor: colors.lime },
  actions: { marginTop: 32, gap: 12 },
});
