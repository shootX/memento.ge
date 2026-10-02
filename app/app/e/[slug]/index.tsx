import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { api } from '@/src/api/client';
import type { GuestEventInfo } from '@/src/api/types';
import { LanguageSwitcher } from '@/src/components/LanguageSwitcher';
import { GuestEventSkeleton } from '@/src/components/Skeleton';
import { GuestHero } from '@/src/components/guest/GuestHero';
import { ShotCounter } from '@/src/components/guest/ShotCounter';
import { ShutterButton } from '@/src/components/guest/ShutterButton';
import { Field, GhostButton, Screen } from '@/src/components/ui';
import { formatGeorgianDate } from '@/src/lib/dates';
import { guestStore } from '@/src/stores/guest-store';
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
      const gk = await guestStore.getGuestKey(slug);
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

  const locale = (i18n.language === 'en' || i18n.language === 'ru' ? i18n.language : 'ka') as
    | 'ka'
    | 'en'
    | 'ru';

  if (loading) {
    return (
      <Screen style={{ paddingHorizontal: 0 }}>
        <GuestEventSkeleton />
      </Screen>
    );
  }

  if (!info) {
    return (
      <Screen>
        <Text style={styles.errTitle}>ღონისძიება ვერ მოიძებნა</Text>
        <GhostButton label={t('retry')} onPress={() => router.replace('/scan')} />
      </Screen>
    );
  }

  const openCamera = () => {
    void guestStore.setGuestName(slug, name);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push({ pathname: '/e/[slug]/camera', params: { slug, guestName: name, guestKey } });
  };

  return (
    <Screen style={styles.screen} testID="guest-ready">
      <View style={styles.topBar}>
        <Text style={styles.brand}>{t('appName')}</Text>
        <LanguageSwitcher />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <GuestHero
          coverUrl={info.coverUrl}
          coupleNames={info.coupleNames}
          dateLabel={formatGeorgianDate(info.eventDate, locale)}
        />

        <Animated.View entering={FadeInUp.delay(120)} style={styles.content}>
          {info.disposable?.enabled && info.limits.shotsRemaining != null && (
            <ShotCounter
              remaining={info.limits.shotsRemaining}
              total={info.disposable.shotsPerGuest}
              label={t('shotsLeft')}
            />
          )}

          <Field value={name} onChangeText={setName} placeholder={t('yourName')} />

          <View style={styles.shutterRow}>
            <ShutterButton onPress={openCamera} />
          </View>
          <Text style={styles.shutterHint} numberOfLines={2}>{t('takePhoto')}</Text>

          <View style={styles.secondary}>
            <GhostButton label={t('gallery')} onPress={openCamera} />
            {info.publicGallery && info.gallerySlug && (
              <Pressable
                onPress={() => router.push(`/gallery/${info.gallerySlug}`)}
                style={styles.albumLink}
              >
                <Text style={styles.albumText} numberOfLines={1}>{t('album')} →</Text>
              </Pressable>
            )}
          </View>
        </Animated.View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { paddingHorizontal: 0, paddingTop: 8 },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 4,
  },
  brand: { color: colors.lime, fontWeight: '900', fontSize: 18 },
  scroll: { paddingBottom: 120 },
  content: { paddingHorizontal: 20, gap: 14, marginTop: 16 },
  shutterRow: { alignItems: 'center', marginTop: 8 },
  shutterHint: {
    textAlign: 'center',
    color: colors.muted,
    fontWeight: '700',
    fontSize: 14,
    paddingHorizontal: 12,
  },
  secondary: { gap: 10, marginTop: 4 },
  albumLink: { alignSelf: 'center', paddingVertical: 8 },
  albumText: { color: colors.sky, fontWeight: '800', fontSize: 15 },
  errTitle: { color: colors.fg, fontSize: 22, fontWeight: '800', marginBottom: 12 },
});
