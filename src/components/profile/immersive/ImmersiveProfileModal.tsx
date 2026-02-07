import React, { useState, useEffect, useRef, useCallback, useId } from 'react';
import { VolumeX, Volume2, ChevronDown, Check, Upload, Edit, Trash2 } from 'lucide-react';
import { useSwipeable } from 'react-swipeable';
import { supabase } from '@/integrations/supabase/client';
import { useGlobalAudio } from '@/contexts/GlobalAudioContext';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { Progress } from '@/components/ui/progress';
import { useCloudflareStream } from '@/hooks/useCloudflareStream';
import EnhancedVideoPlayer from '@/components/ui/enhanced-video-player';
import ImmersiveIdentityDock from './ImmersiveIdentityDock';
import { uploadToR2Only } from '@/utils/r2OnlyUpload';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useVideoProgressSync } from '@/hooks/useVideoProgressSync';
import { useVideoPreloader } from '@/hooks/useVideoPreloader';
import { USE_VIDEO_PROGRESS_SYNC_V1 } from '@/utils/featureFlags';
import { MediaRuntime } from '@/media/runtime/MediaRuntime';

import { MediaItem } from '@/types/media';

interface LocalMediaItem {
  id: string;
  media_type: 'video' | 'image';
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
  isUploading?: boolean;
  uploadProgress?: number;
  isComplete?: boolean;
}

interface ImmersiveProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMorphToHeader?: () => void;
  mediaItems: LocalMediaItem[];
  initialIndex?: number;
  userId: string;
  onCurrentIndexChange?: (index: number) => void;
  uploadMode?: boolean;
  onUploadComplete?: (mediaItem: LocalMediaItem) => void;
}

