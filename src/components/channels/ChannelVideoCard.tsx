import React, { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Heart } from 'lucide-react';
import { ChannelVideo } from '@/hooks/channels/useChannelsFeed';
import { getStreamPoster } from '@/utils/stream';
import { Squircle } from '@/components/ui/squircle';

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
  const handleClick = () => {
    onPlay(video);
  };
  
  const primaryMedia = video.post_media?.[0];
  
  // Thumbnail resolution chain
  const resolvedThumbnail =
    primaryMedia?.poster_url ||
    (primaryMedia?.stream_id ? getStreamPoster(primaryMedia.media_url, '1s') : undefined) ||
    primaryMedia?.media_url ||
    FALLBACK_THUMBNAIL;

  const [thumbnailUrl, setThumbnailUrl] = useState(resolvedThumbnail);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  
  const duration = primaryMedia?.duration_seconds;
  const title = video.content || 'Untitled';
  const creator = video.user_profiles;
  const creatorName = creator?.display_name || creator?.username || 'Unknown';
  
  const timeAgo = formatDistanceToNow(new Date(video.created_at), { addSuffix: true });

  return (
    <div
      className="cursor-pointer rounded-lg p-2 transition-colors"
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative w-full aspect-video bg-muted rounded-lg overflow-hidden group">
        {/* Video thumbnail */}
        {!imageLoaded && (
          <div className="absolute inset-0 animate-pulse bg-muted rounded-lg pointer-events-none" />
        )}
        <img 
          src={thumbnailUrl}
          alt={title}
          className="w-full h-full object-cover rounded-lg"
          loading="lazy"
          onLoad={() => setImageLoaded(true)}
          onError={() => setThumbnailUrl(FALLBACK_THUMBNAIL)}
        />

        {/* Dark glass overlay metadata card at bottom */}
        <div className="absolute bottom-0 left-0 right-0 px-3 pb-3 pointer-events-none">
          <div 
            className="relative backdrop-blur-md rounded-[6px] overflow-hidden transition-transform duration-200 group-hover:scale-[1.05] bg-black/35 border border-white/10"
          >
            {/* Metadata content */}
            <div className="px-4 pt-3 pb-3">
              {/* Username */}
              <div className="text-white font-medium text-body-md leading-tight mb-2">
                {creatorName}
              </div>
              
              {/* Divider line */}
              <div 
                className="w-full h-[1px] mb-2"
                style={{ background: 'rgba(255, 255, 255, 0.15)' }}
              />
              
              {/* Like count */}
              <div className="flex items-center gap-1.5">
                <Heart className="w-4 h-4" style={{ color: 'rgba(255, 255, 255, 0.7)' }} />
                <span 
                  className="text-body-md font-normal"
                  style={{ color: 'rgba(255, 255, 255, 0.7)' }}
                >
                  {formatViews(video.views_count)}
                </span>
              </div>
            </div>

            {/* Squircle profile thumbnail - overlapping top-right */}
            <div 
              className="absolute -top-4 right-3"
              style={{
                filter: 'drop-shadow(0 2px 8px rgba(0, 0, 0, 0.4))'
              }}
            >
              <Squircle width={56} height={56}>
                <img
                  src={creator?.profile_photo_url || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face'}
                  alt={creatorName}
                  className="w-full h-full object-cover"
                />
              </Squircle>
            </div>
          </div>

          {/* Duration badge - below squircle, right-aligned */}
          {duration && (
            <div 
              className="absolute -bottom-[22px] right-3 rounded px-2 py-1 text-white text-meta font-medium"
              style={{ background: 'rgba(0, 0, 0, 0.6)' }}
            >
              {formatDuration(duration)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
