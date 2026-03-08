import { PlayCircle, Pencil, MapPin } from 'lucide-react';
import type { FeedPost } from '@/components/media-system/types/media';
import { formatDuration, a11yFullDuration } from '@/utils/formatDuration';
import { cn } from '@/lib/utils';

interface CreatorFeaturedVideoProps {
  post: FeedPost | null;
  isOwnProfile: boolean;
  onEditClick?: () => void;
}

export function CreatorFeaturedVideo({ post, isOwnProfile, onEditClick }: CreatorFeaturedVideoProps) {
  // Remove debug log
  // Visitor sees nothing when no featured post
  if (!post && !isOwnProfile) return null;

  // Empty state for own profile
  if (!post) {
    return (
      <button
        type="button"
        onClick={onEditClick}
        className="w-full border-2 border-dashed border-border rounded-xl aspect-[3/1] flex flex-col items-center justify-center gap-1.5 text-muted-foreground hover:bg-muted/30 transition-colors"
      >
        <PlayCircle className="h-6 w-6" />
        <span className="text-xs font-medium">Set your featured video</span>
      </button>
    );
  }

  const firstMedia = post.mediaItems[0];
  const thumbnailUrl = firstMedia?.thumbnailUrl ?? firstMedia?.imageUrl ?? '/placeholder.svg';
  const duration = firstMedia?.duration;

  return (
    <div className="rounded-xl overflow-hidden bg-card border border-border/50 shadow-sm relative">
      {/* Header */}
      <div className="flex items-center justify-between px-3 pt-2.5 pb-1.5">
        <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-[1.5px]">
          Featured
        </span>
        {isOwnProfile && (
          <button
            type="button"
            onClick={onEditClick}
            className="h-7 w-7 flex items-center justify-center rounded-full bg-muted/60 hover:bg-muted transition-colors"
            aria-label="Change featured video"
          >
            <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
        )}
      </div>

      {/* Thumbnail */}
      <div className="relative aspect-video bg-muted">
        <img
          src={thumbnailUrl}
          alt={post.caption || 'Featured video'}
          className="absolute inset-0 w-full h-full object-cover"
          loading="lazy"
        />
        {/* Play overlay */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-11 w-11 rounded-full bg-black/50 flex items-center justify-center backdrop-blur-sm">
            <PlayCircle className="h-6 w-6 text-white" />
          </div>
        </div>
        {/* Duration badge */}
        {duration != null && duration > 0 && (
          <time
            className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/70 text-white text-[10px] font-medium"
            title={a11yFullDuration(duration)}
            aria-label={a11yFullDuration(duration)}
          >
            {formatDuration(duration)}
          </time>
        )}
      </div>

      {/* Caption + course tag + engagement */}
      <div className="px-3 pt-2 pb-3">
        {post.caption && (
          <p className="text-sm font-semibold text-foreground line-clamp-1">{post.caption}</p>
        )}
        {post.courseName && (
          <div className={cn("flex items-center gap-1", post.caption && "mt-2")}>
            <MapPin className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
            <span className="text-xs text-muted-foreground truncate">{post.courseName}</span>
          </div>
        )}
        <p className={cn("text-xs text-muted-foreground", (post.caption || post.courseName) && "mt-1")}>
          {post.likeCount > 0 && <span>{post.likeCount} likes</span>}
          {post.likeCount > 0 && post.commentCount > 0 && <span> · </span>}
          {post.commentCount > 0 && <span>{post.commentCount} comments</span>}
        </p>
      </div>
    </div>
  );
}
