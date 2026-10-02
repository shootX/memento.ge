import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';
import { api } from '@/src/api/client';
import { Card, Field, GhostButton, PrimaryButton, Screen, Subtitle, Title } from '@/src/components/ui';
import { useAuthStore } from '@/src/stores/auth-store';
import { config } from '@/src/config';

export default function HostLoginScreen() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const setSession = useAuthStore((s) => s.setSession);

  const sendLink = async () => {
    setError(null);
    await api.sendMagicLink(email.trim());
    setSent(true);
  };

  const verifyCode = async () => {
    setError(null);
    try {
      const res = await api.verifyLoginCode(email.trim(), code.trim());
      await setSession(res.accessToken, res.user.email);
      router.replace('/host/events');
    } catch {
      setError('კოდი არასწორია (დემოში — ნებისმიერი 6 ციფრი, გარდა 000000)');
    }
  };

  return (
    <Screen>
      <Title>{t('login')}</Title>
      <Subtitle>ელფოსტა + მაგიკ ლინკი / {t('codeLogin')}</Subtitle>

      <Card style={{ marginTop: 20, gap: 8 }}>
        <Field value={email} onChangeText={setEmail} placeholder="you@example.com" keyboardType="email-address" />
        {!sent ? (
          <PrimaryButton label={t('login')} onPress={() => void sendLink()} />
        ) : (
          <>
            <Text style={{ color: '#9ca3af' }}>{t('magicLinkSent')}: {email}</Text>
            <Field value={code} onChangeText={setCode} placeholder="123456" keyboardType="numeric" />
            <PrimaryButton label={t('continue')} onPress={() => void verifyCode()} />
            {error && <Text style={{ color: '#f87171' }}>{error}</Text>}
          </>
        )}
      </Card>

      <View style={{ marginTop: 16, gap: 8 }}>
        <GhostButton
          label="დემო პანელი (mock-token)"
          onPress={() => router.push('/host/mock-token-abc')}
        />
        {config.useMockApi && (
          <Text style={{ color: '#ffb020', fontSize: 12 }}>{t('mockBanner')}</Text>
        )}
      </View>
    </Screen>
  );
}
