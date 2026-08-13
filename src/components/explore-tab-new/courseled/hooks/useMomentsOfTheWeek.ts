import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { MOMENTS_KEY } from '../discoverQueryKeys';
import { CLOUDFLARE_STREAM_SUBDOMAIN } from '@/config/streamConstants';
import { generateStreamHlsUrl } from '@/config/cloudflareStream';
import type { FeedPost, MediaItem } from '@/components/media-system/types/media';

/**
 * useMomentsOfTheWeek — the most recent course-tagged member media, one per
 * course (BRIEF, section 4). Same joins the course Media tab reads (posts ->
 * post_media, tagged_course_ids), scoped to 30 days (WINDOW_DAYS) with a candidate ceiling.
 *
 * Returns FeedPost objects so a tile can hand the read-only fullscreen viewer
 * exactly what it hands from any other media surface.
 */

export interface Moment {
  key: string;
  courseId: string;
  courseName: string | null;
  post: FeedPost;
  thumbnail: string | null;
  mediaType: 'image' | 'video';
  /** Seconds, video only. Undefined when unknown - the badge hides. */
  durationSeconds?: number;
  /** Index of this tile's media within the post's mediaItems. */
  mediaIndex?: number;
  /** Stable media id of this tile's media — authoritative for the viewer. */
  mediaId?: string;
  /**
   * True for the single best tile of its course. The PAGE mosaic renders only
   * these (one tile per course); the SHEET renders the full ranked list.
   */
  isCourseLead: boolean;
}

const DAY = 86_400_000;

/* ---- Ranking constants (all tunable) ---- */
const FRESH_HOT_MS = 2 * DAY; // <= 48h
const FRESH_WARM_MS = 7 * DAY; // <= 7 days
const BAND_HOT = 3;
const BAND_WARM = 2;
const BAND_COOL = 1; // <= 30 days (the fetch window)
const COMMENT_WEIGHT = 2;
const MAX_TILES_PER_POST = 3;
/** PAGE mosaic cap: one tile per course. The SHEET is uncapped. */
const MAX_TILES_PER_COURSE = 1;
/** 30-day window, uncapped sheet: candidate ceiling sized for the whole pool. */
const CANDIDATE_LIMIT = 500;
const WINDOW_DAYS = 30;

function freshnessBand(createdAt: string, now: number): number {
  const age = now - new Date(createdAt).getTime();
  if (age <= FRESH_HOT_MS) return BAND_HOT;
  if (age <= FRESH_WARM_MS) return BAND_WARM;
  return BAND_COOL;
}

function engagement(likes: number, comments: number): number {
  return 1 + Math.log(1 + likes + COMMENT_WEIGHT * comments);
}

function streamThumb(streamId: string): string {
  return `https://${CLOUDFLARE_STREAM_SUBDOMAIN}/${streamId}/thumbnails/thumbnail.jpg?time=0s&height=1080`;
}

