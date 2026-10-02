import { useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { api } from '@/src/api/client';

export default function SlideshowScreen() {
  const { token } = useLocalSearchParams<{ token: string }>();
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

  return (
    <View style={styles.root} testID="host-slideshow">
      {current ? (
        <Animated.View entering={FadeIn} exiting={FadeOut} style={StyleSheet.absoluteFill}>
          <Image source={{ uri: current.url }} style={styles.img} resizeMode="contain" />
          {current.guestName && (
            <Text style={styles.caption} numberOfLines={1}>{current.guestName}</Text>
          )}
        </Animated.View>
      ) : (
        <Text style={styles.caption}>ლაივ სლაიდშოუ</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000', justifyContent: 'center' },
  img: { width: '100%', height: '100%' },
  caption: {
    position: 'absolute',
    bottom: 48,
    alignSelf: 'center',
    color: '#fff',
    fontWeight: '800',
    fontSize: 18,
    paddingHorizontal: 16,
    maxWidth: '90%',
    textAlign: 'center',
  },
});
