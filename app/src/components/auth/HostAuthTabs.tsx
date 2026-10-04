import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '@/src/theme/colors';
import { fonts } from '@/src/theme/typography';

export type HostAuthTab = 'login' | 'register';

type Props = {
  active: HostAuthTab;
  onChange: (tab: HostAuthTab) => void;
};

export function HostAuthTabs({ active, onChange }: Props) {
  const { t } = useTranslation();
  return (
    <View style={styles.row} testID="host-auth-tabs">
      <Pressable
        style={[styles.tab, active === 'login' && styles.tabLoginActive]}
        onPress={() => onChange('login')}
        accessibilityRole="tab"
        accessibilityState={{ selected: active === 'login' }}
        testID="auth-tab-login"
      >
        <Text style={[styles.tabText, active === 'login' && styles.tabTextActive]}>{t('login')}</Text>
      </Pressable>
      <Pressable
        style={[styles.tab, active === 'register' && styles.tabRegisterActive]}
        onPress={() => onChange('register')}
        accessibilityRole="tab"
        accessibilityState={{ selected: active === 'register' }}
        testID="auth-tab-register"
      >
        <Text style={[styles.tabText, active === 'register' && styles.tabTextActive]}>
          {t('register')}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bgElevated,
  },
  tabLoginActive: {
    borderColor: colors.lime,
    backgroundColor: `${colors.lime}18`,
  },
  tabRegisterActive: {
    borderColor: colors.sky,
    backgroundColor: `${colors.sky}18`,
  },
  tabText: {
    color: colors.muted,
    fontFamily: fonts.bodyMedium,
    fontWeight: '600',
    fontSize: 15,
  },
  tabTextActive: {
    color: colors.fg,
  },
});
