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

  // Empty state - Apple-level: refined, visible text, with max media tip
  if (!hasMedia) {
    return (
      <div className="h-full flex items-center justify-center p-5 bg-[#F8FAFC]">
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
                className="gap-1.5 bg-muted hover:bg-muted/80 rounded-xl px-5 py-2.5 h-auto text-foreground"
              >
                <Camera className="h-4 w-4" />
                Camera
              </Button>
              <Button
                variant="ghost"
                onClick={handleGallery}
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
    <div className="h-full flex flex-col bg-[#F8FAFC]">
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
        
        {/* Media counter pill - top left, matching video badge style */}
        {state.mediaItems.length > 1 && (
          <div className="absolute top-2 left-2 z-30 px-2 py-1 rounded-full bg-black/60 backdrop-blur-sm border border-white/10">
            <span className="text-xs font-medium text-white tabular-nums">
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
            disabled={!canAddMore}
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
