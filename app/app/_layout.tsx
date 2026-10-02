import '@/src/i18n';
import {
  NotoSansGeorgian_400Regular,
  NotoSansGeorgian_500Medium,
  NotoSansGeorgian_700Bold,
  useFonts,
} from '@expo-google-fonts/noto-sans-georgian';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as Linking from 'expo-linking';
import { Stack, router } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '@/src/api/client';
import { parseEventSlugFromUrl } from '@/src/lib/slug';
import { useAuthStore } from '@/src/stores/auth-store';
import { colors } from '@/src/theme/colors';
import { fonts } from '@/src/theme/typography';

SplashScreen.preventAutoHideAsync().catch(() => undefined);

const queryClient = new QueryClient();

function useDeepLinks() {
  useEffect(() => {
    const handle = (url: string) => {
      try {
        const u = new URL(url.includes('://') ? url : `https://${url}`);
        if (u.pathname.includes('/auth/callback')) {
          const token = u.searchParams.get('token');
          if (token) {
            void api.exchangeMagicToken(token).then(async (session) => {
              await useAuthStore.getState().setSession(session.accessToken, session.user.email);
              router.replace('/host/events');
            });
          }
          return;
        }
      } catch {
        /* ignore */
      }
      const slug = parseEventSlugFromUrl(url);
      if (slug) router.push(`/e/${slug}`);
    };
    void Linking.getInitialURL().then((url) => {
      if (url) handle(url);
    });
    const sub = Linking.addEventListener('url', ({ url }) => handle(url));
    return () => sub.remove();
  }, []);
}

export default function RootLayout() {
  const { t } = useTranslation();
  const hydrate = useAuthStore((s) => s.hydrate);
  useDeepLinks();

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
