import type { MediaItem, PostMediaContext } from '@/types/media';
import { getStreamIdFromUrl, getStreamPoster } from '@/utils/stream';

export function mapDbRowToMediaItem(r: {
  id: string;
  media_type: 'image' | 'video';
  media_url: string;
  poster_url?: string | null;
  file_name?: string | null;
}): MediaItem {
  return {
    id: r.id,
    type: r.media_type,
    url: r.media_url,
    posterUrl: r.poster_url ?? (getStreamPoster(r.media_url, '1s') ?? null),
    streamId: r.media_type === 'video' ? (getStreamIdFromUrl(r.media_url) ?? null) : null,
    alt: r.file_name ?? null,
  };
}

export function buildPostMediaContext(post: {
  media: Array<Parameters<typeof mapDbRowToMediaItem>[0]>;
  user?: any; content?: string; post_tags?: any[]; golfCourse?: any;
  initialIndex?: number; videoPosition?: number; videoMuted?: boolean;
}): PostMediaContext {
  const items = (post.media ?? []).map(mapDbRowToMediaItem);
  return {
    items,
    mediaUrls: items.map(i => i.url),
    mediaTypes: items.map(i => i.type),
    user: post.user,
    displayName: post.user?.display_name ?? post.user?.username,
    content: post.content,
    postTags: post.post_tags,
    golfCourse: post.golfCourse,
    initialIndex: post.initialIndex ?? 0,
    videoPosition: post.videoPosition ?? 0,
    videoMuted: post.videoMuted ?? true,
  };
}

/** Strict: do not cast arrays; always map. */
export function mapDbListToMediaItems(rows: Parameters<typeof mapDbRowToMediaItem>[0][] | undefined | null): MediaItem[] {
  return (rows ?? []).map(mapDbRowToMediaItem);
}