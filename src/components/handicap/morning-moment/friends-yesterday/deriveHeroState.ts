import type { FriendYesterday } from '@/lib/handicap/useFriendsYesterday';

export type HeroState = 'enriched' | 'summary' | 'invite' | 'nudge';

/**
 * Mirrors the Friends' Rounds card State A/B/C/D logic:
 * - D: not a Clbhouz user → invite
 * - C: Clbhouz user, not synced → nudge (ask to sync)
 * - A: synced + has stableford & differential → enriched stats
 * - B: synced summary-only → clean gross only (no "Syncing…")
 */
export function deriveHeroState(data: FriendYesterday): HeroState {
  if (!data.is_clbhouz_user) return 'invite';
  if (!data.friend_connection_id) return 'nudge';
  if (data.stableford !== null && data.differential !== null) return 'enriched';
  return 'summary';
}

export const firstNameOf = (name: string): string =>
  name.split(',').slice(-1)[0].trim().split(' ')[0] || 'friend';
