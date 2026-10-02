import { useLocalSearchParams } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Text } from 'react-native';
import { api } from '@/src/api/client';
import { Screen, Title } from '@/src/components/ui';
import { colors } from '@/src/theme/colors';

export default function HostPayScreen() {
  const { token } = useLocalSearchParams<{ token: string }>();
  const { t } = useTranslation();

  useEffect(() => {
    const url = api.getPaymentUrl(token);
    void WebBrowser.openBrowserAsync(url, {
      presentationStyle: WebBrowser.WebBrowserPresentationStyle.FULL_SCREEN,
      showInRecents: true,
    });
  }, [token]);

  return (
    <Screen>
      <Title>{t('pay')}</Title>
      <ActivityIndicator color={colors.lime} style={{ marginTop: 24 }} />
      <Text style={{ color: colors.muted, marginTop: 12 }}>
        TBC/BOG გადახდა ბრაუზერში იხსნება. დასრულების შემდეგ დაბრუნდი აპში.
      </Text>
    </Screen>
  );
}
