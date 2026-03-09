import React from 'react';
import { Heart, MessageCircle, Film } from 'lucide-react';
import type { FeedPost } from '@/components/media-system/types/media';
import { formatDistanceToNowStrict } from 'date-fns';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { useFullscreenFeed } from '@/components/fullscreen-feed/hooks/useFullscreenFeed';

function formatDuration(seconds?: number): string {
  if (!seconds) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function abbreviateCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

interface CourseMediaLandscapeCardProps {
  post: FeedPost;
  index: number;
  allPosts?: FeedPost[];
}


export const CourseMediaLandscapeCard: React.FC<CourseMediaLandscapeCardProps> = ({ post, index, allPosts }) => {
  const media = post.mediaItems[0];
  const isVideo = media?.type === 'video';
  const thumbnailUrl = isVideo ? media?.thumbnailUrl : (media?.imageUrl || media?.thumbnailUrl);
  const duration = media?.duration;

  const timeAgo = (() => {
    try {
      return formatDistanceToNowStrict(new Date(post.createdAt), { addSuffix: true });
    } catch {
      return '';
    }
  })();

  return (
    <div
      style={{ gridColumn: '1 / -1' }}
      className="bg-card cursor-pointer mt-[0px]"
      onClick={() => {
        if (allPosts) {
          useFullscreenFeed.getState().open({
            posts: allPosts,
            startIndex: index,
            sourceId: 'course-media',
          });
        }
      }}
      data-course-media-index={index}
    >
      {/* Media */}
      <div className="relative aspect-video overflow-hidden">
        {/* Creator avatar — top-left inside card */}
        <div className="absolute top-1.5 left-1.5 z-10">
          <SquircleAvatar
            src={post.avatarUrl}
            alt=""
            size={20}
            fallback={post.displayName?.charAt(0)?.toUpperCase() || '?'}
            hideRing
          />
        </div>
        {thumbnailUrl ? (
          <img
            src={thumbnailUrl}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-muted">
            <Film className="w-10 h-10 text-muted-foreground" />
          </div>
        )}

        {/* Duration badge */}
        {isVideo && duration != null && duration > 0 && (
          <div
            className="absolute bottom-2 right-2 z-10 rounded-[4px] liquid-glass flex items-center"
            style={{ padding: '2px 6px' }}
          >
            <span className="text-[11px] font-semibold text-white tracking-[0.02em]">
              {formatDuration(duration)}
            </span>
          </div>
        )}
      </div>

      {/* Caption */}
      {post.caption && (
        <p className="px-3 pt-1.5 text-sm text-foreground line-clamp-1">{post.caption}</p>
      )}

      {/* Engagement */}
      <div className="flex items-center gap-4 px-3 p1.5-2">
        {post.likeCount > 0 && (
          <div className="flex items-center gap-1 text-muted-foreground">
            <Heart className="w-3.5 h-3.5" />
            <span className="text-xs">{abbreviateCount(post.likeCount)}</span>
          </div>
        )}
        {post.commentCount > 0 && (
          <div className="flex items-center gap-1 text-muted-foreground">
            <MessageCircle className="w-3.5 h-3.5" />
            <span className="text-xs">{abbreviateCount(post.commentCount)}</span>
          </div>
        )}
      </div>
    </div>
  );
};
