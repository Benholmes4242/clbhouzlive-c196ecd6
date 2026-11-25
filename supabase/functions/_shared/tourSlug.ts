/** Tour name → Sportradar URL slug, as tournament-live-sync resolves tourSlug.
 * Shared so round-complete and the nightly integrity check ask for the same tour. */
export function getTourSlug(tourName: string): string | null {
  const normalized = (tourName || '').toUpperCase();
  const map: Record<string, string | null> = {
    'PGA': 'pga',
    'LPGA': 'lpga',
    'EURO': 'euro',
    'DP': 'euro',
    'CHAMP': 'champ',
    'PGAD': 'pgad',
    'LIV': null,
    'OLY': null,
    'USGA': null,
  };
  return map[normalized] ?? (normalized.includes('LIV') ? null : 'pga');
}
