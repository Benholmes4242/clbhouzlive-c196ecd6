import { useQuery } from '@tanstack/react-query';

import { supabase } from '@/integrations/supabase/client';
import { CLOUDFLARE_STREAM_SUBDOMAIN } from '@/config/streamConstants';
import { generateStreamHlsUrl } from '@/config/cloudflareStream';
import type { FeedPost, MediaItem } from '@/components/media-system/types/media';

import type { CommunityVideo } from './useCommunityVideos';

/**
 * useCommunityLibrary — THE WHOLE MEDIA LIBRARY for the /community destination
 * (BRIEF_COMMUNITY_PAGE_REBUILD S1).
 *
 * WHY A SIBLING AND NOT A WIDENING (S1.1). useCommunityVideos backs the two
 * shipped Discover rails: its query is `post_media!inner` filtered to
 * media_type = 'video', and its result is a two-tier object the rails consume
 * directly. Widening it to carry photos would change the rows the shipped
 * rails' cache entry holds (photo-only posts would enter the candidate set and
 * spend the 2000-row ceiling) and would change the shape the rails receive.
 * The rails must not move, so this reads the library separately, under its own
 * query key, and useCommunityVideos is untouched.
 *
 * NOT COURSE-LED. No tagged_course_ids predicate and no time window: 236 of 242
 * media posts carry no course tag, and the tagged join was exactly what made
 * this page show six posts while the rails pointing at it read 242.
 *
 * ONE ROW PER POST (S1.2) — a post with three videos contributes its FIRST.
 * ORDER is newest-first by post created_at (S1.3), NEVER by like_count.
 *
 * Each item is a structural superset of CommunityVideo, so the page reuses the
 * SHIPPED Discover tiles rather than forking the video grammar, and carries the
 * post as a FeedPost so a tap can open the fullscreen viewer.
 */

/** Long form starts here, seconds. Matches VIDEO_MIN_SECONDS on the rails. */
export const LIBRARY_VIDEO_MIN_SECONDS = 180;
/** Candidate ceiling. All-time, so sized for the whole library. */
const CANDIDATE_LIMIT = 2000;

export interface CommunityLibraryItem extends CommunityVideo {
  /** 'video' when the lead media is video, else 'photo'. */
  kind: 'video' | 'photo';
  /** Null for photos AND for a video whose duration is unknown. */
  duration: number | null;
  /** First tagged course id, or null. */
  courseId: string | null;
  /** True media aspect (w/h), or null when unmeasured. */
  aspect: number | null;
  /** The post, ready for the fullscreen viewer. */
  post: FeedPost;
  /** Index of the lead media inside the post. */
  mediaIndex: number;
  /** Stable id of the lead media. */
  mediaId: string;
}

export interface CommunityLibraryResult {
  /** Every post, newest first — one row per post. */
  all: CommunityLibraryItem[];
  /** Video, duration >= 180s. */
  videos: CommunityLibraryItem[];
  /** Video, duration > 0 and < 180s. */
  clips: CommunityLibraryItem[];
  /** Photo leads, plus any video whose duration is unknown. */
  photos: CommunityLibraryItem[];
}

function streamThumb(streamId: string): string {
  return `https://${CLOUDFLARE_STREAM_SUBDOMAIN}/${streamId}/thumbnails/thumbnail.jpg?time=0s&height=1080`;
}

export const COMMUNITY_LIBRARY_KEY = ['community', 'library', 'all-time'] as const;

