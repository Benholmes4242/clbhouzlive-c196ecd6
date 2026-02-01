// MediaStep - Step 1: Add Media, Studio, Tags
// Non-blocking media processing with loading indicators
import { useCallback, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Camera, Images, Plus, Wand2, Award, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { triggerHaptic } from '@/lib/ui/haptics';
import { openMediaPicker } from '@/utils/openMediaPicker';
import { StepProps } from '../types';
import { StudioEdits } from '@/types/studio';
import { ComposerMediaItem } from '@/hooks/useSnapModal';

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
  
  const isLoading = isPickerOpen || processingCount > 0;
  
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
    
    // IMMEDIATELY create placeholder items and add to state
    const placeholderItems: ComposerMediaItem[] = files.map((file, idx) => {
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
  
  // Open camera
  const handleCamera = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*,video/*';
    input.capture = 'environment';
    input.style.display = 'none';
    document.body.appendChild(input);
    
    setIsPickerOpen(true);
    
    input.addEventListener('change', async () => {
      const files = Array.from(input.files ?? []);
      document.body.removeChild(input);
      setIsPickerOpen(false);
      await handleFilesSelected(files);
    });
    
    // Handle cancel
    const handleFocus = () => {
      setTimeout(() => {
        if (!input.files?.length) {
          setIsPickerOpen(false);
          if (document.body.contains(input)) {
            document.body.removeChild(input);
          }
        }
        window.removeEventListener('focus', handleFocus);
      }, 500);
    };
    window.addEventListener('focus', handleFocus);
    
    input.click();
  }, [handleFilesSelected]);
  
  // Open gallery with loading state callback
  const handleGallery = useCallback(() => {
    openMediaPicker(
      handleFilesSelected, 
      POST_LIMITS.MAX_MEDIA_COUNT - state.mediaItems.length,
      setIsPickerOpen
    );
  }, [handleFilesSelected, state.mediaItems.length]);
  
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
    return (
      <div className="h-full flex items-center justify-center p-5 bg-[#F8FAFC] relative">
        {isLoading && <LoadingOverlay />}
        
        <motion.div 
          className="text-center max-w-[300px] flex flex-col items-center"
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
        >
          <div className="rounded-2xl px-6 py-10 flex flex-col items-center bg-white shadow-sm">
            {/* Icon container */}
            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
              <Camera className="h-5 w-5 text-muted-foreground" />
            </div>
            
            {/* Text - visible hierarchy */}
            <h3 className="text-base font-semibold text-foreground mb-1">
              Add your media
            </h3>
            <p className="text-sm text-muted-foreground text-center mb-1">
              Capture or select photos and videos
            </p>
            <p className="text-xs text-muted-foreground mb-5">
              Maximum {POST_LIMITS.MAX_MEDIA_COUNT} items
            </p>
            
            {/* CTA buttons */}
            <div className="flex gap-2">
              <Button
                variant="ghost"
                onClick={handleCamera}
                disabled={isLoading}
                className="gap-1.5 bg-muted hover:bg-muted/80 rounded-xl px-5 py-2.5 h-auto text-foreground"
              >
                <Camera className="h-4 w-4" />
                Camera
              </Button>
              <Button
                variant="ghost"
                onClick={handleGallery}
                disabled={isLoading}
                className="gap-1.5 bg-muted hover:bg-muted/80 rounded-xl px-5 py-2.5 h-auto text-foreground"
              >
                <Images className="h-4 w-4" />
                Gallery
              </Button>
            </div>
            
            {/* Inspiration tips */}
            <div className="mt-8 pt-6 border-t border-border w-full">
              <p className="text-xs font-medium text-muted-foreground text-center mb-3">
                Tips for great moments
              </p>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="w-1 h-1 rounded-full bg-muted-foreground flex-shrink-0" />
                  <span>Share your best shots from the round</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="w-1 h-1 rounded-full bg-muted-foreground flex-shrink-0" />
                  <span>Tag your playing partners with @mentions</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="w-1 h-1 rounded-full bg-muted-foreground flex-shrink-0" />
                  <span>Add the course location for discovery</span>
                </div>
              </div>
            </div>
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
        
        {/* Media counter pill - top left, matching toggle button style */}
        {state.mediaItems.length > 1 && (
          <div className="absolute top-3 left-3 z-30 flex items-center px-2 py-1 rounded-full bg-black/60 backdrop-blur-xl border border-white/10 shadow-lg shadow-black/20">
            <span className="text-[10px] text-white font-medium tabular-nums">
              {currentMediaIndex + 1}/{state.mediaItems.length}
            </span>
          </div>
        )}
      </div>
      
      {/* Bottom action bar - fixed to bottom of wizard */}
      <div className="flex-shrink-0 border-t border-border bg-background px-4 py-3 pb-safe">
        {/* Media counter */}
        <div className="text-center mb-2">
          <p className="text-xs text-muted-foreground">
            {state.mediaItems.length}/{POST_LIMITS.MAX_MEDIA_COUNT} items selected
            {!canAddMore && <span className="text-amber-600 ml-1">• Maximum reached</span>}
          </p>
        </div>
        
        <div className="flex items-center justify-center gap-2">
          {/* Add more media - disabled at max */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleGallery}
            disabled={!canAddMore || isLoading}
            className="gap-1.5 px-4 py-2.5 h-auto rounded-full bg-muted hover:bg-muted/80 text-sm font-medium transition-colors text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="h-4 w-4" />
            Add Media
          </Button>
          
          {/* Studio button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onOpenStudio}
            className="gap-1.5 px-4 py-2.5 h-auto rounded-full bg-muted hover:bg-muted/80 text-sm font-medium transition-colors text-foreground"
          >
            <Wand2 className="h-4 w-4" />
            Studio
          </Button>
          
          {/* Badges button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onOpenBadges}
            className="gap-1.5 px-4 py-2.5 h-auto rounded-full bg-muted hover:bg-muted/80 text-sm font-medium transition-colors text-foreground"
          >
            <Award className="h-4 w-4" />
            Badges
          </Button>
        </div>
      </div>
    </div>
  );
}