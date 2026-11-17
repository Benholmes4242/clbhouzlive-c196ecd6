/**
 * The selected course's photo reads for the What's been played tile
 * (BRIEF_WHATS_BEEN_PLAYED §3). No new RPCs, and every read shares the course
 * page's cache entries:
 * - hole photos: the Media tab's hole tag list (['hole-photo-tags'],
 *   fetchHolePhotos) names the tagged holes; each hole's credited rows come
 *   from get_hole_media via holeMediaQuery, the same path useCourseGallery
 *   uses, which supplies hole number, par, yards and member.
 * - hardest hole: get_course_hole_ranks rank 1, only at HOLE_DIFFICULTY_MIN_ROUNDS.
 * - course photos: galleryCourseMediaQuery (get_course_media_v2, filter all).
 */
import { useMemo } from 'react';
import { useQueries, useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useActiveActor } from '@/context/ActiveActorContext';
import { fetchHolePhotos, holeMediaPoster } from '@/lib/courseMedia/holePhotoData';
import { holeMediaQuery } from '@/lib/courseMedia/holeMediaQuery';
import type { MemberShotRow } from '@/lib/courseMedia/memberShotPosts';
import { galleryCourseMediaQuery } from '@/components/explore-tab-new/courseled/hooks/useGalleryCourseMedia';
import { settled } from './PageLoadGate';
import { hardestHoleFromRanks } from './playedRings';

const EMPTY_POSTS: never[] = [];

/** A video tile's playable source for HoleInlineVideo (BRIEF_PLAYED_MEMBER_MEDIA_AUTOPLAY §2). */
export interface TileVideo { media_url: string; stream_id: string | null; poster_url: string | null; duration_seconds: number | null }

export interface TileHolePhoto { kind: 'hole'; key: string; holeNo: number; addedAt: string; imageUrl: string; par: number | null; yards: number | null; memberName: string | null; memberId: string | null; memberPhoto: string | null; sourcePostId: string | null; mediaId?: string; rows?: MemberShotRow[]; video?: TileVideo }
export interface TileCoursePhoto { kind: 'course'; key: string; postId?: string; mediaId?: string; createdAt: string; imageUrl: string; caption: string; memberName: string | null; memberId: string | null; memberPhoto: string | null; video?: TileVideo }

export function usePlayedTile(courseId: string | null, userId: string | undefined) {
  const { activeActor } = useActiveActor();
  const tags = useQuery({
    queryKey: ['hole-photo-tags', courseId, userId],
    enabled: !!courseId && !!userId,
    queryFn: () => fetchHolePhotos(courseId as string, userId as string),
  });
  const holeNumbers = useMemo(
    () => [...new Set((tags.data ?? []).filter((r) => r.status === 'approved').map((r) => r.hole_no))].sort((a, b) => a - b),
    [tags.data],
  );
  const holeReads = useQueries({ queries: holeNumbers.map((n) => ({ ...holeMediaQuery(courseId as string, n), enabled: !!courseId })) });
  const ranks = useQuery({
    queryKey: ['course-hole-ranks', courseId],
    enabled: !!courseId,
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_course_hole_ranks', { p_course_ids: [courseId as string] });
      if (error) throw error;
      return data ?? [];
    },
  });
  const media = useQuery(galleryCourseMediaQuery(courseId, userId, activeActor?.type, activeActor?.id));

  const holes = useMemo<TileHolePhoto[]>(() => {
    const out: TileHolePhoto[] = [];
    holeReads.forEach((q, i) => {
      const rows = ((q.data ?? []) as MemberShotRow[]).filter((r) => r.media_url);
      if (!rows.length) return;
      // One per hole: its newest photo.
      const r = [...rows].sort((a, b) => (b.added_at ?? '').localeCompare(a.added_at ?? ''))[0];
      const img = holeMediaPoster(r);
      if (!img) return;
      out.push({ kind: 'hole', key: `h:${r.id}`, holeNo: r.hole_no ?? holeNumbers[i], addedAt: r.added_at ?? '', imageUrl: img, par: r.par ?? null, yards: r.yards ?? null, memberName: r.member_name ?? null, memberId: r.member_id ?? null, memberPhoto: r.member_avatar_url ?? null, sourcePostId: r.source_post_id ?? null, mediaId: r.id, rows, ...(r.media_type === 'video' ? { video: { media_url: r.media_url, stream_id: r.stream_id ?? null, poster_url: img, duration_seconds: r.duration_seconds ?? null } } : {}) });
    });
    return out;
  }, [holeReads, holeNumbers]);

  const hardestHole = useMemo(() => {
    return hardestHoleFromRanks((ranks.data ?? []) as Array<{ hole_no: number; difficulty_rank: number; rounds: number }>);
  }, [ranks.data]);

  const photos = useMemo<TileCoursePhoto[]>(() => {
    const holePosts = new Set(holes.map((h) => h.sourcePostId).filter(Boolean));
    return (media.data ?? []).flatMap((p) => {
      if (holePosts.has(p.id)) return [];
      const m = p.mediaItems?.[0];
      const img = m ? (m.type === 'video' ? m.thumbnailUrl : m.imageUrl || m.thumbnailUrl) : null;
      if (!img) return [];
      const caption = (p.caption ?? '').split('\n').map((l) => l.trim()).find(Boolean) ?? '';
      return [{ kind: 'course' as const, key: `c:${p.id}`, postId: p.id, mediaId: m?.id, createdAt: p.createdAt, imageUrl: img, caption, memberName: p.displayName || p.username || null, memberId: p.userId || null, memberPhoto: p.avatarUrl || null, ...(m?.type === 'video' && m.streamId ? { video: { media_url: m.hlsUrl ?? m.streamId, stream_id: m.streamId, poster_url: img, duration_seconds: m.duration ?? null } } : {}) }];
    });
  }, [media.data, holes]);

  const ready = !courseId || !userId || (
    settled(tags) && holeReads.every((q) => settled(q)) && settled(ranks) && settled(media)
  );
  /** V4 §3: the course's media set, opened by course photo taps. */
  const coursePosts = media.data ?? EMPTY_POSTS;
  return { holes, photos, hardestHole, ready, coursePosts };
}
