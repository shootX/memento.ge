import { useLocalSearchParams } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { api } from '@/src/api/client';
import { PrimaryButton, Screen, Title } from '@/src/components/ui';
import { colors } from '@/src/theme/colors';

export default function HostPayScreen() {
  const { token, preview } = useLocalSearchParams<{ token: string; preview?: string }>();
  const { t } = useTranslation();
  const [opening, setOpening] = useState(preview !== 'ui');
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);

  useEffect(() => {
    if (preview === 'ui') return;
    (async () => {
      try {
        const session = await api.createPaymentSession(
          token,
          `memento://host/${token}/pay-complete`,
        );
        setCheckoutUrl(session.checkoutUrl);
        await WebBrowser.openBrowserAsync(session.checkoutUrl, {
          presentationStyle: WebBrowser.WebBrowserPresentationStyle.FULL_SCREEN,
        });
      } finally {
        setOpening(false);
      }
    })();
  }, [token, preview]);

  return (
    <Screen testID="host-pay">
      <Title>{t('pay')}</Title>
      <View style={styles.card}>
        <Text style={styles.provider}>TBC / BOG</Text>
        <Text style={styles.amount}>99 ₾</Text>
        <Text style={styles.hint} numberOfLines={3}>
          გადახდის შემდეგ ალბომი აქტიურდება — სტუმრები ატვირთავენ ფოტოებს.
        </Text>
        {opening ? (
          <ActivityIndicator color={colors.lime} style={{ marginTop: 16 }} />
        ) : (
          <PrimaryButton
            label="გადახდის გაგრძელება"
            onPress={() => {
              const url = checkoutUrl ?? api.getPaymentUrl(token);
              void WebBrowser.openBrowserAsync(url);
            }}
          />
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: 24,
    padding: 24,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.amber,
    backgroundColor: 'rgba(255,176,32,0.08)',
    gap: 8,
  },
  provider: { color: colors.amber, fontWeight: '900', fontSize: 13, letterSpacing: 1 },
  amount: { color: colors.fg, fontSize: 40, fontWeight: '900' },
  hint: { color: colors.muted, lineHeight: 22, fontWeight: '600' },
});
