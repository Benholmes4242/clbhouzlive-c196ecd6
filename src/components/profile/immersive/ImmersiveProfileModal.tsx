import React, { useState, useEffect, useRef, useCallback } from 'react';
import { VolumeX, Volume2, ChevronDown } from 'lucide-react';
import { useSwipeable } from 'react-swipeable';
import { supabase } from '@/integrations/supabase/client';
import { useGlobalAudio } from '@/hooks/useGlobalAudio';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';

interface MediaItem {
  id: string;
  media_type: 'image' | 'video';
  media_url: string;
  thumbnail_url?: string;
  duration: number;
  display_order: number;
  header_extended_url?: string;
  header_strip_url?: string;
  header_metadata?: any;
  video_method?: string;
  file_name?: string;
  created_at: string;
}

interface ImmersiveProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  mediaItems: MediaItem[];
  initialIndex?: number;
  userId: string;
  onCurrentIndexChange?: (index: number) => void;
}

const ImmersiveProfileModal: React.FC<ImmersiveProfileModalProps> = ({
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
  const [sessionId] = useState(() => `immersive_session_${Date.now()}`);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);
  const { isGloballyMuted, toggleGlobalMute } = useGlobalAudio();
  const { session } = useSupabaseSession();
  
  const currentItem = mediaItems[activeIndex];
  const totalItems = mediaItems.length;

  // Liquid glass styles for buttons
  const liquidGlassStyle = {
    background: 'rgba(255, 255, 255, 0.1)',
    backdropFilter: 'blur(20px) saturate(1.8)',
    WebkitBackdropFilter: 'blur(20px) saturate(1.8)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37), inset 0 1px 0 rgba(255, 255, 255, 0.3)',
  };

  const logTelemetryEvent = useCallback(async (event: string, data: any = {}) => {
    if (!session?.user?.id) return;
    
    try {
      await supabase.from('profile_immersive_telemetry').insert({
        user_id: userId,
        viewer_id: session.user.id,
        session_id: sessionId,
        event_type: event,
        media_index: activeIndex,
        metadata: {
          ...data,
          total_items: totalItems,
          is_own_profile: session.user.id === userId,
          media_id: currentItem?.id
        }
      });
    } catch (error) {
      console.error('Telemetry logging failed:', error);
    }
  }, [session?.user?.id, userId, sessionId, currentItem?.id, activeIndex, totalItems]);

  // Progress timer for current media
  useEffect(() => {
    if (!isOpen || !currentItem || isTransitioning) return;

    const duration = currentItem.media_type === 'image' ? 3000 : currentItem.duration;
    startTimeRef.current = Date.now();
    setProgress(0);

    const updateProgress = () => {
      const elapsed = Date.now() - startTimeRef.current;
      const newProgress = Math.min((elapsed / duration) * 100, 100);
      setProgress(newProgress);

      if (newProgress >= 100) {
        handleNext();
      }
    };

    intervalRef.current = setInterval(updateProgress, 50);
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [activeIndex, currentItem, isOpen, isTransitioning]);

  const handleNext = useCallback(() => {
    if (isTransitioning) return;
    
    if (activeIndex >= totalItems - 1) {
      // Auto-fade and close when reaching the end
      handleClose();
      return;
    }

    setIsTransitioning(true);
    const nextIndex = activeIndex + 1;
    
    setTimeout(() => {
      setActiveIndex(nextIndex);
      onCurrentIndexChange?.(nextIndex);
      setProgress(0);
      setIsTransitioning(false);
    }, 150);
  }, [activeIndex, totalItems, isTransitioning, onCurrentIndexChange]);

  const handleClose = useCallback(() => {
    // Smooth fade-out transition
    const modal = document.getElementById('immersive-modal');
    if (modal) {
      modal.style.transition = 'opacity 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
      modal.style.opacity = '0';
      setTimeout(() => {
        onClose();
      }, 800);
    } else {
      onClose();
    }
  }, [onClose]);

  // Swipe handlers
  const swipeHandlers = useSwipeable({
    onSwipedDown: handleClose,
    trackMouse: false,
    trackTouch: true,
    preventScrollOnSwipe: true,
    delta: 50
  });

  // Lock scroll and hide nav on mobile
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      
      const isMobile = window.innerWidth < 768;
      if (isMobile) {
        document.body.style.position = 'fixed';
        document.body.style.width = '100%';
        document.body.style.top = '0';
      }
      
      return () => {
        document.body.style.overflow = '';
        document.body.style.position = '';
        document.body.style.width = '';
        document.body.style.top = '';
      };
    }
  }, [isOpen]);

  if (!isOpen || !currentItem) return null;

  return (
    <div
      id="immersive-modal"
      className="fixed inset-0 z-[100] bg-black"
      {...swipeHandlers}
    >
      {/* Segmented Progress Bar */}
      <div className="absolute top-0 left-0 right-0 z-20 flex gap-1 p-4">
        {mediaItems.map((_, index) => (
          <div key={index} className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden">
            <div
              className="h-full bg-white transition-all duration-75 ease-linear rounded-full"
              style={{
                width: index < activeIndex ? '100%' : 
                       index === activeIndex ? `${progress}%` : '0%'
              }}
            />
          </div>
        ))}
      </div>

      {/* Mute Button - Top Right */}
      <button
        onClick={toggleGlobalMute}
        className="absolute top-4 right-4 z-20 w-12 h-12 rounded-full transition-all duration-300 hover:scale-105"
        style={liquidGlassStyle}
      >
        {isGloballyMuted ? (
          <VolumeX className="w-6 h-6 text-white mx-auto" />
        ) : (
          <Volume2 className="w-6 h-6 text-white mx-auto" />
        )}
      </button>

      {/* Media Content */}
      <div className="absolute inset-0 flex items-center justify-center">
        {currentItem.media_type === 'video' ? (
          <video
            key={`${currentItem.id}-${activeIndex}`}
            src={currentItem.media_url}
            poster={currentItem.thumbnail_url}
            className="w-full h-full object-cover"
            autoPlay
            muted={isGloballyMuted}
            playsInline
            onLoadedData={() => {
              startTimeRef.current = Date.now();
            }}
          />
        ) : (
          <img
            key={`${currentItem.id}-${activeIndex}`}
            src={currentItem.media_url}
            alt="Profile media"
            className="w-full h-full object-cover"
            onLoad={() => {
              startTimeRef.current = Date.now();
            }}
          />
        )}
      </div>

      {/* Down Arrow - Bottom Center */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-20">
        <button
          onClick={handleClose}
          className="w-12 h-12 rounded-full transition-all duration-300 hover:scale-105 animate-bounce"
          style={liquidGlassStyle}
        >
          <ChevronDown className="w-6 h-6 text-white mx-auto" />
        </button>
      </div>
    </div>
  );
};

export default ImmersiveProfileModal;