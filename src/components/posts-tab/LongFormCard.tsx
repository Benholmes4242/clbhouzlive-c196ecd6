import React, { useState } from 'react';
import type { FeedPost } from '@/components/media-system/types/media';
import { Play } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface LongFormCardProps {
  post: FeedPost;
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export const LongFormCard: React.FC<LongFormCardProps> = ({ post }) => {
  const [expanded, setExpanded] = useState(false);
  const firstMedia = post.mediaItems[0];
  const thumbnailUrl = firstMedia?.thumbnailUrl || firstMedia?.imageUrl;
  const duration = firstMedia?.duration;
  const timeAgo = formatDistanceToNow(new Date(post.createdAt), { addSuffix: true });

  return (
    <div
      className="bg-card rounded-xl overflow-hidden shadow-sm border border-border/50 mx-0 cursor-pointer"
      onClick={() => { /* TODO: wire to player */ }}
    >
      {/* Media area — 16:9 */}
      <div className="relative aspect-video bg-muted">
        {thumbnailUrl && (
          <img
            src={thumbnailUrl}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
            loading="lazy"
          />
        )}

        {/* Play icon center */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center"
            style={{
              background: 'rgba(0,0,0,0.45)',
            }}
          >
            <Play className="w-5 h-5 text-white fill-white ml-0.5" />
          </div>
        </div>

        {/* Duration badge */}
        {duration != null && duration > 0 && (
          <div
            className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded text-[10px] font-medium text-white"
            style={{
              background: 'rgba(0,0,0,0.35)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: '1px solid rgba(255,255,255,0.1)',
            }}
          >
            {formatDuration(duration)}
          </div>
        )}
      </div>

      {/* Caption */}
      {post.caption && (
        <p className="text-sm font-semibold text-foreground line-clamp-2 px-3 pt-2">
          {post.caption}
        </p>
      )}

      {/* Creator row */}
      <div className="flex items-center gap-2 px-3 py-1">
        {post.avatarUrl && (
          <img
            src={post.avatarUrl}
            alt=""
            className="w-5 h-5 rounded-full object-cover"
            loading="lazy"
          />
        )}
        <span className="text-xs text-muted-foreground truncate">
          {post.displayName}
        </span>
        <span className="text-xs text-muted-foreground">·</span>
        <span className="text-xs text-muted-foreground">{timeAgo}</span>
      </div>

      {/* Engagement */}
      <div className="text-xs text-muted-foreground px-3 pb-3 flex items-center gap-2">
        {post.likeCount > 0 && <span>♥ {post.likeCount}</span>}
        {post.commentCount > 0 && <span>💬 {post.commentCount}</span>}
      </div>
    </div>
  );
};
