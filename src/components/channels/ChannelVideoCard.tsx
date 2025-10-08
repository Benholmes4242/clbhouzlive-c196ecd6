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
  
  const primaryMedia = video.post_media?.[0];
  const thumbnailUrl = primaryMedia?.poster_url || 
    (primaryMedia?.stream_id ? getStreamPoster(primaryMedia.media_url, '1s') : null) ||
    primaryMedia?.media_url;
  
  const duration = primaryMedia?.duration_seconds;
  const title = video.content || 'Untitled';
  const creator = video.user_profiles;
  const creatorName = creator?.display_name || creator?.username || 'Unknown';
  const courseName = video.post_tags?.find(tag => tag.taggable_entities?.entity_type === 'golf_club')?.taggable_entities?.name;
  
  const timeAgo = formatDistanceToNow(new Date(video.created_at), { addSuffix: true });

  return (
    <div 
      className="group flex flex-col md:flex-row gap-3 md:gap-4 cursor-pointer hover:bg-accent/50 rounded-lg p-2 md:p-3 transition-colors"
      onClick={() => onPlay(video)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Thumbnail */}
      <div className="relative w-full md:w-80 md:flex-shrink-0 aspect-video bg-muted rounded-lg overflow-hidden">
        <img 
          src={thumbnailUrl || '/placeholder.svg'}
          alt={`${title} – ${creatorName}`}
          className="w-full h-full object-cover"
          loading="lazy"
        />
        {/* Duration overlay */}
        {duration && (
          <div 
            className="absolute bottom-2 right-2 bg-black/80 text-white text-xs font-medium px-1.5 py-0.5 rounded"
            aria-label={`duration ${Math.floor(duration / 60)} minutes ${Math.floor(duration % 60)} seconds`}
          >
            {formatDuration(duration)}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col justify-start gap-1 min-w-0">
        {/* Title */}
        <h3 className="font-semibold text-base leading-tight line-clamp-2 text-foreground">
          {title}
        </h3>

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
            <span className="bg-accent px-2 py-0.5 rounded-full">
              🏌️ {courseName}
            </span>
          </div>
        )}
      </div>

      {/* Actions menu */}
      <div className="flex md:self-start" onClick={(e) => e.stopPropagation()}>
        <DropdownMenu>
          <DropdownMenuTrigger className="p-2 hover:bg-accent rounded-full transition-colors">
            <MoreVertical className="w-5 h-5 text-muted-foreground" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>Save to playlist</DropdownMenuItem>
            <DropdownMenuItem>Share</DropdownMenuItem>
            <DropdownMenuItem className="text-destructive">Report</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};
