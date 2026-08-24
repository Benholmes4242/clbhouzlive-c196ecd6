import { useLocation } from 'react-router-dom';
import { isDarkChromeRoute } from '@/components/header/globalHeaderRules';

/**
 * Route → theme for the floating bottom nav pill.
 * DARK glass follows the app-wide chrome resolver.
 *
 * HISTORY: Tour Hub carried an explicit light exception here for as long as
 * that surface was light. Tour Hub is now dark, so the condition the exception
 * named has been met and the branch is gone — the nav is the Clubhouse pill
 * everywhere. Recorded rather than deleted so the exception is not re-added.
 */
export type NavTheme = 'dark' | 'light';

export function useNavTheme(): NavTheme {
  const { pathname } = useLocation();
  return isDarkChromeRoute(pathname) ? 'dark' : 'light';
}
