import React, { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { MoreVertical, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ChannelVideo } from '@/hooks/channels/useChannelsFeed';
import { getStreamPoster } from '@/utils/stream';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

const FALLBACK_THUMBNAIL = 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=1280&q=60&auto=format';

interface ChannelVideoCardProps {
  video: ChannelVideo;
  onPlay: (video: ChannelVideo) => void;
}

const formatDuration = (seconds: number | null): string => {
  if (!seconds) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const formatViews = (count?: number): string => {
  if (!count) return '0 views';
  if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M views`;
  if (count >= 1000) return `${(count / 1000).toFixed(1)}K views`;
  return `${count} views`;
};

export const ChannelVideoCard: React.FC<ChannelVideoCardProps> = ({ video, onPlay }) => {
  const isMock = (video as any).mock === true;
  const mockIndex = (video as any).mockIndex || 0;
  
  // Diagnostics (DEV only)
  if (import.meta.env.DEV) {
    console.debug('[ChannelVideoCard] video', {
      id: video?.id,
      isMock,
      primaryMedia: video?.post_media?.[0],
      thumbnail_url: (video as any)?.thumbnail_url,
      poster_url: (video as any)?.poster_url,
    });
  }
  
  const handleClick = () => {
    if (isMock) {
      // Don't show modal, let the Link handle navigation
      return;
    } else {
      onPlay(video);
    }
  };
  
  const handleMenuAction = (action: string) => {
    // Disable actions for mock videos
    if (isMock) {
      return;
    }
    // Handle real video actions here
    console.log(`Action: ${action}`, video.id);
  };
  
  // Be generous for mocks - check both top-level and primaryMedia
  const primaryMedia = video.post_media?.[0];
  const videoWithExtras = video as any;
  
  // Greedy fallback chain: prefer explicit mock fields first
  const resolvedThumbnail =
    // Top-level mock fields
    videoWithExtras?.thumbnail_url ||
    videoWithExtras?.poster_url ||
    // Media-level fields
    primaryMedia?.poster_url ||
    (primaryMedia as any)?.thumbnail_url ||
    // If Stream, compute poster
    (primaryMedia?.stream_id ? getStreamPoster(primaryMedia.media_url, '1s') : undefined) ||
    // Fallback to media URL (often an image for mocks)
    primaryMedia?.media_url ||
    // Last resort
    FALLBACK_THUMBNAIL;

  const [thumbnailUrl, setThumbnailUrl] = useState(resolvedThumbnail);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  
  const duration = primaryMedia?.duration_seconds;
  const title = video.content || 'Untitled';
  const creator = video.user_profiles;
  const creatorName = creator?.display_name || creator?.username || 'Unknown';
  const courseName = video.post_tags?.find(tag => tag.taggable_entities?.entity_type === 'golf_club')?.taggable_entities?.name;
  
  const timeAgo = formatDistanceToNow(new Date(video.created_at), { addSuffix: true });

  const content = (
    <>
      {/* Thumbnail */}
      <div className="relative w-full md:w-80 md:flex-shrink-0 aspect-video bg-muted rounded-lg overflow-hidden">
        {!imageLoaded && (
          <div className="absolute inset-0 animate-pulse bg-muted rounded-lg pointer-events-none" />
        )}
        <img 
          src={thumbnailUrl}
          alt={title}
          className="w-full h-full aspect-video object-cover rounded-lg"
          loading="lazy"
          onLoad={() => setImageLoaded(true)}
          onError={() => setThumbnailUrl(FALLBACK_THUMBNAIL)}
        />
        {/* Duration overlay */}
        {duration && (
          <div 
            className="absolute bottom-2 right-2 rounded-md bg-[rgba(0,0,0,0.65)] text-white text-xs px-2 py-1 font-medium"
            aria-label={`duration ${Math.floor(duration / 60)} minutes ${Math.floor(duration % 60)} seconds`}
          >
            {formatDuration(duration)}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col justify-start gap-1 min-w-0">
        {/* Title row with menu */}
        <div className="flex items-start gap-2">
          <h3 className="flex-1 font-semibold text-base leading-tight line-clamp-2 text-foreground min-w-0">
            {title}
          </h3>
          
          {/* Actions menu */}
          <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
            <DropdownMenu>
              <DropdownMenuTrigger className="p-2 hover:bg-muted rounded-full transition-colors">
                <MoreVertical className="w-5 h-5 text-muted-foreground" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem 
                  onClick={() => handleMenuAction('save')}
                  disabled={isMock}
                >
                  Save to playlist
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => handleMenuAction('share')}
                  disabled={isMock}
                >
                  Share
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => handleMenuAction('report')}
                  disabled={isMock}
                  className="text-destructive"
                >
                  Report
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Creator row */}
        <div className="flex items-center gap-2 mt-1">
          <Avatar className="w-6 h-6">
            <AvatarImage src={creator?.profile_photo_url || undefined} alt={creatorName} />
            <AvatarFallback className="text-xs">
              {creatorName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <span className="font-medium">{creatorName}</span>
            {creator?.is_verified && (
              <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
            )}
          </div>
        </div>

        {/* Metadata row */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>{formatViews(video.views_count)}</span>
          <span>•</span>
          <span>{timeAgo}</span>
        </div>

        {/* Course chip */}
        {courseName && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
            <span className="bg-muted px-2.5 py-1 rounded-full text-xs">
              🏌️ {courseName}
            </span>
          </div>
        )}
      </div>
    </>
  );

  return (
    <>
      {isMock ? (
        <Link
          to={`/channel/mock-${mockIndex}`}
          className="group flex flex-col md:flex-row gap-3 md:gap-4 cursor-pointer rounded-lg p-2 md:p-3 transition-colors"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {content}
        </Link>
      ) : (
        <div
          className="group flex flex-col md:flex-row gap-3 md:gap-4 cursor-pointer rounded-lg p-2 md:p-3 transition-colors"
          onClick={handleClick}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {content}
        </div>
      )}

    </>
  );
};
