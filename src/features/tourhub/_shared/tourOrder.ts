import type { TourId } from '../hooks/useOverviewData';

/** Canonical tour importance order — used to sort tour-keyed lists app-wide.
 *  PGA → LPGA → DP World → Korn Ferry → Champions → LIV. */
export const TOUR_PRIORITY: TourId[] = ['pga', 'lpga', 'euro', 'pgad', 'champ', 'liv'];

/** Sort key for a tour slug; unknown tours sort last. */
export function tourPriorityIndex(slug: TourId | string | null | undefined): number {
  const i = TOUR_PRIORITY.indexOf((slug ?? '') as TourId);
  return i === -1 ? TOUR_PRIORITY.length : i;
}

/** Short display label for a tour slug — for pills/badges. */
export const TOUR_LABEL: Record<TourId, string> = {
  pga: 'PGA',
  lpga: 'LPGA',
  euro: 'DP World',
  pgad: 'Korn Ferry',
  champ: 'Champions',
  liv: 'LIV',
};

/** First distinctive word in a tournament name — used to disambiguate
 *  same-tour live pills (e.g. "PGA · Memorial"). Skips generic filler. */
const SHORT_NAME_SKIP = new Set([
  'open', 'classic', 'invitational', 'championship', 'tournament', 'the', 'at', 'presented', 'by',
]);
export function shortTournamentToken(name: string): string {
  const words = (name ?? '').split(/\s+/).filter(Boolean);
  for (const w of words) {
    if (!SHORT_NAME_SKIP.has(w.toLowerCase()) && w.length > 2) return w;
  }
  return words[0] ?? name;
}



/** Normalise a raw `tour_name` string from the DB into a canonical TourId. */
export function mapTourSlug(tourName: string | null | undefined): TourId {
  const normalized = (tourName ?? '').toLowerCase().trim();
  // Inclusion-based matching so multi-word DB strings map cleanly.
  // Order matters: 'pga tour champions' must resolve to 'champ', not 'pga',
  // so the pga branch is the LAST specific check before the fallback.
  if (normalized.includes('dp world') || normalized.includes('european tour') || normalized === 'euro') return 'euro';
  if (normalized.includes('korn ferry') || normalized === 'pgad') return 'pgad';
  if (normalized.includes('liv')) return 'liv';
  if (normalized.includes('champions') || normalized === 'champ') return 'champ';
  if (normalized.includes('lpga')) return 'lpga';
  if (normalized.includes('pga')) return 'pga';
  return 'pga';
}
