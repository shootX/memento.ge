import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';
import * as Facebook from 'expo-auth-session/providers/facebook';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { api } from '@/src/api/client';
import type { MobileOAuthPendingLink } from '@/src/api/types';
import { config } from '@/src/config';
import {
  completePendingOAuthLink,
  exchangeOAuthToken,
  type OAuthExchangeResult,
} from '@/src/auth/social-auth-service';
import {
  isAppleSignInConfigured,
  isFacebookSignInConfigured,
  isGoogleSignInConfigured,
} from '@/src/auth/social-config';
import { AppleLogoIcon, FacebookFIcon, GoogleGIcon } from '@/src/components/auth/SocialBrandIcons';
import { CodeInput } from '@/src/components/CodeInput';
import { Field, GhostButton, PrimaryButton } from '@/src/components/ui';
import { colors } from '@/src/theme/colors';
import { fonts } from '@/src/theme/typography';

WebBrowser.maybeCompleteAuthSession();

type Props = {
  disabled?: boolean;
  onResult: (result: OAuthExchangeResult) => void;
  /** Screenshot preview: show Apple button on web as on iOS. */
  previewAsIos?: boolean;
};

async function createNoncePair(): Promise<{ raw: string; hashed: string }> {
  const raw = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const hashed = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, raw);
  return { raw, hashed };
}

function SocialButtonContent({
  icon,
  label,
  labelStyle,
}: {
  icon: ReactNode;
  label: string;
  labelStyle: object;
}) {
  return (
    <View style={styles.btnRow}>
      <View style={styles.btnIcon}>{icon}</View>
      <Text style={labelStyle}>{label}</Text>
    </View>
  );
}

function GoogleSignInButton({
  disabled,
  busy,
  onBusy,
  onResult,
}: {
  disabled?: boolean;
  busy: boolean;
  onBusy: (v: boolean) => void;
  onResult: (result: OAuthExchangeResult) => void;
}) {
  const { t } = useTranslation();
  const [nonceHash, setNonceHash] = useState<string | null>(null);
  const handledRef = useRef<string | null>(null);

  useEffect(() => {
    void createNoncePair().then(({ hashed }) => setNonceHash(hashed));
  }, []);

  const googleConfig = useMemo(
    () => ({
      iosClientId: config.googleIosClientId || undefined,
      androidClientId: config.googleAndroidClientId || undefined,
      webClientId: config.googleWebClientId || undefined,
    }),
    [],
  );

  const [, googleResponse, googlePrompt] = Google.useIdTokenAuthRequest({
    ...googleConfig,
    selectAccount: true,
    extraParams: nonceHash ? { nonce: nonceHash } : undefined,
  });

  const runExchange = useCallback(
    async (body: Parameters<typeof api.exchangeMobileOAuth>[0]) => {
      onBusy(true);
      const result = await exchangeOAuthToken(api, body);
      onBusy(false);
      onResult(result);
    },
    [onBusy, onResult],
  );

  useEffect(() => {
    if (!googleResponse) return;
    const key = `${googleResponse.type}-${googleResponse.type === 'success' ? googleResponse.params.id_token : ''}`;
    if (handledRef.current === key) return;
    if (googleResponse.type === 'success' && googleResponse.params.id_token) {
      handledRef.current = key;
      void runExchange({ provider: 'google', idToken: googleResponse.params.id_token });
    } else if (googleResponse.type === 'cancel' || googleResponse.type === 'dismiss') {
      handledRef.current = key;
      onResult({ kind: 'cancelled' });
    }
  }, [googleResponse, onResult, runExchange]);

  const signInGoogle = async () => {
    if (config.useMockApi) {
      await runExchange({ provider: 'google', idToken: 'mock-google-token' });
      return;
    }
    if (!nonceHash) return;
    await googlePrompt();
  };

  return (
    <Pressable
      style={[styles.googleBtn, (disabled || busy) && styles.disabled]}
      onPress={() => {
        if (!disabled && !busy) void signInGoogle();
      }}
      accessibilityRole="button"
      accessibilityLabel={t('signInWithGoogle')}
      testID="social-google"
    >
      <SocialButtonContent
        icon={<GoogleGIcon />}
        label={t('signInWithGoogle')}
        labelStyle={styles.googleText}
      />
    </Pressable>
  );
}

