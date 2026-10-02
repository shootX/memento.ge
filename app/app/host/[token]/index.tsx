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
import { Badge, GhostButton, PrimaryButton } from '@/src/components/ui';
import { SEED } from '@/src/constants/images';
import { colors } from '@/src/theme/colors';
import { fonts } from '@/src/theme/typography';

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
  const coverUri = host?.coverUrl ?? SEED.cover;

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
        <Text style={styles.errTitle}>{t('hostLinkNotFound')}</Text>
      </View>
    );
  }

  const deleteMedia = (id: string) => {
    Alert.alert(t('delete'), t('deleteConfirm'), [
      { text: t('no'), style: 'cancel' },
      {
        text: t('delete'),
        style: 'destructive',
        onPress: () =>
          void api.deleteHostMedia(token, id, host.csrfToken, bearer).then(() => mediaQ.refetch()),
      },
    ]);
  };

  const stats = [
    { label: t('statPhotos'), value: String(host.usage.uploadCount) },
    { label: t('statGuests'), value: '—' },
    { label: t('statDays'), value: '90' },
  ];

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.scroll} testID="host-ready">
      <View style={styles.hero}>
        <Image source={{ uri: coverUri }} style={styles.cover} contentFit="cover" />
        <LinearGradient colors={['transparent', colors.bg]} style={styles.heroGrad} />
        <View style={styles.heroText}>
          <Badge color={host.isPaid ? colors.success : colors.amber}>
            {host.isPaid ? t('paid') : t('unpaid')}
          </Badge>
          <Text style={styles.couple} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.8}>
            {host.coupleNames}
          </Text>
          <Text style={styles.meta} numberOfLines={1}>
            {formatGeorgianDate(host.eventDate)}
          </Text>
        </View>
      </View>

      <Animated.View entering={FadeInUp} style={styles.body}>
        <View style={styles.stats}>
          {stats.map((s) => (
            <View key={s.label} style={styles.statCard}>
              <Text style={styles.statVal}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        <View style={styles.qrCard}>
          <Text style={styles.qrTitle}>{t('qrCardTitle')}</Text>
          <Text style={styles.qrHint}>{t('qrCardHint')}</Text>
          <View style={styles.qrBox} />
          <GhostButton
            label={t('share')}
            onPress={() => void Share.share({ message: host.guestUrl, url: host.guestUrl })}
          />
        </View>

        {!host.isPaid && (
          <PrimaryButton label={t('pay')} onPress={() => router.push(`/host/${token}/pay`)} />
        )}
        <GhostButton label={t('slideshow')} onPress={() => router.push(`/host/${token}/slideshow`)} />

        <Text style={styles.section}>{t('album')}</Text>
        <View style={styles.grid}>
          {(mediaQ.data ?? []).map((item) => (
            <Pressable key={item.id} style={styles.tile} onLongPress={() => deleteMedia(item.id)}>
              <Image
                source={{ uri: item.thumbUrl ?? item.url }}
                style={styles.img}
                contentFit="cover"
              />
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
  loading: { flex: 1, backgroundColor: colors.bg, padding: 20 },
  errTitle: { color: colors.fg, fontFamily: fonts.display, fontSize: 22, fontWeight: '800' },
  hero: { height: 240 },
  cover: { ...StyleSheet.absoluteFill },
  heroGrad: { position: 'absolute', left: 0, right: 0, bottom: 0, height: '70%' },
  heroText: { position: 'absolute', left: 20, right: 20, bottom: 16 },
  couple: { color: colors.fg, fontFamily: fonts.display, fontSize: 26, fontWeight: '800', marginTop: 8 },
  meta: { color: colors.muted, marginTop: 4, fontFamily: fonts.body },
  body: { padding: 20, gap: 12 },
  stats: { flexDirection: 'row', gap: 8 },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    alignItems: 'center',
  },
  statVal: { color: colors.lime, fontFamily: fonts.display, fontSize: 22, fontWeight: '800' },
  statLabel: { color: colors.muted, fontSize: 11, marginTop: 4, fontFamily: fonts.body },
  qrCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    gap: 8,
  },
  qrTitle: { color: colors.fg, fontFamily: fonts.bodyMedium, fontWeight: '800' },
  qrHint: { color: colors.muted, fontSize: 13, fontFamily: fonts.body },
  qrBox: {
    height: 120,
    borderRadius: 12,
    backgroundColor: colors.bgElevated,
    borderWidth: 1,
    borderColor: colors.lime,
  },
  section: { color: colors.fg, fontFamily: fonts.display, fontSize: 18, marginTop: 8 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tile: {
    width: '31.5%',
    borderRadius: 12,
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
    fontSize: 9,
    padding: 4,
    backgroundColor: 'rgba(0,0,0,0.55)',
    fontFamily: fonts.bodyMedium,
  },
  empty: { color: colors.muted, textAlign: 'center', padding: 24, width: '100%' },
});
