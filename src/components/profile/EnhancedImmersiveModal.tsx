import React, { useState, useEffect, useRef, useCallback } from 'react';
import { VolumeX, Volume2, ChevronDown } from 'lucide-react';
import { useSwipeable } from 'react-swipeable';
import { supabase } from '@/integrations/supabase/client';
import { useGlobalAudio } from '@/hooks/useGlobalAudio';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { Progress } from '@/components/ui/progress';
import EnhancedVideoPlayer from '@/components/ui/enhanced-video-player';
import LiquidGlassIdentityDock from './LiquidGlassIdentityDock';
import { useVideoPreloader } from '@/hooks/useVideoPreloader';

interface MediaItem {
  id: string;
  media_type: 'image' | 'video';
  media_url: string;
  thumbnail_url?: string;
  duration: number;
  display_order: number;
}

interface EnhancedImmersiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  mediaItems: MediaItem[];
  initialIndex?: number;
  userId: string;
  onCurrentIndexChange?: (index: number) => void;
}

const EnhancedImmersiveModal: React.FC<EnhancedImmersiveModalProps> = ({
  isOpen,
  onClose,
  mediaItems = [],
  initialIndex = 0,
  userId,
  onCurrentIndexChange
}) => {
  const [activeIndex, setActiveIndex] = useState(initialIndex);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isVideoPaused, setIsVideoPaused] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { isGloballyMuted, toggleGlobalMute } = useGlobalAudio();
  const { session } = useSupabaseSession();
  
  const currentItem = mediaItems[activeIndex];
  const totalItems = mediaItems.length;

  // Enhanced video preloader for instant playback
  const { isPreloaded } = useVideoPreloader({
    videos: mediaItems.filter(item => item.media_type === 'video').map(item => ({ id: item.id, url: item.media_url })),
    currentIndex: activeIndex,
    preloadCount: 2
  });

  // Handle video tap to pause/unpause - instant response
  const handleVideoTap = useCallback(() => {
    if (currentItem?.media_type === 'video' && videoRef.current) {
      if (isVideoPaused) {
        videoRef.current.play();
        setIsVideoPaused(false);
      } else {
        videoRef.current.pause();
        setIsVideoPaused(true);
      }
    }
  }, [currentItem, isVideoPaused]);

  const logTelemetryEvent = useCallback(async (event: string, data: any = {}) => {
    if (!session?.user?.id) return;
    
    try {
      // Log to console for now since user_analytics table doesn't exist
      console.log('Telemetry event:', event, data);
    } catch (error) {
      console.error('Error logging telemetry:', error);
    }
  }, [session?.user?.id]);

  const handleNext = useCallback(() => {
    if (isTransitioning) return;
    
    if (activeIndex < totalItems - 1) {
      setIsTransitioning(true);
      const nextIndex = activeIndex + 1;
      setActiveIndex(nextIndex);
      onCurrentIndexChange?.(nextIndex);
      setProgress(0);
      
      // Mobile-optimized transition
      setTimeout(() => setIsTransitioning(false), 200);
      
      logTelemetryEvent('immersive_next', {
        from_index: activeIndex,
        to_index: nextIndex,
        media_type: currentItem?.media_type
      });
    } else {
      handleClose();
    }
  }, [activeIndex, totalItems, isTransitioning, onCurrentIndexChange, currentItem, logTelemetryEvent]);

  const handleClose = useCallback(() => {
    setIsTransitioning(true);
    
    // Enhanced mobile close animation
    setTimeout(() => {
      onClose();
      setIsTransitioning(false);
    }, 250);
    
    logTelemetryEvent('immersive_close', {
      final_index: activeIndex,
      total_viewed: activeIndex + 1,
      session_duration: Date.now() - startTimeRef.current
    });
  }, [onClose, activeIndex, logTelemetryEvent]);

  // Enhanced mobile swipe gestures
  const swipeHandlers = useSwipeable({
    onSwipedDown: handleClose,
    onSwipedLeft: handleNext,
    trackMouse: false,
    preventScrollOnSwipe: true,
    delta: 50 // Reduced threshold for more responsive swiping
  });

  // Progress timer with enhanced mobile performance
  useEffect(() => {
    if (!isOpen || !currentItem || isVideoPaused) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    const duration = currentItem.duration || 5000;
    const interval = 50; // Smoother animation on mobile
    const increment = (interval / duration) * 100;

    setProgress(0);
    startTimeRef.current = Date.now();

    intervalRef.current = setInterval(() => {
      setProgress(prev => {
        const newProgress = prev + increment;
        if (newProgress >= 100) {
          handleNext();
          return 100;
        }
        return newProgress;
      });
    }, interval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [currentItem, isOpen, isVideoPaused, handleNext]);

  // Reset video pause state when activeIndex changes
  useEffect(() => {
    setIsVideoPaused(false);
  }, [activeIndex]);

  // Mobile body scroll lock with enhanced UX
  useEffect(() => {
    if (isOpen) {
      const originalStyle = window.getComputedStyle(document.body).overflow;
      document.body.style.overflow = 'hidden';
      document.body.style.touchAction = 'none'; // Prevent iOS bounce
      document.body.style.userSelect = 'none'; // Prevent text selection
      
      return () => {
        document.body.style.overflow = originalStyle;
        document.body.style.touchAction = 'auto';
        document.body.style.userSelect = 'auto';
      };
    }
  }, [isOpen]);

  if (!isOpen || !currentItem) return null;

  return (
    <div
      className={`fixed inset-0 z-50 bg-black transition-all duration-300 ${
        isTransitioning ? 'opacity-0' : 'opacity-100'
      }`}
      {...swipeHandlers}
    >
      {/* Segmented Progress Bar */}
      <div className="absolute top-0 left-0 right-0 z-20 flex gap-1 p-4 safe-area-bg">
        {mediaItems.map((_, index) => (
          <div key={index} className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden">
            <div
              className="h-full bg-white transition-all duration-100 ease-linear"
              style={{
                width: index < activeIndex ? '100%' : 
                       index === activeIndex ? `${progress}%` : '0%'
              }}
            />
          </div>
        ))}
      </div>

      {/* Enhanced Mute Button */}
      <button
        onClick={toggleGlobalMute}
        className="absolute top-6 right-6 z-20 p-3 rounded-full bg-black/40 backdrop-blur-sm border border-white/20 text-white hover:bg-black/60 transition-all duration-200"
        style={{ marginTop: 'env(safe-area-inset-top, 0)' }}
      >
        {isGloballyMuted ? (
          <VolumeX className="w-5 h-5" />
        ) : (
          <Volume2 className="w-5 h-5" />
        )}
      </button>

      {/* Enhanced Media Content */}
      <div className="absolute inset-0 flex items-center justify-center">
        {currentItem.media_type === 'video' ? (
          <div 
            className="w-full h-full cursor-pointer"
            onClick={handleVideoTap}
          >
            <EnhancedVideoPlayer
              ref={videoRef}
              src={currentItem.media_url}
              poster={currentItem.thumbnail_url}
              autoplay={true}
              muted={isGloballyMuted}
              loop={false}
              playsInline
              className="w-full h-full object-cover"
              onEnded={handleNext}
              preload={isPreloaded(currentItem.media_url) ? 'auto' : 'metadata'}
            />
          </div>
        ) : (
          <img
            src={currentItem.media_url}
            alt="Profile media"
            className="w-full h-full object-cover"
            onLoad={() => logTelemetryEvent('image_loaded', { media_id: currentItem.id })}
          />
        )}
      </div>

      {/* Enhanced Liquid Glass Identity Dock */}
      <LiquidGlassIdentityDock
        userId={userId}
        isVisible={true}
        onMorphToHeader={handleClose}
      />

      {/* Enhanced Close Button */}
      <button
        onClick={handleClose}
        className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-20 p-3 rounded-full bg-black/40 backdrop-blur-sm border border-white/20 text-white hover:bg-black/60 transition-all duration-200"
      >
        <ChevronDown className="w-6 h-6" />
      </button>
    </div>
  );
};

export default EnhancedImmersiveModal;