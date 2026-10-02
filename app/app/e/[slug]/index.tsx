import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { api } from '@/src/api/client';
import type { GuestEventInfo } from '@/src/api/types';
import { Badge, Field, GhostButton, PrimaryButton, Screen, Subtitle, Title } from '@/src/components/ui';
import { formatGeorgianDate } from '@/src/lib/dates';
import { useGuestStore } from '@/src/stores/guest-store';
import { colors } from '@/src/theme/colors';

export default function GuestEventScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { t, i18n } = useTranslation();
  const [info, setInfo] = useState<GuestEventInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [guestKey, setGuestKey] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const gk = await useGuestStore.getState().getGuestKey(slug);
      if (cancelled) return;
      setGuestKey(gk);
      try {
        const data = await api.getGuestEvent(slug, gk);
        if (!cancelled) setInfo(data);
      } catch {
        if (!cancelled) setInfo(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (loading) {
    return (
      <Screen style={styles.center}>
        <ActivityIndicator color={colors.lime} size="large" />
      </Screen>
    );
  }

  if (!info) {
    return (
      <Screen>
        <Title>ღონისძიება ვერ მოიძებნა</Title>
        <GhostButton label={t('retry')} onPress={() => router.replace('/scan')} />
      </Screen>
    );
  }

  const locale = (i18n.language === 'en' || i18n.language === 'ru' ? i18n.language : 'ka') as
    | 'ka'
    | 'en'
    | 'ru';

  return (
    <Screen style={{ paddingHorizontal: 0 }}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {info.coverUrl ? (
          <Image source={{ uri: info.coverUrl }} style={styles.cover} contentFit="cover" />
        ) : (
          <View style={[styles.cover, styles.coverFallback]} />
        )}
        <View style={styles.body}>
          <Badge color={colors.sky}>ღონისძიება</Badge>
          <Title>{info.coupleNames}</Title>
          <Subtitle>{formatGeorgianDate(info.eventDate, locale)}</Subtitle>

          {info.disposable?.enabled && info.limits.shotsRemaining != null && (
            <View style={styles.shots}>
              <Text style={styles.shotsLabel}>{t('shotsLeft')}</Text>
              <Text style={styles.shotsNum}>{info.limits.shotsRemaining}</Text>
            </View>
          )}

          <Field value={name} onChangeText={setName} placeholder={t('yourName')} />

          <View style={styles.row}>
            <PrimaryButton
              label={t('takePhoto')}
              onPress={() => {
                void useGuestStore.getState().setGuestName(slug, name);
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                router.push({ pathname: '/e/[slug]/camera', params: { slug, guestName: name, guestKey } });
              }}
            />
            <GhostButton
              label={t('gallery')}
              onPress={() => {
                void useGuestStore.getState().setGuestName(slug, name);
                router.push({ pathname: '/e/[slug]/album', params: { slug, guestName: name, guestKey } });
              }}
            />
          </View>

          {info.publicGallery && info.gallerySlug && (
            <GhostButton
              label={t('album')}
              onPress={() => router.push(`/gallery/${info.gallerySlug}`)}
            />
          )}
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { justifyContent: 'center', alignItems: 'center' },
  scroll: { paddingBottom: 40 },
  cover: { width: '100%', height: 200 },
  coverFallback: { backgroundColor: colors.surface },
  body: { padding: 20, gap: 12 },
  shots: {
    marginTop: 8,
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.lime,
    backgroundColor: '#c4ff0d12',
    alignItems: 'center',
  },
  shotsLabel: { color: colors.lime, fontWeight: '800', fontSize: 12 },
  shotsNum: { color: colors.fg, fontSize: 42, fontWeight: '900' },
  row: { gap: 10, marginTop: 8 },
});
