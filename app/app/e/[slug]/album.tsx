import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Screen, Subtitle, PrimaryButton } from '@/src/components/ui';

/** Shortcut to public gallery for the same slug. */
export default function GuestAlbumRedirect() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { t } = useTranslation();
  return (
    <Screen>
      <Subtitle>{t('album')}</Subtitle>
      <PrimaryButton label={t('continue')} onPress={() => router.replace(`/gallery/${slug}`)} />
    </Screen>
  );
}
