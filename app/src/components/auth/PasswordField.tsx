import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { colors } from '@/src/theme/colors';
import { fonts } from '@/src/theme/typography';

type Props = {
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  testID?: string;
};

export function PasswordField({ value, onChangeText, placeholder, testID }: Props) {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);

  return (
    <View style={styles.row} testID={testID}>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        secureTextEntry={!visible}
        accessibilityLabel={placeholder}
        style={styles.input}
        autoCapitalize="none"
        autoCorrect={false}
        textContentType="password"
      />
      <Pressable
        onPress={() => setVisible((v) => !v)}
        accessibilityRole="button"
        accessibilityLabel={visible ? t('passwordHide') : t('passwordShow')}
        hitSlop={8}
        style={styles.eye}
      >
        <Ionicons name={visible ? 'eye-off-outline' : 'eye-outline'} size={22} color={colors.sky} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingRight: 8,
  },
  input: {
    flex: 1,
    color: colors.fg,
    fontFamily: fonts.body,
    fontSize: 16,
    paddingHorizontal: 14,
    paddingVertical: 14,
    minHeight: 48,
  },
  eye: { padding: 6 },
});
