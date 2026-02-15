// MediaStep - Step 1: Add Media, Studio, Tags
// Uses native OS picker via pickMediaFiles utility
import { useCallback, useMemo, useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Images, Plus, Wand2, Award, MapPin, AtSign, X, Play } from 'lucide-react';
import { triggerHaptic } from '@/lib/ui/haptics';
import { pickMediaFiles, validateMediaFiles } from '@/utils/media/pickMediaFiles';
import { StepProps } from '../types';
import { StudioEdits } from '@/types/studio';
import { ComposerMediaItem } from '@/hooks/useSnapModal';
import { PermissionDeniedCard } from '../components';
import { PostTemplateSelector, PostTemplate } from '../components/PostTemplateSelector';
import { useFirstRunFlag } from '@/hooks/useFirstRunFlag';
import { useToast } from '@/hooks/use-toast';

// Lazy imports for heavy components
import CreateMomentMediaStage from '@/components/post/create-moment/CreateMomentMediaStage';
import { POST_LIMITS } from '@/constants/postLimits';
import { validateMediaFile } from '@/constants/postLimits';

// Processing UX components
import { MediaProcessingBanner } from '@/components/post/create-moment/MediaProcessingBanner';
import { PickerLoadingBanner } from '@/components/post/create-moment/PickerLoadingBanner';

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
  const { toast } = useToast();
  
  // Loading states for picker
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState<'camera' | 'photos' | null>(null);
  
  // Per-item processing tracking (replaces blocking overlay)
  const [processingMediaIds, setProcessingMediaIds] = useState<Set<string>>(new Set());
  const [warningMediaIds, setWarningMediaIds] = useState<Set<string>>(new Set());
  const [removingMediaIds, setRemovingMediaIds] = useState<Set<string>>(new Set());
  
  // Batch progress tracking
  const [batchTotal, setBatchTotal] = useState(0);
  const [batchCompleted, setBatchCompleted] = useState(0);
  
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
  
  // Animated removal — shrink out before dispatching REMOVE_MEDIA
  const animateAndRemove = useCallback((mediaId: string) => {
    setRemovingMediaIds(prev => new Set(prev).add(mediaId));
    setTimeout(() => {
      dispatch({ type: 'REMOVE_MEDIA', payload: mediaId });
      setRemovingMediaIds(prev => {
        const next = new Set(prev);
        next.delete(mediaId);
        return next;
      });
      setProcessingMediaIds(prev => {
        const next = new Set(prev);
        next.delete(mediaId);
        return next;
      });
      setWarningMediaIds(prev => {
        const next = new Set(prev);
        next.delete(mediaId);
        return next;
      });
    }, 200);
  }, [dispatch]);
  
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
        thumbnailUrl: type === 'image' ? previewUrl : undefined,
        duration: undefined,
      } as ComposerMediaItem;
    });
    
    // Add to state immediately - user sees their media right away
    dispatch({ type: 'ADD_MEDIA', payload: placeholderItems });
    triggerHaptic('success');
    
    // Count videos that need processing
    const videosToProcess = placeholderItems.filter(item => item.type === 'video');
    if (videosToProcess.length > 0) {
      // Mark videos as processing (per-item tracking)
      setProcessingMediaIds(prev => {
        const next = new Set(prev);
        videosToProcess.forEach(v => next.add(v.id));
        return next;
      });
      
      // Set batch progress
      setBatchTotal(prev => prev + videosToProcess.length);
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
          
          // Show toast explaining why the video was removed
          toast({
            title: 'Video removed',
            description: validation.error || 'Video exceeds the allowed limits.',
            variant: 'destructive',
          });
          triggerHaptic('error');
          
          // Animate out then remove
          animateAndRemove(item.id);
          setBatchCompleted(prev => prev + 1);
          URL.revokeObjectURL(tmpUrl);
          return;
        }
        
        // Generate poster in background
        let thumbnailUrl: string | undefined;
        try {
          thumbnailUrl = await generateVideoPoster(item.file!);
        } catch (posterErr) {
          console.warn('Poster generation failed:', posterErr);
          // Mark as warning — video still usable, just no custom poster
          setWarningMediaIds(prev => new Set(prev).add(item.id));
        }
        
        // If poster came back undefined (not error, just failed), also mark warning
        if (!thumbnailUrl) {
          setWarningMediaIds(prev => new Set(prev).add(item.id));
        }
        
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
        // Mark as warning — video still usable
        setWarningMediaIds(prev => new Set(prev).add(item.id));
      } finally {
        // Remove from processing set
        setProcessingMediaIds(prev => {
          const next = new Set(prev);
          next.delete(item.id);
          return next;
        });
        setBatchCompleted(prev => prev + 1);
      }
    });
  }, [dispatch, toast, animateAndRemove]);
  
  // Reset batch counters when all processing completes
  useEffect(() => {
    if (batchTotal > 0 && batchCompleted >= batchTotal && processingMediaIds.size === 0) {
      // Reset after the completion banner fades (2s + buffer)
      const timer = setTimeout(() => {
        setBatchTotal(0);
        setBatchCompleted(0);
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [batchTotal, batchCompleted, processingMediaIds.size]);
  
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

  // Template state
  const [activeTemplateId, setActiveTemplateId] = useState<string | null>(null);

  const handleSelectTemplate = useCallback((template: PostTemplate) => {
    setActiveTemplateId(template.id);
    dispatch({ type: 'SET_CATEGORIES', payload: template.categories as any });
    dispatch({ type: 'SET_CAPTION', payload: template.captionStructure });
    if (template.badges) {
      dispatch({ type: 'SET_BADGES', payload: template.badges });
    }
  }, [dispatch]);

  const handleDeselectTemplate = useCallback(() => {
    setActiveTemplateId(null);
    dispatch({ type: 'SET_CATEGORIES', payload: [] as any });
    dispatch({ type: 'SET_CAPTION', payload: '' });
    dispatch({ type: 'SET_BADGES', payload: [] });
  }, [dispatch]);

  // Empty state
  if (!hasMedia) {
    if (permissionDenied) {
      return (
        <PermissionDeniedCard 
          type={permissionDenied} 
          onRetry={handleRetryPermission}
        />
      );
    }
    
    return (
      <div className="h-full flex flex-col items-center justify-center px-8 relative" style={{ background: 'linear-gradient(to bottom, rgba(254,243,199,0.3), white, white)' }}>
        {/* Skeleton loading banner */}
        <PickerLoadingBanner isVisible={isPickerOpen} />
        
        <motion.div 
          className="flex flex-col items-center text-center w-full max-w-sm"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        >
          {/* Branded camera icon — amber */}
          <div className="relative h-20 w-20 rounded-[28%] bg-amber-100 flex items-center justify-center mb-6">
            <Camera className="h-9 w-9 text-amber-600" />
            <div 
              className="absolute inset-0 rounded-[28%] bg-amber-50 animate-ping" 
              style={{ animationDuration: '3s' }} 
            />
          </div>
          
          <h3 className="text-xl font-bold tracking-tight text-gray-900 mb-1.5">
            Create Your Moment
          </h3>
          <p className="text-sm font-medium text-gray-500 mb-1">
            Photos and videos from your round
          </p>
          <p className="text-xs text-gray-400 mb-8">
            Up to {POST_LIMITS.MAX_MEDIA_COUNT} photos & videos
          </p>
          
          {/* Action cards — Camera (amber) & Gallery */}
          <div className="flex gap-3 w-full max-w-[280px]">
            <button
              onClick={handleCamera}
              disabled={isPickerOpen}
              className="flex-1 flex flex-col items-center gap-2 py-5 rounded-2xl text-white font-medium shadow-sm active:scale-[0.97] transition-all disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, #fbbf24, #f59e0b)' }}
            >
              <Camera className="h-6 w-6" />
              <div>
                <div className="text-sm font-semibold">Camera</div>
                <div className="text-[10px] opacity-80">Capture now</div>
              </div>
            </button>
            <button
              onClick={handleGallery}
              disabled={isPickerOpen}
              className="flex-1 flex flex-col items-center gap-2 py-5 rounded-2xl bg-white border border-gray-200 text-gray-800 font-medium shadow-sm active:scale-[0.97] transition-all disabled:opacity-50"
            >
              <Images className="h-6 w-6 text-amber-500" />
              <div>
                <div className="text-sm font-semibold">Gallery</div>
                <div className="text-[10px] text-gray-400">Choose media</div>
              </div>
            </button>
          </div>

          {/* Post Templates */}
          <div className="w-full mt-8">
            <PostTemplateSelector
              onSelectTemplate={handleSelectTemplate}
              onDeselectTemplate={handleDeselectTemplate}
              activeTemplateId={activeTemplateId}
            />
          </div>
          
          {/* Quick action chips — amber icons */}
          <div className="flex flex-wrap justify-center gap-2 mt-6">
            <span className="flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-white border border-gray-200 shadow-sm text-sm font-medium text-gray-600 active:bg-gray-50 transition-colors">
              <Camera className="h-4 w-4 text-amber-500" />
              Best shots
            </span>
            <span className="flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-white border border-gray-200 shadow-sm text-sm font-medium text-gray-600 active:bg-gray-50 transition-colors">
              <AtSign className="h-4 w-4 text-amber-500" />
              Tag partners
            </span>
            <span className="flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-white border border-gray-200 shadow-sm text-sm font-medium text-gray-600 active:bg-gray-50 transition-colors">
              <MapPin className="h-4 w-4 text-amber-500" />
              Add location
            </span>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col relative" style={{ backgroundColor: '#F8FAFC' }}>
      {/* Non-blocking picker loading banner */}
      <PickerLoadingBanner isVisible={isPickerOpen} />
      
      {/* Large media preview stage — reduced height by 15% */}
      <div className="flex-shrink-0" style={{ maxHeight: '85%', height: '85%' }}>
        <CreateMomentMediaStage
          media={state.mediaItems}
          activeMediaId={activeMediaId}
          coverMediaId={coverMediaId}
          onActiveMediaChange={handleActiveMediaChange}
          onSetCover={handleSetCover}
          onRemoveMedia={handleRemoveMedia}
          onReorder={handleReorder}
          getEdits={getEdits}
          processingMediaIds={processingMediaIds}
          warningMediaIds={warningMediaIds}
          removingMediaIds={removingMediaIds}
        />
      </div>
      
      {/* Two-row scrollable thumbnail grid below the preview */}
      <div className="flex-shrink-0 px-0" style={{ paddingTop: '2px' }}>
        <div 
          className="overflow-x-auto media-grid-scroll"
          style={{ 
            scrollSnapType: 'x mandatory',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
          }}
        >
          <style dangerouslySetInnerHTML={{ __html: `
            .media-grid-scroll::-webkit-scrollbar { display: none; }
          `}} />
          <div 
            className="grid"
            style={{
              gap: '2px',
              gridTemplateRows: state.mediaItems.length <= 4 ? '1fr' : 'repeat(2, 1fr)',
              gridAutoFlow: 'column',
              gridAutoColumns: 'minmax(0, 1fr)',
              width: 'max-content',
              minWidth: '100%',
            }}
          >
            {state.mediaItems.map((item, index) => {
              const isRemoving = removingMediaIds.has(item.id);
              const isProcessing = processingMediaIds.has(item.id);
              const isActive = item.id === activeMediaId;
              
              return (
                <motion.div
                  key={item.id}
                  className="relative overflow-hidden cursor-pointer"
                  style={{ 
                    width: '5rem',
                    height: '5rem',
                    scrollSnapAlign: 'start',
                  }}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ 
                    opacity: isRemoving ? 0 : 1, 
                    scale: isRemoving ? 0.5 : 1,
                  }}
                  transition={{ duration: 0.2 }}
                  onClick={() => handleActiveMediaChange(item.id)}
                >
                  {/* Image/Video */}
                  {item.type === 'image' ? (
                    <img 
                      src={item.previewUrl} 
                      alt="" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <>
                      <img 
                        src={item.thumbnailUrl || item.previewUrl} 
                        alt="" 
                        className="w-full h-full object-cover"
                      />
                      {/* Video play icon */}
                      <div className="absolute bottom-1 left-1 w-5 h-5 rounded-full flex items-center justify-center"
                        style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
                      >
                        <Play className="w-2.5 h-2.5 text-white fill-white" />
                      </div>
                    </>
                  )}
                  
                  {/* Remove button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      animateAndRemove(item.id);
                    }}
                    className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-black/40 text-white flex items-center justify-center"
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                  
                  {/* Active ring */}
                  {isActive && (
                    <div className="absolute inset-0 ring-2 ring-amber-400 pointer-events-none" />
                  )}
                  
                  {/* Processing overlay */}
                  {isProcessing && (
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                      <div className="w-4 h-4 border-2 border-white/60 border-t-white rounded-full animate-spin" />
                    </div>
                  )}
                </motion.div>
              );
            })}
            
            {/* "+ Add More" cell */}
            {canAddMore && (
              <button
                onClick={handleGallery}
                disabled={isPickerOpen}
                className="border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 active:bg-gray-50 transition-colors disabled:opacity-50"
                style={{ 
                  width: '5rem',
                  height: '5rem',
                }}
              >
                <Plus className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </div>
      
      {/* Bottom action bar — extra padding for safe area */}
      <div className="flex-shrink-0 border-t border-gray-100 bg-white px-4 py-3 pb-6">
        {/* Non-blocking processing progress banner */}
        <MediaProcessingBanner 
          totalVideos={batchTotal} 
          completedVideos={batchCompleted} 
        />
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* Add more media */}
            <button
              onClick={handleGallery}
              disabled={!canAddMore || isPickerOpen}
              className={`flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-gray-100 text-sm font-medium text-gray-800 active:bg-gray-200 transition-colors ${!canAddMore ? 'opacity-30 cursor-not-allowed' : ''}`}
            >
              <Plus className="h-4 w-4" />
              Add
            </button>
            
            {/* Studio button */}
            <button
              onClick={() => {
                studioFirstRun.markSeen();
                onOpenStudio();
              }}
              className="relative flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-gray-100 text-sm font-medium text-gray-800 active:bg-gray-200 transition-colors"
            >
              <Wand2 className="h-4 w-4" />
              Studio
              {!studioFirstRun.hasSeen && (
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              )}
            </button>
            
            {/* Badges button */}
            <button
              onClick={() => {
                badgesFirstRun.markSeen();
                onOpenBadges();
              }}
              className="relative flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-gray-100 text-sm font-medium text-gray-800 active:bg-gray-200 transition-colors"
            >
              <Award className="h-4 w-4" />
              Badges
              {!badgesFirstRun.hasSeen && (
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              )}
            </button>
          </div>
          
          {/* Media count */}
          <span className="text-xs text-gray-400 font-medium tabular-nums">
            {state.mediaItems.length}/{POST_LIMITS.MAX_MEDIA_COUNT}
          </span>
        </div>
      </div>
    </div>
  );
}
