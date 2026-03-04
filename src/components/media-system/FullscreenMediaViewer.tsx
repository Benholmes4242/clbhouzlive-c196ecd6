/**
 * FullscreenMediaViewer — standalone fullscreen media player page.
 * Uses React Query for paginated data fetching with infinite scroll.
 * MuteButton is now inside SocialOverlay per-item, no standalone needed.
 */
import { useCallback } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { VideoPoolProvider } from './VideoPoolProvider';
import { FeedContainer } from './FeedContainer';
import { usePreloader } from './hooks/usePreloader';
import { supabase } from '@/integrations/supabase/client';
import { CLOUDFLARE_STREAM_SUBDOMAIN } from '@/media/constants';
import type { FeedPost, MediaItem } from './types/media';

const PAGE_SIZE = 10;
const UID_RE = /([0-9a-f]{32})/i;

function extractStreamId(url: string): string | null {
  return url.match(UID_RE)?.[1] ?? null;
}
function buildHlsUrl(id: string): string {
  return `https://${CLOUDFLARE_STREAM_SUBDOMAIN}/${id}/manifest/video.m3u8`;
}
function buildThumbnailUrl(id: string): string {
  return `https://${CLOUDFLARE_STREAM_SUBDOMAIN}/${id}/thumbnails/thumbnail.jpg?height=720&fit=crop`;
}
function buildMp4Url(id: string): string {
  return `https://${CLOUDFLARE_STREAM_SUBDOMAIN}/${id}/downloads/default.mp4`;
}

async function fetchFeedPage(offset: number): Promise<{ posts: FeedPost[]; nextOffset: number }> {
  const { data, error } = await supabase
    .from('post_media')
    .select(`
      id, post_id, media_type, media_url, poster_url, stream_id,
      width, height, duration_seconds, display_order,
      posts!inner (
        id, user_id, content, like_count, comment_count, status,
        user_profiles:user_id (
          id, username, display_name, profile_photo_url
        )
      )
    `)
    .eq('media_type', 'video')
    .not('stream_id', 'is', null)
    .eq('posts.status', 'published')
    .order('created_at', { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1);

  if (error || !data) {
    console.error('[MediaPlayer] Fetch error:', error);
    return { posts: [], nextOffset: offset + PAGE_SIZE };
  }

  const postMap = new Map<string, FeedPost>();

  for (const row of data as any[]) {
    const post = row.posts;
    if (!post) continue;
    const streamId = row.stream_id || extractStreamId(row.media_url || '');
    if (!streamId) continue;

    if (!postMap.has(post.id)) {
      const profile = post.user_profiles;
      postMap.set(post.id, {
        id: post.id,
        userId: post.user_id,
        username: profile?.display_name || profile?.username || '',
        avatarUrl: profile?.profile_photo_url || '',
        caption: post.content || '',
        mediaItems: [],
        likeCount: post.like_count || 0,
        commentCount: post.comment_count || 0,
      });
    }

    const feedPost = postMap.get(post.id)!;
    const item: MediaItem = {
      id: row.id,
      type: 'video',
      hlsUrl: buildHlsUrl(streamId),
      mp4Url: buildMp4Url(streamId),
      thumbnailUrl: row.poster_url || buildThumbnailUrl(streamId),
      width: row.width || 1080,
      height: row.height || 1920,
      duration: row.duration_seconds || undefined,
    };
    feedPost.mediaItems.push(item);
  }

  return { posts: Array.from(postMap.values()), nextOffset: offset + PAGE_SIZE };
}

function FeedWithPreloader({ posts, onNearEnd }: { posts: FeedPost[]; onNearEnd: () => void }) {
  usePreloader(posts);
  return <FeedContainer posts={posts} onNearEnd={onNearEnd} />;
}

export default function FullscreenMediaViewer() {
  const {
    data,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['media-system-feed'],
    queryFn: ({ pageParam = 0 }) => fetchFeedPage(pageParam as number),
    getNextPageParam: (lastPage) => {
      if (lastPage.posts.length < PAGE_SIZE) return undefined;
      return lastPage.nextOffset;
    },
    initialPageParam: 0,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  const posts = data?.pages.flatMap((p) => p.posts) ?? [];

  const handleNearEnd = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (isLoading) {
    return (
      <div className="w-full h-[100dvh] bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  if (!posts.length) {
    return (
      <div className="w-full h-[100dvh] bg-black flex items-center justify-center">
        <p className="text-white/60 text-sm">No video posts found</p>
      </div>
    );
  }

  return (
    <VideoPoolProvider>
      <div className="w-full h-[100dvh] bg-black overflow-hidden">
        <FeedWithPreloader posts={posts} onNearEnd={handleNearEnd} />
      </div>
    </VideoPoolProvider>
  );
}
