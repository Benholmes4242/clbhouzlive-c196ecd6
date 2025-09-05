import React, { useCallback, useRef, useEffect, useState } from 'react';
import { Top100Highlight } from '@/hooks/useTop100Highlights';
import { MapPin, Play, Volume2, VolumeX } from 'lucide-react';
import { format } from 'date-fns';
import { uidFromNode, generateThumbnailUrl } from '@/utils/cloudflareStreamTransform';
import { useHighlightsVideo } from './HighlightsVideoController';
import HLSVideoCard from '@/components/ui/HLSVideoCard';
import CoursePostBadge from '@/components/posts/CoursePostBadge';

interface HighlightCardWithModalProps {
  highlight: Top100Highlight;
  onOpenModal?: (postId: string) => void;
  isLandscape?: boolean;
}

const HighlightCardWithModal: React.FC<HighlightCardWithModalProps> = ({ 
  highlight, 
  onOpenModal,
  isLandscape = false
}) => {
  const primaryMedia = highlight.post_media[0];
  const createdDate = new Date(highlight.created_at);
  const videoRef = useRef<HTMLVideoElement>(null);
  
  // Use the highlights video controller for playback
  const { activeId, register, play, pause, setCardMuted, getCardMuted } = useHighlightsVideo();
  const isActive = activeId === highlight.id;
  
  // Local state for this card's mute status
  const [isCardMuted, setIsCardMuted] = useState(() => getCardMuted(highlight.id));
  
  // Extract Cloudflare Stream ID for crisp thumbnails
  const extractCloudflareStreamId = (m3u8: string) => {
    const match = /\/([a-z0-9-]{16,})\/manifest\/video\.m3u8/i.exec(m3u8);
    return match?.[1] ?? null;
  };

  // For videos, use the HLS URL directly
  const videoId = primaryMedia?.media_type === 'video' ? uidFromNode({ media_url: primaryMedia.media_url }) : null;
  const streamId = videoId ? extractCloudflareStreamId(`https://videodelivery.net/${videoId}/manifest/video.m3u8`) : null;
  
  // Use high-res Cloudflare Stream thumbnail for crisp quality
  const posterUrl = streamId 
    ? generateThumbnailUrl(streamId, { width: 640, height: 360, time: 5 })
    : null;
  
  const hlsUrl = videoId ? `https://videodelivery.net/${videoId}/manifest/video.m3u8` : null;

  // Register with video controller
  useEffect(() => {
    if (primaryMedia?.media_type === 'video') {
      register(highlight.id, videoRef.current);
    }
  }, [highlight.id, primaryMedia, register]);

  // Handle play/pause click
  const handleVideoClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (primaryMedia?.media_type === 'video') {
      if (isActive) {
        pause(highlight.id, false); // Manual pause - don't reset mute state
      } else {
        play(highlight.id);
      }
    }
  }, [primaryMedia, isActive, play, pause, highlight.id]);

  // Update local state when video becomes active/inactive
  useEffect(() => {
    const currentMuted = getCardMuted(highlight.id);
    setIsCardMuted(currentMuted);
  }, [isActive, highlight.id, getCardMuted]);

  // Handle mute/unmute toggle for this specific card
  const handleMuteToggle = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    const newMuted = !isCardMuted;
    setIsCardMuted(newMuted);
    setCardMuted(highlight.id, newMuted);
  }, [isCardMuted, highlight.id, setCardMuted]);

  // Safety check for media
  if (!primaryMedia) {
    return (
      <div className="flex-none w-80 bg-card rounded-xl overflow-hidden shadow-sm">
        <div className="relative h-48 bg-muted flex items-center justify-center">
          <span className="text-muted-foreground">No media</span>
        </div>
        <div className="p-4">
          <div className="flex items-start gap-2 mb-2">
            <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-sm truncate">{highlight.golf_course.name}</h4>
            </div>
          </div>
          {highlight.content && (
            <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
              {highlight.content}
            </p>
          )}
          <div className="text-xs text-muted-foreground">
            {format(createdDate, 'MMM d, yyyy')}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="group/highlight bg-card rounded-xl overflow-hidden shadow-sm cursor-pointer card-base card-highlights">
      <div className="relative overflow-hidden rounded-2xl card-base card-highlights" onClick={handleVideoClick}>
        {primaryMedia.media_type === 'image' ? (
          <img
            src={primaryMedia.media_url}
            alt="Golf course moment"
            className="w-full h-full object-cover object-center"
            loading="lazy"
            decoding="async"
          />
        ) : (
          <>
            {/* Active video */}
            {isActive ? (
                <HLSVideoCard
                  ref={videoRef}
                  hlsUrl={hlsUrl}
                  poster={posterUrl || undefined}
                  muted={isCardMuted}
                  autoplay={false}
                  showMuteButton={false}
                  className="w-full h-full object-cover object-center"
                />
            ) : (
              /* Video thumbnail with play overlay */
              <div className="relative w-full h-full">
                <img
                  src={posterUrl || primaryMedia.media_url}
                  alt="Video thumbnail"
                  className="w-full h-full object-cover object-center"
                  loading="lazy"
                  decoding="async"
                />
                
                {/* Play button overlay */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="rounded-full bg-white/10 backdrop-blur-2xl border border-white/20 w-5 h-5 md:w-7 md:h-7 flex items-center justify-center group-hover:bg-white/20 transition-colors">
                    <Play className="w-3 h-3 md:w-4 md:h-4 text-white ml-0.5" fill="currentColor" />
                  </div>
                </div>
              </div>
            )}
          </>
        )}
        
        {/* Golf Course Badge - Top Left */}
        {highlight.golf_course && (
          <div className="absolute top-3 left-3 z-20">
            <CoursePostBadge 
              course={{
                id: highlight.golf_course.id,
                name: highlight.golf_course.name,
                country: highlight.golf_course.country
              }}
              className="text-xs"
            />
          </div>
        )}

        {/* Top Right Controls */}
        <div className="absolute top-3 right-3 z-30 flex items-center gap-2">
          {/* Media count indicator */}
          {highlight.post_media.length > 1 && (
            <div className="bg-black/50 text-white px-2 py-1 rounded-md text-xs">
              +{highlight.post_media.length - 1} more
            </div>
          )}

        {/* Mute/Unmute Button for videos */}
        {primaryMedia.media_type === 'video' && (
          <button
            onClick={handleMuteToggle}
            className="rounded-full bg-white/10 backdrop-blur-md border border-white/20 w-8 h-8 flex items-center justify-center hover:bg-white/20 transition-all duration-200"
            aria-label={isCardMuted ? 'Unmute video' : 'Mute video'}
          >
            {isCardMuted ? (
              <VolumeX className="w-5 h-5 text-white" />
            ) : (
              <Volume2 className="w-5 h-5 text-white" />
            )}
          </button>
        )}
        </div>
      </div>
    </div>
  );
};

export default HighlightCardWithModal;