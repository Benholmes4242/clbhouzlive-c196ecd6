import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { CLOUDFLARE_STREAM_SUBDOMAIN } from '@/config/streamConstants';
import { generateStreamHlsUrl } from '@/config/cloudflareStream';

/**
 * useCommunityVideos — the two Discover video rails (BRIEF_DISCOVER_MEDIA_RAILS).
 *
 * THIS HOOK IS DELIBERATELY NOT COURSE-LED. There is NO tagged_course_ids
 * predicate and there must never be one: 236 of the library's 242 media posts
 * carry no course tag, so a tagged join would hand each rail six posts and the
 * rails would be pointless. useMomentsOfTheWeek stays course-tagged (it powers
 * the mosaic and /community); this reads the WHOLE library instead.
 *
 * ONE ROW PER POST — a post with three videos contributes its FIRST video only.
 *
 * TIERS by duration_seconds (Ben's split):
 *   videos  >= 180
 *   clips   >= 60 and < 180
 *   neither < 60 or NULL  -> appears in NO rail. A NULL duration never enters a
 *   rail: a rail is a claim about length and an unknown length would be a guess.
 *
 * ORDER is newest-first by post created_at, NEVER by like_count (engagement
 * averages 2.4 across the library and cannot rank anything). The like count is
 * displayed but never sorts.
 *
 * NO TIME WINDOW. The 30-day window is exactly what was hiding this content.
 */

/** Lower bound of the long-form rail, seconds. */
export const VIDEO_MIN_SECONDS = 180;
/** Lower bound of the clips rail, seconds. */
export const CLIP_MIN_SECONDS = 60;
/** Per-rail cap — matches MAX_RAIL_TILES on the community rails. */
export const MAX_RAIL_TILES = 12;
/** Below this a rail renders NOTHING — matches MIN_RAIL_TILES. */
export const MIN_RAIL_TILES = 3;
/** Candidate ceiling. All-time, so sized for the whole library. */
const CANDIDATE_LIMIT = 2000;

export interface CommunityVideo {
  key: string;
  postId: string;
  userId: string;
  createdAt: string;
  /** posts.content first line, trimmed. Empty when the post has no caption. */
  title: string;
  likeCount: number;
  durationSeconds: number;
  thumbnail: string | null;
  hlsUrl: string | null;
  displayName: string;
  avatarUrl: string | null;
  /** First RESOLVABLE tagged course name, or null. Six posts in 242. */
  courseName: string | null;
}

export interface CommunityVideosResult {
  /** duration >= 180s, newest first, capped. */
  videos: CommunityVideo[];
  /** 60s <= duration < 180s, newest first, capped. */
  clips: CommunityVideo[];
  /** Diagnostic: video rows whose duration_seconds is null (never railed). */
  nullDurationCount: number;
}

function streamThumb(streamId: string): string {
  return `https://${CLOUDFLARE_STREAM_SUBDOMAIN}/${streamId}/thumbnails/thumbnail.jpg?time=0s&height=720`;
}

export const COMMUNITY_VIDEOS_KEY = ['discover', 'community-videos'] as const;

export function useCommunityVideos() {
  return useQuery({
    queryKey: COMMUNITY_VIDEOS_KEY,
    queryFn: async (): Promise<CommunityVideosResult> => {
      const { data, error } = await supabase
        .from('posts')
        .select(
          `id, user_id, content, created_at, like_count, tagged_course_ids,
           post_media!inner ( id, media_type, media_url, poster_url, hls_url, stream_id, duration_seconds, display_order )`,
        )
        .eq('status', 'published')
        .eq('post_media.media_type', 'video')
        .order('created_at', { ascending: false })
        .limit(CANDIDATE_LIMIT);
      if (error) throw error;

      type Row = {
        id: string;
        user_id: string;
        content: string | null;
        created_at: string;
        like_count: number | null;
        tagged_course_ids: string[] | null;
        post_media: Array<{
          id: string;
          media_type: string;
          media_url: string | null;
          poster_url: string | null;
          hls_url: string | null;
          stream_id: string | null;
          duration_seconds: number | null;
          display_order: number | null;
        }> | null;
      };

      const rows = (data ?? []) as unknown as Row[];

      let nullDurationCount = 0;

      // ONE ROW PER POST: the post's FIRST video by display_order. The map is
      // keyed by post id, so a post can never contribute two tiles.
      const perPost = new Map<
        string,
        { row: Row; media: NonNullable<Row['post_media']>[number] }
      >();
      for (const row of rows) {
        if (perPost.has(row.id)) continue;
        const videos = (row.post_media ?? [])
          .filter((m) => m.media_type === 'video')
          .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));
        const first = videos[0];
        if (!first) continue;
        if (first.duration_seconds == null) {
          nullDurationCount += 1;
          continue;
        }
        perPost.set(row.id, { row, media: first });
      }

      const candidates = [...perPost.values()].filter(({ media }) => {
        const d = Number(media.duration_seconds);
        return Number.isFinite(d) && d >= CLIP_MIN_SECONDS;
      });
      if (candidates.length === 0) {
        return { videos: [], clips: [], nullDurationCount };
      }

      // Identities, and course names only for the rare tagged post.
      const userIds = Array.from(new Set(candidates.map((c) => c.row.user_id)));
      const courseIds = Array.from(
        new Set(
          candidates
            .map((c) => c.row.tagged_course_ids?.[0])
            .filter((id): id is string => !!id),
        ),
      );
      const [{ data: profiles }, coursesRes] = await Promise.all([
        supabase
          .from('user_profiles')
          .select('id, display_name, username, profile_photo_url')
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
        }>).map((p) => [p.id, p]),
      );
      const courseNameById = new Map(
        ((coursesRes.data ?? []) as Array<{ id: string; name: string }>).map((c) => [
          c.id,
          c.name,
        ]),
      );

      const mapped: CommunityVideo[] = candidates
        .map(({ row, media }) => {
          const profile = profileById.get(row.user_id);
          const taggedId = row.tagged_course_ids?.[0] ?? null;
          return {
            key: `${row.id}-${media.id}`,
            postId: row.id,
            userId: row.user_id,
            createdAt: row.created_at,
            title: (row.content ?? '').split('\n')[0]?.trim() ?? '',
            likeCount: row.like_count ?? 0,
            durationSeconds: Number(media.duration_seconds),
            thumbnail:
              media.poster_url ||
              (media.stream_id ? streamThumb(media.stream_id) : null),
            hlsUrl: media.stream_id
              ? generateStreamHlsUrl(media.stream_id)
              : media.hls_url ?? null,
            displayName: profile?.display_name ?? profile?.username ?? 'Player',
            avatarUrl: profile?.profile_photo_url ?? null,
            // MULTIPLE TAGS: the FIRST resolvable name only, never concatenated.
            courseName: taggedId ? courseNameById.get(taggedId) ?? null : null,
          };
        })
        // NEWEST FIRST. Never like_count.
        .sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );

      return {
        videos: mapped
          .filter((m) => m.durationSeconds >= VIDEO_MIN_SECONDS)
          .slice(0, MAX_RAIL_TILES),
        clips: mapped
          .filter(
            (m) =>
              m.durationSeconds >= CLIP_MIN_SECONDS &&
              m.durationSeconds < VIDEO_MIN_SECONDS,
          )
          .slice(0, MAX_RAIL_TILES),
        nullDurationCount,
      };
    },
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
}
