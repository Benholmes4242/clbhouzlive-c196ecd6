/**
 * FullscreenMediaViewer — standalone fullscreen media player page.
 * Fetches real post data from Supabase and renders the pooled video feed.
 */
import { useEffect, useState } from 'react';
import { VideoPoolProvider } from './VideoPoolProvider';
import { FeedContainer } from './FeedContainer';
import { MuteButton } from './MuteButton';
import { supabase } from '@/integrations/supabase/client';
import { CLOUDFLARE_STREAM_SUBDOMAIN } from '@/media/constants';
import type { FeedPost, MediaItem } from './types/media';

const UID_RE = /([0-9a-f]{32})/i;

function extractStreamId(url: string): string | null {
  const match = url.match(UID_RE);
  return match ? match[1] : null;
}

function buildHlsUrl(streamId: string): string {
  return `https://${CLOUDFLARE_STREAM_SUBDOMAIN}/${streamId}/manifest/video.m3u8`;
}

function buildThumbnailUrl(streamId: string): string {
  return `https://${CLOUDFLARE_STREAM_SUBDOMAIN}/${streamId}/thumbnails/thumbnail.jpg?height=720&fit=crop`;
}

async function fetchTestFeed(): Promise<FeedPost[]> {
  // Fetch recent posts with video media
  const { data, error } = await supabase
    .from('post_media')
    .select(`
      id,
      post_id,
      media_type,
      media_url,
      poster_url,
      stream_id,
      width,
      height,
      duration_seconds,
      display_order,
      posts!inner (
        id,
        user_id,
        content,
        like_count,
        comment_count,
        status
      )
    `)
    .eq('media_type', 'video')
    .not('stream_id', 'is', null)
    .eq('posts.status', 'published')
    .order('created_at', { ascending: false })
    .limit(15);

  if (error || !data) {
    console.error('[MediaPlayer] Failed to fetch test data:', error);
    return [];
  }

  // Group media by post
  const postMap = new Map<string, FeedPost>();

  for (const row of data as any[]) {
    const post = row.posts;
    if (!post) continue;

    const streamId = row.stream_id || extractStreamId(row.media_url || '');
    if (!streamId) continue;

    if (!postMap.has(post.id)) {
      postMap.set(post.id, {
        id: post.id,
        userId: post.user_id,
        username: '',
        avatarUrl: '',
        caption: post.content || '',
        mediaItems: [],
        likeCount: post.like_count || 0,
        commentCount: post.comment_count || 0,
      });
    }

    const feedPost = postMap.get(post.id)!;
    const mediaItem: MediaItem = {
      id: row.id,
      type: 'video',
      hlsUrl: buildHlsUrl(streamId),
      thumbnailUrl: row.poster_url || buildThumbnailUrl(streamId),
      width: row.width || 1080,
      height: row.height || 1920,
      duration: row.duration_seconds || undefined,
    };

    feedPost.mediaItems.push(mediaItem);
  }

  // Sort media items by display_order within each post
  const posts = Array.from(postMap.values());
  
  // If we have fewer than 5 posts, also try to get some image posts
  return posts;
}

export default function FullscreenMediaViewer() {
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTestFeed().then((data) => {
      setPosts(data);
      setLoading(false);
    });
  }, []);

  if (loading) {
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
        <MuteButton />
        <FeedContainer posts={posts} />
      </div>
    </VideoPoolProvider>
  );
}
