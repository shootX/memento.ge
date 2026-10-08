import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Linking, ScrollView, StyleSheet, Text, View } from 'react-native';
import { api } from '@/src/api/client';
import type { MobileOAuthPendingLink } from '@/src/api/types';
import { classifyPasswordAuthError } from '@/src/auth/password-auth-errors';
import {
  OAuthPendingLinkForm,
  SocialLoginSection,
} from '@/src/components/auth/SocialLoginSection';
import { HostAuthTabs, type HostAuthTab } from '@/src/components/auth/HostAuthTabs';
import { PasswordField } from '@/src/components/auth/PasswordField';
import { Card, Field, GhostButton, PrimaryButton } from '@/src/components/ui';
import { isAnySocialSignInConfigured } from '@/src/auth/social-config';
import type { OAuthExchangeResult } from '@/src/auth/social-auth-service';
import { SEED } from '@/src/constants/images';
import { useAuthStore } from '@/src/stores/auth-store';
import { colors } from '@/src/theme/colors';
import { fonts } from '@/src/theme/typography';

const MIN_PASSWORD_LEN = 8;
const FORGOT_PASSWORD_URL = 'https://qr.socialsave.cc/forgot-password';

type ScreenStep = 'auth' | 'oauth_pending';

export default function HostLoginScreen() {
  const { t } = useTranslation();
  const [tab, setTab] = useState<HostAuthTab>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [step, setStep] = useState<ScreenStep>('auth');
  const [oauthPending, setOauthPending] = useState<MobileOAuthPendingLink | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const setSession = useAuthStore((s) => s.setSession);

  const passwordAuthErrorMessage = (err: unknown) => {
    const kind = classifyPasswordAuthError(err);
    if (kind === 'wrong_credentials') return t('authWrongCredentials');
    if (kind === 'rate_limited') return t('authRateLimited');
    return t('retry');
  };

  const completeSession = async (accessToken: string, userEmail: string) => {
    await setSession(accessToken, userEmail);
    router.replace('/host/events');
  };

  const handleOAuthResult = async (result: OAuthExchangeResult) => {
    setInfo(null);
    setError(null);
    if (result.kind === 'cancelled') {
      setInfo(t('oauthCancelled'));
      return;
    }
    if (result.kind === 'pending_link') {
      setOauthPending(result.pending);
      setStep('oauth_pending');
      return;
    }
    if (result.kind === 'error') {
      setError(result.code === 'RATE_LIMITED' ? t('authRateLimited') : t('oauthErrorGeneric'));
      return;
    }
    if (result.kind === 'session') {
      setBusy(true);
      try {
        await completeSession(result.session.accessToken, result.session.user.email);
      } catch {
        setError(t('retry'));
      } finally {
        setBusy(false);
      }
    }
  };

  const validateEmail = () => {
    if (!email.trim().includes('@')) {
      setError(t('loginEmailInvalid'));
      return false;
    }
    return true;
  };

  const validatePassword = () => {
    if (password.length < MIN_PASSWORD_LEN) {
      setError(t('passwordTooShort'));
      return false;
    }
    return true;
  };

  const submitLogin = async () => {
    setError(null);
    setInfo(null);
    if (!validateEmail() || !validatePassword()) return;
    setBusy(true);
    try {
      const res = await api.mobilePasswordLogin(email.trim(), password);
      await completeSession(res.accessToken, res.user.email);
    } catch (e) {
      setError(passwordAuthErrorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const submitRegister = async () => {
    setError(null);
    setInfo(null);
    if (!validateEmail() || !validatePassword()) return;
    if (password !== confirmPassword) {
      setError(t('passwordMismatch'));
      return;
    }
    setBusy(true);
    try {
      const res = await api.mobilePasswordRegister({
        email: email.trim(),
        password,
        ...(name.trim() ? { name: name.trim() } : {}),
      });
      await completeSession(res.accessToken, res.user.email);
    } catch (e) {
      setError(passwordAuthErrorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const backFromOAuthPending = () => {
    setOauthPending(null);
    setStep('auth');
    setError(null);
    setInfo(null);
  };

  const showSocial = step === 'auth' && isAnySocialSignInConfigured();
  const subtitle = tab === 'login' ? t('loginPasswordSubtitle') : t('registerSubtitle');

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.scroll} testID="host-login">
      <Image source={{ uri: SEED.cover }} style={styles.hero} contentFit="cover" />
      <Text style={styles.title}>{t('login')}</Text>
      <Text style={styles.sub}>{subtitle}</Text>

      <Card style={styles.card}>
        {step === 'oauth_pending' && oauthPending ? (
          <>
            <OAuthPendingLinkForm
              pending={oauthPending}
              disabled={busy}
              onResult={(r) => void handleOAuthResult(r)}
            />
            <GhostButton label={t('back')} onPress={backFromOAuthPending} />
          </>
        ) : (
          <>
            <HostAuthTabs
              active={tab}
              onChange={(next) => {
                setTab(next);
                setError(null);
                setInfo(null);
              }}
            />

            {tab === 'register' && (
              <Field
                value={name}
                onChangeText={setName}
                placeholder={t('nameOptionalPlaceholder')}
                testID="auth-name"
              />
            )}

            <Field
              value={email}
              onChangeText={setEmail}
              placeholder={t('emailPlaceholder')}
              keyboardType="email-address"
              testID="auth-email"
            />
            <PasswordField
              value={password}
              onChangeText={setPassword}
              placeholder={t('passwordPlaceholder')}
              testID="auth-password"
            />
            {tab === 'register' && (
              <PasswordField
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder={t('passwordConfirmPlaceholder')}
                testID="auth-password-confirm"
              />
            )}

            {tab === 'login' && (
              <GhostButton
                label={t('forgotPassword')}
                onPress={() => void Linking.openURL(FORGOT_PASSWORD_URL)}
              />
            )}

            <PrimaryButton
              label={tab === 'login' ? t('login') : t('registerAction')}
              disabled={busy}
              onPress={() => void (tab === 'login' ? submitLogin() : submitRegister())}
              testID="auth-submit"
            />

            {showSocial && (
              <>
                <Text style={styles.oauthOr} accessibilityRole="text">{t('oauthOr')}</Text>
                <SocialLoginSection disabled={busy} onResult={(r) => void handleOAuthResult(r)} />
              </>
            )}

            {error && <Text style={styles.error}>{error}</Text>}
            {info && <Text style={styles.info}>{info}</Text>}
          </>
        )}
      </Card>

      {__DEV__ && (
        <GhostButton label={t('demoPanel')} onPress={() => router.push('/preview/host')} />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: 24, paddingBottom: 40 },
  hero: { width: '100%', height: 160, borderRadius: 20, marginBottom: 20 },
  title: { color: colors.fg, fontFamily: fonts.display, fontSize: 28, fontWeight: '800' },
  sub: { color: colors.muted, marginTop: 8, lineHeight: 22, fontFamily: fonts.body },
  card: { marginTop: 20, gap: 12 },
  error: { color: colors.danger, fontFamily: fonts.bodyMedium },
  info: { color: colors.muted, fontFamily: fonts.body, textAlign: 'center' },
  oauthOr: {
    textAlign: 'center',
    color: colors.muted,
    fontFamily: fonts.body,
    fontSize: 13,
    marginTop: 4,
  },
});
