import { supabase } from '@/integrations/supabase/client';
import type { SocialUser } from '@/hooks/useSocialLists';

export type ActorKind = 'personal' | 'business';

export interface FollowsPageResult {
  users: SocialUser[];
  hasMore: boolean;
  totalCount: number;
}

export const FOLLOWS_PAGE_SIZE = 20;

/**
 * Resolve a batch of actor refs (mix of personal / business) into SocialUser
 * rows for follower/following lists. Phase 2b — see brief.
 */
async function resolveActorsToSocialUsers(
  refs: Array<{ type: ActorKind; id: string }>,
): Promise<Map<string, SocialUser>> {
  const out = new Map<string, SocialUser>();
  if (refs.length === 0) return out;

  const personalIds = Array.from(
    new Set(refs.filter((r) => r.type === 'personal').map((r) => r.id)),
  );
  const businessIds = Array.from(
    new Set(refs.filter((r) => r.type === 'business').map((r) => r.id)),
  );

  if (personalIds.length > 0) {
    const { data, error } = await supabase
      .from('user_profiles')
      .select(
        'id, username, display_name, profile_photo_url, home_club, eg_handicap_index, profile_type, show_handicap',
      )
      .in('id', personalIds)
      .is('deleted_at', null);
    if (error) throw error;
    for (const p of data ?? []) {
      out.set(`personal:${p.id}`, {
        id: p.id,
        username: p.username || '',
        displayName: p.display_name || p.username || 'Golfer',
        avatarUrl: p.profile_photo_url,
        homeClub: p.home_club,
        handicapIndex: p.eg_handicap_index,
        showHandicap: p.show_handicap ?? true,
        creatorOnly: false,
        profileType: p.profile_type || 'personal',
        actorType: 'personal',
      });
    }
  }

  if (businessIds.length > 0) {
    const { data, error } = await supabase
      .from('business_accounts')
      .select('id, name, slug, logo_url, category, location')
      .in('id', businessIds)
      .eq('is_deleted', false);
    if (error) throw error;
    for (const b of data ?? []) {
      out.set(`business:${b.id}`, {
        id: b.id,
        username: b.slug || '',
        displayName: b.name || 'Business',
        avatarUrl: b.logo_url,
        homeClub: b.location || b.category,
        handicapIndex: null,
        showHandicap: false,
        creatorOnly: true,
        profileType: 'business',
        actorType: 'business',
        slug: b.slug,
      });
    }
  }

  return out;
}

interface FetchFollowsPageOpts {
  profileActorType: ActorKind;
  profileActorId: string;
  /** 'followers' = people who follow this actor; 'following' = people this actor follows */
  direction: 'followers' | 'following';
  pageParam: number;
}

export async function fetchFollowsPage({
  profileActorType,
  profileActorId,
  direction,
  pageParam,
}: FetchFollowsPageOpts): Promise<FollowsPageResult> {
  const from = pageParam * FOLLOWS_PAGE_SIZE;
  const to = from + FOLLOWS_PAGE_SIZE - 1;

  const selfCol = direction === 'followers' ? 'following' : 'follower';
  const otherTypeCol = direction === 'followers' ? 'follower_actor_type' : 'following_actor_type';
  const otherIdCol = direction === 'followers' ? 'follower_actor_id' : 'following_actor_id';

  const { data: rows, error, count } = await supabase
    .from('follows')
    .select(`${otherTypeCol}, ${otherIdCol}`, { count: 'exact' })
    .eq(`${selfCol}_actor_type`, profileActorType)
    .eq(`${selfCol}_actor_id`, profileActorId)
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) throw error;

  const refs: Array<{ type: ActorKind; id: string }> = (rows ?? [])
    .map((r) => ({
      type: (r as Record<string, unknown>)[otherTypeCol] as ActorKind,
      id: (r as Record<string, unknown>)[otherIdCol] as string,
    }))
    .filter((r) => !!r.id && (r.type === 'personal' || r.type === 'business'));

  if (refs.length === 0) {
    return { users: [], hasMore: false, totalCount: count ?? 0 };
  }

  const resolved = await resolveActorsToSocialUsers(refs);
  const users = refs
    .map((r) => resolved.get(`${r.type}:${r.id}`))
    .filter((u): u is SocialUser => !!u);

  const total = count ?? users.length;
  return { users, hasMore: to + 1 < total, totalCount: total };
}
