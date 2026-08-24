/**
 * Chrome-V2 Registry (H0)
 * ------------------------------------------------------------------
 * Single source of truth for route chrome. PURE ADDITION — no runtime
 * consumer yet; the Island header (H1) will be the first.
 *
 * Encodes the union of:
 *   - src/components/header/globalHeaderRules.ts
 *       (GLOBAL_HEADER_EXCLUDED_ROUTES, GLOBAL_HEADER_EXCLUDED_PREFIXES,
 *        isConditionallyExcluded, IMMERSIVE_*, DARK_CHROME_ROUTES)
 *   - src/components/header/CompactHeader.tsx
 *       (21 is*Route flags, handleLogoClick branches, isBackArrowRoute,
 *        isEditorialChromeRoute, tone inference)
 *
 * Rule order = first-match-wins. Specific exacts precede prefixes;
 * conversation routes precede their parent (e.g. /messages/:id before
 * /messages).
 *
 * Titles: CompactHeader today renders ONLY an ArrowLeft icon for every
 * back-arrow family — no adjacent title text. Every back rule below
 * therefore encodes `title: null`. When the Island header starts
 * rendering titles, this file is where they land.
 */

import { isBusinessProfilePath } from '@/components/header/globalHeaderRules';

export type ChromeTone = 'light' | 'dark';


export type LeftCell =
  | { kind: 'logo' }
  | {
      kind: 'back';
      title: string | null;
      backTarget: string | 'history';
      /** When backTarget === 'history', used as safeGoBack fallback path. */
      backFallback?: string;
    };

export interface ChromeSpec {
  chrome: 'island' | 'none';
  left?: LeftCell;
  tone: ChromeTone;
  bleed: boolean;
  /** Hide the HCP cell in the right capsule (e.g. handicap/rivalry). */
  hideHcp?: boolean;
  /**
   * When true, the island capsules render with `position: absolute` instead
   * of `fixed` — they ride away with the page on scroll (TikTok/Instagram
   * top-chrome model). The page's single sticky row (chips/tabs) locks at
   * the notch and becomes the entire stuck header.
   */
  scrollAway?: boolean;
  note?: string;
}

export interface ChromeRule {
  match: {
    exact?: string;
    prefix?: string;
    test?: (path: string, search: URLSearchParams) => boolean;
  };
  spec: ChromeSpec;
}

const EDITORIAL_NOTE = 'editorial 52px today';

