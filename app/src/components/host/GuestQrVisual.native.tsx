import QRCode from 'react-native-qrcode-svg';
import { colors } from '@/src/theme/colors';

export type GuestQrVisualProps = {
  guestUrl: string;
  onRef?: (ref: { toDataURL: (cb: (url: string) => void) => void }) => void;
};

export function GuestQrVisual({ guestUrl, onRef }: GuestQrVisualProps) {
  return (
    <QRCode
      getRef={(c) => {
        if (c && onRef) onRef(c);
      }}
      value={guestUrl}
      size={148}
      color="#FFFFFF"
      backgroundColor={colors.bgElevated}
    />
  );
}
