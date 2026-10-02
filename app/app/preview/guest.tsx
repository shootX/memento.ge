import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { LanguageSwitcher } from '@/src/components/LanguageSwitcher';
import { GuestHero } from '@/src/components/guest/GuestHero';
import { ShotCounter } from '@/src/components/guest/ShotCounter';
import { ShutterButton } from '@/src/components/guest/ShutterButton';
import { Field, Screen } from '@/src/components/ui';
import { formatGeorgianDate } from '@/src/lib/dates';
import { colors } from '@/src/theme/colors';

const info = {
  coupleNames: 'ნინო & გიორგი',
  eventDate: '2026-06-14T00:00:00.000Z',
  coverUrl: 'https://qr.socialsave.cc/seed-samples/wedding-4.jpg',
  disposable: { enabled: true, shotsPerGuest: 5 },
  limits: { shotsRemaining: 3, maxBytesPerFile: 104857600 },
};

export default function PreviewGuestScreen() {
  const { t, i18n } = useTranslation();
  const locale = i18n.language === 'en' || i18n.language === 'ru' ? i18n.language : 'ka';

  return (
    <Screen style={styles.screen} testID="guest-ready">
      <View style={styles.topBar}>
        <Text style={styles.brand}>{t('appName')}</Text>
        <LanguageSwitcher />
      </View>
      <ScrollView contentContainerStyle={styles.scroll}>
        <GuestHero
          coverUrl={info.coverUrl}
          coupleNames={info.coupleNames}
          dateLabel={formatGeorgianDate(info.eventDate, locale)}
        />
        <Animated.View entering={FadeInUp} style={styles.content}>
          <ShotCounter remaining={3} total={5} label={t('shotsLeft')} />
          <Field value="მარიამი" onChangeText={() => {}} placeholder={t('yourName')} />
          <View style={styles.shutterRow}>
            <ShutterButton onPress={() => {}} />
          </View>
          <Text style={styles.hint}>{t('takePhoto')}</Text>
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
    paddingHorizontal: 20,
    marginBottom: 4,
  },
  brand: { color: colors.lime, fontWeight: '900', fontSize: 18 },
  scroll: { paddingBottom: 80 },
  content: { paddingHorizontal: 20, gap: 14, marginTop: 16 },
  shutterRow: { alignItems: 'center', marginTop: 8 },
  hint: { textAlign: 'center', color: colors.muted, fontWeight: '700' },
});