export function useMomentsOfTheWeek() {
  return useQuery({
    queryKey: [...MOMENTS_KEY, WINDOW_DAYS],
    queryFn: async (): Promise<Moment[]> => {
      const since = new Date(Date.now() - WINDOW_DAYS * DAY).toISOString();
      const { data, error } = await supabase
        .from('posts')
        .select(
          `id, user_id, actor_id, actor_type, content, created_at, course_id, tagged_course_ids,
           like_count, comment_count,
           post_media ( id, media_type, media_url, poster_url, hls_url, stream_id, width, height, duration_seconds, display_order )`,
        )
        .eq('status', 'published')
        .gte('created_at', since)
        .order('created_at', { ascending: false })
        .limit(CANDIDATE_LIMIT);
      if (error) throw error;

      type Row = {
        id: string;
        user_id: string;
        actor_id: string | null;
        actor_type: string | null;
        content: string | null;
        created_at: string;
        course_id: string | null;
        tagged_course_ids: string[] | null;
        like_count: number | null;
        comment_count: number | null;
        post_media: Array<{
          id: string;
          media_type: string;
          media_url: string;
          poster_url: string | null;
          hls_url: string | null;
          stream_id: string | null;
          width: number | null;
          height: number | null;
          duration_seconds: number | null;
          display_order: number | null;
        }> | null;
      };

      const rows = ((data ?? []) as unknown) as Row[];

      // Rank candidates: freshness band x log engagement, newest as tiebreak.
      const now = Date.now();
      const ranked = rows
        .map((row) => ({
          row,
          courseId: row.tagged_course_ids?.[0] ?? row.course_id ?? null,
          score:
            freshnessBand(row.created_at, now) *
            engagement(row.like_count ?? 0, row.comment_count ?? 0),
        }))
        .filter(
          (c): c is { row: Row; courseId: string; score: number } =>
            !!c.courseId && !!c.row.post_media && c.row.post_media.length > 0,
        )
        .sort(
          (a, b) =>
            b.score - a.score ||
            new Date(b.row.created_at).getTime() - new Date(a.row.created_at).getTime(),
        );

      // Fill tiles under the per-post cap. The per-course cap is NOT applied
      // here: the sheet shows the full ranked list. Instead the first tile of
      // each course is flagged `isCourseLead` and the PAGE mosaic renders only
      // those (MAX_TILES_PER_COURSE = 1).
      const perCourse = new Map<string, number>();
      const picked: Array<{
        row: Row;
        courseId: string;
        mediaIndex: number;
        isCourseLead: boolean;
      }> = [];
      for (const cand of ranked) {
        const mediaCount = cand.row.post_media?.length ?? 0;
        const take = Math.min(MAX_TILES_PER_POST, mediaCount);
        for (let i = 0; i < take; i += 1) {
          const used = perCourse.get(cand.courseId) ?? 0;
          picked.push({
            row: cand.row,
            courseId: cand.courseId,
            mediaIndex: i,
            isCourseLead: used < MAX_TILES_PER_COURSE,
          });
          perCourse.set(cand.courseId, used + 1);
        }
      }
      if (picked.length === 0) return [];



      // Course names and author identities, one round-trip each.
      const courseIds = picked.map((p) => p.courseId);
      const userIds = Array.from(new Set(picked.map((p) => p.row.user_id)));
      const [{ data: courses }, { data: profiles }] = await Promise.all([
        supabase.from('golf_courses').select('id, name').in('id', courseIds),
        supabase
          .from('user_profiles')
          .select('id, display_name, username, profile_photo_url, is_verified')
          .in('id', userIds),
      ]);
      const courseName = new Map<string, string>();
      for (const c of (courses ?? []) as Array<{ id: string; name: string }>) {
        courseName.set(c.id, c.name);
      }
      const profileById = new Map<
        string,
        {
          display_name: string | null;
          username: string | null;
          profile_photo_url: string | null;
          is_verified: boolean | null;
        }
      >();
      for (const p of (profiles ?? []) as Array<{
        id: string;
        display_name: string | null;
        username: string | null;
        profile_photo_url: string | null;
        is_verified: boolean | null;
      }>) {
        profileById.set(p.id, p);
      }

      return picked.map(({ row, courseId, mediaIndex, isCourseLead }): Moment => {
        const media = [...(row.post_media ?? [])].sort(
          (a, b) => (a.display_order ?? 0) - (b.display_order ?? 0),
        );
        const mediaItems: MediaItem[] = media.map((m) => {
          const isVideo = m.media_type === 'video';
          const ready = isVideo && m.duration_seconds != null;
          const thumb =
            m.poster_url || (m.stream_id ? streamThumb(m.stream_id) : undefined);
          return {
            id: m.id,
            type: isVideo ? 'video' : 'image',
            // Manifest source of truth mirrors the canonical feedMapper: the
            // hls_url column is null for Cloudflare Stream rows, so the URL is
            // built from stream_id. Without this the fullscreen viewer gets no
            // hlsUrl and falls back to the poster-only branch (never plays).
            hlsUrl: isVideo && ready
              ? (m.stream_id ? generateStreamHlsUrl(m.stream_id) : m.hls_url ?? undefined)
              : undefined,
            imageUrl: isVideo ? undefined : m.media_url,
            thumbnailUrl: thumb,
            streamId: m.stream_id ?? undefined,
            width: m.width ?? 1080,
            height: m.height ?? 1920,
            duration: m.duration_seconds ? Number(m.duration_seconds) : undefined,
            displayOrder: m.display_order ?? 0,
            isProcessing: isVideo && !ready,
          };
        });
        const profile = profileById.get(row.user_id);
        const post: FeedPost = {
          id: row.id,
          userId: row.user_id,
          actorType: (row.actor_type as FeedPost['actorType']) ?? 'personal',
          actorId: row.actor_id ?? row.user_id,
          username: profile?.username ?? '',
          displayName: profile?.display_name ?? 'Player',
          avatarUrl: profile?.profile_photo_url ?? '',
          isVerified: !!profile?.is_verified,
          creatorRelation: 'none',
          caption: row.content ?? '',
          mediaItems,
          createdAt: row.created_at,
          likeCount: row.like_count ?? 0,
          commentCount: row.comment_count ?? 0,
          shareCount: 0,
          review: null,
          isReview: false,
          isLikedByMe: false,
          isFollowedByMe: false,
          courseId,
          courseName: courseName.get(courseId) ?? undefined,
        };
        const tile = mediaItems[mediaIndex] ?? mediaItems[0];
        return {
          key: `${row.id}-${courseId}-${mediaIndex}`,
          courseId,
          courseName: courseName.get(courseId) ?? null,
          post,
          thumbnail: tile?.imageUrl ?? tile?.thumbnailUrl ?? null,
          mediaType: tile?.type === 'video' ? 'video' : 'image',
          durationSeconds: tile?.type === 'video' ? tile?.duration : undefined,
          mediaIndex,
          mediaId: tile?.id,
          isCourseLead,
        };
      });
    },
    // UNCHANGED at 10 min. The member's own photo appears immediately via
    // invalidateDiscoverMoments on upload completion, so this only governs
    // other members' posts.
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
}
