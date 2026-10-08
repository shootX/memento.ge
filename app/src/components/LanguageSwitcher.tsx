import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors } from '@/src/theme/colors';

const langs = ['ka', 'en', 'ru'] as const;

export function LanguageSwitcher() {
  const { i18n } = useTranslation();
  return (
    <View style={styles.row}>
      {langs.map((lng) => (
        <Pressable
          key={lng}
          onPress={() => void i18n.changeLanguage(lng)}
          style={[styles.chip, i18n.language === lng && styles.active]}
        >
          <Text style={[styles.text, i18n.language === lng && styles.activeText]}>
            {lng === 'ka' ? 'ქარ' : lng.toUpperCase()}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 6 },
  chip: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  active: { backgroundColor: colors.lime, borderColor: colors.lime },
  text: { color: colors.muted, fontWeight: '700', fontSize: 12 },
  activeText: { color: colors.limeOn },
});
