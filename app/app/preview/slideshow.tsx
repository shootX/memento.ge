import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';
import { KenBurnsImage } from '@/src/components/KenBurnsImage';
import { SEED } from '@/src/constants/images';
import { colors } from '@/src/theme/colors';
import { fonts } from '@/src/theme/typography';

export default function PreviewSlideshowScreen() {
  const { t } = useTranslation();

  return (
    <View style={styles.root} testID="host-slideshow">
      <KenBurnsImage uri={SEED.photo2} />
      <View style={styles.qrBadge}>
        <Text style={styles.qrText}>{t('slideshowQr')}</Text>
      </View>
      <Text style={styles.names}>ნინო & გიორგი</Text>
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
  },
});
