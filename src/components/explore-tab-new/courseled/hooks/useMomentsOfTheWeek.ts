import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { CLOUDFLARE_STREAM_SUBDOMAIN } from '@/config/streamConstants';
import { generateStreamHlsUrl } from '@/config/cloudflareStream';
import type { FeedPost, MediaItem } from '@/components/media-system/types/media';

/**
 * useMomentsOfTheWeek — the most recent course-tagged member media, one per
 * course (BRIEF, section 4). Same joins the course Media tab reads (posts ->
 * post_media, tagged_course_ids), scoped to 14 days with a small limit.
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
}

const DAY = 86_400_000;

function streamThumb(streamId: string): string {
  return `https://${CLOUDFLARE_STREAM_SUBDOMAIN}/${streamId}/thumbnails/thumbnail.jpg?time=0s&height=1080`;
}

export function useMomentsOfTheWeek(limit = 24) {
  return useQuery({
    queryKey: ['courseled', 'moments', limit],
    queryFn: async (): Promise<Moment[]> => {
      const since = new Date(Date.now() - 14 * DAY).toISOString();
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
        .limit(160);
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

      // One moment per course, newest first.
      const seenCourses = new Set<string>();
      const picked: Array<{ row: Row; courseId: string }> = [];
      for (const row of rows) {
        const courseId = row.tagged_course_ids?.[0] ?? row.course_id ?? null;
        if (!courseId || seenCourses.has(courseId)) continue;
        if (!row.post_media || row.post_media.length === 0) continue;
        seenCourses.add(courseId);
        picked.push({ row, courseId });
        if (picked.length >= limit) break;
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

      return picked.map(({ row, courseId }): Moment => {
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
        return {
          key: `${row.id}-${courseId}`,
          courseId,
          courseName: courseName.get(courseId) ?? null,
          post,
          thumbnail: mediaItems[0]?.imageUrl ?? mediaItems[0]?.thumbnailUrl ?? null,
          mediaType: mediaItems[0]?.type === 'video' ? 'video' : 'image',
        };
      });
    },
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
}
