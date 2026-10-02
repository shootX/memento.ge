import { useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { api } from '@/src/api/client';
import { KenBurnsImage } from '@/src/components/KenBurnsImage';
import { SEED } from '@/src/constants/images';
import { colors } from '@/src/theme/colors';
import { fonts } from '@/src/theme/typography';

export default function SlideshowScreen() {
  const { token } = useLocalSearchParams<{ token: string }>();
  const { t } = useTranslation();
  const hostQ = useQuery({
    queryKey: ['host', token, 'slideshow-meta'],
    queryFn: () => api.getHost(token),
  });
  const { data: media } = useQuery({
    queryKey: ['host-media', token, 'slideshow'],
    queryFn: () => api.getHostMedia(token),
    refetchInterval: 10000,
  });
  const [idx, setIdx] = useState(0);
  const items = media ?? [];

  useEffect(() => {
    void activateKeepAwakeAsync('slideshow');
    return () => {
      deactivateKeepAwake('slideshow');
    };
  }, []);

  useEffect(() => {
    if (!items.length) return;
    const timer = setInterval(() => setIdx((v) => (v + 1) % items.length), 5000);
    return () => clearInterval(timer);
  }, [items.length]);

  const current = items[idx];
  const slideUri = current?.url ?? SEED.photo2;

  return (
    <View style={styles.root} testID="host-slideshow">
      <KenBurnsImage uri={slideUri} />
      <View style={styles.qrBadge}>
        <Text style={styles.qrText}>{t('slideshowQr')}</Text>
      </View>
      {hostQ.data?.coupleNames && (
        <Text style={styles.names} numberOfLines={1}>{hostQ.data.coupleNames}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  qrBadge: {
    position: 'absolute',
    top: 20,
    right: 16,
    backgroundColor: 'rgba(0,0,0,0.65)',
    borderWidth: 1,
    borderColor: colors.lime,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
    maxWidth: 140,
  },
  qrText: {
    color: colors.lime,
    fontSize: 10,
    fontFamily: fonts.bodyMedium,
    fontWeight: '700',
    lineHeight: 14,
  },
  names: {
    position: 'absolute',
    bottom: 48,
    alignSelf: 'center',
    color: '#fff',
    fontFamily: fonts.display,
    fontSize: 22,
    fontWeight: '800',
    maxWidth: '90%',
    textAlign: 'center',
  },
});
