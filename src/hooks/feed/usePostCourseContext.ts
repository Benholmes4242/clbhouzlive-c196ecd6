/**
 * usePostCourseContext — BATCHED course data for the Clubhouse feed.
 *
 * ONE rpc call per feed page for every visible post's course, never one per
 * post. Call this where the feed data resolves (Clubhouse.tsx) and pass the
 * resulting Map down. Do NOT call it inside a post card.
 */
import { useMemo } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { batchDigest, feedKeys, viewerId } from '@/lib/queryKeys';
import { useMergedBatch } from '@/lib/batchQuery';

export interface PostCourseContext {
  course_id: string;
  rounds_tracked: number | null;
  avg_over_par: number | null;
  /** Percentile difficulty, batched from get_post_course_context. */
  harder_than_pct: number | null;
  your_rounds: number | null;
  your_best: number | null;
  /** Community rating for this course, batched from get_post_course_context. */
  community_rating: number | null;
  /** Review count behind community_rating. Returned, not currently rendered. */
  rating_count: number | null;
}

export type PostCourseContextMap = Map<string, PostCourseContext>;

const EMPTY_MAP: PostCourseContextMap = new Map();

/**
 * @param courseIds the loaded page's course ids (used for the REQUEST, never the key)
 * @param scope     what this feed IS — 'clubhouse:suggested', `profile:<actor>` …
 */
export function usePostCourseContext(courseIds: string[], scope: string) {
  const { user } = useSupabaseSession();
  const batch = useMergedBatch<PostCourseContext>();
  // De-duplicate + stabilise the key so scroll/pagination churn does not
  // re-fire the request for ids we already asked about.
  const ids = useMemo(() => {
    const unique = Array.from(new Set(courseIds.filter(Boolean)));
    unique.sort();
    return unique;
  }, [courseIds]);

  const query = useQuery({
    // BATCH IDIOM (src/lib/queryKeys.ts). Keyed on scope + viewer + a DIGEST of
    // the course-id set. keepPreviousData + mergeOverPrevious keep every already
    // resolved course band on screen while a changed set fetches.
    queryKey: feedKeys.postCourseContext(scope, viewerId(user?.id), batchDigest(ids)),
    placeholderData: keepPreviousData,
    enabled: ids.length > 0,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    queryFn: async (): Promise<PostCourseContextMap> => {
      // Single RPC for the whole page of posts.
      const { data, error } = await supabase.rpc('get_post_course_context', {
        p_course_ids: ids,
      });
      if (error) throw error;
      const map: PostCourseContextMap = new Map();
      for (const row of (data ?? []) as PostCourseContext[]) {
        map.set(row.course_id, row);
      }
      return batch.mergeOverPrevious(map);
    },
  });

  batch.commit(query.data);

  return query.data ?? EMPTY_MAP;
}

/** Resolves the course a post belongs to: course_id, else first tagged course. */
export function resolvePostCourseId(post: {
  courseId?: string | null;
  tags?: { entity_type: string; entity_id: string }[] | null;
}): string | null {
  if (post.courseId) return post.courseId;
  const tagged = post.tags?.find((t) => t.entity_type === 'golf_club');
  return tagged?.entity_id ?? null;
}