// ---------------------------------------------------------------------------
// Registry (ORDER MATTERS)
// ---------------------------------------------------------------------------
export const CHROME_REGISTRY: ChromeRule[] = [
  // ── chrome:'none' EXACT routes (from GLOBAL_HEADER_EXCLUDED_ROUTES) ──────
  // '/' is Clubhouse landing — dark, immersive, page owns chrome.
  // H4b: Clubhouse feed. Island paints; page provides left slot
  // (Suggested/Friends toggle). No logo (slot overrides), no HCP.
  { match: { exact: '/' },                        spec: { chrome: 'island', left: { kind: 'logo' }, tone: 'dark',  bleed: true } },
  { match: { exact: '/clubhouse' },               spec: { chrome: 'island', left: { kind: 'logo' }, tone: 'dark',  bleed: true } },
  { match: { exact: '/auth' },                    spec: { chrome: 'none', tone: 'dark',  bleed: false } },
  { match: { exact: '/auth/callback' },           spec: { chrome: 'none', tone: 'dark',  bleed: false } },
  { match: { exact: '/signup' },                  spec: { chrome: 'none', tone: 'dark',  bleed: false } },
  { match: { exact: '/onboarding' },              spec: { chrome: 'none', tone: 'light', bleed: false } },
  { match: { exact: '/create-moment' },           spec: { chrome: 'none', tone: 'light', bleed: false } },
  { match: { exact: '/business/intro' },          spec: { chrome: 'none', tone: 'light', bleed: false } },
  { match: { exact: '/messages' },                spec: { chrome: 'none', tone: 'light', bleed: false } },
  // ── /profile family — ISLAND (H3): light, immersive, no back.
  // /profile/quest keeps its history-back island rule (declared first so it
  // wins before the /profile/ prefix rule below). Own profile and bare visitor
  // profile pages intentionally omit the back button; bottom nav is the exit.
  { match: { exact: '/profile/quest' },           spec: { chrome: 'island', left: { kind: 'back', title: null, backTarget: 'history' }, tone: 'light', bleed: false } },
  { match: { exact: '/profile' },                 spec: { chrome: 'island', tone: 'light', bleed: true } },
  { match: { exact: '/achievements' },            spec: { chrome: 'none', tone: 'light', bleed: false } },
  { match: { exact: '/golferstofollow' },         spec: { chrome: 'none', tone: 'light', bleed: false } },
  { match: { exact: '/notificationmessages' },    spec: { chrome: 'none', tone: 'light', bleed: false } },
  { match: { exact: '/edit-profile' },            spec: { chrome: 'none', tone: 'light', bleed: false } },
  // ── /handicap family — ISLAND (H3): dark tone, back fallback '/profile',
  // HCP cell hidden. Rivalry sub-routes declared first so they win before the
  // /handicap/ prefix.
  {
    match: {
      test: (p) =>
        /^\/handicap\/rivalry\/[^/]+$/.test(p) ||
        /^\/handicap\/[^/]+\/rivalry\/[^/]+$/.test(p),
    },
    spec: {
      chrome: 'island',
      left: { kind: 'back', title: null, backTarget: 'history' },
      tone: 'dark',
      bleed: true,
      hideHcp: true,
    },
  },
  { match: { exact: '/handicap' },                spec: { chrome: 'island', left: { kind: 'back', title: null, backTarget: 'history', backFallback: '/profile' }, tone: 'dark',  bleed: true, hideHcp: true } },
  { match: { exact: '/followers' },               spec: { chrome: 'none', tone: 'light', bleed: false } },
  { match: { exact: '/following' },               spec: { chrome: 'none', tone: 'light', bleed: false } },
  { match: { exact: '/join' },                    spec: { chrome: 'none', tone: 'light', bleed: false } },

  // ── chrome:'none' PREFIX routes (from GLOBAL_HEADER_EXCLUDED_PREFIXES) ──
  // Order: conversation before parent, specific before general.
  { match: { prefix: '/messages/' },              spec: { chrome: 'none', tone: 'light', bleed: false } },
  { match: { prefix: '/admin' },                  spec: { chrome: 'none', tone: 'light', bleed: false } },
  { match: { prefix: '/hub' },                    spec: { chrome: 'none', tone: 'light', bleed: false } },
  { match: { prefix: '/echo' },                   spec: { chrome: 'none', tone: 'light', bleed: false } },
  // Social lists (F3): /profile/:username/(followers|following) — ISLAND, padded (no bleed).
  // Declared BEFORE the /profile/ prefix rule so it wins.
  { match: { test: (p) => /^\/profile\/[^/]+\/(followers|following)$/.test(p) },
    spec: { chrome: 'island', left: { kind: 'back', title: null, backTarget: 'history', backFallback: '/' }, tone: 'light', bleed: false, note: 'social lists - padded island (F3)' } },
  // Profile PAGE (/profile/:username, exactly 2 segments) — island WITHOUT back.
  // (bottom nav is the way out). Sub-pages fall through to the prefix rule
  // below and KEEP their back button.
  { match: { test: (p) => /^\/profile\/[^/]+$/.test(p) },
    spec: { chrome: 'island', tone: 'light', bleed: true } },
  // /profile/ prefix — ISLAND (H3). Sits after /profile/quest above.
  { match: { prefix: '/profile/' },               spec: { chrome: 'island', left: { kind: 'back', title: null, backTarget: 'history', backFallback: '/' }, tone: 'light', bleed: true } },

  
  { match: { prefix: '/discover/explore/region/' },spec:{ chrome: 'none', tone: 'light', bleed: true  } },
  { match: { prefix: '/achievements/' },          spec: { chrome: 'none', tone: 'light', bleed: false } },
  // /handicap/ prefix — ISLAND (H3). Rivalry sub-routes handled above.
  { match: { prefix: '/handicap/' },              spec: { chrome: 'island', left: { kind: 'back', title: null, backTarget: 'history', backFallback: '/profile' }, tone: 'dark',  bleed: true, hideHcp: true } },
  { match: { prefix: '/manage/' },                spec: { chrome: 'none', tone: 'light', bleed: false } },
  { match: { prefix: '/support/' },               spec: { chrome: 'none', tone: 'light', bleed: false } },
  { match: { prefix: '/legal' },                  spec: { chrome: 'none', tone: 'light', bleed: false } },
  { match: { prefix: '/privacy' },                spec: { chrome: 'none', tone: 'light', bleed: false } },
  { match: { prefix: '/terms' },                  spec: { chrome: 'none', tone: 'light', bleed: false } },
  { match: { prefix: '/businesses/manage' },      spec: { chrome: 'none', tone: 'light', bleed: false } },
  { match: { prefix: '/business/create' },        spec: { chrome: 'none', tone: 'light', bleed: false, note: 'business create wizard - shell owns chrome' } },
  { match: { prefix: '/business/invite/accept' }, spec: { chrome: 'none', tone: 'light', bleed: false } },
  { match: { prefix: '/i/' },                     spec: { chrome: 'none', tone: 'light', bleed: false } },
  { match: { prefix: '/rate-course-v2/' },        spec: { chrome: 'none', tone: 'light', bleed: false } },

  // Business profile: /business/:idOrSlug (exactly 3 segments, third segment
  // not a reserved static route) — ISLAND (H3), no back button (bottom nav is
  // the way out). Managed sub-pages (edit/verification/etc.) remain
  // page-owned, non-immersive. The test is the shared predicate so this rule
  // and the immersive classifier cannot drift.
  {
    match: { test: isBusinessProfilePath },
    spec: {
      chrome: 'island',
      tone: 'light',
      bleed: true,
    },
  },

  // Business social lists (F3): ISLAND, padded. Declared BEFORE the managed-subpage rule.
  { match: { test: (p) => /^\/business\/[^/]+\/(followers|following)$/.test(p) },
    spec: { chrome: 'island', left: { kind: 'back', title: null, backTarget: 'history', backFallback: '/clubhouse' }, tone: 'light', bleed: false, note: 'business social lists (F3)' } },
  {
    match: {
      test: (p) =>
        /^\/business\/[^/]+\/(verification|edit|insights|team|activity|reviews)(\/.*)?$/.test(p),
    },
    spec: { chrome: 'none', tone: 'light', bleed: false, note: 'managed business subpages - shell owns chrome' },
  },


  // Course detail: /courses/:id (exactly 3 segments) — ISLAND (H3),
  // back with fallback '/courses'. Deeper /courses/:id/* subroutes fall
  // through to the prefix rule below (chrome:'none') and remain page-owned.
  {
    match: {
      test: (p) => {
        if (!p.startsWith('/courses/')) return false;
        const segs = p.replace(/\/$/, '').split('/');
        return segs.length === 3;
      },
    },
    spec: {
      chrome: 'island',
      left: { kind: 'back', title: null, backTarget: 'history', backFallback: '/courses' },
      tone: 'light',
      bleed: true,
      scrollAway: true,
    },
  },

  // All courses sub-routes are page-owned today (isConditionallyExcluded).
  // The detail page renders its own FloatingPageHeader; other sub-pages are
  // similarly excluded from the global chrome.
  {
    match: { prefix: '/courses/' },
    spec: { chrome: 'none', tone: 'light', bleed: true, note: 'all courses subroutes excluded today (isConditionallyExcluded); detail page owns FloatingPageHeader' },
  },

  // ── ISLAND routes ────────────────────────────────────────────────────────
  // Tour Hub deep pages (island + back arrow, editorial geometry).
  {
    match: { prefix: '/tourhub/tournament/' },
    spec: {
      chrome: 'island',
      left: { kind: 'back', title: null, backTarget: 'history' },
      tone: 'dark',
      bleed: true, // tourHeroOverlay drives transparent chrome over cinematic hero
      note: EDITORIAL_NOTE,
    },
  },
  {
    match: { prefix: '/tourhub/player/' },
    spec: {
      chrome: 'island',
      left: { kind: 'back', title: null, backTarget: 'history' },
      tone: 'dark',
      bleed: false,
      note: EDITORIAL_NOTE,
    },
  },
  {
    match: { exact: '/tourhub/college-golf' },
    spec: {
      chrome: 'island',
      left: { kind: 'back', title: null, backTarget: 'history', backFallback: '/tourhub' },
      tone: 'dark',
      bleed: false,
      scrollAway: true,
      note: EDITORIAL_NOTE,
    },
  },
  {
    match: { exact: '/tourhub/college-golf/compare' },
    spec: {
      chrome: 'island',
      left: { kind: 'back', title: null, backTarget: 'history' },
      tone: 'dark',
      bleed: false,
      note: EDITORIAL_NOTE,
    },
  },
  {
    match: {
      test: (p) =>
        p.startsWith('/tourhub/college-golf/') &&
        p !== '/tourhub/college-golf' &&
        p !== '/tourhub/college-golf/compare',
    },
    spec: {
      chrome: 'island',
      left: { kind: 'back', title: null, backTarget: 'history' },
      tone: 'dark',
      bleed: false,
      note: EDITORIAL_NOTE,
    },
  },

  // Tour Hub top-level (logo + editorial geometry; cinematic overlay on overview).
  // Overview tab keeps fixed islands over the cinematic hero; every other tab
  // gets scrollAway islands (chips lock at the notch on scroll).
  { match: { test: (p, s) => (p === '/tourhub' || p === '/tour') && (s.get('tab') ?? 'overview') === 'overview' },
    spec: { chrome: 'island', left: { kind: 'logo' }, tone: 'dark', bleed: true, note: EDITORIAL_NOTE } },
  { match: { exact: '/tourhub' },                 spec: { chrome: 'island', left: { kind: 'logo' }, tone: 'dark', bleed: true,  scrollAway: true, note: EDITORIAL_NOTE } },
  { match: { exact: '/tour' },                    spec: { chrome: 'island', left: { kind: 'logo' }, tone: 'dark', bleed: true,  scrollAway: true, note: EDITORIAL_NOTE } },
  // Remaining /tourhub/* sub-tabs and /tour/* aliases (not deep) — page owns
  // chrome today (isConditionallyExcluded); only the exact hubs above stay island.
  { match: { prefix: '/tourhub/' },               spec: { chrome: 'none', tone: 'light', bleed: true, note: 'other tour subpages immersive/page-owned today (isConditionallyExcluded)' } },
  { match: { prefix: '/tour/' },                  spec: { chrome: 'none', tone: 'light', bleed: true, note: 'other tour subpages immersive/page-owned today (isConditionallyExcluded)' } },

  // Watch sub-pages: back to /watch's caller.
  { match: { exact: '/watch/videos' },            spec: { chrome: 'island', left: { kind: 'back', title: 'Videos', backTarget: 'history' }, tone: 'light', bleed: true, scrollAway: true } },
  { match: { exact: '/watch/clips' },             spec: { chrome: 'island', left: { kind: 'back', title: 'Clips',  backTarget: 'history' }, tone: 'light', bleed: true, scrollAway: true } },
  { match: { exact: '/watch' },                   spec: { chrome: 'island', left: { kind: 'logo' }, tone: 'light', bleed: true, scrollAway: true } },

  // Discover landing (bottom-nav tab). Same editorial geometry as /courses:
  // cinematic hero under a scroll-away glass island.
  { match: { exact: '/explore' },                 spec: { chrome: 'island', left: { kind: 'logo' }, tone: 'light', bleed: true,  scrollAway: true, note: EDITORIAL_NOTE } },

  // Courses landing (editorial geometry; cinematic hero → glass overlay).
  { match: { exact: '/courses' },                 spec: { chrome: 'island', left: { kind: 'logo' }, tone: 'light', bleed: true,  scrollAway: true, note: EDITORIAL_NOTE } },


  // /community is deleted (BRIEF_DISCOVER_ONE_PAGE §3); the path now redirects
  // to Discover, so it needs no chrome entry of its own.

  // Friends activity — back arrow, history.
  { match: { exact: '/friends-activity' },        spec: { chrome: 'island', left: { kind: 'back', title: null, backTarget: 'history' }, tone: 'light', bleed: false } },

  // /profile/quest — declared earlier alongside the /profile family.


  // Discover sub-pages (region/theme lists, video sections). Prefix rules for
  // discover/explore region already emitted as chrome:'none' above; theme routes
  // are back-arrow island (page renders under CompactHeader today).
  {
    match: { prefix: '/discover/explore/theme/' },
    spec: { chrome: 'island', left: { kind: 'back', title: null, backTarget: '/explore' }, tone: 'light', bleed: false },
  },
  {
    match: {
      test: (p, s) =>
        p.startsWith('/discover') && s.get('main') === 'videos' && !!s.get('section'),
    },
    spec: { chrome: 'island', left: { kind: 'back', title: null, backTarget: '/explore' }, tone: 'light', bleed: false },
  },

  // Discover landing / other discover routes.
  { match: { prefix: '/discover' },               spec: { chrome: 'island', left: { kind: 'logo' }, tone: 'light', bleed: false } },
];

