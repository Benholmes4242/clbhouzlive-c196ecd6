import { useLocation } from 'react-router-dom';

/**
 * Route → theme for the floating bottom nav pill.
 * DARK glass on dark-surface routes; LIGHT glass everywhere else.
 *
 * Kept in sync with isDarkChromeRoute() in header rules:
 *   '/'          — Clubhouse feed (dark)
 *   '/clubhouse' — Clubhouse feed (dark)
 *   '/handicap'  — Handicap area (dark)
 */
const DARK_PREFIXES = ['/handicap'];
const DARK_EXACT = new Set(['/', '/clubhouse']);

export type NavTheme = 'dark' | 'light';

export function useNavTheme(): NavTheme {
  const { pathname } = useLocation();
  if (DARK_EXACT.has(pathname)) return 'dark';
  if (pathname.startsWith('/clubhouse')) return 'dark';
  if (DARK_PREFIXES.some(p => pathname.startsWith(p))) return 'dark';
  return 'light';
}
