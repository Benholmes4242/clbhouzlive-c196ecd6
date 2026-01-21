// MediaStep - Step 1: Add Media, Studio, Tags
// Declutter & Elevate - 2-tier action bar, branded empty state
import { useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Camera, Images, Plus, Wand2, Award } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { triggerHaptic } from '@/lib/ui/haptics';
import { openMediaPicker } from '@/utils/openMediaPicker';
import { normalizeFilesToMediaItems } from '@/lib/mediaUtils';
import { StepProps } from '../types';
import { StudioEdits } from '@/types/studio';

// Lazy imports for heavy components
import CreateMomentMediaStage from '@/components/post/create-moment/CreateMomentMediaStage';
import { POST_LIMITS } from '@/constants/postLimits';

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
  
  // Handle file selection
  const handleFilesSelected = useCallback(async (files: File[]) => {
    if (files.length === 0) return;
    
    try {
      const result = await normalizeFilesToMediaItems(files);
      if (result.validItems.length > 0) {
        dispatch({ type: 'ADD_MEDIA', payload: result.validItems });
        triggerHaptic('success');
      }
      if (result.errors.length > 0) {
        console.warn('Some files could not be processed:', result.errors);
      }
    } catch (err) {
      console.error('Failed to process media files:', err);
    }
  }, [dispatch]);
  
  // Open camera
  const handleCamera = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*,video/*';
    input.capture = 'environment';
    input.style.display = 'none';
    document.body.appendChild(input);
    
    input.addEventListener('change', async () => {
      const files = Array.from(input.files ?? []);
      document.body.removeChild(input);
      await handleFilesSelected(files);
    });
    
    input.click();
  }, [handleFilesSelected]);
  
  // Open gallery
  const handleGallery = useCallback(() => {
    openMediaPicker(handleFilesSelected, POST_LIMITS.MAX_MEDIA_COUNT - state.mediaItems.length);
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

  // Empty state - branded & elevated
  if (!hasMedia) {
    return (
      <div className="h-full flex items-center justify-center p-6 bg-[#F8FAFC]">
        <motion.div 
          className="text-center max-w-[320px] flex flex-col items-center"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
        >
          <div className="border border-dashed border-[#e2e8f0] rounded-2xl p-8 flex flex-col items-center bg-white">
            {/* Icon container */}
            <div className="h-14 w-14 rounded-full bg-[#e2e8f0] flex items-center justify-center mb-4">
              <Camera className="h-8 w-8 text-muted-foreground" />
            </div>
            
            {/* Text */}
            <h3 className="text-lg font-semibold text-foreground mb-1">
              Add your media
            </h3>
            <p className="text-sm text-muted-foreground text-center mb-6">
              Capture or select photos and videos
            </p>
            
            {/* CTA buttons */}
            <div className="flex gap-3">
              <Button
                variant="default"
                onClick={handleCamera}
                className="gap-2 bg-[#e2e8f0] text-foreground hover:bg-[#cbd5e1]"
              >
                <Camera className="h-4 w-4" />
                Camera
              </Button>
              <Button
                variant="outline"
                onClick={handleGallery}
                className="gap-2"
              >
                <Images className="h-4 w-4" />
                Gallery
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  // Media selected state
  return (
    <div className="h-full flex flex-col bg-[#F8FAFC]">
      {/* Media stage - takes most of the space */}
      <div className="flex-1 min-h-0 relative">
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
        
        {/* Bottom gradient fade for controls overlay */}
        <div className="absolute bottom-0 inset-x-0 h-24 bg-gradient-to-t from-background/80 to-transparent pointer-events-none" />
        
        {/* Media counter pill */}
        {state.mediaItems.length > 1 && (
          <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-black/50 backdrop-blur-sm">
            <span className="text-xs text-white font-medium tabular-nums">
              {currentMediaIndex + 1}/{state.mediaItems.length}
            </span>
          </div>
        )}
      </div>
      
      {/* 2-Tier Action bar */}
      <div className="flex-shrink-0 border-t border-[#e2e8f0] bg-[#F8FAFC] px-4 py-3 space-y-3">
        {/* Secondary actions row */}
        <div className="flex items-center justify-center gap-3">
          {/* Add more media */}
          {canAddMore && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleGallery}
              className="gap-1.5 text-muted-foreground hover:text-foreground hover:bg-[#e2e8f0]"
            >
              <Plus className="h-4 w-4" />
              Add
            </Button>
          )}
          
          {/* Studio button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onOpenStudio}
            className="gap-1.5 text-muted-foreground hover:text-foreground hover:bg-[#e2e8f0]"
          >
            <Wand2 className="h-4 w-4" />
            Studio
          </Button>
          
          {/* Badges button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onOpenBadges}
            className="gap-1.5 text-muted-foreground hover:text-foreground hover:bg-[#e2e8f0]"
          >
            <Award className="h-4 w-4" />
            Badges
          </Button>
        </div>
      </div>
    </div>
  );
}

export default MediaStep;
