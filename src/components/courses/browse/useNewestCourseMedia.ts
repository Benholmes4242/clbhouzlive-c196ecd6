/**
 * A rail card's newest member photo or video (BRIEF_PLAYED_MEMBER_MEDIA_AUTOPLAY §1).
 * Reads get_course_media_v2 (filter 'all', the course Media tab's visibility, so
 * post and review media both count), one row, under its own key. Signed out it
 * passes a null p_user_id, which the RPC accepts. Deferred: `useNearViewport`
 * enables the read only once the card is within NEAR_MARGIN of the viewport.
 */
import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useActiveActor } from '@/context/ActiveActorContext';
import type { RpcClient } from '@/features/watch-v2/hooks/useHubMixedGrid';

export const NEAR_MARGIN = '400px';

export interface NewestCourseMedia { media_type: 'image' | 'video'; media_url: string; stream_id: string | null; poster_url: string | null; duration_seconds: number | null }

export const newestCourseMediaKey = (courseId: string, userId: string | null, actorType?: string, actorId?: string) =>
  ['course-newest-media', courseId, userId, actorType ?? null, actorId ?? null] as const;

export function useNearViewport<T extends Element>(): [React.RefObject<T>, boolean] {
  const ref = useRef<T>(null);
  const [near, setNear] = useState(false);
  useEffect(() => {
    if (near) return;
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) { setNear(true); io.disconnect(); }
    }, { rootMargin: NEAR_MARGIN });
    io.observe(el);
    return () => io.disconnect();
  }, [near]);
  return [ref, near];
}

export function useNewestCourseMedia(courseId: string, userId: string | null, enabled: boolean) {
  const { activeActor } = useActiveActor();
  return useQuery({
    queryKey: newestCourseMediaKey(courseId, userId, activeActor?.type, activeActor?.id),
    enabled: enabled && !!courseId,
    staleTime: 2 * 60 * 1000,
    queryFn: async (): Promise<NewestCourseMedia | null> => {
      const params: Record<string, unknown> = { p_user_id: userId, p_course_id: courseId, p_filter: 'all', p_page_size: 1 };
      if (userId) {
        params.p_viewer_actor_type = activeActor?.type ?? 'personal';
        params.p_viewer_actor_id = activeActor?.id ?? userId;
      }
      const { data, error } = await (supabase as unknown as RpcClient).rpc('get_course_media_v2', params);
      if (error) throw error;
      const r = ((data ?? []) as Array<Record<string, unknown>>)[0];
      if (!r || typeof r.media_url !== 'string' || !r.media_url) return null;
      return {
        media_type: r.media_type === 'video' ? 'video' : 'image',
        media_url: r.media_url,
        stream_id: (r.stream_id as string | null) ?? null,
        poster_url: (r.poster_url as string | null) ?? null,
        duration_seconds: (r.duration_seconds as number | null) ?? null,
      };
    },
  });
}
