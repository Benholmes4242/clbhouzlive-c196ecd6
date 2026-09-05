import { useQuery } from '@tanstack/react-query';

import { generateStreamHlsUrl } from '@/config/cloudflareStream';
import { CLOUDFLARE_STREAM_SUBDOMAIN } from '@/config/streamConstants';
import type { FeedPost, MediaItem } from '@/components/media-system/types/media';
import { supabase } from '@/integrations/supabase/client';
import type { CommunityLibraryItem } from './useCommunityLibrary';

const POST_LIMIT = 72;

function streamThumb(streamId: string): string {
  return `https://${CLOUDFLARE_STREAM_SUBDOMAIN}/${streamId}/thumbnails/thumbnail.jpg?time=0s&height=1080`;
}

export interface DiscoverMediaPreview {
  clips: CommunityLibraryItem[];
  videos: CommunityLibraryItem[];
  rounds: CommunityLibraryItem[];
}

export function useDiscoverMediaPreview(enabled: boolean) {
  return useQuery({
    queryKey: ['discover', 'news-media-preview'],
    enabled,
    staleTime: 10 * 60_000,
    queryFn: async (): Promise<DiscoverMediaPreview> => {
      const { data, error } = await supabase
        .from('posts')
        .select(`id, user_id, actor_id, actor_type, content, created_at, course_id, tagged_course_ids,
          whs_score_id, like_count, comment_count,
          post_media!inner ( id, media_type, media_url, poster_url, hls_url, stream_id, width, height, duration_seconds, display_order )`)
        .eq('status', 'published')
        .order('created_at', { ascending: false })
        .limit(POST_LIMIT);
      if (error) throw error;

      type Media = {
        id: string; media_type: string; media_url: string | null; poster_url: string | null;
        hls_url: string | null; stream_id: string | null; width: number | null;
        height: number | null; duration_seconds: number | null; display_order: number | null;
      };
      type Row = {
        id: string; user_id: string; actor_id: string | null; actor_type: string | null;
        content: string | null; created_at: string; course_id: string | null;
        tagged_course_ids: string[] | null; whs_score_id: string | null;
        like_count: number | null; comment_count: number | null; post_media: Media[] | null;
      };
      const rows = (data ?? []) as unknown as Row[];
      const userIds = [...new Set(rows.map((row) => row.user_id))];
      const courseIds = [...new Set(rows.flatMap((row) => [row.tagged_course_ids?.[0], row.course_id]).filter((id): id is string => !!id))];
      const [{ data: profiles }, { data: courses }] = await Promise.all([
        userIds.length
          ? supabase.from('public_profiles').select('id, username, display_name, profile_photo_url').in('id', userIds)
          : Promise.resolve({ data: [] }),
        courseIds.length
          ? supabase.from('golf_courses').select('id, name').in('id', courseIds)
          : Promise.resolve({ data: [] }),
      ]);
      const profileById = new Map((profiles ?? []).map((profile: any) => [profile.id as string, profile]));
      const courseById = new Map((courses ?? []).map((course: any) => [course.id as string, course.name as string]));

      const mapped = rows.flatMap((row): CommunityLibraryItem[] => {
        const media = [...(row.post_media ?? [])].sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));
        const lead = media[0];
        if (!lead) return [];
        const profile = profileById.get(row.user_id) as any;
        const courseId = row.tagged_course_ids?.[0] ?? row.course_id ?? null;
        const isVideo = lead.media_type === 'video';
        const ready = isVideo && lead.duration_seconds != null;
        const thumbnail = isVideo
          ? lead.poster_url ?? (lead.stream_id ? streamThumb(lead.stream_id) : null)
          : lead.media_url;
        const leadItem: MediaItem = {
          id: lead.id,
          type: isVideo ? 'video' : 'image',
          hlsUrl: ready ? (lead.stream_id ? generateStreamHlsUrl(lead.stream_id) : lead.hls_url ?? undefined) : undefined,
          imageUrl: isVideo ? undefined : lead.media_url ?? undefined,
          thumbnailUrl: thumbnail ?? undefined,
          streamId: lead.stream_id ?? undefined,
          width: lead.width ?? 1080,
          height: lead.height ?? 1080,
          duration: lead.duration_seconds ?? undefined,
          displayOrder: lead.display_order ?? 0,
          isProcessing: isVideo && !ready,
        };
        const post: FeedPost = {
          id: row.id,
          userId: row.user_id,
          actorType: (row.actor_type as FeedPost['actorType']) ?? 'personal',
          actorId: row.actor_id ?? row.user_id,
          username: profile?.username ?? '',
          displayName: profile?.display_name ?? profile?.username ?? 'Player',
          avatarUrl: profile?.profile_photo_url ?? '',
          isVerified: false,
          creatorRelation: 'none',
          caption: row.content ?? '',
          mediaItems: [leadItem],
          createdAt: row.created_at,
          likeCount: row.like_count ?? 0,
          commentCount: row.comment_count ?? 0,
          shareCount: 0,
          review: null,
          isReview: false,
          isLikedByMe: false,
          isFollowedByMe: false,
          courseId: courseId ?? undefined,
          courseName: courseId ? courseById.get(courseId) : undefined,
        };
        return [{
          key: `${row.id}-${lead.id}`,
          postId: row.id,
          userId: row.user_id,
          createdAt: row.created_at,
          title: (row.content ?? '').split('\n')[0]?.trim() ?? '',
          likeCount: row.like_count ?? 0,
          durationSeconds: lead.duration_seconds ?? 0,
          duration: lead.duration_seconds,
          kind: isVideo ? 'video' : 'photo',
          thumbnail,
          hlsUrl: leadItem.hlsUrl ?? null,
          displayName: post.displayName,
          avatarUrl: post.avatarUrl || null,
          courseName: post.courseName ?? null,
          courseId,
          aspect: lead.width && lead.height ? lead.width / lead.height : null,
          post,
          mediaIndex: 0,
          mediaId: lead.id,
          roundLinked: !!row.whs_score_id,
        } as CommunityLibraryItem & { roundLinked: boolean }];
      });

      return {
        clips: mapped.filter((item) => item.kind === 'video' && (item.duration == null || item.duration < 180)).slice(0, 12),
        videos: mapped.filter((item) => item.kind === 'video' && item.duration != null && item.duration >= 180).slice(0, 12),
        rounds: mapped.filter((item) => (item as CommunityLibraryItem & { roundLinked?: boolean }).roundLinked).slice(0, 12),
      };
    },
  });
}