function FacebookSignInButton({
  disabled,
  busy,
  onBusy,
  onResult,
}: {
  disabled?: boolean;
  busy: boolean;
  onBusy: (v: boolean) => void;
  onResult: (result: OAuthExchangeResult) => void;
}) {
  const { t } = useTranslation();
  const handledRef = useRef<string | null>(null);
  const clientId = config.facebookAppId || 'unused';

  const [, facebookResponse, facebookPrompt] = Facebook.useAuthRequest({ clientId });

  const runExchange = useCallback(
    async (body: Parameters<typeof api.exchangeMobileOAuth>[0]) => {
      onBusy(true);
      const result = await exchangeOAuthToken(api, body);
      onBusy(false);
      onResult(result);
    },
    [onBusy, onResult],
  );

  useEffect(() => {
    if (!facebookResponse) return;
    const accessHint =
      facebookResponse.type === 'success'
        ? facebookResponse.authentication?.accessToken ?? ''
        : '';
    const key = `${facebookResponse.type}-${accessHint}`;
    if (handledRef.current === key) return;
    if (facebookResponse.type === 'success') {
      const accessToken = facebookResponse.authentication?.accessToken;
      if (!accessToken) return;
      handledRef.current = key;
      void runExchange({ provider: 'facebook', accessToken });
    } else if (facebookResponse.type === 'cancel' || facebookResponse.type === 'dismiss') {
      handledRef.current = key;
      onResult({ kind: 'cancelled' });
    }
  }, [facebookResponse, onResult, runExchange]);

  const signInFacebook = async () => {
    if (config.useMockApi) {
      await runExchange({ provider: 'facebook', accessToken: 'mock-facebook-pending' });
      return;
    }
    await facebookPrompt();
  };

  return (
    <Pressable
      style={[styles.facebookBtn, (disabled || busy) && styles.disabled]}
      onPress={() => {
        if (!disabled && !busy) void signInFacebook();
      }}
      accessibilityRole="button"
      accessibilityLabel={t('signInWithFacebook')}
      testID="social-facebook"
    >
      <SocialButtonContent
        icon={<FacebookFIcon />}
        label={t('signInWithFacebook')}
        labelStyle={styles.facebookText}
      />
    </Pressable>
  );
}

function PreviewAppleSignInButton({
  disabled,
  busy,
  onPress,
}: {
  disabled?: boolean;
  busy: boolean;
  onPress: () => void;
}) {
  const { t } = useTranslation();
  return (
    <Pressable
      style={[styles.appleMockBtn, (disabled || busy) && styles.disabled]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={t('signInWithApple')}
      testID="social-apple"
    >
      <SocialButtonContent
        icon={<AppleLogoIcon />}
        label={t('signInWithApple')}
        labelStyle={styles.appleMockText}
      />
    </Pressable>
  );
}

export function SocialLoginSection({ disabled, onResult, previewAsIos }: Props) {
  const { t } = useTranslation();
  const [busy, setBusy] = useState(false);

  const showGoogle = isGoogleSignInConfigured();
  const showApple = isAppleSignInConfigured() || previewAsIos;
  const showFacebook = isFacebookSignInConfigured();
  const useNativeApple = showApple && Platform.OS === 'ios' && !previewAsIos;
  const usePreviewApple = showApple && previewAsIos;

  const runExchange = async (body: Parameters<typeof api.exchangeMobileOAuth>[0]) => {
    setBusy(true);
    const result = await exchangeOAuthToken(api, body);
    setBusy(false);
    onResult(result);
  };

  const signInApple = async () => {
    if (config.useMockApi || previewAsIos) {
      await runExchange({ provider: 'apple', idToken: 'mock-apple-token' });
      return;
    }
    try {
      const { hashed } = await createNoncePair();
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
        nonce: hashed,
      });
      if (!credential.identityToken) {
        onResult({ kind: 'error', message: 'missing_token' });
        return;
      }
      await runExchange({ provider: 'apple', idToken: credential.identityToken });
    } catch (e) {
      if ((e as { code?: string }).code === 'ERR_REQUEST_CANCELED') {
        onResult({ kind: 'cancelled' });
        return;
      }
      onResult({ kind: 'error', message: 'apple_failed' });
    }
  };

  if (!showGoogle && !showApple && !showFacebook) return null;

  const mockGoogle = () => {
    if (!disabled && !busy) void runExchange({ provider: 'google', idToken: 'mock-google-token' });
  };

  const mockFacebook = () => {
    if (!disabled && !busy) {
      void runExchange({ provider: 'facebook', accessToken: 'mock-facebook-pending' });
    }
  };

  const googleBtn =
    config.useMockApi ? (
      <Pressable
        style={[styles.googleBtn, (disabled || busy) && styles.disabled]}
        onPress={mockGoogle}
        accessibilityRole="button"
        accessibilityLabel={t('signInWithGoogle')}
        testID="social-google"
      >
        <SocialButtonContent
          icon={<GoogleGIcon />}
          label={t('signInWithGoogle')}
          labelStyle={styles.googleText}
        />
      </Pressable>
    ) : (
      <GoogleSignInButton disabled={disabled} busy={busy} onBusy={setBusy} onResult={onResult} />
    );

  const facebookBtn =
    config.useMockApi ? (
      <Pressable
        style={[styles.facebookBtn, (disabled || busy) && styles.disabled]}
        onPress={mockFacebook}
        accessibilityRole="button"
        accessibilityLabel={t('signInWithFacebook')}
        testID="social-facebook"
      >
        <SocialButtonContent
          icon={<FacebookFIcon />}
          label={t('signInWithFacebook')}
          labelStyle={styles.facebookText}
        />
      </Pressable>
    ) : (
      <FacebookSignInButton disabled={disabled} busy={busy} onBusy={setBusy} onResult={onResult} />
    );

  return (
    <View style={styles.wrap} testID="social-login">
      {useNativeApple && (
        <AppleAuthentication.AppleAuthenticationButton
          buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
          buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
          cornerRadius={12}
          style={styles.appleBtn}
          onPress={() => {
            if (!disabled && !busy) void signInApple();
          }}
        />
      )}
      {usePreviewApple && (
        <PreviewAppleSignInButton
          disabled={disabled}
          busy={busy}
          onPress={() => {
            if (!disabled && !busy) void signInApple();
          }}
        />
      )}
      {showGoogle && googleBtn}
      {showFacebook && facebookBtn}
    </View>
  );
}

