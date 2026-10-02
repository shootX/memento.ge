import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { api } from '@/src/api/client';
import { extractHostTokenFromUrl } from '@/src/lib/slug';
import { formatGeorgianDate } from '@/src/lib/dates';
import { useAuthStore } from '@/src/stores/auth-store';
import { Card, GhostButton, PrimaryButton, Screen, Title } from '@/src/components/ui';
import { colors } from '@/src/theme/colors';

export default function HostEventsScreen() {
  const { t } = useTranslation();
  const token = useAuthStore((s) => s.accessToken);
  const email = useAuthStore((s) => s.email);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['my-events', token],
    queryFn: () => api.listMyEvents(token ?? ''),
    enabled: !!token,
  });

  return (
    <Screen>
      <Title>{t('myEvents')}</Title>
      {email && <Text style={styles.email}>{email}</Text>}

      {isLoading ? (
        <ActivityIndicator color={colors.lime} style={{ marginTop: 24 }} />
      ) : (
        <View style={{ marginTop: 16, gap: 12 }}>
          {(data ?? []).map((ev) => {
            const hostToken = ev.hostUrl ? extractHostTokenFromUrl(ev.hostUrl) : null;
            return (
              <Pressable
                key={ev.id}
                onPress={() => hostToken && router.push(`/host/${hostToken}`)}
              >
                <Card>
                  <Text style={styles.name}>{ev.coupleNames}</Text>
                  <Text style={styles.meta}>
                    {formatGeorgianDate(ev.eventDate)} · {ev.isPaid ? '✅' : '⏳'}
                  </Text>
                </Card>
              </Pressable>
            );
          })}
          {data?.length === 0 && (
            <Text style={styles.empty}>{t('eventsEmpty')}</Text>
          )}
        </View>
      )}

      <View style={styles.actions}>
        <PrimaryButton label={t('newEvent')} onPress={() => router.push('/host/create')} />
        <GhostButton label={t('retry')} onPress={() => void refetch()} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  email: { color: colors.muted, marginTop: 4 },
  name: { color: colors.fg, fontWeight: '800', fontSize: 18 },
  meta: { color: colors.muted, marginTop: 4 },
  empty: { color: colors.muted, textAlign: 'center', padding: 24 },
  actions: { marginTop: 24, gap: 10 },
});
