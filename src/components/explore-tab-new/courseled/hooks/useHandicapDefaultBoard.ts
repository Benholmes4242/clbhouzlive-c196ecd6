import { useUserProfile } from '@/hooks/useUserProfile';

import type { BoardKey } from '../boardFilters';

/**
 * THE LANDING BOARD IS CHOSEN FROM THE MEMBER'S OWN INDEX
 * (BRIEF_DISCOVER_HANDICAP_DEFAULT H1).
 *
 * A 24-handicapper cannot appear on a gross board on any window, ever, so
 * landing everyone on gross hides most of the membership from the surface's
 * default view. On net the mid-handicappers actually win, so an index of 5.0 or
 * above lands on net. Nothing in the UI says so (H2.2) and nobody is segregated
 * (H2.3): only the landing view differs.
 *
 * H1.5 — ONE BOUNDARY, 5.0 EXACTLY, and 5.0 gets net. No rounding, no bucketing,
 * and deliberately NOT the club-analytics band vocabulary.
 *
 * H1.2 — only the BOARD varies. The window stays 14 for everyone.
 */
export const HANDICAP_BOARD_BOUNDARY = 5;
/** H1.1 / H4.3 — no index, or an index that never resolves, is the gross board
    ('topar' since BRIEF_RETIRE_GROSS_BOARD; the label still reads "Lowest
    gross" and it ranks on gross-to-par). */
export const DEFAULT_BOARD_FALLBACK: BoardKey = 'topar';

export function boardForIndex(index: number | null | undefined): BoardKey {
  if (index == null || !Number.isFinite(index)) return DEFAULT_BOARD_FALLBACK;
  return index >= HANDICAP_BOARD_BOUNDARY ? 'net' : DEFAULT_BOARD_FALLBACK;
}

/**
 * H4.1 — NO EXTRA ROUND TRIP. This reads the shared ['user-profile', userId]
 * query the app already holds; when it is cached the board is known on the first
 * render.
 *
 * H4.2 — until it IS known, `resolved` is false and the board holds its loading
 * state. There is no gross render that is then replaced by net.
 */
export function useHandicapDefaultBoard(userId: string | undefined) {
  const profile = useUserProfile(userId);

  /* No signed-in member: gross, immediately. */
  if (!userId) return { board: DEFAULT_BOARD_FALLBACK, resolved: true };

  /* H4.3 — a failed profile read is a silent fallback, not an error state. */
  if (profile.isError) return { board: DEFAULT_BOARD_FALLBACK, resolved: true };

  if (!profile.isSuccess) return { board: DEFAULT_BOARD_FALLBACK, resolved: false };

  /* H1.4 — the CURRENT index off user_profiles, never hcp_at_time. */
  const index = profile.data?.eg_handicap_index ?? profile.data?.manual_handicap_index ?? null;
  return { board: boardForIndex(index), resolved: true };
}
