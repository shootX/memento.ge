import { Image } from 'expo-image';
import * as Sharing from 'expo-sharing';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, { FadeIn, ZoomIn } from 'react-native-reanimated';
import { api } from '@/src/api/client';
import { Field, GhostButton, PrimaryButton, Screen, Title } from '@/src/components/ui';
import { colors } from '@/src/theme/colors';

type Item = { id: string; url: string; thumbUrl?: string; guestName?: string };

export default function GalleryScreen() {
  const { slug, preview } = useLocalSearchParams<{ slug: string; preview?: string }>();
  const { t } = useTranslation();
  const [locked, setLocked] = useState(false);
  const [coupleNames, setCoupleNames] = useState('');
  const [items, setItems] = useState<Item[]>([]);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(true);
  const [lightbox, setLightbox] = useState<Item | null>(null);

  const load = async (pwd?: string) => {
    setLoading(true);
    try {
      const data = await api.getGallery(slug, pwd);
      setLocked(!!data.locked);
      setCoupleNames(data.coupleNames ?? '');
      const mapped = (data.items ?? []).map((it, idx) => ({
        id: it.id ?? String(idx),
        url: it.url,
        thumbUrl: it.thumbUrl,
        guestName: it.guestName,
      }));
      setItems(mapped);
      if (preview === 'lightbox' && mapped[0]) setLightbox(mapped[0]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const data = await api.getGallery(slug);
        if (!active) return;
        setLocked(!!data.locked);
        setCoupleNames(data.coupleNames ?? '');
        const mapped = (data.items ?? []).map((it, idx) => ({
          id: it.id ?? String(idx),
          url: it.url,
          thumbUrl: it.thumbUrl,
          guestName: it.guestName,
        }));
        setItems(mapped);
        if (preview === 'lightbox' && mapped[0]) setLightbox(mapped[0]);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [slug, preview]);

  if (loading) {
    return (
      <Screen style={styles.center} testID="gallery-loading">
        <ActivityIndicator color={colors.lime} />
      </Screen>
    );
  }

  if (locked) {
    return (
      <Screen>
        <Title>{coupleNames}</Title>
        <Text style={styles.lock}>🔒</Text>
        <Field
          value={password}
          onChangeText={setPassword}
          placeholder={t('galleryPassword')}
          secureTextEntry
        />
        <PrimaryButton label={t('continue')} onPress={() => void load(password)} />
      </Screen>
    );
  }

  const width = Dimensions.get('window').width;
  const col = (width - 48) / 2;

  return (
    <Screen style={{ paddingHorizontal: 12 }} testID="gallery-ready">
      <Title>{coupleNames || t('album')}</Title>
      {items.length === 0 ? (
        <Text style={styles.empty}>{t('emptyAlbum')}</Text>
      ) : (
        <FlatList
          data={items}
          numColumns={2}
          keyExtractor={(i) => i.id}
          columnWrapperStyle={{ gap: 12 }}
          contentContainerStyle={{ gap: 12, paddingVertical: 16 }}
          renderItem={({ item }) => (
            <Pressable onPress={() => setLightbox(item)} style={{ width: col }}>
              <Image source={{ uri: item.thumbUrl ?? item.url }} style={styles.tile} contentFit="cover" />
            </Pressable>
          )}
        />
      )}

      <Modal visible={!!lightbox} transparent animationType="fade">
        <Pressable style={styles.lbBg} onPress={() => setLightbox(null)} testID="gallery-lightbox">
          {lightbox && (
            <Animated.View entering={ZoomIn} style={styles.lbInner}>
              <Image source={{ uri: lightbox.url }} style={styles.lbImg} contentFit="contain" />
              {lightbox.guestName && (
                <Animated.Text entering={FadeIn} style={styles.lbName}>{lightbox.guestName}</Animated.Text>
              )}
              <GhostButton
                label={t('share')}
                onPress={() => void Sharing.shareAsync(lightbox.url)}
              />
            </Animated.View>
          )}
        </Pressable>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { justifyContent: 'center', alignItems: 'center' },
  lock: { fontSize: 32, marginVertical: 12 },
  empty: { color: colors.muted, marginTop: 24, textAlign: 'center' },
  tile: { width: '100%', aspectRatio: 3 / 4, borderRadius: 16 },
  lbBg: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.92)',
    justifyContent: 'center',
    padding: 16,
  },
  lbInner: { alignItems: 'center', gap: 12 },
  lbImg: { width: '100%', height: '68%' },
  lbName: { color: colors.fg, textAlign: 'center', fontWeight: '800', fontSize: 16 },
});
