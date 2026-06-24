/**
 * Safe localStorage wrapper — silently handles private browsing and WebView contexts
 * where localStorage throws.
 */
export const safeLocalStorage = {
  get: (key: string): string | null => {
    try { return localStorage.getItem(key); } catch { return null; }
  },
  set: (key: string, value: string): void => {
    try { localStorage.setItem(key, value); } catch { /* silent */ }
  },
  remove: (key: string): void => {
    try { localStorage.removeItem(key); } catch { /* silent */ }
  },
};
