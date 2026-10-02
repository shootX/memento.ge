import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
  Alert,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { api } from '@/src/api/client';
import { useAuthStore } from '@/src/stores/auth-store';
import { formatGeorgianDate } from '@/src/lib/dates';
import { Skeleton } from '@/src/components/Skeleton';
import { Badge, GhostButton, PrimaryButton, Title } from '@/src/components/ui';
import { colors } from '@/src/theme/colors';

export default function HostDashboardScreen() {
  const { token } = useLocalSearchParams<{ token: string }>();
  const { t } = useTranslation();
  const bearer = useAuthStore((s) => s.accessToken);

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
      <View style={styles.loading} testID="host-skeleton">
        <Skeleton style={{ height: 200, borderRadius: 0 }} />
        <View style={{ padding: 20, gap: 12 }}>
          <Skeleton style={{ height: 24, width: '40%' }} />
          <Skeleton style={{ height: 32, width: '80%' }} />
          <Skeleton style={{ height: 80, width: '100%' }} />
        </View>
      </View>
    );
  }

  if (!host) {
    return (
      <View style={styles.loading}>
        <Title>ლინკი ვერ მოიძებნა</Title>
      </View>
    );
  }

  const deleteMedia = (id: string) => {
    Alert.alert(t('delete'), t('deleteConfirm'), [
      { text: 'არა', style: 'cancel' },
      {
        text: t('delete'),
        style: 'destructive',
        onPress: () =>
          void api.deleteHostMedia(token, id, host.csrfToken, bearer).then(() => mediaQ.refetch()),
      },
    ]);
  };

  const usagePct = Math.min(100, (host.usage.uploadCount / host.usage.maxUploads) * 100);

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.scroll} testID="host-ready">
      <View style={styles.hero}>
        <Image source={{ uri: host.coverUrl ?? undefined }} style={styles.cover} contentFit="cover" />
        <LinearGradient colors={['transparent', colors.bg]} style={styles.heroGrad} />
        <View style={styles.heroText}>
          <Badge color={host.isPaid ? colors.success : colors.amber}>
            {host.isPaid ? 'აქტიური' : 'გადაუხდელი'}
          </Badge>
          <Text style={styles.couple} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.8}>
            {host.coupleNames}
          </Text>
          <Text style={styles.meta} numberOfLines={1}>
            {formatGeorgianDate(host.eventDate)} · {host.usage.uploadCount}/{host.usage.maxUploads}
          </Text>
          <View style={styles.usageTrack}>
            <View style={[styles.usageFill, { width: `${usagePct}%` }]} />
          </View>
        </View>
      </View>

      <Animated.View entering={FadeInUp} style={styles.body}>
        <View style={styles.actions}>
          {!host.isPaid && (
            <PrimaryButton label={t('pay')} onPress={() => router.push(`/host/${token}/pay`)} />
          )}
          <GhostButton label={t('slideshow')} onPress={() => router.push(`/host/${token}/slideshow`)} />
          <GhostButton
            label="QR"
            onPress={() => Share.share({ message: host.guestUrl, url: host.guestUrl })}
          />
        </View>

        <Text style={styles.section}>{t('album')}</Text>
        <View style={styles.grid}>
          {(mediaQ.data ?? []).map((item) => (
            <Pressable key={item.id} style={styles.tile} onLongPress={() => deleteMedia(item.id)}>
              <Image source={{ uri: item.thumbUrl ?? item.url }} style={styles.img} contentFit="cover" />
              {item.guestName && (
                <Text style={styles.guest} numberOfLines={1}>{item.guestName}</Text>
              )}
            </Pressable>
          ))}
          {(mediaQ.data ?? []).length === 0 && (
            <Text style={styles.empty}>{t('emptyAlbum')}</Text>
          )}
        </View>
      </Animated.View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  scroll: { paddingBottom: 40 },
  loading: { flex: 1, backgroundColor: colors.bg },
  hero: { height: 280, position: 'relative' },
  cover: { ...StyleSheet.absoluteFill },
  heroGrad: { position: 'absolute', left: 0, right: 0, bottom: 0, height: '70%' },
  heroText: { position: 'absolute', left: 20, right: 20, bottom: 20 },
  couple: { color: colors.fg, fontSize: 28, fontWeight: '900', marginTop: 10, lineHeight: 34 },
  meta: { color: colors.muted, marginTop: 6, fontWeight: '600' },
  usageTrack: {
    height: 6,
    backgroundColor: colors.border,
    borderRadius: 999,
    marginTop: 12,
    overflow: 'hidden',
  },
  usageFill: { height: '100%', backgroundColor: colors.lime },
  body: { padding: 20, gap: 12 },
  actions: { gap: 8 },
  section: { color: colors.fg, fontWeight: '800', fontSize: 18, marginTop: 8 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  tile: {
    width: '48%',
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: colors.surface,
  },
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
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  empty: { color: colors.muted, textAlign: 'center', padding: 24, width: '100%' },
});
