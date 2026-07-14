/**
 * Feed snapshot validation.
 *
 * react-virtuoso's StateSnapshot captures item RANGES tied to the length of
 * the data array at capture time. If a tab's feed later shrinks (PTR,
 * refetch, cache eviction) below those ranges, restoring the snapshot makes
 * Virtuoso iterate an undefined item and reads `.index` on it — crashing
 * the app with "Cannot read properties of undefined (reading 'index')".
 *
 * This helper validates a snapshot against the CURRENT data length before
 * we hand it to `restoreStateFrom`. If the ranges don't fit, we drop the
 * snapshot and treat the mount as fresh (initialState={undefined}).
 */
import type { StateSnapshot } from 'react-virtuoso';

export function snapshotFitsPosts(
  snap: StateSnapshot | undefined,
  postsLen: number,
): boolean {
  if (!snap) return false;
  if (postsLen <= 0) return false;
  const ranges = (snap as any).ranges as
    | Array<{ startIndex: number; endIndex: number; size: number }>
    | undefined;
  if (!Array.isArray(ranges) || ranges.length === 0) {
    // No ranges recorded — safe to restore (scrollTop only).
    return true;
  }
  const maxEnd = ranges.reduce(
    (m, r) => (typeof r?.endIndex === 'number' && r.endIndex > m ? r.endIndex : m),
    -1,
  );
  // endIndex is inclusive — must be strictly less than the current length.
  return maxEnd < postsLen;
}

export function safeInitialState(
  snap: StateSnapshot | undefined,
  postsLen: number,
): StateSnapshot | undefined {
  return snapshotFitsPosts(snap, postsLen) ? snap : undefined;
}
