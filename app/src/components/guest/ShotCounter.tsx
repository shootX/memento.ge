import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { colors } from '@/src/theme/colors';

type Props = {
  remaining: number;
  total: number;
  label: string;
};

export function ShotCounter({ remaining, total, label }: Props) {
  return (
    <Animated.View entering={FadeIn} style={styles.card} testID="shot-counter">
      <Text style={styles.label} numberOfLines={2}>{label}</Text>
      <Text style={styles.num}>{remaining}</Text>
      <View style={styles.dots}>
        {Array.from({ length: total }).map((_, i) => {
          const used = i >= total - remaining;
          return (
            <View key={i} style={[styles.dot, used && styles.dotUsed]} />
          );
        })}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(196,255,13,0.35)',
    backgroundColor: 'rgba(196,255,13,0.08)',
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  label: {
    color: colors.lime,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  num: {
    color: colors.fg,
    fontSize: 48,
    fontWeight: '900',
    marginTop: 4,
    lineHeight: 52,
  },
  dots: { flexDirection: 'row', gap: 6, marginTop: 10, flexWrap: 'wrap', justifyContent: 'center' },
  dot: {
    width: 28,
    height: 34,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  dotUsed: {
    borderColor: colors.lime,
    backgroundColor: colors.lime,
    shadowColor: colors.lime,
    shadowOpacity: 0.45,
    shadowRadius: 8,
  },
});
