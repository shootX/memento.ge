import '@/src/i18n';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as Linking from 'expo-linking';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { api } from '@/src/api/client';
import { parseEventSlugFromUrl } from '@/src/lib/slug';
import { useAuthStore } from '@/src/stores/auth-store';
import { colors } from '@/src/theme/colors';

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
  const hydrate = useAuthStore((s) => s.hydrate);
  useDeepLinks();

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  return (
    <QueryClientProvider client={queryClient}>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.bg },
          headerTintColor: colors.fg,
          headerTitleStyle: { fontWeight: '800' },
          contentStyle: { backgroundColor: colors.bg },
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding" options={{ title: 'Memento' }} />
        <Stack.Screen name="scan" options={{ title: 'QR' }} />
        <Stack.Screen name="e/[slug]/index" options={{ headerShown: false }} />
        <Stack.Screen name="e/[slug]/camera" options={{ title: 'Camera' }} />
        <Stack.Screen name="e/[slug]/album" options={{ title: 'Album' }} />
        <Stack.Screen name="gallery/[slug]" options={{ title: 'Gallery' }} />
        <Stack.Screen name="host/login" options={{ title: 'Host' }} />
        <Stack.Screen name="host/events" options={{ title: 'Events' }} />
        <Stack.Screen name="host/create" options={{ title: 'New event' }} />
        <Stack.Screen name="host/[token]/index" options={{ headerShown: false }} />
        <Stack.Screen name="host/[token]/slideshow" options={{ headerShown: false }} />
        <Stack.Screen name="host/[token]/pay" options={{ title: 'Payment' }} />
      </Stack>
    </QueryClientProvider>
  );
}
