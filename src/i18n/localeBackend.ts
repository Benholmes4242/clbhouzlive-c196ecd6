import type { BackendModule, ReadCallback } from 'i18next';

/**
 * Locale JSON lives in src/locales and is bundled by Vite: each namespace is
 * its own lazy chunk (never eager, never fetched from public/ — Vite cannot
 * import public files, see FIX_LOCALES_OUT_OF_PUBLIC). A missing file calls
 * back with an error, exactly as the old HTTP 404 did.
 */
const LOCALE_MODULES = import.meta.glob<{ default: Record<string, unknown> }>('../locales/*/*.json');

export const bundledBackend: BackendModule = {
  type: 'backend',
  init() {},
  read(lng: string, ns: string, callback: ReadCallback) {
    const load = LOCALE_MODULES[`../locales/${lng}/${ns}.json`];
    if (!load) {
      callback(`failed loading ../locales/${lng}/${ns}.json; status code: 404`, false);
      return;
    }
    load().then(
      (mod) => callback(null, mod.default),
      (err) => callback(err instanceof Error ? err.message : String(err), true),
    );
  },
};
