import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { colors } from '@/src/theme/colors';
import { fonts } from '@/src/theme/typography';

type Props = {
  coverUrl?: string | null;
  coupleNames: string;
  dateLabel: string;
  eventLabel: string;
};

export function GuestHero({ coverUrl, coupleNames, dateLabel, eventLabel }: Props) {
  const initials = coupleNames
    .split(/[&\s]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('');

  return (
    <Animated.View entering={FadeInDown.duration(500)} style={styles.wrap} testID="guest-hero">
      {coverUrl ? (
        <Image source={{ uri: coverUrl }} style={styles.image} contentFit="cover" />
      ) : (
        <View style={[styles.image, styles.fallback]}>
          <Text style={styles.initials}>{initials}</Text>
        </View>
      )}
      <LinearGradient colors={['transparent', 'rgba(13,13,15,0.92)']} style={styles.gradient} />
      <View style={styles.caption}>
        <Text style={styles.label}>{eventLabel}</Text>
        <Text style={styles.title} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.75}>
          {coupleNames}
        </Text>
        <Text style={styles.date} numberOfLines={1}>{dateLabel}</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    height: 300,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    overflow: 'hidden',
    backgroundColor: colors.surface,
  },
  image: { ...StyleSheet.absoluteFill },
  fallback: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1a1a22',
  },
  initials: { fontSize: 56, fontWeight: '900', color: colors.lime, fontFamily: fonts.display },
  gradient: { position: 'absolute', left: 0, right: 0, bottom: 0, height: '65%' },
  caption: { position: 'absolute', left: 20, right: 20, bottom: 22 },
  label: {
    color: colors.sky,
    fontSize: 11,
    fontFamily: fonts.bodyMedium,
    fontWeight: '800',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  title: {
    color: colors.fg,
    fontSize: 30,
    fontFamily: fonts.display,
    fontWeight: '900',
    marginTop: 6,
    lineHeight: 36,
  },
  date: { color: colors.muted, marginTop: 6, fontSize: 15, fontFamily: fonts.bodyMedium },
});
