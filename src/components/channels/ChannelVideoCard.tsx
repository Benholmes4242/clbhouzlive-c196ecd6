import React, { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { MoreVertical, CheckCircle2 } from 'lucide-react';
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

const FALLBACK_THUMBNAILS = [
  '/images/mocks/thumbnails/golf-01.jpg',
  '/images/mocks/thumbnails/golf-02.jpg',
  '/images/mocks/thumbnails/golf-03.jpg',
  '/images/mocks/thumbnails/golf-04.jpg',
  '/images/mocks/thumbnails/golf-05.jpg',
];

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
  const [isHovered, setIsHovered] = useState(false);
  const [showComingSoon, setShowComingSoon] = useState(false);
  const [thumbnailError, setThumbnailError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  
  const isMock = (video as any).mock === true;
  
  const handleClick = () => {
    if (isMock) {
      setShowComingSoon(true);
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
  
  const primaryMedia = video.post_media?.[0];
  const thumbnailUrl = thumbnailError 
    ? FALLBACK_THUMBNAILS[0]
    : primaryMedia?.poster_url || 
      primaryMedia?.media_url ||
      (primaryMedia?.stream_id ? getStreamPoster(primaryMedia.media_url, '1s') : null) ||
      FALLBACK_THUMBNAILS[0];
  
  const duration = primaryMedia?.duration_seconds;
  const title = video.content || 'Untitled';
  const creator = video.user_profiles;
  const creatorName = creator?.display_name || creator?.username || 'Unknown';
  const courseName = video.post_tags?.find(tag => tag.taggable_entities?.entity_type === 'golf_club')?.taggable_entities?.name;
  
  const timeAgo = formatDistanceToNow(new Date(video.created_at), { addSuffix: true });

  return (
    <>
      <div 
        className="group flex flex-col md:flex-row gap-3 md:gap-4 cursor-pointer rounded-lg p-2 md:p-3 transition-colors"
        onClick={handleClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
      {/* Thumbnail */}
      <div className="relative w-full md:w-80 md:flex-shrink-0 aspect-video bg-muted rounded-lg overflow-hidden">
        {!imageLoaded && (
          <div className="absolute inset-0 animate-pulse bg-muted rounded-lg" />
        )}
        <img 
          src={thumbnailUrl}
          alt={title}
          className={`w-full h-full aspect-video object-cover rounded-lg ${imageLoaded ? '' : 'hidden'}`}
          loading="lazy"
          onLoad={() => setImageLoaded(true)}
          onError={() => setThumbnailError(true)}
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
    </div>

    {/* Coming Soon Dialog */}
    <Dialog open={showComingSoon} onOpenChange={setShowComingSoon}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Coming Soon</DialogTitle>
          <DialogDescription>
            Long-form creator videos are coming soon. Stay tuned!
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-end mt-4">
          <Button onClick={() => setShowComingSoon(false)}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  </>
  );
};
