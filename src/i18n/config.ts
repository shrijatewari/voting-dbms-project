import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import enTranslations from './locales/en.json';
import hiTranslations from './locales/hi.json';
import bnTranslations from './locales/bn.json';
import teTranslations from './locales/te.json';
import mrTranslations from './locales/mr.json';
import taTranslations from './locales/ta.json';
import guTranslations from './locales/gu.json';
import knTranslations from './locales/kn.json';
import mlTranslations from './locales/ml.json';
import paTranslations from './locales/pa.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: enTranslations },
      hi: { translation: hiTranslations },
      bn: { translation: bnTranslations },
      te: { translation: teTranslations },
      mr: { translation: mrTranslations },
      ta: { translation: taTranslations },
      gu: { translation: guTranslations },
      kn: { translation: knTranslations },
      ml: { translation: mlTranslations },
      pa: { translation: paTranslations },
    },
    fallbackLng: 'en',
    lng: (() => {
      const saved = localStorage.getItem('i18nextLng');
      return saved || 'en';
    })(),
    debug: false,
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
      lookupLocalStorage: 'i18nextLng',
      checkWhitelist: true,
    },
    react: {
      useSuspense: false,
    },
    // Ensure language is loaded immediately
    load: 'languageOnly',
    // Support all language codes
    supportedLngs: ['en', 'hi', 'bn', 'te', 'mr', 'ta', 'gu', 'kn', 'ml', 'pa'],
  });

export default i18n;
