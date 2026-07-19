/**
 * i18n bootstrap — Wave 0 foundation.
 * No user-visible copy has been keyed yet; this file only wires machinery.
 *
 * Detection order:
 *   1. Persisted user choice under `clbhouz.locale` (in-app setting).
 *   2. `navigator.language` (falls back to OS / WebView locale).
 *   3. `en`.
 *
 * The in-app persisted choice ALWAYS beats the OS / Median WebView locale.
 */
import i18n from 'i18next';
import { initReactI18next, useTranslation } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import HttpBackend from 'i18next-http-backend';
import { useCallback } from 'react';
import authEn from '../../public/locales/en/auth.json';

export const LOCALE_STORAGE_KEY = 'clbhouz.locale';
export const SUPPORTED_LOCALES = ['en', 'ja', 'ko', 'es', 'de', 'en-XA'] as const;
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

if (!i18n.isInitialized) {
  i18n
    .use(HttpBackend)
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
      fallbackLng: 'en',
      supportedLngs: SUPPORTED_LOCALES as unknown as string[],
      nonExplicitSupportedLngs: true,
      partialBundledLanguages: true,
      resources: {
        en: { auth: authEn as Record<string, unknown> },
      },
      defaultNS: 'common',
      ns: ['common', 'auth', 'composer', 'messaging', 'achievements', 'courses', 'tourhub'],
      load: 'languageOnly',
      // React already escapes.
      interpolation: { escapeValue: false },
      // Suspense off — we don't want the feed to blank while a namespace loads.
      react: { useSuspense: false },
      backend: {
        loadPath: '/locales/{{lng}}/{{ns}}.json',
      },
      detection: {
        // Persisted user choice FIRST, then browser/OS, then fallbackLng.
        order: ['localStorage', 'navigator'],
        lookupLocalStorage: LOCALE_STORAGE_KEY,
        caches: ['localStorage'],
      },
    })
    .catch(() => {
      // Non-fatal: fallbackLng keeps English rendering.
    });
}

export function getActiveLocale(): string {
  return i18n.resolvedLanguage || i18n.language || 'en';
}

export function useLocale() {
  const { i18n: instance } = useTranslation();
  const setLocale = useCallback(async (next: SupportedLocale) => {
    try {
      window.localStorage.setItem(LOCALE_STORAGE_KEY, next);
    } catch {
      // ignore quota / privacy-mode failures
    }
    await instance.changeLanguage(next);
  }, [instance]);

  return {
    locale: (instance.resolvedLanguage || instance.language || 'en') as SupportedLocale,
    setLocale,
  };
}

export default i18n;

// Dev-only pseudo-locale toggle. `en-XA` pads every key ~35% with brackets
// and accents to expose text-expansion clipping. Because no copy is keyed
// yet in Wave 0, only the smoke key visibly changes — the rest of the UI
// stays byte-identical to `en`. Exposed as a window helper (behind the Vite
// DEV gate) so QA can flip locales from the console without shipping a UI
// affordance that would break the pixel-identical acceptance gate.
if (import.meta.env.DEV && typeof window !== 'undefined') {
  (window as unknown as { __clbhouzSetLocale?: (l: SupportedLocale) => Promise<void> })
    .__clbhouzSetLocale = async (l: SupportedLocale) => {
      try { window.localStorage.setItem(LOCALE_STORAGE_KEY, l); } catch { /* noop */ }
      await i18n.changeLanguage(l);
    };
}