export type OAuthPendingProps = {
  pending: MobileOAuthPendingLink;
  disabled?: boolean;
  onResult: (result: OAuthExchangeResult) => void;
};

export function OAuthPendingLinkForm({ pending, disabled, onResult }: OAuthPendingProps) {
  const { t } = useTranslation();
  const [email, setEmail] = useState(pending.email ?? '');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'email' | 'code'>(pending.email ? 'code' : 'email');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendEmail = async () => {
    if (!email.trim().includes('@')) {
      setError(t('loginEmailInvalid'));
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await api.startOAuthLink(pending.pendingLinkId, email.trim());
      setStep('code');
    } catch {
      setError(t('retry'));
    } finally {
      setBusy(false);
    }
  };

  const verify = async () => {
    if (code.trim().length < 6) return;
    setBusy(true);
    setError(null);
    const result = await completePendingOAuthLink(
      api,
      pending.pendingLinkId,
      email.trim(),
      code.trim(),
    );
    setBusy(false);
    if (result.kind === 'session') {
      onResult(result);
      return;
    }
    setError(t('invalidCode'));
  };

  return (
    <View testID="oauth-pending-link" style={styles.pendingWrap}>
      <Text style={styles.pendingTitle}>{t('oauthLinkTitle')}</Text>
      <Text style={styles.pendingSub}>{t('oauthLinkSubtitle')}</Text>
      {step === 'email' ? (
        <>
          <Field
            value={email}
            onChangeText={setEmail}
            placeholder={t('emailPlaceholder')}
            keyboardType="email-address"
          />
          <PrimaryButton label={t('sendCode')} disabled={disabled || busy} onPress={() => void sendEmail()} />
        </>
      ) : (
        <>
          <Text style={styles.sent}>{t('magicLinkSent')}: {email}</Text>
          <CodeInput value={code} onChange={setCode} />
          <PrimaryButton
            label={t('verifyCode')}
            disabled={disabled || busy || code.length < 6}
            onPress={() => void verify()}
          />
          <GhostButton label={t('resendCode')} onPress={() => void sendEmail()} />
        </>
      )}
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 10 },
  btnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  btnIcon: { width: 22, alignItems: 'center' },
  appleBtn: { width: '100%', height: 48 },
  appleMockBtn: {
    minHeight: 48,
    borderRadius: 12,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  appleMockText: { color: '#fff', fontWeight: '700', fontFamily: fonts.bodyMedium },
  googleBtn: {
    minHeight: 48,
    borderRadius: 12,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#dadce0',
  },
  googleText: { color: '#1f1f1f', fontWeight: '700', fontFamily: fonts.bodyMedium },
  facebookBtn: {
    minHeight: 48,
    borderRadius: 12,
    backgroundColor: '#1877F2',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  facebookText: { color: '#fff', fontWeight: '700', fontFamily: fonts.bodyMedium },
  disabled: { opacity: 0.5 },
  pendingWrap: { gap: 12 },
  pendingTitle: { color: colors.fg, fontFamily: fonts.display, fontWeight: '800', fontSize: 16 },
  pendingSub: { color: colors.muted, marginTop: 4, fontFamily: fonts.body, lineHeight: 20 },
  sent: { color: colors.muted, fontSize: 13, fontFamily: fonts.body },
  error: { color: colors.danger, fontFamily: fonts.bodyMedium },
});
