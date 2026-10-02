import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';
import { LanguageSwitcher } from '@/src/components/LanguageSwitcher';
import { Card, GhostButton, PrimaryButton, Screen, Subtitle, Title } from '@/src/components/ui';
import { config } from '@/src/config';
import { colors } from '@/src/theme/colors';

export default function HomeScreen() {
  const { t } = useTranslation();

  return (
    <Screen style={styles.root}>
      <View style={styles.top}>
        <Text style={styles.logo}>{t('appName')}</Text>
        <LanguageSwitcher />
      </View>

      <View style={styles.hero}>
        <View style={styles.glowSky} />
        <View style={styles.glowLime} />
        <Title>{t('tagline')}</Title>
        <Subtitle>QR · ორიგინალი · ლაივ ალბომი</Subtitle>
      </View>

      {config.useMockApi && (
        <Card style={styles.mock}>
          <Text style={styles.mockText}>{t('mockBanner')}</Text>
        </Card>
      )}

      <View style={styles.actions}>
        <PrimaryButton label={t('scanQr')} onPress={() => router.push('/scan')} />
        <GhostButton label={t('guest')} onPress={() => router.push('/e/demo')} />
        <GhostButton label={t('openDemo')} onPress={() => router.push('/e/demo')} />
        <GhostButton label={t('host')} onPress={() => router.push('/host/login')} />
        <GhostButton label={t('start')} onPress={() => router.push('/onboarding')} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  root: { paddingBottom: 32 },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  logo: { color: colors.lime, fontSize: 22, fontWeight: '900' },
  hero: { marginTop: 48, marginBottom: 24, position: 'relative' },
  glowLime: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.lime,
    opacity: 0.12,
    top: -20,
    right: 0,
  },
  glowSky: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: colors.sky,
    opacity: 0.1,
    left: -10,
    bottom: 0,
  },
  actions: { gap: 12, marginTop: 8 },
  mock: { marginBottom: 16, borderColor: colors.amber },
  mockText: { color: colors.amber, fontSize: 13, fontWeight: '600' },
});
