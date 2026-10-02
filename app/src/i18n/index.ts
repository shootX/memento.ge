import * as Localization from 'expo-localization';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from '@/src/i18n/locales/en.json';
import ka from '@/src/i18n/locales/ka.json';
import ru from '@/src/i18n/locales/ru.json';

const device = Localization.getLocales()[0]?.languageCode ?? 'ka';
const envLocale = process.env.EXPO_PUBLIC_DEFAULT_LOCALE;
const initial =
  envLocale === 'ka' || envLocale === 'en' || envLocale === 'ru'
    ? envLocale
    : device === 'en' || device === 'ru' || device === 'ka'
      ? 'ka'
      : 'ka';

void i18n.use(initReactI18next).init({
  resources: { ka: { translation: ka }, en: { translation: en }, ru: { translation: ru } },
  lng: initial,
  fallbackLng: 'ka',
  interpolation: { escapeValue: false },
});

export default i18n;
