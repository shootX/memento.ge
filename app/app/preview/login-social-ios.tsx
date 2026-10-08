import { Image } from 'expo-image';
import { ScrollView, StyleSheet, Text } from 'react-native';
import { SocialLoginSection } from '@/src/components/auth/SocialLoginSection';
import { Card, Field, PrimaryButton } from '@/src/components/ui';
import { SEED } from '@/src/constants/images';
import { colors } from '@/src/theme/colors';
import { fonts } from '@/src/theme/typography';
import { useTranslation } from 'react-i18next';

/** Screenshot: login card with email first, „ან“, social incl. Apple (iOS mock). */
export default function PreviewLoginSocialIos() {
  const { t } = useTranslation();
  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.scroll} testID="preview-login-ios">
      <Image source={{ uri: SEED.cover }} style={styles.hero} contentFit="cover" />
      <Text style={styles.title}>{t('login')}</Text>
      <Text style={styles.sub}>{t('loginSubtitle')}</Text>
      <Card style={styles.card}>
        <Field value="host@example.com" onChangeText={() => {}} placeholder={t('emailPlaceholder')} />
        <PrimaryButton label={t('sendCode')} disabled onPress={() => {}} />
        <Text style={styles.oauthOr}>{t('oauthOr')}</Text>
        <SocialLoginSection previewAsIos onResult={() => {}} />
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: 24 },
  hero: { width: '100%', height: 160, borderRadius: 20, marginBottom: 20 },
  title: { color: colors.fg, fontFamily: fonts.display, fontSize: 28, fontWeight: '800' },
  sub: { color: colors.muted, marginTop: 8, lineHeight: 22, fontFamily: fonts.body },
  card: { marginTop: 20, gap: 12 },
  oauthOr: { textAlign: 'center', color: colors.muted, fontFamily: fonts.body, fontSize: 13, marginTop: 4 },
});