const ImmersiveProfileModal: React.FC<ImmersiveProfileModalProps> = ({
  isOpen,
  onClose,
  onMorphToHeader,
  mediaItems = [],
  initialIndex = 0,
  userId,
  onCurrentIndexChange,
  uploadMode = false,
  onUploadComplete
}) => {
  const [activeIndex, setActiveIndex] = useState(initialIndex);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [sessionId] = useState(() => `immersive_session_${Date.now()}`);
  const [localMediaItems, setLocalMediaItems] = useState<LocalMediaItem[]>(mediaItems);
  const [isVideoPaused, setIsVideoPaused] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaId = useId();
  const { isGloballyMuted, toggleGlobalMute } = useGlobalAudio();
  
  // Video progress sync hook
  const { progress: syncedProgress, segmentProgress } = useVideoProgressSync(
    videoRef.current,
    { totalSegments: localMediaItems.length }
  );

  const { isPreloaded, promotePreload } = useVideoPreloader(localMediaItems, activeIndex, { maxPreloadItems: 1 });
  
  // Enhanced mobile animations
  const [isMobileTransitioning, setIsMobileTransitioning] = useState(false);
  const { session } = useSupabaseSession();
  const { uploadVideo } = useCloudflareStream();
  const { toast } = useToast();
  
  const currentItem = localMediaItems[activeIndex];
  const totalItems = localMediaItems.length;

  // Check if this is the current user's profile media
  const isOwnMedia = session?.user?.id === userId;

  // Update local media items when props change
  useEffect(() => {
    setLocalMediaItems(mediaItems);
  }, [mediaItems]);

  // DEBUG: Log when ImmersiveProfileModal is rendered
  useEffect(() => {
    if (isOpen) {
      console.log('🚨 IMMERSIVE PROFILE MODAL RENDERED!', {
        userId,
        mediaItems: localMediaItems.length,
        activeIndex,
        currentItem: currentItem?.id,
        uploadMode
      });
    }
  }, [isOpen, userId, localMediaItems.length, activeIndex, currentItem?.id, uploadMode]);

  // Video preloading for instant playback
  useEffect(() => {
    if (currentItem?.media_type === 'video' && activeIndex < totalItems - 1) {
      const nextItem = localMediaItems[activeIndex + 1];
      if (nextItem?.media_type === 'video') {
        // Preload next video
        const preloadVideo = document.createElement('video');
        preloadVideo.src = nextItem.media_url;
        preloadVideo.preload = 'auto';
        preloadVideo.muted = true;
        preloadVideo.playsInline = true;
      }
    }
  }, [activeIndex, currentItem, localMediaItems, totalItems]);

  // Liquid glass styles for buttons
  const liquidGlassStyle = {
    background: 'rgba(255, 255, 255, 0.1)',
    backdropFilter: 'blur(20px) saturate(1.8)',
    WebkitBackdropFilter: 'blur(20px) saturate(1.8)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37), inset 0 1px 0 rgba(255, 255, 255, 0.3)',
  };

  // Handle video tap to pause/unpause - route through MediaRuntime
  const handleVideoTap = useCallback(() => {
    if (currentItem?.media_type === 'video') {
      if (isVideoPaused) {
        MediaRuntime.requestPlay({ id: mediaId, surface: 'fullscreen', reason: 'user' });
        setIsVideoPaused(false);
      } else {
        MediaRuntime.requestPause({ id: mediaId, reason: 'user' });
        setIsVideoPaused(true);
      }
    }
  }, [currentItem, isVideoPaused, mediaId]);

  // Handle media deletion
  const handleDeleteMedia = useCallback(async () => {
    if (!currentItem || !session?.user?.id) return;
    
    const confirmed = window.confirm('Are you sure you want to delete this media?');
    if (!confirmed) return;

    try {
      const { error } = await supabase
        .from('profile_media')
        .delete()
        .eq('id', currentItem.id)
        .eq('user_id', userId); // Ensure user can only delete their own media

      if (error) throw error;

      // Remove from local state
      const newMediaItems = localMediaItems.filter(item => item.id !== currentItem.id);
      setLocalMediaItems(newMediaItems);

      // Adjust active index if necessary
      if (activeIndex >= newMediaItems.length && newMediaItems.length > 0) {
        setActiveIndex(newMediaItems.length - 1);
      } else if (newMediaItems.length === 0) {
        // If no media left, close the modal
        onClose();
        return;
      }

      toast({
        title: "Media deleted",
        description: "The media has been successfully deleted.",
      });

    } catch (error) {
      console.error('Error deleting media:', error);
      toast({
        title: "Error",
        description: "Failed to delete media. Please try again.",
        variant: "destructive",
      });
    }
  }, [currentItem, session?.user?.id, userId, localMediaItems, activeIndex, onClose, toast]);

  // Handle edit media (placeholder for future implementation)
  const handleEditMedia = useCallback(() => {
    console.log('Edit media:', currentItem?.id);
    toast({
      title: "Coming soon",
      description: "Media editing will be available soon!",
    });
  }, [currentItem?.id, toast]);

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

  const handleNext = useCallback(() => {
    if (isTransitioning) return;
    
    if (activeIndex >= totalItems - 1) {
      // Enhanced mobile fade and close
      setIsMobileTransitioning(true);
      const modal = document.getElementById('immersive-modal');
      if (modal) {
        const isMobile = window.innerWidth < 768;
        modal.style.transition = isMobile 
          ? 'opacity 0.4s ease-out, transform 0.4s ease-out' 
          : 'opacity 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
        modal.style.opacity = '0';
        if (isMobile) {
          modal.style.transform = 'translateY(20px)';
        }
        setTimeout(() => {
          onClose();
        }, isMobile ? 400 : 800);
      } else {
        onClose();
      }
      return;
    }

    setIsTransitioning(true);
    setIsMobileTransitioning(true);
    const nextIndex = activeIndex + 1;
    
    // Faster transitions on mobile
    const transitionDuration = window.innerWidth < 768 ? 100 : 150;
    
    setTimeout(() => {
      setActiveIndex(nextIndex);
      onCurrentIndexChange?.(nextIndex);
      setProgress(0);
      setIsTransitioning(false);
      setIsMobileTransitioning(false);
    }, transitionDuration);
  }, [activeIndex, totalItems, isTransitioning, onCurrentIndexChange, onClose]);

  // Upload functionality
  const handleFileUpload = useCallback(async (file: File) => {
    if (!session?.user?.id) return;

    const tempId = `temp_${Date.now()}`;
    
    // Only accept video files
    if (!file.type.startsWith('video/')) {
      toast({
        title: "Invalid file type",
        description: "Only videos are allowed for immersive media.",
        variant: "destructive",
      });
      return;
    }
    
    // Create temporary media item
    const tempMediaItem: LocalMediaItem = {
      id: tempId,
      media_type: 'video',
      media_url: URL.createObjectURL(file),
      duration: 30000, // Default duration, will be updated after upload
      display_order: localMediaItems.length,
      created_at: new Date().toISOString(),
      isUploading: true,
      uploadProgress: 0
    };

    // Add to local state
    setLocalMediaItems(prev => [...prev, tempMediaItem]);
    setActiveIndex(localMediaItems.length);

    try {
      let uploadResult;
      
      uploadResult = await uploadVideo(file);
      
      // Update progress during upload
      setLocalMediaItems(prev => prev.map(item => 
        item.id === tempId ? { ...item, uploadProgress: 75 } : item
      ));

      if (uploadResult.success) {
        // Save to database
        const { data, error } = await supabase
          .from('profile_media')
          .insert({
            user_id: userId,
            media_type: 'video',
            media_url: uploadResult.urls?.hls || uploadResult.videoId,
            thumbnail_url: uploadResult.thumbnail,
            duration: 30000, // Default video duration
            display_order: localMediaItems.length,
            video_method: 'cloudflare_stream',
            is_immersive: true
          })
          .select()
          .single();

        if (error) throw error;

        // Update with final data
        const finalMediaItem: LocalMediaItem = {
          id: data.id,
          media_type: 'video',
          media_url: data.media_url,
          thumbnail_url: data.thumbnail_url,
          duration: data.duration || 30000,
          display_order: data.display_order,
          header_extended_url: data.header_extended_url,
          header_strip_url: data.header_strip_url,
          header_metadata: data.header_metadata,
          video_method: data.video_method,
          file_name: data.file_name,
          created_at: data.created_at,
          isUploading: false,
          uploadProgress: 100,
          isComplete: true
        };

        setLocalMediaItems(prev => prev.map(item => 
          item.id === tempId ? finalMediaItem : item
        ));

        // Show complete state for 2 seconds, then continue
        setTimeout(() => {
          setLocalMediaItems(prev => prev.map(item => 
            item.id === tempId ? { ...item, isComplete: false } : item
          ));
          onUploadComplete?.(finalMediaItem);
        }, 2000);

      } else {
        throw new Error(uploadResult.error || 'Upload failed');
      }

    } catch (error) {
      console.error('Upload failed:', error);
      // Remove failed upload
      setLocalMediaItems(prev => prev.filter(item => item.id !== tempId));
    }
  }, [session?.user?.id, userId, localMediaItems.length, uploadVideo, onUploadComplete]);

  // File input handler
  const handleFileInputChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  }, [handleFileUpload]);

  // Progress timer for current media - only start when media is actually ready
  useEffect(() => {
    if (!isOpen || !currentItem || isTransitioning || currentItem.isUploading) return;

    // Videos will use onEnded callback for auto-advance, no timer needed
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isOpen, currentItem, isTransitioning, handleNext]);

  // Reset video pause state when changing media
  useEffect(() => {
    setIsVideoPaused(false);
  }, [activeIndex]);

  const handleClose = useCallback(() => {
    // Enhanced mobile fade-out transition
    setIsMobileTransitioning(true);
    const modal = document.getElementById('immersive-modal');
    if (modal) {
      const isMobile = window.innerWidth < 768;
      modal.style.transition = isMobile 
        ? 'opacity 0.4s ease-out, transform 0.4s ease-out' 
        : 'opacity 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
      modal.style.opacity = '0';
      if (isMobile) {
        modal.style.transform = 'translateY(20px)';
      }
      setTimeout(() => {
        onClose();
      }, isMobile ? 400 : 800);
    } else {
      onClose();
    }
  }, [onClose]);

  // Swipe handlers - moved after handleClose definition
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
      className="fixed inset-0 z-[99] bg-black"
      data-immersive-modal="true"
      {...swipeHandlers}
    >
      {/* Segmented Progress Bar */}
      <div className="absolute top-0 left-0 right-0 z-20 flex gap-1 p-4">
        {localMediaItems.map((item, index) => (
          <div key={index} className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-75 ease-linear rounded-full ${
                item.isUploading 
                  ? 'bg-green-500' 
                  : item.isComplete 
                    ? 'bg-green-500' 
                    : 'bg-white'
              }`}
              style={{
                width: item.isUploading 
                  ? `${item.uploadProgress || 0}%`
                  : USE_VIDEO_PROGRESS_SYNC_V1 && index === activeIndex && segmentProgress.length > 0
                    ? `${segmentProgress[index] * 100}%`
                    : index < activeIndex 
                      ? '100%' 
                      : index === activeIndex 
                        ? USE_VIDEO_PROGRESS_SYNC_V1 ? `${syncedProgress}%` : `${progress}%`
                        : '0%'
              }}
            />
          </div>
        ))}
      </div>

      {/* Mute Button - Top Right */}
      <button
        onClick={toggleGlobalMute}
        className="absolute top-8 right-4 z-20 w-8 h-8 rounded-full transition-all duration-300 hover:scale-105 flex items-center justify-center p-1"
        style={liquidGlassStyle}
      >
        {isGloballyMuted ? (
          <VolumeX className="w-4 h-4 text-white" />
        ) : (
          <Volume2 className="w-4 h-4 text-white" />
        )}
      </button>


      {/* Media Content */}
      <div className="absolute inset-0 flex items-center justify-center" onClick={handleVideoTap}>

        {currentItem.media_type === 'video' ? (
          <EnhancedVideoPlayer
            ref={videoRef}
            src={currentItem.media_url}
            autoplay={true}
            muted={isGloballyMuted}
            loop={false} // Disable loop so video can end and trigger onEnded
            enableHLS={true}
            className="w-full h-full"
            onPlay={() => {
              setIsVideoPaused(false);
              // Progress is now handled by useVideoProgressSync hook
            }}
            onPause={() => setIsVideoPaused(true)}
            onEnded={() => {
              // Clear any existing timer
              if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
              }
              // Auto-advance to next video
              handleNext();
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

        {/* Upload Progress Overlay */}
        {currentItem.isUploading && (
          <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center text-white z-30">
            <div className="w-3/4 max-w-sm space-y-4">
              <Progress 
                value={currentItem.uploadProgress || 0} 
                className="h-3 bg-white/20"
              />
              <div className="text-center space-y-2">
                <div className="flex items-center justify-center gap-2">
                  <Upload className="w-5 h-5 animate-pulse" />
                  <p className="text-lg font-medium">Uploading...</p>
                </div>
                <p className="text-sm text-white/80">
                  {currentItem.uploadProgress?.toFixed(0) || 0}%
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Upload Complete Overlay */}
        {currentItem.isComplete && (
          <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center text-white z-30">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto">
                <Check className="w-8 h-8 text-white" />
              </div>
              <p className="text-lg font-medium">Upload Complete!</p>
            </div>
          </div>
        )}
      </div>

      {/* Enhanced Liquid Glass Identity Dock */}
      <ImmersiveIdentityDock 
        userId={userId}
        isVisible={isOpen && !currentItem.isUploading}
        onMorphToHeader={onMorphToHeader || handleClose}
      />

      {/* Down Arrow - Bottom Center */}
      <div
        className="absolute left-1/2 transform -translate-x-1/2 z-20"
        style={{ bottom: 'calc(var(--bottom-nav-height) + 8px)' }}
      >
        <button
          onClick={handleClose}
          className="w-8 h-8 rounded-full transition-all duration-300 hover:scale-105 animate-[bounce_1.5s_ease-in-out_infinite] p-0"
          style={liquidGlassStyle}
          aria-label="Close immersive"
          title="Close"
        >
          <ChevronDown className="w-4 h-4 text-white mx-auto" />
        </button>
      </div>
    </div>
  );
};

export default ImmersiveProfileModal;