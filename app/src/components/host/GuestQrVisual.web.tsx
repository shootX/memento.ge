import { Image } from 'expo-image';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { colors } from '@/src/theme/colors';

export type GuestQrVisualProps = {
  guestUrl: string;
  onRef?: (ref: { toDataURL: (cb: (url: string) => void) => void }) => void;
};

export function GuestQrVisual({ guestUrl, onRef }: GuestQrVisualProps) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void import('qrcode').then((QR) =>
      QR.toDataURL(guestUrl, {
        width: 148,
        margin: 1,
        color: { dark: '#FFFFFF', light: colors.bgElevated },
      }).then((url) => {
        if (cancelled) return;
        setDataUrl(url);
        onRef?.({
          toDataURL: (cb) => {
            cb(url);
          },
        });
      }),
    );
    return () => {
      cancelled = true;
    };
  }, [guestUrl, onRef]);

  if (!dataUrl) {
    return <View style={{ width: 148, height: 148, backgroundColor: colors.bgElevated }} />;
  }

  return <Image source={{ uri: dataUrl }} style={{ width: 148, height: 148 }} contentFit="contain" />;
}
