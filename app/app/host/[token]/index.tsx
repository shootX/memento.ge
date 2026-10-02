import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { api } from '@/src/api/client';
import { formatGeorgianDate } from '@/src/lib/dates';
import { Badge, GhostButton, PrimaryButton, Screen, Title } from '@/src/components/ui';
import { colors } from '@/src/theme/colors';

export default function HostDashboardScreen() {
  const { token } = useLocalSearchParams<{ token: string }>();
  const { t } = useTranslation();

  const hostQ = useQuery({
    queryKey: ['host', token],
    queryFn: () => api.getHost(token),
    refetchInterval: 15000,
  });

  const mediaQ = useQuery({
    queryKey: ['host-media', token],
    queryFn: () => api.getHostMedia(token),
    refetchInterval: 15000,
  });

  const host = hostQ.data;

  if (hostQ.isLoading) {
    return (
      <Screen style={styles.center}>
        <ActivityIndicator color={colors.lime} />
      </Screen>
    );
  }

  if (!host) {
    return (
      <Screen>
        <Title>ლინკი ვერ მოიძებნა</Title>
      </Screen>
    );
  }

  const deleteMedia = (id: string) => {
    Alert.alert(t('delete'), t('deleteConfirm'), [
      { text: 'არა', style: 'cancel' },
      {
        text: t('delete'),
        style: 'destructive',
        onPress: () => void api.deleteHostMedia(token, id, host.csrfToken).then(() => mediaQ.refetch()),
      },
    ]);
  };

  return (
    <Screen style={{ paddingHorizontal: 0 }}>
      {host.coverUrl && <Image source={{ uri: host.coverUrl }} style={styles.cover} contentFit="cover" />}
      <View style={styles.body}>
        <Badge color={host.isPaid ? colors.success : colors.amber}>
          {host.isPaid ? 'აქტიური' : 'გადაუხდელი'}
        </Badge>
        <Title>{host.coupleNames}</Title>
        <Text style={styles.meta}>
          {formatGeorgianDate(host.eventDate)} · {host.usage.uploadCount}/{host.usage.maxUploads}
        </Text>

        <View style={styles.actions}>
          {!host.isPaid && (
            <PrimaryButton label={t('pay')} onPress={() => router.push(`/host/${token}/pay`)} />
          )}
          <GhostButton
            label={t('slideshow')}
            onPress={() => router.push(`/host/${token}/slideshow`)}
          />
          <GhostButton
            label="QR"
            onPress={() => Share.share({ message: host.guestUrl, url: host.guestUrl })}
          />
          <GhostButton
            label={t('share')}
            onPress={() => Share.share({ message: host.hostUrl, url: host.hostUrl })}
          />
        </View>

        <Text style={styles.section}>{t('album')}</Text>
        <FlatList
          data={mediaQ.data ?? []}
          numColumns={2}
          keyExtractor={(i) => i.id}
          scrollEnabled={false}
          columnWrapperStyle={{ gap: 10 }}
          contentContainerStyle={{ gap: 10 }}
          ListEmptyComponent={<Text style={styles.empty}>{t('emptyAlbum')}</Text>}
          renderItem={({ item }) => (
            <Pressable style={styles.tile} onLongPress={() => deleteMedia(item.id)}>
              <Image source={{ uri: item.thumbUrl ?? item.url }} style={styles.img} contentFit="cover" />
              {item.guestName && <Text style={styles.guest}>{item.guestName}</Text>}
            </Pressable>
          )}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { justifyContent: 'center', alignItems: 'center' },
  cover: { width: '100%', height: 180 },
  body: { padding: 20, gap: 10 },
  meta: { color: colors.muted },
  actions: { gap: 8, marginVertical: 8 },
  section: { color: colors.fg, fontWeight: '800', marginTop: 8 },
  empty: { color: colors.muted, textAlign: 'center', padding: 20 },
  tile: { flex: 1, borderRadius: 16, overflow: 'hidden', backgroundColor: colors.surface },
  img: { width: '100%', aspectRatio: 3 / 4 },
  guest: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
    padding: 6,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
});
