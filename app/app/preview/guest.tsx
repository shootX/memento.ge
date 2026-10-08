import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { GuestHero } from '@/src/components/guest/GuestHero';
import { ShotCounter } from '@/src/components/guest/ShotCounter';
import { ShutterButton } from '@/src/components/guest/ShutterButton';
import { Field } from '@/src/components/ui';
import { SEED } from '@/src/constants/images';
import { colors } from '@/src/theme/colors';
import { fonts } from '@/src/theme/typography';

export default function PreviewGuestScreen() {
  const { t } = useTranslation();

  return (
    <View style={styles.screen} testID="guest-ready">
      <View style={styles.topBar}>
        <Text style={styles.brand}>{t('appName')}</Text>
      </View>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <GuestHero
          coverUrl={SEED.cover}
          coupleNames="ნინო & გიორგი"
          dateLabel="14 ივნისი, 2026"
          eventLabel={t('eventLabel')}
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
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg, paddingTop: 8 },
  topBar: { paddingHorizontal: 20, marginBottom: 4 },
  brand: { color: colors.lime, fontFamily: fonts.display, fontSize: 18, fontWeight: '800' },
  scroll: { paddingBottom: 80 },
  content: { paddingHorizontal: 20, gap: 14, marginTop: 16 },
  shutterRow: { alignItems: 'center', marginTop: 8 },
  hint: {
    textAlign: 'center',
    color: colors.muted,
    fontFamily: fonts.bodyMedium,
    fontWeight: '700',
  },
});
