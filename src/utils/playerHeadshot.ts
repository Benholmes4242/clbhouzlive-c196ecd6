const R2_BASE = 'https://pub-f598829c702247c88b3281e7ee9e35ea.r2.dev';

/** Map internal tour codes (any casing) to R2 folder names */
const TOUR_FOLDER_MAP: Record<string, string> = {
  pga: 'PGA Tour',
  EURO: 'DP World Tour',
  euro: 'DP World Tour',
  LPGA: 'LPGA',
  lpga: 'LPGA',
  PGAD: 'Korn Ferry',
  pgad: 'Korn Ferry',
  LIV: 'LIV',
  liv: 'LIV',
};

/**
 * Build the R2 headshot URL for a player.
 * Returns null if the tour code is unknown or playerName is empty.
 */
export function getR2HeadshotUrl(playerName: string, tourCode: string): string | null {
  const folder = TOUR_FOLDER_MAP[tourCode];
  if (!folder || !playerName) return null;
  return `${R2_BASE}/${encodeURIComponent(folder)}/${encodeURIComponent(playerName)}.webp`;
}

/**
 * Try to resolve an R2 headshot when we have multiple possible tour codes.
 * Uses the first matching tour code; falls back to priority order.
 */
export function getR2HeadshotUrlMultiTour(
  playerName: string,
  tourCodes?: string[] | null,
): string | null {
  if (!playerName) return null;

  if (tourCodes && tourCodes.length > 0) {
    for (const code of tourCodes) {
      const url = getR2HeadshotUrl(playerName, code);
      if (url) return url;
    }
  }

  // Fallback: try all tours in priority order
  const priority = ['pga', 'liv', 'euro', 'pgad', 'lpga'];
  for (const code of priority) {
    const url = getR2HeadshotUrl(playerName, code);
    if (url) return url;
  }
  return null;
}
