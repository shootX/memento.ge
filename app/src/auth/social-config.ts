import { config } from '@/src/config';
import { Platform } from 'react-native';

export function isGoogleSignInConfigured(): boolean {
  if (config.useMockApi) return true;
  if (Platform.OS === 'ios') return !!config.googleIosClientId;
  if (Platform.OS === 'android') return !!config.googleAndroidClientId;
  return !!config.googleWebClientId;
}

export function isAppleSignInConfigured(): boolean {
  if (config.useMockApi) return true;
  return Platform.OS === 'ios';
}

export function isFacebookSignInConfigured(): boolean {
  if (config.useMockApi) return true;
  return !!config.facebookAppId;
}

export function isAnySocialSignInConfigured(): boolean {
  return isGoogleSignInConfigured() || isAppleSignInConfigured() || isFacebookSignInConfigured();
}
