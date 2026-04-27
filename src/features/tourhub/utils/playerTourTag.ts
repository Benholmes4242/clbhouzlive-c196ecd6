/**
 * playerTourTag — central mapping from a player's tour_codes array to a
 * displayable tour tag for College Franchise alumni rows.
 *
 * Rules (locked in Phase 1 fix step):
 *  - PGA primary (first code 'pga' or includes 'pga' as primary) → no tag (implicit)
 *  - lpga → LPGA pink
 *  - EURO or dpwt → DPWT blue
 *  - Multi-tour with PGA primary → no tag (PGA wins)
 *  - Empty/null → no tag
 *
 * NOTE: data layer stores DPWT as the legacy code 'EURO' on sr_players.tour_codes.
 * Map both spellings so we're forward-compatible if ingestion later uses 'dpwt'.
 */

export type PlayerTourTag = {
  label: 'LPGA' | 'DPWT';
  bg: string;
  fg: string;
} | null;

const LPGA_TAG = { label: 'LPGA' as const, bg: '#FCE7F3', fg: '#BE185D' }; // pink-100/700
const DPWT_TAG = { label: 'DPWT' as const, bg: '#DBEAFE', fg: '#1D4ED8' }; // blue-100/700

export function getPlayerTourTag(tourCodes: string[] | null | undefined): PlayerTourTag {
  if (!tourCodes || tourCodes.length === 0) return null;
  const primary = tourCodes[0]?.toLowerCase();
  // PGA primary → no tag (implicit default)
  if (primary === 'pga') return null;
  if (primary === 'lpga') return LPGA_TAG;
  if (primary === 'euro' || primary === 'dpwt') return DPWT_TAG;
  return null;
}
