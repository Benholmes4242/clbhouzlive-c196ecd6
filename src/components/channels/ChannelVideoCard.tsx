import React, { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Heart } from 'lucide-react';
import { Link } from 'react-router-dom';
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
          className="relative backdrop-blur-[12px] rounded-[6px] overflow-hidden transition-transform duration-200 group-hover:scale-[1.05]"
          style={{
            background: 'rgba(25, 25, 25, 0.6)',
            boxShadow: '0 2px 6px rgba(0, 0, 0, 0.3)'
          }}
        >
          {/* Metadata content */}
          <div className="px-4 pt-3 pb-3">
            {/* Username */}
            <div className="text-white font-medium text-[14px] leading-tight mb-2">
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
                className="text-[14px] font-normal"
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
            className="absolute -bottom-[22px] right-3 rounded px-2 py-1 text-white text-[12px] font-medium"
            style={{ background: 'rgba(0, 0, 0, 0.6)' }}
          >
            {formatDuration(duration)}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {isMock ? (
        <Link
          to={`/channel/mock-${mockIndex}`}
          className="block cursor-pointer rounded-lg p-2 transition-colors"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {content}
        </Link>
      ) : (
        <div
          className="cursor-pointer rounded-lg p-2 transition-colors"
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
