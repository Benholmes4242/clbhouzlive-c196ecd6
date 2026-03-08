import { Pin, Heart, Pencil } from 'lucide-react';
import type { FeedPost } from '@/components/media-system/types/media';
import { formatDuration, a11yFullDuration } from '@/utils/formatDuration';
import { cn } from '@/lib/utils';

interface CreatorPinnedPostsProps {
  posts: FeedPost[];
  isOwnProfile: boolean;
  onEditClick?: () => void;
}

export function CreatorPinnedPosts({ posts, isOwnProfile, onEditClick }: CreatorPinnedPostsProps) {
  if (posts.length === 0 && !isOwnProfile) return null;

  if (posts.length === 0) {
    return (
      <button
        type="button"
        onClick={onEditClick}
        className="w-full py-3 text-xs text-muted-foreground text-center hover:text-foreground transition-colors"
      >
        Pin up to 3 of your best posts
      </button>
    );
  }

  return (
    <div className="space-y-1.5">
      {/* Header */}
      <div className="flex items-center justify-between px-0.5">
        <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-[1.5px]">
          Pinned
        </span>
        {isOwnProfile && (
          <button
            type="button"
            onClick={onEditClick}
            className="text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Edit
          </button>
        )}
      </div>

      {/* Horizontal scroll */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide">
        {posts.map((post) => {
          const firstMedia = post.mediaItems[0];
          const thumb = firstMedia?.thumbnailUrl ?? firstMedia?.imageUrl ?? '/placeholder.svg';
          const isVideo = firstMedia?.type === 'video';
          const duration = firstMedia?.duration;

          return (
            <button
              key={post.id}
              type="button"
              className="w-[120px] shrink-0 rounded-lg overflow-hidden relative bg-muted"
              onClick={() => {/* Navigation handled later */}}
            >
              <div className="aspect-[4/5] relative">
                <img
                  src={thumb}
                  alt={post.caption || 'Pinned post'}
                  className="absolute inset-0 w-full h-full object-cover"
                  loading="lazy"
                />

                {/* Pin icon */}
                <div className="absolute top-1.5 left-1.5 h-5 w-5 rounded-full bg-black/50 flex items-center justify-center">
                  <Pin className="h-2.5 w-2.5 text-white" />
                </div>

                {/* Duration badge */}
                {isVideo && duration != null && duration > 0 && (
                  <time
                    className="absolute bottom-1.5 right-1.5 px-1 py-0.5 rounded bg-black/70 text-white text-[9px] font-medium"
                    title={a11yFullDuration(duration)}
                    aria-label={a11yFullDuration(duration)}
                  >
                    {formatDuration(duration)}
                  </time>
                )}

                {/* Engagement */}
                {post.likeCount > 0 && (
                  <div className="absolute bottom-1.5 left-1.5 flex items-center gap-0.5 text-white text-[9px] font-medium drop-shadow-sm">
                    <Heart className="h-2.5 w-2.5 fill-white" />
                    {post.likeCount}
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
