/**
 * Web gate routing rules.
 *
 * On the web the app shell never mounts — every path resolves to the
 * AppDownloadGate except the exempt list below. `/post/:postId` is exempt
 * because PostDeepLinkPage is a real logged-out preview surface and is
 * strictly better than a download wall; the legal pages are exempt because
 * the gate itself links to them.
 *
 * Three states only: invite (`/i/:code`, `/join`), profile (`/profile/*`),
 * and none (everything else that is gated).
 */

export type GateState =
  | { kind: 'invite'; code: string | null }
  | { kind: 'profile'; username: string }
  | { kind: 'none' };

/**
 * `/go/` is the email handoff doormat (BRIEF_EMAIL_HANDOFF_PAGE). It is exempt
 * BY DESIGN, not by exception: it holds no data and needs no session, which is
 * exactly why emails point at it instead of at /handicap. Signed-in surfaces
 * must never be added to this list.
 */
const EXEMPT_PREFIXES = ['/post/', '/tour/news/', '/discover/news', '/privacy', '/terms', '/legal/', '/go/'];

export function isGateExemptPath(pathname: string): boolean {
  return EXEMPT_PREFIXES.some((p) => pathname === p || pathname.startsWith(p));
}

export function resolveGateState(pathname: string): GateState {
  if (pathname === '/join' || pathname.startsWith('/join/')) {
    return { kind: 'invite', code: null };
  }
  if (pathname.startsWith('/i/')) {
    const code = pathname.slice(3).split('/')[0];
    return { kind: 'invite', code: code ? decodeURIComponent(code) : null };
  }
  if (pathname.startsWith('/profile/')) {
    const rest = pathname.slice('/profile/'.length).split('/')[0];
    // /profile/handicap, /profile/quest etc. are app sub-routes, not usernames.
    const RESERVED = ['handicap', 'quest', 'edit', 'settings'];
    if (rest && !RESERVED.includes(rest)) {
      return { kind: 'profile', username: decodeURIComponent(rest) };
    }
  }
  return { kind: 'none' };
}
