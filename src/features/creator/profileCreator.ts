/** CR2 reads only Ben's creator RPCs. Server qualification/privacy is authoritative;
 * adapt their named columns locally to Watch's shared fullscreen row contract. */
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { HubRpcRow } from '@/features/watch-v2/utils/toFeedPost';
import type { Database } from '@/integrations/supabase/types';
export type VideoKind = 'all' | 'short' | 'long';
export type CreatorSummary = { is_creator: boolean; videos: number; shorts: number; long_form: number };
export type CreatorVideo = Database['public']['Functions']['get_profile_videos']['Returns'][number];
export type RoundVideo = Database['public']['Functions']['get_profile_round_videos']['Returns'][number];
export function creatorFeedRow(row: CreatorVideo): HubRpcRow {
  return { ...row, post_created_at: row.created_at, post_content: row.caption, post_user_id: row.actor_id, creator_username: row.handle, creator_display_name: row.display_name, creator_avatar_url: row.avatar_url, creator_is_verified: row.is_verified };
}
export function creatorDuration(seconds: number | null | undefined): string {
  if (seconds == null || !Number.isFinite(seconds) || seconds < 0) return '';
  const total = Math.floor(seconds); return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
}
export function useProfileCreator(userId: string | undefined, signedIn: boolean) {
  return useQuery({ queryKey: ['profile-creator', userId], enabled: signedIn && !!userId, retry: false, queryFn: async (): Promise<CreatorSummary | null> => {
    if (!userId) return null;
    const { data, error } = await supabase.rpc('get_profile_creator', { p_user_id: userId });
    if (error) throw error; return data?.[0] ?? null;
  } });
}
export function useProfileVideos(userId: string, kind: VideoKind, signedIn: boolean) {
  return useInfiniteQuery({ queryKey: ['profile-videos', userId, kind], enabled: signedIn && !!userId, initialPageParam: undefined as string | undefined, queryFn: async ({ pageParam }) => {
    const { data, error } = await supabase.rpc('get_profile_videos', { p_user_id: userId, p_kind: kind, p_limit: 30, ...(pageParam ? { p_before: pageParam } : {}) });
    if (error) throw error; return data ?? [];
  }, getNextPageParam: page => page.length === 30 ? page[page.length - 1]?.created_at : undefined });
}
export function creatorTab(param: string | null, creator: boolean, pending: boolean): string | null {
  if (!param && pending) return null;
  if (!param) return creator ? 'videos' : 'activity';
  if (param === 'videos') return pending ? null : creator ? 'videos' : 'activity';
  return param;
}
