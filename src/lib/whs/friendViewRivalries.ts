/**
 * Friend-view rivalry data (file 13, Phase 3).
 *
 * When viewing another user's handicap page, we render two layers of rivalry:
 *
 *   1. PRIMARY:   viewer-vs-owner  (always present if any H2H data exists)
 *                 — fetched via existing `get_friend_view_rivalry` RPC
 *                   (owner fast-path: viewer = friend, rival = owner).
 *   2. SECONDARY: owner's OTHER rivalries where viewer is ALSO friends with
 *                 the rival — fetched via new
 *                 `get_friend_view_rivalries_for_owner` RPC, which applies
 *                 transitive-trust filtering server-side.
 *
 * Hydration (rival display name / thumbnail) comes from the VIEWER's
 * `whs_friend_matches` rows. Transitive trust guarantees those rows exist.
 *
 * Owner-view rivalries continue to use `useFriendRivalries` from
 * `src/lib/whs/hooks.ts`. This module is friend-view only.
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { FriendRivalry, FriendRivalryHydrated } from './types';

// ─── Fetchers ──────────────────────────────────────────────────────────────

async function hydrateRivalries(
  viewerId: string,
  rows: FriendRivalry[],
): Promise<FriendRivalryHydrated[]> {
  if (rows.length === 0) return [];

  // Collect both possible identifiers used by `whs_friend_matches` lookups.
  const friendRowIds = rows
    .map((r) => (r as any).rival_friend_row_id)
    .filter(Boolean) as string[];
  const rivalUserIds = rows.map((r) => r.rival_user_id).filter(Boolean) as string[];

  const matchesByRowId: Record<string, any> = {};
  const matchesByUserId: Record<string, any> = {};

  if (friendRowIds.length > 0 || rivalUserIds.length > 0) {
    const { data: matches } = await supabase
      .from('whs_friend_matches' as any)
      .select(
        'friend_row_id, friend_user_id, friend_name, friend_thumbnail_url, friend_connection_id, is_clbhouz_user',
      )
      .eq('owner_user_id', viewerId);

    for (const m of (matches as any[]) ?? []) {
      if (m.friend_row_id) matchesByRowId[m.friend_row_id] = m;
      if (m.friend_user_id) matchesByUserId[m.friend_user_id] = m;
    }
  }

  return rows.map((r): FriendRivalryHydrated => {
    const byRow = (r as any).rival_friend_row_id
      ? matchesByRowId[(r as any).rival_friend_row_id]
      : null;
    const byUser = r.rival_user_id ? matchesByUserId[r.rival_user_id] : null;
    const match = byRow ?? byUser ?? null;
    return {
      ...(r as any),
      rival_name: match?.friend_name ?? null,
      rival_thumbnail_url: match?.friend_thumbnail_url ?? null,
      rival_is_clbhouz_user: !!match?.is_clbhouz_user,
      rival_friend_connection_id: match?.friend_connection_id ?? null,
    };
  });
}

/**
 * Primary card: viewer-vs-owner. Uses the file-09 single RPC via the
 * owner fast-path (friend_id = viewer_id, rival_id = owner_id).
 *
 * Returns null when no rivalry row exists for that pair (i.e. they've
 * never played a shared round).
 */
export async function fetchPrimaryRivalryWithOwner(
  viewerId: string,
  ownerId: string,
): Promise<FriendRivalryHydrated | null> {
  if (viewerId === ownerId) return null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.rpc as any)('get_friend_view_rivalry', {
    p_viewer_id: viewerId,
    p_friend_id: viewerId,
    p_rival_id: ownerId,
  });
  if (error) throw error;
  const rows = (data as FriendRivalry[]) ?? [];
  if (rows.length === 0) return null;
  const hydrated = await hydrateRivalries(viewerId, rows);
  return hydrated[0] ?? null;
}

/**
 * Secondary list: owner's OTHER rivalries, server-side filtered by
 * transitive trust + me-vs-owner exclusion. Ordered by computed_at DESC.
 */
export async function fetchOwnerSecondaryRivalries(
  viewerId: string,
  ownerId: string,
): Promise<FriendRivalryHydrated[]> {
  if (viewerId === ownerId) return [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.rpc as any)(
    'get_friend_view_rivalries_for_owner',
    { p_viewer_id: viewerId, p_owner_user_id: ownerId },
  );
  if (error) throw error;
  const rows = (data as FriendRivalry[]) ?? [];
  return hydrateRivalries(viewerId, rows);
}

// ─── Hook ──────────────────────────────────────────────────────────────────

export interface FriendViewRivalryData {
  primary: FriendRivalryHydrated | null;
  secondary: FriendRivalryHydrated[];
}

/**
 * Returns the two layers of friend-view rivalry data for a given owner profile.
 * No-ops when viewer is missing or equals the owner.
 */
export function useFriendViewRivalriesForProfile(
  viewerUserId: string | undefined,
  ownerUserId: string | undefined,
) {
  const enabled = !!viewerUserId && !!ownerUserId && viewerUserId !== ownerUserId;
  return useQuery<FriendViewRivalryData>({
    queryKey: ['whs-friend-view-rivalries', viewerUserId ?? '', ownerUserId ?? ''],
    enabled,
    staleTime: 60_000,
    queryFn: async () => {
      const [primary, secondary] = await Promise.all([
        fetchPrimaryRivalryWithOwner(viewerUserId!, ownerUserId!),
        fetchOwnerSecondaryRivalries(viewerUserId!, ownerUserId!),
      ]);
      return { primary, secondary };
    },
  });
}
