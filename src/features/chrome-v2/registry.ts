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

export type ChromeTone = 'light' | 'dark';

export type LeftCell =
  | { kind: 'logo' }
  | { kind: 'back'; title: string | null; backTarget: string | 'history' };

export interface ChromeSpec {
  chrome: 'island' | 'none';
  left?: LeftCell;
  tone: ChromeTone;
  bleed: boolean;
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
  { match: { exact: '/' },                        spec: { chrome: 'none', tone: 'dark',  bleed: true  } },
  { match: { exact: '/clubhouse' },               spec: { chrome: 'none', tone: 'dark',  bleed: true  } },
  { match: { exact: '/auth' },                    spec: { chrome: 'none', tone: 'dark',  bleed: false } },
  { match: { exact: '/auth/callback' },           spec: { chrome: 'none', tone: 'dark',  bleed: false } },
  { match: { exact: '/signup' },                  spec: { chrome: 'none', tone: 'dark',  bleed: false } },
  { match: { exact: '/onboarding' },              spec: { chrome: 'none', tone: 'light', bleed: false } },
  { match: { exact: '/create-moment' },           spec: { chrome: 'none', tone: 'light', bleed: false } },
  { match: { exact: '/business/intro' },          spec: { chrome: 'none', tone: 'light', bleed: false } },
  { match: { exact: '/messages' },                spec: { chrome: 'none', tone: 'light', bleed: false } },
  { match: { exact: '/profile' },                 spec: { chrome: 'none', tone: 'light', bleed: true  } },
  { match: { exact: '/achievements' },            spec: { chrome: 'none', tone: 'light', bleed: false } },
  { match: { exact: '/golferstofollow' },         spec: { chrome: 'none', tone: 'light', bleed: false } },
  { match: { exact: '/notificationmessages' },    spec: { chrome: 'none', tone: 'light', bleed: false } },
  { match: { exact: '/edit-profile' },            spec: { chrome: 'none', tone: 'light', bleed: false } },
  { match: { exact: '/handicap' },                spec: { chrome: 'none', tone: 'dark',  bleed: false } },
  { match: { exact: '/followers' },               spec: { chrome: 'none', tone: 'light', bleed: false } },
  { match: { exact: '/following' },               spec: { chrome: 'none', tone: 'light', bleed: false } },
  { match: { exact: '/join' },                    spec: { chrome: 'none', tone: 'light', bleed: false } },

  // ── chrome:'none' PREFIX routes (from GLOBAL_HEADER_EXCLUDED_PREFIXES) ──
  // Order: conversation before parent, specific before general.
  { match: { prefix: '/messages/' },              spec: { chrome: 'none', tone: 'light', bleed: false } },
  { match: { prefix: '/admin' },                  spec: { chrome: 'none', tone: 'light', bleed: false } },
  { match: { prefix: '/hub' },                    spec: { chrome: 'none', tone: 'light', bleed: false } },
  { match: { prefix: '/echo' },                   spec: { chrome: 'none', tone: 'light', bleed: false } },
  { match: { prefix: '/profile/' },               spec: { chrome: 'none', tone: 'light', bleed: true  } },
  { match: { prefix: '/top100/' },                spec: { chrome: 'none', tone: 'light', bleed: true  } },
  { match: { prefix: '/discover/explore/region/' },spec:{ chrome: 'none', tone: 'light', bleed: true  } },
  { match: { prefix: '/achievements/' },          spec: { chrome: 'none', tone: 'light', bleed: false } },
  { match: { prefix: '/handicap/' },              spec: { chrome: 'none', tone: 'dark',  bleed: false } },
  { match: { prefix: '/manage/' },                spec: { chrome: 'none', tone: 'light', bleed: false } },
  { match: { prefix: '/support/' },               spec: { chrome: 'none', tone: 'light', bleed: false } },
  { match: { prefix: '/legal' },                  spec: { chrome: 'none', tone: 'light', bleed: false } },
  { match: { prefix: '/privacy' },                spec: { chrome: 'none', tone: 'light', bleed: false } },
  { match: { prefix: '/terms' },                  spec: { chrome: 'none', tone: 'light', bleed: false } },
  { match: { prefix: '/businesses/manage' },      spec: { chrome: 'none', tone: 'light', bleed: false } },
  { match: { prefix: '/business/create' },        spec: { chrome: 'none', tone: 'light', bleed: false } },
  { match: { prefix: '/business/invite/accept' }, spec: { chrome: 'none', tone: 'light', bleed: false } },
  { match: { prefix: '/i/' },                     spec: { chrome: 'none', tone: 'light', bleed: false } },
  { match: { prefix: '/rate-course-v2/' },        spec: { chrome: 'none', tone: 'light', bleed: false } },

  // Business profile: /business/:idOrSlug (exactly 3 segments) — page owns chrome, immersive.
  // Managed sub-pages (/business/:id/edit|verification|insights|team|activity|followers|following)
  // — page owns chrome, non-immersive.
  {
    match: {
      test: (p) => {
        if (!p.startsWith('/business/')) return false;
        const segs = p.replace(/\/$/, '').split('/');
        return segs.length === 3; // profile
      },
    },
    spec: { chrome: 'none', tone: 'light', bleed: true },
  },
  {
    match: {
      test: (p) =>
        /^\/business\/[^/]+\/(verification|edit|insights|team|activity|followers|following)(\/.*)?$/.test(p),
    },
    spec: { chrome: 'none', tone: 'light', bleed: false },
  },

