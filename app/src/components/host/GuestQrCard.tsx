import { useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Platform, Share, StyleSheet, View } from 'react-native';
import { GhostButton } from '@/src/components/ui';
import { GuestQrVisual } from '@/src/components/host/GuestQrVisual';
import { colors } from '@/src/theme/colors';

type QrRef = { toDataURL: (cb: (url: string) => void) => void };

type Props = {
  guestUrl: string;
};

export function GuestQrCard({ guestUrl }: Props) {
  const { t } = useTranslation();
  const qrRef = useRef<QrRef | null>(null);

  const onShare = () => {
    void Share.share({ message: guestUrl, url: guestUrl });
  };

  const onSave = useCallback(() => {
    const qr = qrRef.current;
    if (!qr) return;
    qr.toDataURL(async (dataUrl: string) => {
      try {
        if (Platform.OS === 'web' && typeof document !== 'undefined') {
          const a = document.createElement('a');
          a.href = dataUrl;
          a.download = 'memento-guest-qr.png';
          a.click();
          return;
        }
        const FileSystem = await import('expo-file-system/legacy');
        const MediaLibrary = await import('expo-media-library');
        const { status } = await MediaLibrary.requestPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert(t('cameraPermission'));
          return;
        }
        const base64 = dataUrl.replace(/^data:image\/\w+;base64,/, '');
        const path = `${FileSystem.cacheDirectory ?? ''}guest-qr.png`;
        await FileSystem.writeAsStringAsync(path, base64, {
          encoding: FileSystem.EncodingType.Base64,
        });
        await MediaLibrary.saveToLibraryAsync(path);
      } catch {
        Alert.alert(t('retry'));
      }
    });
  }, [t]);

  return (
    <View style={styles.card}>
      <View style={styles.qrFrame} testID="guest-qr">
        <GuestQrVisual
          guestUrl={guestUrl}
          onRef={(c) => {
            qrRef.current = c;
          }}
        />
      </View>
      <View style={styles.actions}>
        <View style={styles.actionBtn}>
          <GhostButton label={t('save')} onPress={() => void onSave()} />
        </View>
        <View style={styles.actionBtn}>
          <GhostButton label={t('share')} onPress={onShare} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { gap: 12 },
  qrFrame: {
    alignSelf: 'center',
    padding: 14,
    borderRadius: 12,
    backgroundColor: colors.bgElevated,
    borderWidth: 2,
    borderColor: colors.lime,
    minWidth: 176,
    minHeight: 176,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actions: { flexDirection: 'row', gap: 8 },
  actionBtn: { flex: 1 },
});
