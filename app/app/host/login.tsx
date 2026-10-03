import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { api } from '@/src/api/client';
import { CodeInput } from '@/src/components/CodeInput';
import { Card, Field, GhostButton, PrimaryButton } from '@/src/components/ui';
import { SEED } from '@/src/constants/images';
import { useAuthStore } from '@/src/stores/auth-store';
import { colors } from '@/src/theme/colors';
import { fonts } from '@/src/theme/typography';

export default function HostLoginScreen() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const setSession = useAuthStore((s) => s.setSession);

  const sendLink = async () => {
    if (busy || !email.trim().includes('@')) {
      if (!email.trim().includes('@')) setError(t('loginEmailInvalid'));
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await api.sendMagicLink(email.trim());
      setStep('code');
    } catch {
      setError(t('retry'));
    } finally {
      setBusy(false);
    }
  };

  const verifyCode = async () => {
    if (busy || code.trim().length < 6) return;
    setBusy(true);
    setError(null);
    try {
      const res = await api.verifyLoginCode(email.trim(), code.trim());
      await setSession(res.accessToken, res.user.email);
      router.replace('/host/events');
    } catch {
      setError(t('invalidCode'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.scroll} testID="host-login">
      <Image source={{ uri: SEED.cover }} style={styles.hero} contentFit="cover" />
      <Text style={styles.title}>{t('login')}</Text>
      <Text style={styles.sub}>{t('loginSubtitle')}</Text>

      <Card style={styles.card}>
        {step === 'email' ? (
          <>
            <Field
              value={email}
              onChangeText={setEmail}
              placeholder={t('emailPlaceholder')}
              keyboardType="email-address"
            />
            <PrimaryButton label={t('sendCode')} disabled={busy} onPress={() => void sendLink()} />
          </>
        ) : (
          <>
            <Text style={styles.sent}>{t('magicLinkSent')}: {email}</Text>
            <CodeInput value={code} onChange={setCode} />
            <PrimaryButton label={t('verifyCode')} disabled={busy} onPress={() => void verifyCode()} />
            <GhostButton label={t('resendCode')} onPress={() => void sendLink()} />
            {error && <Text style={styles.error}>{error}</Text>}
          </>
        )}
      </Card>

      {__DEV__ && (
        <GhostButton label={t('demoPanel')} onPress={() => router.push('/preview/host')} />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: 24, paddingBottom: 40 },
  hero: { width: '100%', height: 160, borderRadius: 20, marginBottom: 20 },
  title: { color: colors.fg, fontFamily: fonts.display, fontSize: 28, fontWeight: '800' },
  sub: { color: colors.muted, marginTop: 8, lineHeight: 22, fontFamily: fonts.body },
  card: { marginTop: 20, gap: 12 },
  sent: { color: colors.muted, fontSize: 13, fontFamily: fonts.body },
  error: { color: colors.danger, fontFamily: fonts.bodyMedium },
});