  // Course detail: /courses/:courseId (exactly 3 segments) — FloatingPageHeader owns it.
  {
    match: {
      test: (p) => p.startsWith('/courses/') && p.split('/').length === 3,
    },
    // Legacy CompactHeader would treat this as a back-arrow route with editorial
    // geometry — but globalHeaderRules excludes it (page owns chrome). Encode as
    // 'none' + immersive to match today's runtime.
    spec: { chrome: 'none', tone: 'light', bleed: true, note: EDITORIAL_NOTE },
  },

  // ── ISLAND routes ────────────────────────────────────────────────────────
  // Tour Hub deep pages (island + back arrow, editorial geometry).
  {
    match: { prefix: '/tourhub/tournament/' },
    spec: {
      chrome: 'island',
      left: { kind: 'back', title: null, backTarget: 'history' },
      tone: 'light',
      bleed: true, // tourHeroOverlay drives transparent chrome over cinematic hero
      note: EDITORIAL_NOTE,
    },
  },
  {
    match: { prefix: '/tourhub/player/' },
    spec: {
      chrome: 'island',
      left: { kind: 'back', title: null, backTarget: 'history' },
      tone: 'light',
      bleed: false,
      note: EDITORIAL_NOTE,
    },
  },
  {
    match: { exact: '/tourhub/college-golf/compare' },
    spec: {
      chrome: 'island',
      left: { kind: 'back', title: null, backTarget: 'history' },
      tone: 'light',
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
      tone: 'light',
      bleed: false,
      note: EDITORIAL_NOTE,
    },
  },

  // Tour Hub top-level (logo + editorial geometry; cinematic overlay on overview).
  { match: { exact: '/tourhub' },                 spec: { chrome: 'island', left: { kind: 'logo' }, tone: 'light', bleed: true,  note: EDITORIAL_NOTE } },
  { match: { exact: '/tour' },                    spec: { chrome: 'island', left: { kind: 'logo' }, tone: 'light', bleed: true,  note: EDITORIAL_NOTE } },
  // Remaining /tourhub/* sub-tabs and /tour/* aliases (not deep) — logo + editorial.
  { match: { prefix: '/tourhub/' },               spec: { chrome: 'island', left: { kind: 'logo' }, tone: 'light', bleed: true,  note: EDITORIAL_NOTE } },
  { match: { prefix: '/tour/' },                  spec: { chrome: 'island', left: { kind: 'logo' }, tone: 'light', bleed: true,  note: EDITORIAL_NOTE } },

  // Watch sub-pages: back to /watch's caller.
  { match: { exact: '/watch/videos' },            spec: { chrome: 'island', left: { kind: 'back', title: null, backTarget: 'history' }, tone: 'light', bleed: false } },
  { match: { exact: '/watch/clips' },             spec: { chrome: 'island', left: { kind: 'back', title: null, backTarget: 'history' }, tone: 'light', bleed: false } },
  { match: { exact: '/watch' },                   spec: { chrome: 'island', left: { kind: 'logo' }, tone: 'light', bleed: false } },

  // Courses landing (editorial geometry; cinematic hero → glass overlay).
  { match: { exact: '/courses' },                 spec: { chrome: 'island', left: { kind: 'logo' }, tone: 'light', bleed: true,  note: EDITORIAL_NOTE } },

  // Friends activity — back arrow, history.
  { match: { exact: '/friends-activity' },        spec: { chrome: 'island', left: { kind: 'back', title: null, backTarget: 'history' }, tone: 'light', bleed: false } },

  // /profile/quest — treated as achievements family (back, history).
  { match: { exact: '/profile/quest' },           spec: { chrome: 'island', left: { kind: 'back', title: null, backTarget: 'history' }, tone: 'light', bleed: false } },

  // Discover sub-pages (region/theme lists, video sections). Prefix rules for
  // discover/explore region already emitted as chrome:'none' above; theme routes
  // are back-arrow island (page renders under CompactHeader today).
  {
    match: { prefix: '/discover/explore/theme/' },
    spec: { chrome: 'island', left: { kind: 'back', title: null, backTarget: '/courses?tab=discover' }, tone: 'light', bleed: false },
  },
  {
    match: {
      test: (p, s) =>
        p.startsWith('/discover') && s.get('main') === 'videos' && !!s.get('section'),
    },
    spec: { chrome: 'island', left: { kind: 'back', title: null, backTarget: '/watch' }, tone: 'light', bleed: false },
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
  tone: 'light',
  bleed: false,
};

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
    if (exact !== undefined && pathname === exact) return rule.spec;
    if (prefix !== undefined && pathname.startsWith(prefix)) return rule.spec;
    if (test !== undefined && test(pathname, search)) return rule.spec;
  }
  return DEFAULT_SPEC;
}
