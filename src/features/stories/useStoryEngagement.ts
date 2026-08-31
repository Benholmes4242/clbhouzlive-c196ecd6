/**
 * useStoryEngagement (BRIEF_STORY_ENGAGEMENT §S4).
 *
 * ONE READ PER WINDOW, NEVER PER ROW. The list component hands over every story
 * id it is about to render and this issues a SINGLE `get_story_engagement` RPC,
 * joining the result into a Map keyed on the story id. A per-card query in a
 * list is exactly the fault this pattern exists to prevent.
 *
 * Stories carry NO denormalised counters and NO triggers on their tables: three
 * or four stories a week make a live count cheaper than another pair of counter
 * triggers to keep honest. The RPC is SECURITY INVOKER, so a guest reads true
 * like counts through content_reactions' public SELECT and gets
 * `viewerLiked: false`.
 *
 * A missing id is zero counts and not-liked — never a spinner per row.
 */
import { useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';

import { supabase } from '@/integrations/supabase/client';

/**
 * TWO TARGET TYPES, NOT ONE. There are two story TABLES; a single 'story' type
 * would force anything resolving a target to probe both to find out which it is
 * in.
 */
export type StoryTargetType = 'tour_story' | 'amateur_story';

export interface StoryEngagement {
  likeCount: number;
  commentCount: number;
  viewerLiked: boolean;
}

export const EMPTY_STORY_ENGAGEMENT: StoryEngagement = {
  likeCount: 0,
  commentCount: 0,
  viewerLiked: false,
};

interface Row {
  target_id: string;
  like_count: number | null;
  comment_count: number | null;
  viewer_liked: boolean | null;
}

export function useStoryEngagement(
  targetType: StoryTargetType,
  storyIds: readonly (string | null | undefined)[],
) {
  // Stable key: the sorted set of ids in the visible window.
  const ids = useMemo(() => {
    const seen = new Set<string>();
    for (const id of storyIds) if (id) seen.add(id);
    return [...seen].sort();
  }, [storyIds]);

  const { data } = useQuery<Row[]>({
    queryKey: ['story-engagement', targetType, ids.join(',')],
    enabled: ids.length > 0,
    staleTime: 60_000,
    queryFn: async () => {
      const { data: rows, error } = await supabase.rpc('get_story_engagement', {
        p_target_type: targetType,
        p_ids: ids,
      });
      if (error) throw error;
      return (rows ?? []) as unknown as Row[];
    },
  });

  const map = useMemo(() => {
    const out = new Map<string, StoryEngagement>();
    for (const r of data ?? []) {
      if (!r.target_id) continue;
      out.set(r.target_id, {
        likeCount: r.like_count ?? 0,
        commentCount: r.comment_count ?? 0,
        viewerLiked: r.viewer_liked ?? false,
      });
    }
    return out;
  }, [data]);

  const engagementFor = useCallback(
    (id: string | null | undefined): StoryEngagement =>
      (id ? map.get(id) : undefined) ?? EMPTY_STORY_ENGAGEMENT,
    [map],
  );

  return { engagementFor };
}

export default useStoryEngagement;
