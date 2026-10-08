import { useLocalSearchParams } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, AppState, StyleSheet, Text, View } from 'react-native';
import { api } from '@/src/api/client';
import {
  getPendingPaymentId,
  pollPaymentStatus,
  rememberPaymentSession,
} from '@/src/lib/payment-flow';
import { queryClient } from '@/src/lib/query-client';
import { useAuthStore } from '@/src/stores/auth-store';
import { PrimaryButton, Screen, Title } from '@/src/components/ui';
import { colors } from '@/src/theme/colors';

export default function HostPayScreen() {
  const { token, preview } = useLocalSearchParams<{ token: string; preview?: string }>();
  const { t } = useTranslation();
  const bearer = useAuthStore((s) => s.accessToken);
  const [opening, setOpening] = useState(preview !== 'ui');
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
  const paymentIdRef = useRef<string | null>(null);
  const pollingRef = useRef(false);

  const refreshPayment = useCallback(async () => {
    const paymentId = paymentIdRef.current ?? getPendingPaymentId(token);
    if (!paymentId || pollingRef.current) return;
    pollingRef.current = true;
    try {
      await pollPaymentStatus(token, paymentId, bearer);
      await queryClient.invalidateQueries({ queryKey: ['host', token] });
      await queryClient.invalidateQueries({ queryKey: ['my-events'] });
    } finally {
      pollingRef.current = false;
    }
  }, [token, bearer]);

  useEffect(() => {
    if (preview === 'ui') return;
    (async () => {
      try {
        const session = await api.createPaymentSession(
          token,
          `memento://host/${token}/pay-complete`,
          bearer,
        );
        paymentIdRef.current = session.paymentId;
        rememberPaymentSession(token, session.paymentId);
        setCheckoutUrl(session.checkoutUrl);
        await WebBrowser.openBrowserAsync(session.checkoutUrl, {
          presentationStyle: WebBrowser.WebBrowserPresentationStyle.FULL_SCREEN,
        });
        await refreshPayment();
      } finally {
        setOpening(false);
      }
    })();
  }, [token, preview, bearer, refreshPayment]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') void refreshPayment();
    });
    return () => sub.remove();
  }, [refreshPayment]);

  return (
    <Screen testID="host-pay">
      <Title>{t('pay')}</Title>
      <View style={styles.card}>
        <Text style={styles.provider}>TBC / BOG</Text>
        <Text style={styles.amount}>99 ₾</Text>
        <Text style={styles.hint} numberOfLines={3}>{t('payHint')}</Text>
        {opening ? (
          <ActivityIndicator color={colors.lime} style={{ marginTop: 16 }} />
        ) : (
          <PrimaryButton
            label={t('payContinue')}
            onPress={() => {
              const url = checkoutUrl ?? api.getPaymentUrl(token);
              void WebBrowser.openBrowserAsync(url).then(() => refreshPayment());
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
