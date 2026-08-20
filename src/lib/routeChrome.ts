import {
  CANVAS_DARK_CANVAS,
  isCanvasDarkRoute,
  isDarkChromeRoute,
  isImmersiveRoute,
  isLightImmersiveRoute,
} from '@/components/header/globalHeaderRules';
import {
  applyShieldColor,
  ensureStatusBarOverlayBooted,
  setStatusBarStyleColor,
} from '@/hooks/useMedianStatusBar';

type ChromeCache = {
  surface: string;
  darkChrome: boolean;
  isAuth: boolean;
  immersive: boolean;
  shieldColor: string;
  sbKey: string;
};

export type ChromeClaim = {
  id: string;
  statusBarStyle: 'light' | 'dark';  // 'dark' = DARK icons (light bg)
  statusBarColor: string;            // AARRGGBB, e.g. 'FFF8FAFC'
  shieldColor: string;               // CSS color for #safe-area-shield
};

const chromeClaims: ChromeClaim[] = [];

function applyClaim(c: ChromeClaim): void {
  try {
    ensureStatusBarOverlayBooted();
    setStatusBarStyleColor(c.statusBarStyle, c.statusBarColor);
    applyShieldColor(c.shieldColor);
  } catch {}
  // Chrome no longer matches the route - invalidate the idempotency cache
  // so the next route apply cannot be skipped as "unchanged".
  (window as any).__lvChromeCache = undefined;
}

/** Persistent overlays (e.g. the search overlay) claim their chrome while
 *  open. The top claim wins over route chrome until released. Re-claiming
 *  the same id moves it to the top. */
export function claimOverlayChrome(claim: ChromeClaim): void {
  const idx = chromeClaims.findIndex((c) => c.id === claim.id);
  if (idx !== -1) chromeClaims.splice(idx, 1);
  chromeClaims.push(claim);
  applyClaim(claim);
}

export function releaseOverlayChrome(id: string): void {
  const idx = chromeClaims.findIndex((c) => c.id === id);
  if (idx === -1) return;
  chromeClaims.splice(idx, 1);
  const top = chromeClaims[chromeClaims.length - 1];
  if (top) applyClaim(top);
  else applyRouteChrome(window.location.pathname, true);
}

/**
 * Single source of truth for route chrome (html/body bg, shield, body route
 * classes, native status bar). Called by AppRoutes on every navigation AND by
 * overlays on teardown so the notch re-resolves for the route being returned
 * to. Idempotency cache skips redundant writes.
 *
 * force=true bypasses the cache (used after an overlay mutated chrome behind
 * the cache's back, so the values must be re-asserted even if "unchanged").
 */
export function applyRouteChrome(pathname: string, force = false): void {
  // An open overlay owns the chrome: re-assert its claim instead of the
  // route. (Overlay teardowns call applyRouteChrome unconditionally - this
  // is what makes returning from fullscreen/immersive land on the claim.)
  const topClaim = chromeClaims[chromeClaims.length - 1];
  if (topClaim) {
    applyClaim(topClaim);
    return;
  }


  const darkChrome = isDarkChromeRoute(pathname);
  const immersive = isImmersiveRoute(pathname);
  const isAuth = pathname.startsWith('/auth');
  const lightImmersive = isLightImmersiveRoute(pathname);

  // Echo / Messages: the near-black canvas owns the notch and the home
  // indicator band. Chrome matches #05070A instead of the light default.
  const canvasDark = isCanvasDarkRoute(pathname);

  const surface = canvasDark
    ? CANVAS_DARK_CANVAS
    : darkChrome
    ? '#15171F'
    : immersive
      ? (lightImmersive ? '#F8FAFC' : '#0F172A')
      : '#F8FAFC';
  const shieldColor = canvasDark
    ? CANVAS_DARK_CANVAS
    : immersive
      ? 'transparent'
      : (darkChrome ? '#15171F' : '#F8FAFC');

  // Status bar icon intent (see useMedianStatusBar for the inverted mapping):
  //   'dark'  intent = DARK icons  (for a LIGHT background)
  //   'light' intent = WHITE icons (for a DARK background)
  // - darkChrome + immersive (Clubhouse feed) -> transparent bar, white icons
  // - darkChrome only (auth/signup/handicap)  -> opaque charcoal, white icons
  // - immersive light/dark (hero photo behind) -> transparent, dark icons
  // - default light (#F8FAFC notch)            -> opaque light, dark icons
  const statusBar = canvasDark
    ? { style: 'light' as const, color: 'FF05070A' }
    : darkChrome
    ? (immersive
        ? { style: 'light' as const, color: '00000000' }
        : { style: 'light' as const, color: 'FF15171F' })
    : immersive
      ? { style: 'dark' as const, color: '00000000' }
      : { style: 'dark' as const, color: 'FFF8FAFC' };

  const sbKey = `${statusBar.style}|${statusBar.color}`;
  const prev = force ? undefined : ((window as any).__lvChromeCache as ChromeCache | undefined);

  if (
    prev &&
    prev.surface === surface &&
    prev.darkChrome === darkChrome &&
    prev.isAuth === isAuth &&
    prev.immersive === immersive &&
    prev.shieldColor === shieldColor &&
    prev.sbKey === sbKey
  ) {
    return;
  }

  if (!prev || prev.surface !== surface) {
    document.documentElement.style.backgroundColor = surface;
    document.body.style.backgroundColor = surface;
  }
  if (!prev || prev.darkChrome !== darkChrome) {
    document.body.classList.toggle('route-clubhouse', darkChrome);
  }
  if (!prev || prev.isAuth !== isAuth) {
    document.body.classList.toggle('route-auth', isAuth);
  }
  if (!prev || prev.immersive !== immersive) {
    if (immersive) document.documentElement.setAttribute('data-immersive-route', 'true');
    else document.documentElement.removeAttribute('data-immersive-route');
  }
  if (!prev || prev.shieldColor !== shieldColor) {
    try { applyShieldColor(shieldColor); } catch {}
  }
  if (!prev || prev.sbKey !== sbKey) {
    try {
      ensureStatusBarOverlayBooted();
      setStatusBarStyleColor(statusBar.style, statusBar.color);
    } catch {}
  }

  (window as any).__lvChromeCache = { surface, darkChrome, isAuth, immersive, shieldColor, sbKey };
}