// ---------------------------------------------------------------------------
// Default fallback
// ---------------------------------------------------------------------------
const DEFAULT_SPEC: ChromeSpec = {
  chrome: 'island',
  left: { kind: 'logo' },
  tone: 'dark',
  bleed: false,
};

// The tour-only light-island exception is GONE: the seven tour island entries
// now declare tone: 'dark' themselves, so keepsLightChrome() had no remaining
// callers or effect and was removed with it. Every island tone now resolves
// dark; the surviving `tone: 'light'` literals in this file are historical and
// are coerced here (see 3.4 finding — they need their own cleanup brief).
function withResolvedTone(spec: ChromeSpec, pathname: string): ChromeSpec {
  if (spec.chrome === 'none' || spec.tone === 'dark') return spec;
  return { ...spec, tone: 'dark' };
}

/**
 * Resolve chrome for a route. Walks CHROME_REGISTRY in order; first match wins.
 * Returns DEFAULT_SPEC when no rule matches (today's CompactHeader default:
 * light + logo + non-immersive).
 */
export function resolveChrome(
  pathname: string,
  search: URLSearchParams,
): ChromeSpec {
  for (const rule of CHROME_REGISTRY) {
    const { exact, prefix, test } = rule.match;
    if (exact !== undefined && pathname === exact) return withResolvedTone(rule.spec, pathname);
    if (prefix !== undefined && pathname.startsWith(prefix)) return withResolvedTone(rule.spec, pathname);
    if (test !== undefined && test(pathname, search)) return withResolvedTone(rule.spec, pathname);
  }
  return DEFAULT_SPEC;
}
