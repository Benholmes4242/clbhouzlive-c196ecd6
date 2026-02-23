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
  champ: 'Champions%20Tour',
  CHAMP: 'Champions%20Tour',
  'champions-tour': 'Champions%20Tour',
};

/**
 * Returns the R2 headshot URL for a player.
 * Falls back to the shared silhouette placeholder if tour code is unknown.
 *
 * @param playerName  - Exact full_name value from the database e.g. "Rory McIlroy"
 * @param tourCode    - Tour code from database e.g. "pga", "euro", "liv"
 */
export function getPlayerHeadshotUrl(playerName: string, tourCode: string): string {
  const folder = TOUR_FOLDER[tourCode];
  if (!folder || !playerName) return SILHOUETTE;
  const encoded = encodeURIComponent(playerName);
  return `${R2_BASE}/${folder}/${encoded}.webp`;
}

export { SILHOUETTE as PLAYER_SILHOUETTE_URL };
