import { useEffect } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { colors } from '@/src/theme/colors';

export function Skeleton({ style }: { style?: ViewStyle }) {
  const opacity = useSharedValue(0.35);

  useEffect(() => {
    opacity.value = withRepeat(withTiming(0.85, { duration: 900 }), -1, true);
  }, [opacity]);

  const anim = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return <Animated.View style={[styles.base, style, anim]} />;
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: colors.border,
    borderRadius: 12,
  },
});

export function GuestEventSkeleton() {
  return (
    <View style={sk.wrap} testID="guest-skeleton">
      <Skeleton style={sk.hero} />
      <Skeleton style={sk.lineLg} />
      <Skeleton style={sk.lineMd} />
      <Skeleton style={sk.shots} />
      <Skeleton style={sk.input} />
      <Skeleton style={sk.shutter} />
    </View>
  );
}

const sk = StyleSheet.create({
  wrap: { padding: 20, gap: 14 },
  hero: { width: '100%', height: 280, borderRadius: 24 },
  lineLg: { height: 28, width: '85%' },
  lineMd: { height: 18, width: '55%' },
  shots: { height: 88, width: '100%', borderRadius: 20 },
  input: { height: 52, width: '100%' },
  shutter: { height: 88, width: 88, borderRadius: 44, alignSelf: 'center', marginTop: 12 },
});
