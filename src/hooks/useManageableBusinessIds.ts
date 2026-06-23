/**
 * useManageableBusinessIds
 *
 * Returns the set of business ids the viewer can manage as `owner` or `admin`
 * (parity with `useEditablePost`'s server-side `canManage` check — editors
 * and analysts are excluded).
 *
 * Backed by `useMyBusinesses` (5-minute stale time, deduped by react-query),
 * so calling this from multiple surfaces runs a single query per viewer.
 *
 * Used by the shared `canManagePost` gate to decide whether the
 * `PostOwnerMenu` should render on a business post, without any per-card
 * database lookup.
 */
import { useMemo } from 'react';
import { useMyBusinesses } from './useMyBusinesses';

const EMPTY_SET: ReadonlySet<string> = new Set();

export function useManageableBusinessIds(viewerId?: string): ReadonlySet<string> {
  const { data: memberships } = useMyBusinesses(viewerId);

  return useMemo(() => {
    if (!memberships?.length) return EMPTY_SET;
    const ids = new Set<string>();
    for (const m of memberships) {
      if ((m.role === 'owner' || m.role === 'admin') && m.business?.id) {
        ids.add(m.business.id);
      }
    }
    return ids;
  }, [memberships]);
}
