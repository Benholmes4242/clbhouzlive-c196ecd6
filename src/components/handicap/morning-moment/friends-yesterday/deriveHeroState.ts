import type { FriendYesterday } from '@/lib/handicap/useFriendsYesterday';

export type HeroState = 'enriched' | 'syncing' | 'invite' | 'nudge';

const hasBreakdown = (f: FriendYesterday): boolean =>
  f.eagle_plus !== null || f.birdie !== null || f.par_count !== null;

export function deriveHeroState(data: FriendYesterday): HeroState {
  const enriched =
    data.stableford !== null && data.differential !== null && hasBreakdown(data);
  if (enriched) return 'enriched';
  if (!data.is_clbhouz_user) return 'invite';
  if (data.user_id && data.friend_connection_id) return 'syncing';
  return 'nudge';
}

export const firstNameOf = (name: string): string =>
  name.split(',').slice(-1)[0].trim().split(' ')[0] || 'friend';
