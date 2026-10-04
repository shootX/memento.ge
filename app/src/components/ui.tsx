import { Pressable, StyleSheet, Text, TextInput, View, type ViewStyle } from 'react-native';
import { colors } from '@/src/theme/colors';
import { fonts } from '@/src/theme/typography';

export function Screen({
  children,
  style,
  testID,
}: {
  children: React.ReactNode;
  style?: ViewStyle;
  testID?: string;
}) {
  return (
    <View style={[styles.screen, style]} testID={testID}>
      {children}
    </View>
  );
}

export function Title({ children }: { children: React.ReactNode }) {
  return (
    <Text style={styles.title} numberOfLines={3} adjustsFontSizeToFit minimumFontScale={0.85}>
      {children}
    </Text>
  );
}

export function Subtitle({ children }: { children: React.ReactNode }) {
  return <Text style={styles.subtitle}>{children}</Text>;
}

export function Card({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function PrimaryButton({
  label,
  onPress,
  disabled,
  testID,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  testID?: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!disabled }}
      style={({ pressed }) => [
        styles.primaryBtn,
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
      ]}
    >
      <Text style={styles.primaryBtnText}>{label}</Text>
    </Pressable>
  );
}

export function GhostButton({
  label,
  onPress,
  disabled,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!disabled }}
      style={({ pressed }) => [
        styles.ghostBtn,
        pressed && styles.pressed,
        disabled && styles.disabled,
      ]}
    >
      <Text style={styles.ghostBtnText}>{label}</Text>
    </Pressable>
  );
}

export function Field({
  value,
  onChangeText,
  placeholder,
  keyboardType,
  secureTextEntry,
  testID,
}: {
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'email-address' | 'numeric';
  secureTextEntry?: boolean;
  testID?: string;
}) {
  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={colors.muted}
      keyboardType={keyboardType}
      secureTextEntry={secureTextEntry}
      accessibilityLabel={placeholder}
      testID={testID}
      style={styles.input}
      autoCapitalize="none"
      multiline={false}
    />
  );
}

export function Badge({ children, color = colors.lime }: { children: React.ReactNode; color?: string }) {
  return (
    <View style={[styles.badge, { backgroundColor: `${color}22`, borderColor: color }]}>
      <Text style={[styles.badgeText, { color }]}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  title: {
    color: colors.fg,
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
    fontFamily: fonts.display,
  },
  subtitle: {
    color: colors.muted,
    fontSize: 15,
    marginTop: 6,
    lineHeight: 22,
    fontFamily: fonts.body,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
  },
  primaryBtn: {
    backgroundColor: colors.lime,
    borderRadius: 999,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
    minHeight: 48,
    justifyContent: 'center',
  },
  primaryBtnText: {
    color: colors.limeOn,
    fontWeight: '800',
    fontSize: 16,
    lineHeight: 22,
    textAlign: 'center',
    fontFamily: fonts.bodyMedium,
  },
  ghostBtn: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 12,
    paddingHorizontal: 18,
    alignItems: 'center',
    minHeight: 48,
    justifyContent: 'center',
  },
  ghostBtnText: {
    color: colors.fg,
    fontWeight: '700',
    lineHeight: 20,
    textAlign: 'center',
    fontFamily: fonts.bodyMedium,
  },
  input: {
    backgroundColor: colors.bgElevated,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: colors.fg,
    fontSize: 16,
    lineHeight: 22,
    minHeight: 52,
    marginTop: 8,
    fontFamily: fonts.body,
  },
  badge: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  disabled: { opacity: 0.45 },
  pressed: { transform: [{ scale: 0.98 }] },
});
