import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';
import { PrimaryButton, Screen, Title } from '@/src/components/ui';
import { colors } from '@/src/theme/colors';

export default function PreviewPayScreen() {
  const { t } = useTranslation();
  return (
    <Screen testID="host-pay">
      <Title>{t('pay')}</Title>
      <View style={styles.card}>
        <Text style={styles.provider}>TBC / BOG</Text>
        <Text style={styles.amount}>99 ₾</Text>
        <Text style={styles.hint}>{t('payHint')}</Text>
        <PrimaryButton label={t('payContinue')} onPress={() => {}} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: 24,
    padding: 24,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.amber,
    backgroundColor: 'rgba(255,176,32,0.08)',
    gap: 8,
  },
  provider: { color: colors.amber, fontWeight: '900', fontSize: 13 },
  amount: { color: colors.fg, fontSize: 40, fontWeight: '900' },
  hint: { color: colors.muted, lineHeight: 22, fontWeight: '600' },
});
