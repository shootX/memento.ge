import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '@/src/theme/colors';
import { fonts } from '@/src/theme/typography';

type IconName = keyof typeof Ionicons.glyphMap;

type Props = {
  icon: IconName;
  label: string;
  active?: boolean;
  onPress: () => void;
};

export function CameraControlButton({ icon, label, active, onPress }: Props) {
  return (
    <Pressable
      onPress={onPress}
      style={styles.wrap}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <View style={[styles.circle, active && styles.circleActive]}>
        <Ionicons name={icon} size={22} color={active ? colors.lime : colors.fg} />
      </View>
      <Text style={styles.label} numberOfLines={2}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', width: 56 },
  circle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleActive: { borderColor: colors.lime },
  label: {
    marginTop: 4,
    color: colors.fg,
    fontSize: 10,
    fontFamily: fonts.bodyMedium,
    fontWeight: '600',
    textAlign: 'center',
  },
});
