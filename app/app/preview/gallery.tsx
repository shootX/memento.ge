import { Image } from 'expo-image';
import { useTranslation } from 'react-i18next';
import { Dimensions, Modal, StyleSheet, Text, View } from 'react-native';
import Animated, { ZoomIn } from 'react-native-reanimated';
import { GhostButton, Screen, Title } from '@/src/components/ui';
import { SEED } from '@/src/constants/images';
import { colors } from '@/src/theme/colors';
const items = [
  { id: '1', url: SEED.photo1, guestName: 'მარიამი' },
  { id: '2', url: SEED.photo2, guestName: 'გიორგი' },
];

export default function PreviewGalleryScreen() {
  const { t } = useTranslation();
  const width = Dimensions.get('window').width;
  const col = (width - 48) / 2;
  const lightbox = items[0];

  return (
    <Screen style={{ paddingHorizontal: 12 }} testID="gallery-ready">
      <Title>ნინო & გიორგი</Title>
      <View style={styles.grid}>
        {items.map((item) => (
          <Image key={item.id} source={{ uri: item.url }} style={[styles.tile, { width: col }]} />
        ))}
      </View>
      <Modal visible transparent animationType="fade">
        <View style={styles.lbBg} testID="gallery-lightbox">
          <Animated.View entering={ZoomIn} style={styles.lbInner}>
            <Image source={{ uri: lightbox.url }} style={styles.lbImg} contentFit="contain" />
            <Text style={styles.lbName}>{lightbox.guestName}</Text>
            <GhostButton label={t('share')} onPress={() => {}} />
          </Animated.View>
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 16 },
  tile: { aspectRatio: 3 / 4, borderRadius: 16 },
  lbBg: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.92)',
    justifyContent: 'center',
    padding: 16,
  },
  lbInner: { alignItems: 'center', gap: 12 },
  lbImg: { width: '100%', height: 420 },
  lbName: { color: colors.fg, fontWeight: '800', fontSize: 16 },
});
