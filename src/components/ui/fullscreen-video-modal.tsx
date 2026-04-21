import React, { useEffect, useRef, useState, useId, useMemo } from 'react';
import { X, Volume2, VolumeX, Play, Pause } from 'lucide-react';
import { Button } from './button';
import EnhancedVideoPlayer from './enhanced-video-player';
import { MediaRuntime } from '@/media/runtime/MediaRuntime';
import SoundtrackStrip from '@/components/studio/SoundtrackStrip';
import TextOverlayRenderer from '@/components/studio/TextOverlayRenderer';
import { getFilterClass } from '@/utils/studioFilters';
import { getCropWrapperClass, getPixelLayerStyle } from '@/utils/studioEdit';
import { cn } from '@/lib/utils';
import { SquircleAvatar } from './SquircleAvatar';

interface FullscreenVideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoData: {
    src: string;
    poster?: string;
    user: {
      id: string;
      profile_photo_url?: string;
      display_name?: string;
      username?: string;
    };
    content?: string;
    studioEdit?: any | null;  // Single object for single-video modal
  } | null;
}

const FullscreenVideoModal: React.FC<FullscreenVideoModalProps> = ({
  isOpen,
  onClose,
  videoData
}) => {
  const [isMuted, setIsMuted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const mediaId = useId();

  // Detect if post has music from studioEdit - Option A enforcement
  const { postHasMusic, activeMusic } = useMemo(() => {
    const studioEdit = videoData?.studioEdit;
    const music = (studioEdit as any)?.music ?? null;
    const hasMusic = !!(music?.url || music?.r2Key);
    
    // Debug log only when playable URL exists
    if (music?.url) {
      console.log('[FullscreenVideoModal] music detected', { postHasMusic: hasMusic, activeMusic: music });
    }
    
    return { postHasMusic: hasMusic, activeMusic: music };
  }, [videoData?.studioEdit]);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  // Handle clicks outside modal
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === modalRef.current) {
      onClose();
    }
  };

  // Toggle mute - disabled when music exists (Option A)
  const toggleMute = () => {
    if (postHasMusic) return; // Option A: can't unmute video when music exists
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setIsMuted(videoRef.current.muted);
    }
  };

  // Toggle play/pause via MediaRuntime
  const togglePlayPause = () => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        MediaRuntime.requestPlay({ id: mediaId, surface: 'fullscreen', reason: 'user' });
        setIsPlaying(true);
      } else {
        MediaRuntime.requestPause({ id: mediaId, reason: 'user' });
        setIsPlaying(false);
      }
    }
  };

  if (!isOpen || !videoData) return null;

  return (
    <div 
      ref={modalRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 animate-fade-in"
      onClick={handleBackdropClick}
    >
      {/* Close button */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute right-4 z-10 text-white hover:bg-white/10"
        style={{ top: "calc(env(safe-area-inset-top, 20px) + 12px)" }}
        onClick={onClose}
      >
        <X className="h-6 w-6" />
      </Button>

      {/* Video container */}
      <div className="relative w-full h-full max-w-4xl max-h-[90vh] flex items-center justify-center">
        <div className="relative w-full h-full bg-black rounded-lg overflow-hidden">
          {/* Video player with crop/rotate/filter */}
          {(() => {
            const studioEdit = videoData.studioEdit;
            const filterClass = getFilterClass(studioEdit?.filter);
            const cropClass = getCropWrapperClass(studioEdit?.crop);
            const pixelStyle = getPixelLayerStyle(studioEdit);
            
            return (
              <div className={cn("w-full h-full", cropClass)}>
                <div className={cn("w-full h-full", filterClass)} style={pixelStyle}>
                  <video
                    ref={videoRef}
                    src={videoData.src}
                    className="w-full h-full object-contain"
                    autoPlay
                    loop
                    muted={postHasMusic ? true : isMuted}
                    playsInline
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                    onClick={togglePlayPause}
                  />
                </div>
                {/* Text overlays */}
                {studioEdit?.textOverlays?.length > 0 && (
                  <TextOverlayRenderer
                    textOverlays={studioEdit.textOverlays}
                    isEditable={false}
                    safeAreaContext="feed"
                  />
                )}
              </div>
            );
          })()}

          {/* Video controls overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30">
            {/* Top controls */}
            <div className="absolute top-4 left-4 right-16 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {/* User info */}
                <div className="flex items-center space-x-2">
                  <SquircleAvatar
                    src={videoData.user.profile_photo_url}
                    alt={videoData.user.display_name || videoData.user.username || 'User'}
                    userId={videoData.user.id}
                    size={40}
                    hideRing
                  />
                  <span className="text-white font-medium">
                    {videoData.user.display_name || videoData.user.username}
                  </span>
                </div>
              </div>

              {/* Volume control - hidden when music exists (Option A) */}
              {!postHasMusic && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-white/10"
                  onClick={toggleMute}
                >
                  {isMuted ? (
                    <VolumeX className="h-5 w-5" />
                  ) : (
                    <Volume2 className="h-5 w-5" />
                  )}
                </Button>
              )}
            </div>

            {/* Center play/pause button */}
            <div className="absolute inset-0 flex items-center justify-center">
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/10 w-16 h-16 rounded-full bg-black/30 opacity-0 hover:opacity-100 transition-opacity"
                onClick={togglePlayPause}
              >
                {isPlaying ? (
                  <Pause className="h-8 w-8" />
                ) : (
                  <Play className="h-8 w-8 ml-1" />
                )}
              </Button>
            </div>

            {/* Bottom content */}
            {videoData.content && (
              <div className="absolute bottom-4 left-4 right-4">
                <p className="text-white text-sm leading-relaxed">
                  {videoData.content}
                </p>
              </div>
            )}
          </div>
          
          {/* SoundtrackStrip for music posts - Option A: music controls audio */}
          {activeMusic && (
            <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-50 max-w-[240px]">
              <SoundtrackStrip 
                music={{
                  trackId: activeMusic.trackId || '',
                  title: activeMusic.title || 'Unknown Track',
                  artist: activeMusic.artist,
                  r2Key: activeMusic.r2Key,
                  url: activeMusic.url,
                  startAt: activeMusic.startAt,
                  volume: activeMusic.volume
                }}
                variant="published"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FullscreenVideoModal;