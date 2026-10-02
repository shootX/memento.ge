import { CameraView, useCameraPermissions } from 'expo-camera';
import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Field, GhostButton, PrimaryButton, Screen, Subtitle, Title } from '@/src/components/ui';
import { parseEventSlugFromUrl } from '@/src/lib/slug';
import { colors } from '@/src/theme/colors';

export default function ScanScreen() {
  const { t } = useTranslation();
  const [permission, requestPermission] = useCameraPermissions();
  const [manual, setManual] = useState('');
  const [scanned, setScanned] = useState(false);

  const goSlug = (slug: string) => {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.replace(`/e/${slug}`);
  };

  if (!permission?.granted) {
    return (
      <Screen>
        <Title>{t('scanQr')}</Title>
        <Subtitle>კამერის ნებართვა საჭიროა QR-ისთვის.</Subtitle>
        <View style={styles.actions}>
          <PrimaryButton label="ნებართვა" onPress={() => void requestPermission()} />
          <Field value={manual} onChangeText={setManual} placeholder={t('enterSlug')} />
          <PrimaryButton
            label={t('continue')}
            onPress={() => {
              const slug = parseEventSlugFromUrl(manual) ?? manual.trim().toLowerCase();
              if (slug) goSlug(slug);
            }}
          />
        </View>
      </Screen>
    );
  }

  return (
    <View style={styles.cameraWrap}>
      <CameraView
        style={StyleSheet.absoluteFill}
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={
          scanned
            ? undefined
            : ({ data }) => {
                setScanned(true);
                const slug = parseEventSlugFromUrl(data);
                if (slug) goSlug(slug);
                else setScanned(false);
              }
        }
      />
      <View style={styles.overlay}>
        <Text style={styles.hint}>{t('scanQr')}</Text>
        <GhostButton label={t('enterSlug')} onPress={() => router.back()} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cameraWrap: { flex: 1, backgroundColor: '#000' },
  overlay: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
    gap: 12,
    alignItems: 'center',
  },
  hint: { color: colors.fg, fontWeight: '800', fontSize: 16 },
  actions: { marginTop: 24, gap: 12 },
});