export function useCommunityLibrary() {
  return useQuery({
    queryKey: COMMUNITY_LIBRARY_KEY,
    queryFn: async (): Promise<CommunityLibraryResult> => {
      const { data, error } = await supabase
        .from('posts')
        .select(
          `id, user_id, actor_id, actor_type, content, created_at, course_id, tagged_course_ids,
           like_count, comment_count,
           post_media!inner ( id, media_type, media_url, poster_url, hls_url, stream_id, width, height, duration_seconds, display_order )`,
        )
        .eq('status', 'published')
        .order('created_at', { ascending: false })
        .limit(CANDIDATE_LIMIT);
      if (error) throw error;

      type Media = {
        id: string;
        media_type: string;
        media_url: string | null;
        poster_url: string | null;
        hls_url: string | null;
        stream_id: string | null;
        width: number | null;
        height: number | null;
        duration_seconds: number | null;
        display_order: number | null;
      };
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
        post_media: Media[] | null;
      };

      const rows = (data ?? []) as unknown as Row[];

      // ONE ROW PER POST, keyed by post id so a post can never contribute twice.
      const perPost = new Map<string, { row: Row; media: Media[] }>();
      for (const row of rows) {
        if (perPost.has(row.id)) continue;
        const media = [...(row.post_media ?? [])].sort(
          (a, b) => (a.display_order ?? 0) - (b.display_order ?? 0),
        );
        if (media.length === 0) continue;
        perPost.set(row.id, { row, media });
      }
      const candidates = [...perPost.values()];
      if (candidates.length === 0) return { all: [], videos: [], clips: [], photos: [] };

      const userIds = Array.from(new Set(candidates.map((c) => c.row.user_id)));
      const courseIds = Array.from(
        new Set(
          candidates
            .map((c) => c.row.tagged_course_ids?.[0] ?? c.row.course_id)
            .filter((id): id is string => !!id),
        ),
      );
      const [{ data: profiles }, coursesRes] = await Promise.all([
        supabase
          .from('user_profiles')
          .select('id, display_name, username, profile_photo_url, is_verified')
          .in('id', userIds),
        courseIds.length
          ? supabase.from('golf_courses').select('id, name').in('id', courseIds)
          : Promise.resolve({ data: [] as Array<{ id: string; name: string }> }),
      ]);
      const profileById = new Map(
        ((profiles ?? []) as Array<{
          id: string;
          display_name: string | null;
          username: string | null;
          profile_photo_url: string | null;
          is_verified: boolean | null;
        }>).map((p) => [p.id, p]),
      );
      const courseNameById = new Map(
        ((coursesRes.data ?? []) as Array<{ id: string; name: string }>).map((c) => [
          c.id,
          c.name,
        ]),
      );

      const all: CommunityLibraryItem[] = candidates
        .map(({ row, media }): CommunityLibraryItem => {
          const mediaItems: MediaItem[] = media.map((m) => {
            const isVideo = m.media_type === 'video';
            const ready = isVideo && m.duration_seconds != null;
            const thumb =
              m.poster_url || (m.stream_id ? streamThumb(m.stream_id) : undefined);
            return {
              id: m.id,
              type: isVideo ? 'video' : 'image',
              hlsUrl:
                isVideo && ready
                  ? m.stream_id
                    ? generateStreamHlsUrl(m.stream_id)
                    : m.hls_url ?? undefined
                  : undefined,
              imageUrl: isVideo ? undefined : m.media_url ?? undefined,
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
          const courseId = row.tagged_course_ids?.[0] ?? row.course_id ?? null;
          const courseName = courseId ? courseNameById.get(courseId) ?? null : null;
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
            courseId: courseId ?? undefined,
            courseName: courseName ?? undefined,
          };
          const lead = media[0];
          const leadItem = mediaItems[0];
          const isVideo = leadItem.type === 'video';
          const duration =
            isVideo && lead.duration_seconds != null ? Number(lead.duration_seconds) : null;
          return {
            key: `${row.id}-${lead.id}`,
            postId: row.id,
            userId: row.user_id,
            createdAt: row.created_at,
            title: (row.content ?? '').split('\n')[0]?.trim() ?? '',
            likeCount: row.like_count ?? 0,
            // CommunityVideo's contract; the tiles only read it behind a tier.
            durationSeconds: duration ?? 0,
            duration,
            kind: isVideo ? 'video' : 'photo',
            thumbnail: leadItem.imageUrl ?? leadItem.thumbnailUrl ?? null,
            hlsUrl: leadItem.hlsUrl ?? null,
            displayName: profile?.display_name ?? profile?.username ?? 'Player',
            avatarUrl: profile?.profile_photo_url ?? null,
            courseName,
            courseId,
            aspect:
              lead.width && lead.height && lead.height > 0 ? lead.width / lead.height : null,
            post,
            mediaIndex: 0,
            mediaId: leadItem.id,
          };
        })
        // NEWEST FIRST. Never like_count.
        .sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );

      // A TIER IS A CLAIM ABOUT LENGTH (S2.4): an unknown duration never enters
      // one, it falls to photos-and-everything.
      const videos = all.filter(
        (i) => i.kind === 'video' && i.duration != null && i.duration >= LIBRARY_VIDEO_MIN_SECONDS,
      );
      const clips = all.filter(
        (i) =>
          i.kind === 'video' &&
          i.duration != null &&
          i.duration > 0 &&
          i.duration < LIBRARY_VIDEO_MIN_SECONDS,
      );
      const photos = all.filter((i) => i.kind === 'photo' || i.duration == null);

      return { all, videos, clips, photos };
    },
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
}
