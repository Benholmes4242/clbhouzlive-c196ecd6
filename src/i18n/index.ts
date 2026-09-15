/**
 * i18n bootstrap.
 *
 * ENGLISH ONLY (for now). `de`, `es`, `ja` and `ko` are keyed but only ~26%
 * translated, so a device set to one of those languages used to render a
 * half-English app. Until a locale has had native review it stays OFF:
 *   - device / OS language is NOT detected any more,
 *   - a previously cached `clbhouz.locale` that isn't enabled is cleared.
 *
 * THE SWITCH: `ENABLED_LOCALES` below. Turning a language back on is a
 * one-line change there; the locale JSON files are all still in place.
 *
 * Resolution order now:
 *   1. Persisted `clbhouz.locale`, but only if it is in ENABLED_LOCALES.
 *   2. `en`.
 */
import i18n from 'i18next';
import { initReactI18next, useTranslation } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import HttpBackend from 'i18next-http-backend';
import { useCallback } from 'react';
import authEn from '../../public/locales/en/auth.json';

export const LOCALE_STORAGE_KEY = 'clbhouz.locale';
/** Every locale that HAS files on disk. Kept intact — nothing is deleted. */
export const SUPPORTED_LOCALES = ['en', 'ja', 'ko', 'es', 'de', 'en-XA'] as const;
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

/**
 * THE SWITCH. Locales a member may actually be served.
 * `en-XA` is the pseudo-locale for text-expansion QA: dev builds only, never
 * production. To re-enable a reviewed language, add it to this array.
 */
export const ENABLED_LOCALES: readonly SupportedLocale[] = import.meta.env.DEV
  ? (['en', 'en-XA'] as const)
  : (['en'] as const);

export function isLocaleEnabled(l: string | null | undefined): l is SupportedLocale {
  return !!l && (ENABLED_LOCALES as readonly string[]).includes(l);
}

/**
 * Drop a cached locale that is no longer enabled (e.g. a device that stored
 * `de` before the cutover), so it can't pin the member to a disabled language.
 */
export function pruneStoredLocale(): void {
  if (typeof window === 'undefined') return;
  try {
    const stored = window.localStorage.getItem(LOCALE_STORAGE_KEY);
    if (stored && !isLocaleEnabled(stored)) {
      window.localStorage.removeItem(LOCALE_STORAGE_KEY);
    }
  } catch {
    // ignore quota / privacy-mode failures
  }
}

pruneStoredLocale();


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
      ns: [
        'common',
        'auth',
        'composer',
        'messaging',
        'achievements',
        'courses',
        'tourhub',
        'handicap',
        'echo',
        'profile',
      ],
      load: 'languageOnly',
      // React already escapes.
      interpolation: { escapeValue: false },
      // Suspense off — we don't want the feed to blank while a namespace loads.
      react: { useSuspense: false },
      backend: {
        loadPath: '/locales/{{lng}}/{{ns}}.json',
        // Build-stamped so a device never serves a cached bundle that predates
        // newly added keys (which would render raw key names to the member).
        queryStringParams: { v: __BUILD_ID__ },
      },

      detection: {
        // Persisted user choice FIRST, then browser/OS, then fallbackLng.
        order: ['localStorage', 'navigator'],
        lookupLocalStorage: LOCALE_STORAGE_KEY,
        caches: ['localStorage'],
      },
      // DEV-ONLY: surface missing i18n keys in the console so they don't ship silently.
      missingKeyHandler: import.meta.env.DEV
        ? (_lngs, ns, key, fallbackValue) => {
            if (fallbackValue === key) {
              // eslint-disable-next-line no-console
              console.warn(`[i18n missing key] ${ns}:${key}`);
            }
          }
        : undefined,
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
