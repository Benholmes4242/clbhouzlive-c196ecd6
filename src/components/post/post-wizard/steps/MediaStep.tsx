// MediaStep - Step 1: Add Media, Studio, Tags
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

  // Empty state - no media
  if (!hasMedia) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <motion.div 
          className="text-center max-w-[520px] flex flex-col items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
        >
          <div className="border border-dashed border-border rounded-2xl p-8 flex flex-col items-center bg-muted/30">
            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3">
              <Camera className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="font-medium text-foreground mb-1">Capture the moment</p>
            <p className="text-sm text-muted-foreground text-center mb-4">
              From the tee, the green, or anywhere in between
            </p>
            <div className="flex gap-3">
              <Button
                variant="secondary"
                onClick={handleCamera}
                className="gap-2"
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
    <div className="h-full flex flex-col">
      {/* Media stage - takes most of the space */}
      <div className="flex-1 min-h-0">
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
      </div>
      
      {/* Action bar */}
      <div className="flex-shrink-0 border-t border-border bg-background px-4 py-3">
        <div className="flex items-center justify-center gap-4">
          {/* Add more media */}
          {canAddMore && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleGallery}
              className="gap-1.5"
            >
              <Plus className="h-4 w-4" />
              Add
            </Button>
          )}
          
          {/* Studio button */}
          <Button
            variant="outline"
            size="sm"
            onClick={onOpenStudio}
            className="gap-1.5"
          >
            <Wand2 className="h-4 w-4" />
            Studio
          </Button>
          
          {/* Badges button */}
          <Button
            variant="outline"
            size="sm"
            onClick={onOpenBadges}
            className="gap-1.5"
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
