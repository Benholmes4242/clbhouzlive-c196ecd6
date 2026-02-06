// MediaStep - Step 1: Add Media, Studio, Tags
// Uses native OS picker via pickMediaFiles utility
import { useCallback, useMemo, useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Camera, Images, Plus, Wand2, Award, Loader2, MapPin, AtSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { triggerHaptic } from '@/lib/ui/haptics';
import { pickMediaFiles, validateMediaFiles } from '@/utils/media/pickMediaFiles';
import { StepProps } from '../types';
import { StudioEdits } from '@/types/studio';
import { ComposerMediaItem } from '@/hooks/useSnapModal';
import { PermissionDeniedCard } from '../components';
import { useFirstRunFlag } from '@/hooks/useFirstRunFlag';

// Lazy imports for heavy components
import CreateMomentMediaStage from '@/components/post/create-moment/CreateMomentMediaStage';
import { POST_LIMITS } from '@/constants/postLimits';
import { validateMediaFile } from '@/constants/postLimits';

// Helper functions for background video processing
async function readVideoDuration(src: string, timeoutMs = 3000): Promise<number | undefined> {
  return new Promise((resolve) => {
    const v = document.createElement('video');
    let done = false;

    const cleanup = () => {
      if (!done) {
        done = true;
        if (src.startsWith('blob:')) URL.revokeObjectURL(src);
      }
    };

    const to = setTimeout(() => {
      cleanup();
      resolve(undefined);
    }, timeoutMs);

    v.preload = 'metadata';
    v.onloadedmetadata = () => {
      clearTimeout(to);
      const d = isFinite(v.duration) ? v.duration : undefined;
      cleanup();
      resolve(d);
    };
    v.onerror = () => {
      clearTimeout(to);
      cleanup();
      resolve(undefined);
    };
    v.src = src;
  });
}

async function generateVideoPoster(videoFile: File): Promise<string | undefined> {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    const blobUrl = URL.createObjectURL(videoFile);
    let resolved = false;
    
    const cleanup = () => {
      video.onloadedmetadata = null;
      video.onseeked = null;
      video.onerror = null;
      video.oncanplay = null;
    };
    
    const captureFrame = () => {
      if (resolved) return;
      resolved = true;
      
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx || video.videoWidth === 0) {
        cleanup();
        resolve(undefined);
        return;
      }
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0);
      
      canvas.toBlob((blob) => {
        cleanup();
        if (blob) {
          resolve(URL.createObjectURL(blob));
        } else {
          resolve(undefined);
        }
      }, 'image/jpeg', 0.8);
    };
    
    video.onloadedmetadata = () => {
      const seekTime = Math.min(0.5, video.duration || 0.5);
      video.currentTime = seekTime;
    };
    
    video.onseeked = () => {
      setTimeout(captureFrame, 50);
    };
    
    video.oncanplay = () => {
      if (!resolved && video.currentTime === 0) {
        setTimeout(captureFrame, 100);
      }
    };
    
    video.onerror = () => {
      cleanup();
      resolve(undefined);
    };
    
    // Timeout fallback
    setTimeout(() => {
      if (!resolved) {
        captureFrame();
      }
    }, 2000);
    
    video.preload = 'metadata';
    video.playsInline = true;
    video.muted = true;
    video.src = blobUrl;
    video.load();
  });
}

interface MediaStepProps extends StepProps {
  onOpenStudio: () => void;
  onOpenBadges: () => void;
}

export function MediaStep({ 
  state, 
  dispatch,
  onOpenStudio,
  onOpenBadges,
}: MediaStepProps) {
  const hasMedia = state.mediaItems.length > 0;
  const canAddMore = state.mediaItems.length < POST_LIMITS.MAX_MEDIA_COUNT;
  
  // Loading states for picker and processing
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [processingCount, setProcessingCount] = useState(0);
  const [permissionDenied, setPermissionDenied] = useState<'camera' | 'photos' | null>(null);
  
  const isLoading = isPickerOpen || processingCount > 0;
  
  // First-run flags for Studio & Badges discovery
  const studioFirstRun = useFirstRunFlag('postWizard:studio');
  const badgesFirstRun = useFirstRunFlag('postWizard:badges');
  
  // Active media ID - use state or default to first item
  const activeMediaId = useMemo(() => {
    if (state.activeMediaId) return state.activeMediaId;
    if (state.mediaItems.length === 0) return null;
    return state.mediaItems[0]?.id ?? null;
  }, [state.activeMediaId, state.mediaItems]);
  
  // Cover media ID based on coverIndex
  const coverMediaId = useMemo(() => {
    return state.mediaItems[state.coverIndex]?.id ?? null;
  }, [state.mediaItems, state.coverIndex]);
  
  // Current media index for counter pill
  const currentMediaIndex = useMemo(() => {
    if (!activeMediaId) return 0;
    const idx = state.mediaItems.findIndex(m => m.id === activeMediaId);
    return idx >= 0 ? idx : 0;
  }, [activeMediaId, state.mediaItems]);
  
  // Get edits for a media item
  const getEdits = useCallback((mediaId: string): StudioEdits => {
    return state.studioEditsByMediaId[mediaId] ?? {};
  }, [state.studioEditsByMediaId]);
  
  // Non-blocking file processing
  const handleFilesSelected = useCallback(async (files: File[]) => {
    if (files.length === 0) return;
    
    // Validate files first
    const validFiles = validateMediaFiles(files);
    if (validFiles.length === 0) return;
    
    // IMMEDIATELY create placeholder items and add to state
    const placeholderItems: ComposerMediaItem[] = validFiles.map((file, idx) => {
      const type: 'image' | 'video' = file.type.startsWith('video') ? 'video' : 'image';
      const previewUrl = URL.createObjectURL(file);
      
      return {
        id: crypto.randomUUID?.() ?? `${Date.now()}-${idx}`,
        type,
        file,
        previewUrl,
        thumbnailUrl: type === 'image' ? previewUrl : undefined, // Images ready immediately
        duration: undefined,
      } as ComposerMediaItem;
    });
    
    // Add to state immediately - user sees their media right away
    dispatch({ type: 'ADD_MEDIA', payload: placeholderItems });
    triggerHaptic('success');
    
    // Count videos that need processing
    const videosToProcess = placeholderItems.filter(item => item.type === 'video');
    if (videosToProcess.length > 0) {
      setProcessingCount(prev => prev + videosToProcess.length);
    }
    
    // Process videos in background (non-blocking)
    videosToProcess.forEach(async (item) => {
      try {
        const tmpUrl = URL.createObjectURL(item.file!);
        
        // Extract duration in background
        const duration = await readVideoDuration(tmpUrl, 3000);
        
        // Validate duration
        const validation = validateMediaFile(item.file!, duration);
        if (!validation.valid) {
          console.warn('Video validation failed:', validation.error);
          dispatch({ type: 'REMOVE_MEDIA', payload: item.id });
          setProcessingCount(prev => Math.max(0, prev - 1));
          URL.revokeObjectURL(tmpUrl);
          return;
        }
        
        // Generate poster in background
        const thumbnailUrl = await generateVideoPoster(item.file!);
        
        // Update the specific media item with thumbnail and duration
        dispatch({ 
          type: 'UPDATE_MEDIA_ITEM', 
          payload: { 
            id: item.id, 
            updates: { 
              duration, 
              thumbnailUrl: thumbnailUrl || item.previewUrl,
            } 
          } 
        });
        
        URL.revokeObjectURL(tmpUrl);
      } catch (err) {
        console.error('Video processing error:', err);
        // Even on error, video is still usable - just without thumbnail
      } finally {
        setProcessingCount(prev => Math.max(0, prev - 1));
      }
    });
  }, [dispatch]);
  
  // Open camera via native OS picker with capture attribute
  const handleCamera = useCallback(async () => {
    setPermissionDenied(null);
    setIsPickerOpen(true);
    
    try {
      const files = await pickMediaFiles({ 
        accept: 'image/*,video/*', 
        capture: 'environment',
        multiple: false 
      });
      
      setIsPickerOpen(false);
      
      if (files.length > 0) {
        await handleFilesSelected(files);
      }
    } catch (error) {
      console.error('[MediaStep] Camera error:', error);
      setIsPickerOpen(false);
      triggerHaptic('error');
    }
  }, [handleFilesSelected]);
  
  // Open gallery via native OS picker
  const handleGallery = useCallback(async () => {
    setPermissionDenied(null);
    
    const remainingSlots = POST_LIMITS.MAX_MEDIA_COUNT - state.mediaItems.length;
    
    if (remainingSlots <= 0) {
      return;
    }
    
    setIsPickerOpen(true);
    
    try {
      const files = await pickMediaFiles({ 
        accept: 'image/*,video/*', 
        multiple: remainingSlots > 1,
        maxFiles: remainingSlots
      });
      
      setIsPickerOpen(false);
      
      if (files.length > 0) {
        // Enforce the limit
        const trimmed = files.slice(0, remainingSlots);
        await handleFilesSelected(trimmed);
      }
    } catch (error) {
      console.error('[MediaStep] Gallery picker error:', error);
      setIsPickerOpen(false);
      triggerHaptic('error');
    }
  }, [handleFilesSelected, state.mediaItems.length]);
  
  // Retry permission handler
  const handleRetryPermission = useCallback(() => {
    const deniedType = permissionDenied;
    setPermissionDenied(null);
    if (deniedType === 'camera') {
      handleCamera();
    } else {
      handleGallery();
    }
  }, [permissionDenied, handleCamera, handleGallery]);
  
  // NOTE: Auto-launch removed - iOS blocks programmatic input.click() without user gesture
  
  // Handle active media change (for studio)
  const handleActiveMediaChange = useCallback((mediaId: string) => {
    dispatch({ type: 'SET_ACTIVE_MEDIA_ID', payload: mediaId });
  }, [dispatch]);
  
  // Handle set cover
  const handleSetCover = useCallback((mediaId: string) => {
    const index = state.mediaItems.findIndex(m => m.id === mediaId);
    if (index >= 0) {
      dispatch({ type: 'SET_COVER_INDEX', payload: index });
      triggerHaptic('selection');
    }
  }, [state.mediaItems, dispatch]);
  
  // Handle remove media
  const handleRemoveMedia = useCallback((mediaId: string) => {
    dispatch({ type: 'REMOVE_MEDIA', payload: mediaId });
    triggerHaptic('light');
  }, [dispatch]);
  
  // Handle reorder
  const handleReorder = useCallback((fromIndex: number, toIndex: number) => {
    const items = [...state.mediaItems];
    const [moved] = items.splice(fromIndex, 1);
    items.splice(toIndex, 0, moved);
    
    // Reindex orders
    const reordered = items.map((item, idx) => ({ ...item, order: idx }));
    dispatch({ type: 'REORDER_MEDIA', payload: reordered });
    triggerHaptic('selection');
  }, [state.mediaItems, dispatch]);

  // Loading overlay component
  const LoadingOverlay = () => (
    <motion.div 
      className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <Loader2 className="w-10 h-10 text-white animate-spin" />
      <p className="mt-3 text-white text-sm font-medium">
        {isPickerOpen 
          ? 'Loading from your library...' 
          : `Processing ${processingCount} video${processingCount !== 1 ? 's' : ''}...`}
      </p>
      {isPickerOpen && (
        <p className="mt-1 text-white/70 text-xs text-center px-8">
          Large videos from iCloud may take a few minutes
        </p>
      )}
    </motion.div>
  );

  // Empty state - Apple-level: refined, visible text, with max media tip
  if (!hasMedia) {
    // Show permission denied UI if permission was denied
    if (permissionDenied) {
      return (
        <PermissionDeniedCard 
          type={permissionDenied} 
          onRetry={handleRetryPermission}
        />
      );
    }
    
    return (
      <div className="h-full flex flex-col items-center justify-center px-8 bg-background relative">
        {isLoading && <LoadingOverlay />}
        
        <motion.div 
          className="flex flex-col items-center text-center w-full max-w-sm"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        >
          {/* Branded camera icon with subtle pulse ring */}
          <div className="relative h-20 w-20 rounded-[28%] bg-primary/10 flex items-center justify-center mb-6">
            <Camera className="h-8 w-8 text-primary" />
            <div 
              className="absolute inset-0 rounded-[28%] bg-primary/5 animate-ping" 
              style={{ animationDuration: '3s' }} 
            />
          </div>
          
          {/* Copy — aligned with Moment branding */}
          <h3 className="text-lg font-semibold text-foreground mb-1.5">
            Share your moment
          </h3>
          <p className="text-sm text-muted-foreground mb-1">
            Photos and videos from your round
          </p>
          <p className="text-xs text-muted-foreground/70 mb-8">
            Up to {POST_LIMITS.MAX_MEDIA_COUNT} photos &amp; videos
          </p>
          
          {/* CTA buttons — Camera primary, Gallery secondary */}
          <div className="flex gap-3 w-full max-w-[260px]">
            <Button
              onClick={handleCamera}
              disabled={isLoading}
              className="flex-1 gap-2 rounded-xl h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-medium active:scale-[0.97] transition-all duration-150"
            >
              <Camera className="h-4 w-4" />
              Camera
            </Button>
            <Button
              variant="outline"
              onClick={handleGallery}
              disabled={isLoading}
              className="flex-1 gap-2 rounded-xl h-11 border-border bg-background hover:bg-muted/50 text-foreground font-medium active:scale-[0.97] transition-all duration-150"
            >
              <Images className="h-4 w-4" />
              Gallery
            </Button>
          </div>
          
          {/* Tips as pill badges */}
          <div className="flex flex-wrap justify-center gap-2 mt-8">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted/60 text-xs text-muted-foreground">
              <Camera className="h-3 w-3 flex-shrink-0" />
              Best shots
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted/60 text-xs text-muted-foreground">
              <AtSign className="h-3 w-3 flex-shrink-0" />
              Tag partners
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted/60 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3 flex-shrink-0" />
              Add location
            </span>
          </div>
        </motion.div>
      </div>
    );
  }

  // Media selected state - Apple-level flexbox constraints
  return (
    <div className="h-full flex flex-col bg-[#F8FAFC] relative">
      {isLoading && <LoadingOverlay />}
      
      {/* Media stage - fills available space, never overflows (flex-1 min-h-0 pattern) */}
      <div className="flex-1 min-h-0 relative overflow-hidden">
        <CreateMomentMediaStage
          media={state.mediaItems}
          activeMediaId={activeMediaId}
          coverMediaId={coverMediaId}
          onActiveMediaChange={handleActiveMediaChange}
          onSetCover={handleSetCover}
          onRemoveMedia={handleRemoveMedia}
          onReorder={handleReorder}
          getEdits={getEdits}
        />
        
        {/* Media counter pill — elevated z-index, frosted glass */}
        {state.mediaItems.length > 1 && (
          <div className="absolute top-3 left-3 z-30 flex items-center px-2 py-1 rounded-full bg-black/50 backdrop-blur-sm border border-white/10 shadow-lg shadow-black/20">
            <span className="text-[10px] text-white font-medium tabular-nums">
              {currentMediaIndex + 1}/{state.mediaItems.length}
            </span>
          </div>
        )}
      </div>
      
      {/* Bottom action bar — elevated, with safe area */}
      <div 
        className="flex-shrink-0 border-t border-border bg-background px-4 py-3"
        style={{ boxShadow: '0 -2px 8px rgba(0,0,0,0.06)' }}
      >
        {/* Media counter */}
        <div className="text-center mb-2">
          <p className="text-xs text-muted-foreground">
            {state.mediaItems.length}/{POST_LIMITS.MAX_MEDIA_COUNT} items selected
            {!canAddMore && <span className="text-muted-foreground ml-1">• Maximum reached</span>}
          </p>
        </div>
        
        <div className="flex items-center justify-center gap-2">
          {/* Add more media — aggressive grey-out at max */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleGallery}
            disabled={!canAddMore || isLoading}
            className={`gap-1.5 px-4 py-2.5 h-auto rounded-full bg-muted hover:bg-muted/80 text-sm font-medium transition-colors text-foreground ${!canAddMore ? 'opacity-30 cursor-not-allowed' : ''}`}
          >
            <Plus className="h-4 w-4" />
            Add Media
          </Button>
          
          {/* Studio button with first-run indicator */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              studioFirstRun.markSeen();
              onOpenStudio();
            }}
            className="relative gap-1.5 px-4 py-2.5 h-auto rounded-full bg-muted hover:bg-muted/80 text-sm font-medium transition-colors text-foreground"
          >
            <Wand2 className="h-4 w-4" />
            Studio
            {!studioFirstRun.hasSeen && (
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-primary animate-pulse" />
            )}
          </Button>
          
          {/* Badges button with first-run indicator */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              badgesFirstRun.markSeen();
              onOpenBadges();
            }}
            className="relative gap-1.5 px-4 py-2.5 h-auto rounded-full bg-muted hover:bg-muted/80 text-sm font-medium transition-colors text-foreground"
          >
            <Award className="h-4 w-4" />
            Badges
            {!badgesFirstRun.hasSeen && (
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-primary animate-pulse" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
