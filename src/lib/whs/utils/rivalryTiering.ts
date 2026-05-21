import type { FriendRivalryHydrated } from '../types';

export type RivalryTier = 'archrival' | 'rival' | 'recent' | 'new';

/**
 * Relevance score for a rival.
 *   score = shared_rounds_count + (shared_rounds_last_90d × 2)
 * Depth wins, but recency closes the gap.
 */
export function rivalryScore(r: FriendRivalryHydrated): number {
  return (r.shared_rounds_count ?? 0) + (r.shared_rounds_last_90d ?? 0) * 2;
}

/** Stable key for a rivalry — user_id when Clbhouz, else friend_row_id. */
export function rivalKey(r: FriendRivalryHydrated): string | null {
  return r.rival_user_id ?? r.rival_friend_row_id ?? null;
}

/**
 * Assign a tier to every rivalry. Pure.
 *
 * Tiers:
 *  - NEW: shared_rounds_count === 0
 *  - ARCHRIVAL: top 20% (min 1 if any has shared rounds)
 *  - RIVAL: next 50%
 *  - RECENT: remaining bottom 30%
 *
 * `pinned` rivals are never demoted below RIVAL.
 */
export function assignRivalryTiers(
  rivalries: FriendRivalryHydrated[],
): Map<string, RivalryTier> {
  const tiers = new Map<string, RivalryTier>();
  const ranked: Array<{ key: string; score: number; pinned: boolean; inputIdx: number }> = [];

  rivalries.forEach((r, idx) => {
    const key = rivalKey(r);
    if (!key) return;
    if ((r.shared_rounds_count ?? 0) === 0) {
      tiers.set(key, 'new');
      return;
    }
    ranked.push({
      key,
      score: rivalryScore(r),
      pinned: r.slot_kind === 'pinned',
      inputIdx: idx,
    });
  });

  if (ranked.length === 0) return tiers;

  ranked.sort((a, b) => b.score - a.score || a.inputIdx - b.inputIdx);

  const total = ranked.length;
  const archCutoff = Math.max(1, Math.floor(total * 0.20));
  const rivalCutoff = archCutoff + Math.floor(total * 0.50);

  for (let i = 0; i < ranked.length; i++) {
    const { key, pinned } = ranked[i];
    let tier: RivalryTier;
    if (i < archCutoff) tier = 'archrival';
    else if (i < rivalCutoff) tier = 'rival';
    else tier = 'recent';
    if (pinned && tier === 'recent') tier = 'rival';
    tiers.set(key, tier);
  }

  return tiers;
}
