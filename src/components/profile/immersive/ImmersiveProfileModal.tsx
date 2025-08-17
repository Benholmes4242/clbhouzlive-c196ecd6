import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, Volume2, VolumeX, X } from 'lucide-react';
import { useSwipeable } from 'react-swipeable';
import { SwipeCarousel } from '@/components/ui/swipe-carousel';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useVideoPlaybackManager } from '@/hooks/useVideoPlaybackManager';
import { useGlobalAudio } from '@/contexts/GlobalAudioContext';
import { supabase } from '@/integrations/supabase/client';

interface MediaItem {
  id: string;
  media_type: 'image' | 'video';
  media_url: string;
  thumbnail_url?: string;
  duration: number; // in milliseconds
  header_extended_url?: string;
  header_strip_url?: string;
  display_order: number;
}

interface ImmersiveProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  mediaItems: MediaItem[];
  profileUserId: string;
  currentIndex?: number;
  profilePhotoUrl?: string;
  displayName?: string;
  isOwnProfile?: boolean;
}

const ImmersiveProfileModal: React.FC<ImmersiveProfileModalProps> = ({
  isOpen,
  onClose,
  mediaItems = [],
  profileUserId,
  currentIndex = 0,
  profilePhotoUrl,
  displayName,
  isOwnProfile = false
}) => {
  const [activeIndex, setActiveIndex] = useState(currentIndex);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [progress, setProgress] = useState(0);
  const progressTimeoutRef = useRef<NodeJS.Timeout>();
  const sessionIdRef = useRef<string>();
  const startTimeRef = useRef<number>();
  
  const { isGloballyMuted, toggleGlobalMute } = useGlobalAudio();
  
  // Initialize session tracking
  useEffect(() => {
    if (isOpen) {
      sessionIdRef.current = `immersive_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      startTimeRef.current = Date.now();
      logTelemetryEvent('entered', { media_index: activeIndex });
    }
  }, [isOpen]);

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (progressTimeoutRef.current) {
        clearTimeout(progressTimeoutRef.current);
      }
    };
  }, []);

  // Log telemetry events
  const logTelemetryEvent = async (eventType: string, metadata: any = {}) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from('profile_immersive_telemetry').insert({
        user_id: profileUserId,
        viewer_id: user?.id || null,
        event_type: eventType,
        media_index: activeIndex,
        session_id: sessionIdRef.current,
        device_type: window.innerWidth <= 768 ? 'mobile' : 'desktop',
        duration_ms: startTimeRef.current ? Date.now() - startTimeRef.current : null,
        metadata
      });
    } catch (error) {
      console.error('Failed to log telemetry:', error);
    }
  };

  // Handle media change and auto-progress
  useEffect(() => {
    if (!isOpen || mediaItems.length === 0) return;

    const currentMedia = mediaItems[activeIndex];
    if (!currentMedia) return;

    setProgress(0);
    
    // Clear existing timeout
    if (progressTimeoutRef.current) {
      clearTimeout(progressTimeoutRef.current);
    }

    // For videos, let video player handle the progress
    if (currentMedia.media_type === 'video') {
      return;
    }

    // For images, use duration-based progress
    const duration = currentMedia.duration || 3000;
    const startTime = Date.now();
    
    const updateProgress = () => {
      const elapsed = Date.now() - startTime;
      const newProgress = Math.min((elapsed / duration) * 100, 100);
      setProgress(newProgress);
      
      if (newProgress >= 100) {
        // Auto-advance to next item
        handleNext();
      } else {
        requestAnimationFrame(updateProgress);
      }
    };

    requestAnimationFrame(updateProgress);
  }, [activeIndex, isOpen, mediaItems]);

  const handleNext = () => {
    if (isTransitioning) return;
    
    const nextIndex = activeIndex + 1;
    if (nextIndex >= mediaItems.length) {
      // End of media, close modal
      handleClose();
      return;
    }
    
    setIsTransitioning(true);
    setActiveIndex(nextIndex);
    logTelemetryEvent('media_change', { from_index: activeIndex, to_index: nextIndex });
    setTimeout(() => setIsTransitioning(false), 300);
  };

  const handlePrevious = () => {
    if (isTransitioning || activeIndex <= 0) return;
    
    setIsTransitioning(true);
    const prevIndex = activeIndex - 1;
    setActiveIndex(prevIndex);
    logTelemetryEvent('media_change', { from_index: activeIndex, to_index: prevIndex });
    setTimeout(() => setIsTransitioning(false), 300);
  };

  const handleClose = () => {
    logTelemetryEvent('exited', { duration_ms: startTimeRef.current ? Date.now() - startTimeRef.current : null });
    onClose();
  };

  // Swipe handlers
  const swipeHandlers = useSwipeable({
    onSwipedLeft: handleNext,
    onSwipedRight: handlePrevious,
    onSwipedDown: () => {
      logTelemetryEvent('swipe_return');
      handleClose();
    },
    trackMouse: false,
    trackTouch: true,
    preventScrollOnSwipe: true,
    delta: 50
  });

  // Scroll to return to profile
  const handleScrollDown = () => {
    logTelemetryEvent('scroll_return');
    handleClose();
  };

  if (!isOpen || mediaItems.length === 0) return null;

  const currentMedia = mediaItems[activeIndex];
  const headerUrl = currentMedia?.header_extended_url || currentMedia?.header_strip_url;

  return (
    <div className="fixed inset-0 z-50 bg-black">
      {/* Progress Bar */}
      <div className="absolute top-0 left-0 right-0 z-20 h-1 bg-white/20">
        <div className="flex h-full">
          {mediaItems.map((_, index) => (
            <div
              key={index}
              className="flex-1 mx-px bg-white/20 overflow-hidden"
            >
              <div
                className={cn(
                  "h-full bg-white transition-all duration-300",
                  index < activeIndex ? "w-full" : index === activeIndex ? "" : "w-0"
                )}
                style={{
                  width: index === activeIndex ? `${progress}%` : index < activeIndex ? '100%' : '0%'
                }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Close Button */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-4 right-4 z-20 text-white bg-black/50 hover:bg-black/70"
        onClick={handleClose}
      >
        <X className="h-5 w-5" />
      </Button>

      {/* Mute Toggle */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-4 left-4 z-20 text-white bg-black/50 hover:bg-black/70"
        onClick={toggleGlobalMute}
      >
        {isGloballyMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
      </Button>

      {/* Media Content */}
      <div className="relative w-full h-full" {...swipeHandlers}>
        {currentMedia && (
          <div className="absolute inset-0">
            {/* Header Strip (if available) */}
            {headerUrl && (
              <div 
                className="absolute inset-0 bg-cover bg-center bg-no-repeat filter blur-sm opacity-30"
                style={{ backgroundImage: `url(${headerUrl})` }}
              />
            )}
            
            {/* Main Media */}
            <div className="relative z-10 w-full h-full flex items-center justify-center">
              {currentMedia.media_type === 'image' ? (
                <img
                  src={currentMedia.media_url}
                  alt={`${displayName} profile media ${activeIndex + 1}`}
                  className="max-w-full max-h-full object-contain"
                />
              ) : (
                <video
                  key={currentMedia.id}
                  src={currentMedia.media_url}
                  poster={currentMedia.thumbnail_url}
                  autoPlay
                  muted={isGloballyMuted}
                  loop
                  playsInline
                  className="max-w-full max-h-full object-contain"
                  onLoadedData={() => setProgress(0)}
                  onTimeUpdate={(e) => {
                    const video = e.target as HTMLVideoElement;
                    const progress = (video.currentTime / video.duration) * 100;
                    setProgress(progress);
                  }}
                  onEnded={handleNext}
                />
              )}
            </div>
          </div>
        )}

        {/* Tap areas for navigation */}
        <div className="absolute inset-0 z-10 flex">
          <div className="flex-1" onClick={handlePrevious} />
          <div className="flex-1" onClick={handleNext} />
        </div>

        {/* Down indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-20">
          <button
            onClick={handleScrollDown}
            className="flex flex-col items-center text-white/70 hover:text-white transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center mb-2">
              <ChevronDown className="h-4 w-4" />
            </div>
            <span className="text-xs">Scroll down</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImmersiveProfileModal;