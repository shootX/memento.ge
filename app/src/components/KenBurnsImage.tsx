import { Image } from 'expo-image';
import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

type Props = { uri: string };

export function KenBurnsImage({ uri }: Props) {
  const scale = useSharedValue(1);
  const tx = useSharedValue(0);

  useEffect(() => {
    scale.value = withRepeat(
      withTiming(1.12, { duration: 9000, easing: Easing.inOut(Easing.quad) }),
      -1,
      true,
    );
    tx.value = withRepeat(
      withTiming(-12, { duration: 9000, easing: Easing.inOut(Easing.quad) }),
      -1,
      true,
    );
  }, [scale, tx]);

  const anim = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { translateX: tx.value }],
  }));

  return (
    <Animated.View style={[StyleSheet.absoluteFill, anim]}>
      <Image source={{ uri }} style={StyleSheet.absoluteFill} contentFit="cover" />
    </Animated.View>
  );
}
