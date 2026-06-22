const R2_BASE = 'https://pub-f598829c702247c88b3281e7ee9e35ea.r2.dev';

const SILHOUETTE = `${R2_BASE}/DP%20World%20Tour/Silhouette.webp`;

const TOUR_FOLDER: Record<string, string> = {
  pga:  'PGA%20Tour',
  PGA:  'PGA%20Tour',
  euro: 'DP%20World%20Tour',
  EURO: 'DP%20World%20Tour',
  eur:  'DP%20World%20Tour',
  dp:   'DP%20World%20Tour',
  DP:   'DP%20World%20Tour',
  dpwt: 'DP%20World%20Tour',
  lpga: 'LPGA',
  LPGA: 'LPGA',
  pgad: 'Korn%20Ferry',
  PGAD: 'Korn%20Ferry',
  'korn-ferry': 'Korn%20Ferry',
  liv:  'LIV',
  LIV:  'LIV',
  champ: 'PGA%20Champions',
  CHAMP: 'PGA%20Champions',
  'champions-tour': 'PGA%20Champions',
};

// Player photos live in their HOME tour folder, which may differ from the
// event's tour (majors, co-sanctioned events, Korn Ferry defending champs etc).
// PGA Tour is the most common home folder, so it's the primary fallback.
const FALLBACK_FOLDER_ORDER = [
  'PGA%20Tour',
  'LIV',
  'DP%20World%20Tour',
  'Korn%20Ferry',
  'PGA%20Champions',
  'LPGA',
];

function buildUrl(folder: string, nameKey: string): string {
  // Champions Tour R2 files use underscores; all other tours use spaces
  const filename = folder === 'PGA%20Champions' ? nameKey.replace(/ /g, '_') : nameKey;
  return `${R2_BASE}/${folder}/${encodeURIComponent(filename)}.webp`;
}

/**
 * Returns the R2 headshot URL for a player (event-tour folder only).
 * Falls back to the shared silhouette placeholder if tour code is unknown.
 */
export function getPlayerHeadshotUrl(playerName: string, tourCode: string, headshotOverride?: string | null): string {
  const folder = TOUR_FOLDER[tourCode];
  if (!folder || (!playerName && !headshotOverride)) return SILHOUETTE;
  const nameKey = headshotOverride || playerName;
  return buildUrl(folder, nameKey);
}

/**
 * Returns an ORDERED list of candidate R2 URLs to try for a player.
 * Event-tour folder is tried first, then PGA Tour, then the rest. The avatar
 * walks the list on error and uses the first that loads.
 */
export function getPlayerHeadshotCandidates(
  playerName: string,
  tourCode: string,
  headshotOverride?: string | null,
): string[] {
  if (!playerName && !headshotOverride) return [];
  const nameKey = headshotOverride || playerName;
  const primary = TOUR_FOLDER[tourCode];
  const folders = [primary, ...FALLBACK_FOLDER_ORDER]
    .filter((f): f is string => Boolean(f))
    .filter((f, i, arr) => arr.indexOf(f) === i);
  return folders.map((folder) => buildUrl(folder, nameKey));
}

export { SILHOUETTE as PLAYER_SILHOUETTE_URL };
