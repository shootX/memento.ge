import '@/src/i18n';
import {
  NotoSansGeorgian_400Regular,
  NotoSansGeorgian_500Medium,
  NotoSansGeorgian_700Bold,
  useFonts,
} from '@expo-google-fonts/noto-sans-georgian';
import { QueryClientProvider } from '@tanstack/react-query';
import * as Linking from 'expo-linking';
import { Stack, router } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert } from 'react-native';
import i18n from '@/src/i18n';
import { api } from '@/src/api/client';
import { setUnauthorizedHandler } from '@/src/lib/auth-http';
import { resolveDeepLink } from '@/src/lib/deep-link';
import {
  getPendingPaymentId,
  pollPaymentStatus,
  rememberPaymentSession,
} from '@/src/lib/payment-flow';
import { queryClient } from '@/src/lib/query-client';
import { useAuthStore } from '@/src/stores/auth-store';
import { colors } from '@/src/theme/colors';
import { fonts } from '@/src/theme/typography';

SplashScreen.preventAutoHideAsync().catch(() => undefined);

async function refreshHostAfterPayment(hostToken: string, paymentId?: string) {
  const bearer = useAuthStore.getState().accessToken;
  const pid = paymentId ?? getPendingPaymentId(hostToken);
  if (pid) {
    await pollPaymentStatus(hostToken, pid, bearer).catch(() => undefined);
  }
  await queryClient.invalidateQueries({ queryKey: ['host', hostToken] });
  await queryClient.invalidateQueries({ queryKey: ['my-events'] });
  router.replace(`/host/${hostToken}`);
}

function useDeepLinks() {
  useEffect(() => {
    const handle = (url: string) => {
      const action = resolveDeepLink(url);
      if (action.type === 'auth') {
        void api
          .exchangeMagicToken(action.token)
          .then(async (session) => {
            await useAuthStore.getState().setSession(session.accessToken, session.user.email);
            router.replace('/host/events');
          })
          .catch(() => {
            router.replace('/host/login');
          });
        return;
      }
      if (action.type === 'payComplete') {
        void refreshHostAfterPayment(action.hostToken, action.paymentId);
        return;
      }
      if (action.type === 'guest') {
        router.push(`/e/${action.slug}`);
      }
    };
    void Linking.getInitialURL().then((url) => {
      if (url) handle(url);
    });
    const sub = Linking.addEventListener('url', ({ url }) => handle(url));
    return () => sub.remove();
  }, []);
}

function useSessionExpiryHandler() {
  useEffect(() => {
    setUnauthorizedHandler(() => {
      void useAuthStore.getState().clearSession();
      Alert.alert(i18n.t('sessionExpiredTitle'), i18n.t('sessionExpiredBody'));
      router.replace('/host/login');
    });
    return () => setUnauthorizedHandler(null);
  }, []);
}

export default function RootLayout() {
  const { t } = useTranslation();
  const hydrate = useAuthStore((s) => s.hydrate);
  useDeepLinks();
  useSessionExpiryHandler();

  const [loaded] = useFonts({
    NotoSansGeorgian_400Regular,
    NotoSansGeorgian_500Medium,
    NotoSansGeorgian_700Bold,
  });

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (loaded) SplashScreen.hideAsync().catch(() => undefined);
  }, [loaded]);

  if (!loaded) return null;

  return (
    <QueryClientProvider client={queryClient}>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.bg },
          headerTintColor: colors.fg,
          headerTitleStyle: { fontFamily: fonts.display, fontWeight: '700' },
          contentStyle: { backgroundColor: colors.bg },
          headerBackTitle: t('back'),
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="preview" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding" options={{ headerShown: false }} />
        <Stack.Screen name="scan" options={{ headerShown: false }} />
        <Stack.Screen name="e/[slug]/index" options={{ headerShown: false }} />
        <Stack.Screen name="e/[slug]/camera" options={{ headerShown: false }} />
        <Stack.Screen name="e/[slug]/album" options={{ headerShown: false }} />
        <Stack.Screen name="gallery/[slug]" options={{ headerShown: false }} />
        <Stack.Screen name="host/login" options={{ headerShown: false }} />
        <Stack.Screen name="host/events" options={{ title: t('navEvents') }} />
        <Stack.Screen name="host/create" options={{ title: t('navCreate') }} />
        <Stack.Screen name="host/[token]/index" options={{ headerShown: false }} />
        <Stack.Screen name="host/[token]/slideshow" options={{ headerShown: false }} />
        <Stack.Screen name="host/[token]/pay" options={{ headerShown: false }} />
      </Stack>
    </QueryClientProvider>
  );
}
