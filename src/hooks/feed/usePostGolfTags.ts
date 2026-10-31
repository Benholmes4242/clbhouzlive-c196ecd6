/** usePostGolfTags — BATCHED Played with + per-slide course tags for a page of
 * feed posts. Called where the feed's posts array lives (CardFeed /
 * LightCardFeed), beside useFeedCommentPreview: ONE post_with read (+ one
 * profile read), ONE course_hole_media and ONE course_place_media read for the
 * page's media, and one hole-analysis read per distinct tagged course for pars.
 * Never one query per card.
 */
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { FeedPost } from '@/components/media-system/types/media';
import { holeMediaKey } from '@/lib/courseMedia/holePhotoData';
import { readPostWith, type PostWithPerson } from '@/features/post-v2/lib/postWith';
import type { SlideTag } from '@/features/post-v2/lib/golfPostRules';
import type { CourseHoleAnalysis } from '@/hooks/gam/useCourseHoleAnalysis';

export interface PostGolfTags {
  withByPost: Map<string, PostWithPerson[]>;
  slideTags: Map<string, SlideTag>;
}
const EMPTY: PostGolfTags = { withByPost: new Map(), slideTags: new Map() };

export async function fetchPostGolfTags(posts: readonly FeedPost[]): Promise<PostGolfTags> {
  const ids = posts.map((p) => p.id);
  const media = posts.flatMap((p) => p.mediaItems ?? []);
  const urls = [...new Set(media.flatMap((m) => [m.imageUrl, m.hlsUrl].filter((u): u is string => !!u)))];
  const streams = [...new Set(media.map((m) => m.streamId).filter((s): s is string => !!s))];
  const orFilter = [urls.length ? `media_url.in.(${urls.map((u) => `"${u}"`).join(',')})` : null, streams.length ? `stream_id.in.(${streams.join(',')})` : null].filter(Boolean).join(',');
  const [people, holes, places] = await Promise.all([
    readPostWith(ids),
    orFilter ? supabase.from('course_hole_media').select('course_id, hole_no, media_url, media_type, stream_id').eq('status', 'approved').or(orFilter) : Promise.resolve({ data: [] }),
    orFilter ? supabase.from('course_place_media').select('course_id, place, media_url, media_type, stream_id').eq('status', 'approved').or(orFilter) : Promise.resolve({ data: [] }),
  ]);
  const withByPost = new Map<string, PostWithPerson[]>();
  for (const p of people) withByPost.set(p.postId, [...(withByPost.get(p.postId) ?? []), p]);

  const holeRows = (holes.data ?? []) as Array<{ course_id: string; hole_no: number; media_url: string; media_type: string; stream_id: string | null }>;
  const courseIds = [...new Set(holeRows.map((r) => r.course_id))];
  const pars = new Map<string, number>();
  await Promise.all(courseIds.map(async (id) => {
    const { data } = await supabase.rpc('get_course_hole_analysis' as never, { p_course_id: id } as never);
    for (const h of ((data as unknown as CourseHoleAnalysis | null)?.holes ?? [])) if (h.par) pars.set(`${id}:${h.hole_no}`, h.par);
  }));
  const slideTags = new Map<string, SlideTag>();
  for (const r of (places.data ?? []) as Array<{ place: string; media_url: string; media_type: string; stream_id: string | null }>) {
    slideTags.set(holeMediaKey({ mediaType: r.media_type, url: r.media_url, streamId: r.stream_id }), { place: r.place as never });
  }
  for (const r of holeRows) {
    slideTags.set(holeMediaKey({ mediaType: r.media_type, url: r.media_url, streamId: r.stream_id }), { hole: r.hole_no, par: pars.get(`${r.course_id}:${r.hole_no}`) ?? null });
  }
  return { withByPost, slideTags };
}

export function usePostGolfTags(posts: readonly FeedPost[], scope: string): PostGolfTags {
  const ids = posts.map((p) => p.id);
  const q = useQuery({
    queryKey: ['post-golf-tags', scope, ids.join(',')],
    enabled: ids.length > 0,
    queryFn: () => fetchPostGolfTags(posts),
    staleTime: 60_000,
    placeholderData: keepPreviousData,
  });
  return q.data ?? EMPTY;
}
