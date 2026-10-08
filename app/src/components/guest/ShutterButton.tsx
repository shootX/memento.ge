import * as Haptics from 'expo-haptics';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { colors } from '@/src/theme/colors';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type Props = {
  onPress: () => void;
  disabled?: boolean;
  testID?: string;
  label?: string;
};

export function ShutterButton({ onPress, disabled, testID, label = 'Shutter' }: Props) {
  const scale = useSharedValue(1);
  const ring = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <AnimatedPressable
      testID={testID ?? 'guest-shutter'}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!disabled }}
      onPressIn={() => {
        // Reanimated shared values are mutated in gesture handlers, not React render.
        // eslint-disable-next-line react-hooks/immutability -- Reanimated shared value
        scale.value = withSpring(0.92, { damping: 14, stiffness: 320 });
      }}
      onPressOut={() => {
        // eslint-disable-next-line react-hooks/immutability -- Reanimated shared value
        scale.value = withSpring(1, { damping: 12, stiffness: 280 });
      }}
      onPress={() => {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        onPress();
      }}
      style={[styles.outer, disabled && styles.disabled, ring]}
    >
      <View style={styles.inner} />
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  outer: {
    width: 92,
    height: 92,
    borderRadius: 46,
    borderWidth: 4,
    borderColor: colors.fg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  inner: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.lime,
    borderWidth: 3,
    borderColor: colors.limeOn,
  },
  disabled: { opacity: 0.45 },
});
