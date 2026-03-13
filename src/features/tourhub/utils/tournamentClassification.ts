/**
 * Tournament Classification — shared utility
 * Single source of truth for tour-aware label logic used across
 * WhatsComing and ScheduleTournamentCard (and any future consumers).
 */

// Tour name to slug mapping — handles display names and raw DB values
export const TOUR_NAME_TO_SLUG: Record<string, string> = {
  // Display name variants
  'PGA Tour': 'pga',
  'LIV Golf': 'liv',
  'LIV Golf League': 'liv',
  'LIV GOLF': 'liv',
  'LIV GOLF LEAGUE': 'liv',
  'DP World Tour': 'euro',
  'Korn Ferry Tour': 'pgad',
  'Champions Tour': 'champ',
  'LPGA Tour': 'lpga',
  // Raw DB fallbacks — various casings observed in Sportradar data
  'pga': 'pga',
  'liv': 'liv',
  'LIV': 'liv',
  'euro': 'euro',
  'EURO': 'euro',
  'pgad': 'pgad',
  'PGAD': 'pgad',
  'champ': 'champ',
  'CHAMP': 'champ',
  'lpga': 'lpga',
  'LPGA': 'lpga',
};

// --- MAJORS (by tour) ---
const PGA_MAJOR_KEYWORDS = [
  'masters tournament',
  'the open championship',
  'u.s. open',
  'us open',
  'pga championship',
];

const LPGA_MAJOR_KEYWORDS = [
  'chevron championship',
  "women's pga",
  "womens pga",
  'u.s. women',
  'us women',
  'aig women',
  'evian championship',
  'amundi evian',
];

const CHAMPIONS_MAJOR_KEYWORDS = [
  'senior pga championship',
  'regions tradition',
  'u.s. senior open',
  'us senior open',
  'senior open',
  'kaulig companies',
  'senior players',
];

// --- SIGNATURE EVENTS (by tour) ---
const PGA_SIGNATURE_KEYWORDS = [
  'pebble beach pro-am',
  'at&t pebble beach',
  'genesis invitational',
  'arnold palmer invitational',
  'the players championship',
  'players championship',
  'rbc heritage',
  'cadillac championship',
  'memorial tournament',
  'travelers championship',
];

const LPGA_SIGNATURE_KEYWORDS = [
  'cme group',
  'fm championship',
  'aramco championship',
  'lotte championship',
  'cognizant founders',
  'founders cup',
];

const DPWORLD_SIGNATURE_KEYWORDS = [
  'dubai desert classic',
  'hero dubai',
  'genesis scottish open',
  'scottish open',
  'bmw pga championship',
  'abu dhabi championship',
  'dp world tour championship',
];

// --- PLAYOFFS ---
const PGA_PLAYOFF_KEYWORDS = [
  'tour championship',
  'fedexcup',
  'fedex st. jude',
  'bmw championship',
];

/**
 * Returns a human-readable classification label for a tournament.
 * Tour-aware: prevents cross-tour false positives (e.g. South African Open ≠ Major).
 */
export function getContextLabel(tournament: { name: string; tourName?: string | null }): string {
  const nameLower = tournament.name.toLowerCase();
  const tourSlug = TOUR_NAME_TO_SLUG[tournament.tourName || ''] || '';

  // Cross-tour majors — The 4 Grand Slams are co-sanctioned and may be stored under
  // any tour in Sportradar (e.g. Masters under EURO for Race to Dubai).
  // Always label them MAJOR CHAMPIONSHIP regardless of tour slug.
  // Exclusions prevent catching Senior PGA Championship or U.S. Women's Open here
  // (those are handled correctly by their own tour branches below).
  const CROSS_TOUR_MAJOR_KEYWORDS = [
    'masters tournament',
    'the open championship',
    'u.s. open',
    'us open',
    'pga championship',
  ];
  const isCrossTourMajor =
    CROSS_TOUR_MAJOR_KEYWORDS.some((k) => nameLower.includes(k)) &&
    !nameLower.includes('senior') &&
    !nameLower.includes('women') &&
    !nameLower.includes('bmw');
  if (isCrossTourMajor) return 'MAJOR CHAMPIONSHIP';

  if (tourSlug === 'pga') {
    if (PGA_MAJOR_KEYWORDS.some((k) => nameLower.includes(k))) return 'MAJOR CHAMPIONSHIP';
    if (PGA_PLAYOFF_KEYWORDS.some((k) => nameLower.includes(k))) return 'PLAYOFF EVENT';
    if (PGA_SIGNATURE_KEYWORDS.some((k) => nameLower.includes(k))) return 'SIGNATURE EVENT';
    return 'PGA TOUR EVENT';
  }

  if (tourSlug === 'lpga') {
    if (LPGA_MAJOR_KEYWORDS.some((k) => nameLower.includes(k))) return 'MAJOR CHAMPIONSHIP';
    if (LPGA_SIGNATURE_KEYWORDS.some((k) => nameLower.includes(k))) return 'SIGNATURE EVENT';
    return 'LPGA TOUR EVENT';
  }

  if (tourSlug === 'champ') {
    if (CHAMPIONS_MAJOR_KEYWORDS.some((k) => nameLower.includes(k))) return 'MAJOR CHAMPIONSHIP';
    return 'CHAMPIONS TOUR EVENT';
  }

  if (tourSlug === 'euro') {
    if (DPWORLD_SIGNATURE_KEYWORDS.some((k) => nameLower.includes(k))) return 'ROLEX SERIES';
    return 'DP WORLD TOUR EVENT';
  }

  if (tourSlug === 'liv') return 'LIV GOLF EVENT';
  if (tourSlug === 'pgad') return 'KORN FERRY TOUR EVENT';

  return 'TOUR EVENT';
}
