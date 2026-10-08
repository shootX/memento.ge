import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Text } from 'react-native';
import { api } from '@/src/api/client';
import { PLAN_TIERS, type PlanTierId } from '@/src/config';
import { extractHostTokenFromUrl } from '@/src/lib/slug';
import { useAuthStore } from '@/src/stores/auth-store';
import { Card, Field, GhostButton, PrimaryButton, Screen, Title } from '@/src/components/ui';

export default function CreateEventScreen() {
  const { t } = useTranslation();
  const bearer = useAuthStore((s) => s.accessToken);
  const [coupleNames, setCoupleNames] = useState('');
  const [eventDate, setEventDate] = useState('2026-06-14');
  const [planTier, setPlanTier] = useState<PlanTierId>('classic');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [coverUri, setCoverUri] = useState<string | undefined>();
  const [error, setError] = useState<string | null>(null);

  const pickCover = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 1 });
    if (!res.canceled) setCoverUri(res.assets[0]?.uri);
  };

  const submit = async () => {
    setError(null);
    try {
      const res = await api.createEvent({
        coupleNames,
        eventDate,
        planTier,
        ownerEmail: bearer ? undefined : ownerEmail,
        coverUri,
        bearerToken: bearer,
      });
      const token = extractHostTokenFromUrl(res.hostUrl);
      if (token) router.replace(`/host/${token}`);
      else setError(res.error ?? 'ვერ შეიქმნა');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'ვერ შეიქმნა');
    }
  };

  return (
    <Screen>
      <Title>{t('newEvent')}</Title>
      <Card style={{ marginTop: 16, gap: 8 }}>
        <Field value={coupleNames} onChangeText={setCoupleNames} placeholder={t('coupleNames')} />
        <Field value={eventDate} onChangeText={setEventDate} placeholder="YYYY-MM-DD" />
        {!bearer && (
          <Field value={ownerEmail} onChangeText={setOwnerEmail} placeholder="email" keyboardType="email-address" />
        )}
        <Text style={{ color: '#9ca3af', marginTop: 8 }}>{t('plan')}</Text>
        {(Object.keys(PLAN_TIERS) as PlanTierId[]).map((id) => (
          <GhostButton
            key={id}
            label={`${PLAN_TIERS[id].nameKa} — ${PLAN_TIERS[id].priceGel} ₾`}
            onPress={() => setPlanTier(id)}
          />
        ))}
        <Text style={{ color: planTier === 'classic' ? '#c4ff0d' : '#9ca3af' }}>
          არჩეული: {PLAN_TIERS[planTier].nameKa}
        </Text>
        <GhostButton label="საფარი" onPress={() => void pickCover()} />
        {error && <Text style={{ color: '#f87171' }}>{error}</Text>}
        <PrimaryButton label={t('createEvent')} onPress={() => void submit()} />
      </Card>
    </Screen>
  );
}
