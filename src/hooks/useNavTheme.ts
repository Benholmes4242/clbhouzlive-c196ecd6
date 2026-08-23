import { useLocation } from 'react-router-dom';
import { isDarkChromeRoute } from '@/components/header/globalHeaderRules';

/**
 * Route → theme for the floating bottom nav pill.
 * DARK glass follows the app-wide chrome resolver. Tour Hub keeps its explicit
 * light treatment until that surface is converted.
 */
export type NavTheme = 'dark' | 'light';

export function useNavTheme(): NavTheme {
  const { pathname } = useLocation();
  if (pathname === '/tour' || pathname.startsWith('/tour/') ||
      pathname === '/tourhub' || pathname.startsWith('/tourhub/')) return 'light';
  return isDarkChromeRoute(pathname) ? 'dark' : 'light';
}
