import React, { useState, useEffect, useRef, useCallback } from 'react';
import { VolumeX, Volume2, ChevronDown, Check, Upload } from 'lucide-react';
import { useSwipeable } from 'react-swipeable';
import { supabase } from '@/integrations/supabase/client';
import { useGlobalAudio } from '@/hooks/useGlobalAudio';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { Progress } from '@/components/ui/progress';
import { useCloudflareStream } from '@/hooks/useCloudflareStream';
import EnhancedVideoPlayer from '@/components/ui/enhanced-video-player';
import ImmersiveIdentityDock from './ImmersiveIdentityDock';
// import { useR2Upload } from '@/hooks/useR2Upload';

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
  isUploading?: boolean;
  uploadProgress?: number;
  isComplete?: boolean;
}

interface ImmersiveProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  mediaItems: MediaItem[];
  initialIndex?: number;
  userId: string;
  onCurrentIndexChange?: (index: number) => void;
  uploadMode?: boolean;
  onUploadComplete?: (mediaItem: MediaItem) => void;
}

const ImmersiveProfileModal: React.FC<ImmersiveProfileModalProps> = ({
  isOpen,
  onClose,
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
  const [localMediaItems, setLocalMediaItems] = useState<MediaItem[]>(mediaItems);
  const [isVideoPaused, setIsVideoPaused] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { isGloballyMuted, toggleGlobalMute } = useGlobalAudio();
  const { session } = useSupabaseSession();
  const { uploadVideo } = useCloudflareStream();
  
  const currentItem = localMediaItems[activeIndex];
  const totalItems = localMediaItems.length;

  // Update local media items when props change
  useEffect(() => {
    setLocalMediaItems(mediaItems);
  }, [mediaItems]);

  // Liquid glass styles for buttons
  const liquidGlassStyle = {
    background: 'rgba(255, 255, 255, 0.1)',
    backdropFilter: 'blur(20px) saturate(1.8)',
    WebkitBackdropFilter: 'blur(20px) saturate(1.8)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37), inset 0 1px 0 rgba(255, 255, 255, 0.3)',
  };

  // Handle video tap to pause/unpause
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
      // Auto-fade and close when reaching the end
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
  }, [activeIndex, totalItems, isTransitioning, onCurrentIndexChange, onClose]);

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

  // Upload functionality
  const handleFileUpload = useCallback(async (file: File) => {
    if (!session?.user?.id) return;

    const tempId = `temp_${Date.now()}`;
    const isVideo = file.type.startsWith('video/');
    
    // Create temporary media item
    const tempMediaItem: MediaItem = {
      id: tempId,
      media_type: isVideo ? 'video' : 'image',
      media_url: URL.createObjectURL(file),
      duration: Math.round(isVideo ? 30000 : 3000), // Ensure integer value
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
      
      if (isVideo) {
        uploadResult = await uploadVideo(file);
        
        // Update progress during upload
        setLocalMediaItems(prev => prev.map(item => 
          item.id === tempId ? { ...item, uploadProgress: 75 } : item
        ));
      } else {
        // For images, simulate progress and use a simple upload
        setLocalMediaItems(prev => prev.map(item => 
          item.id === tempId ? { ...item, uploadProgress: 50 } : item
        ));
        
        // Create form data for image upload
        const fileName = `${userId}/${Date.now()}-${file.name}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('profile-media')
          .upload(fileName, file);
          
        if (uploadError) {
          console.error('Storage upload error:', uploadError);
          throw uploadError;
        }
        
        const { data: { publicUrl } } = supabase.storage
          .from('profile-media')
          .getPublicUrl(uploadData.path);
          
        uploadResult = {
          success: true,
          url: publicUrl
        };
        
        // Update progress to 100%
        setLocalMediaItems(prev => prev.map(item => 
          item.id === tempId ? { ...item, uploadProgress: 100 } : item
        ));
      }

      if (uploadResult.success) {
        // Save to database
        const { data, error } = await supabase
          .from('profile_media')
          .insert({
            user_id: userId,
            media_type: isVideo ? 'video' : 'image',
            media_url: isVideo ? (uploadResult.urls?.hls || uploadResult.videoId) : uploadResult.url,
            thumbnail_url: isVideo ? uploadResult.thumbnail : undefined,
            duration: Math.round(isVideo ? 30000 : 3000), // Ensure integer value
            display_order: localMediaItems.length,
            video_method: isVideo ? 'cloudflare_stream' : undefined,
            is_immersive: true
          })
          .select()
          .single();

        if (error) throw error;

        // Update with final data
        const finalMediaItem: MediaItem = {
          id: data.id,
          media_type: data.media_type as 'image' | 'video',
          media_url: data.media_url,
          thumbnail_url: data.thumbnail_url,
          duration: data.duration || (isVideo ? 30000 : 3000),
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

  // Progress timer for current media
  useEffect(() => {
    if (!isOpen || !currentItem || isTransitioning || currentItem.isUploading || isVideoPaused) return;

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
  }, [activeIndex, currentItem, isOpen, isTransitioning, handleNext, isVideoPaused]);

  // Reset video pause state when changing media
  useEffect(() => {
    setIsVideoPaused(false);
  }, [activeIndex]);

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
                  : index < activeIndex 
                    ? '100%' 
                    : index === activeIndex 
                      ? `${progress}%` 
                      : '0%'
              }}
            />
          </div>
        ))}
      </div>

      {/* Mute Button - Top Right */}
      <button
        onClick={toggleGlobalMute}
        className="absolute top-8 right-4 z-20 w-10 h-10 rounded-full transition-all duration-300 hover:scale-105 flex items-center justify-center p-1"
        style={liquidGlassStyle}
      >
        {isGloballyMuted ? (
          <VolumeX className="w-5 h-5 text-white" />
        ) : (
          <Volume2 className="w-5 h-5 text-white" />
        )}
      </button>

      {/* Media Content */}
      <div className="absolute inset-0 flex items-center justify-center" onClick={handleVideoTap}>
        {currentItem.media_type === 'video' ? (
          <EnhancedVideoPlayer
            key={`${currentItem.id}-${activeIndex}`}
            src={currentItem.media_url}
            poster={currentItem.thumbnail_url}
            autoplay={true}
            muted={!isGloballyMuted}
            loop={true}
            enableHLS={true}
            className="w-full h-full"
            onPlay={() => setIsVideoPaused(false)}
            onPause={() => setIsVideoPaused(true)}
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

      {/* Identity Dock */}
      <ImmersiveIdentityDock 
        userId={userId}
        isVisible={isOpen && !currentItem.isUploading}
        onMorphToHeader={handleClose}
      />

      {/* Down Arrow - Bottom Center */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-20">
        <button
          onClick={handleClose}
          className="w-10 h-10 rounded-full transition-all duration-300 hover:scale-105 animate-[bounce_1.5s_ease-in-out_infinite] p-1"
          style={liquidGlassStyle}
        >
          <ChevronDown className="w-6 h-6 text-white mx-auto" />
        </button>
      </div>
    </div>
  );
};

export default ImmersiveProfileModal;