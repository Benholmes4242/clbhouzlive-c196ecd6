/**
 * Step 3: Add Photos & Videos
 * Uses native OS picker via pickMediaFiles utility
 */

import React, { useRef, useCallback, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Camera, AlertCircle, Images, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { ReviewMediaItem } from '../types';
import CreateMomentMediaStage from '@/components/post/create-moment/CreateMomentMediaStage';
import { ComposerMediaItem } from '@/hooks/useSnapModal';
import { pickMediaFiles, validateMediaFiles } from '@/utils/media/pickMediaFiles';
import { triggerHaptic } from '@/lib/ui/haptics';
import { PermissionDeniedCard } from '@/components/post/post-wizard/components/PermissionDeniedCard';

interface MediaStepProps {
  media: ReviewMediaItem[];
  coverMediaId: string | null;
  onAddImages: (files: File[]) => void;
  onAddVideo: (file: File) => void;
  onRemoveMedia: (id: string) => void;
  onSetCover: (id: string) => void;
  onRetryMedia?: (id: string) => void;
  onReorderMedia: (fromIndex: number, toIndex: number) => void;
}

const MAX_MEDIA_ITEMS = 6;

export function MediaStep({
  media,
  coverMediaId,
  onAddImages,
  onAddVideo,
  onRemoveMedia,
  onSetCover,
  onRetryMedia = () => {},
  onReorderMedia,
}: MediaStepProps) {
  const mediaInputRef = useRef<HTMLInputElement>(null);
  const [activeMediaId, setActiveMediaId] = useState<string | null>(
    coverMediaId || (media.length > 0 ? media[0].id : null)
  );
  
  // Loading states
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState<'camera' | 'photos' | null>(null);

  // Keep activeMediaId in sync when media changes
  useEffect(() => {
    if (media.length === 0) {
      setActiveMediaId(null);
    } else if (activeMediaId && !media.find(m => m.id === activeMediaId)) {
      setActiveMediaId(media[0]?.id || null);
    } else if (!activeMediaId && media.length > 0) {
      setActiveMediaId(media[0].id);
    }
  }, [media, activeMediaId]);
  
  // NOTE: Auto-launch removed - iOS blocks programmatic input.click() without user gesture

  const handleMediaSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const remainingSlots = MAX_MEDIA_ITEMS - media.length;
    const filesToProcess = files.slice(0, remainingSlots);

    // Separate images and videos
    const imageFiles: File[] = [];
    const videoFiles: File[] = [];

    filesToProcess.forEach(file => {
      if (file.type.startsWith('video/')) {
        videoFiles.push(file);
      } else if (file.type.startsWith('image/')) {
        imageFiles.push(file);
      }
    });

    // Add images
    if (imageFiles.length > 0) {
      onAddImages(imageFiles);
    }

    // Add videos (one at a time)
    videoFiles.forEach(video => {
      onAddVideo(video);
    });

    // Reset input
    if (mediaInputRef.current) {
      mediaInputRef.current.value = '';
    }
  }, [media.length, onAddImages, onAddVideo]);

  // Process files from picker
  const handleFilesFromPicker = useCallback((files: File[]) => {
    if (files.length === 0) return;
    
    // Validate files
    const validFiles = validateMediaFiles(files);
    if (validFiles.length === 0) return;
    
    const remainingSlots = MAX_MEDIA_ITEMS - media.length;
    const filesToProcess = validFiles.slice(0, remainingSlots);
    
    const imageFiles = filesToProcess.filter(f => f.type.startsWith('image/'));
    const videoFiles = filesToProcess.filter(f => f.type.startsWith('video/'));
    
    if (imageFiles.length > 0) onAddImages(imageFiles);
    videoFiles.forEach(video => onAddVideo(video));
    
    if (filesToProcess.length > 0) {
      triggerHaptic('success');
    }
  }, [media.length, onAddImages, onAddVideo]);

  // Open camera with loading state
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
      handleFilesFromPicker(files);
    } catch (error) {
      console.error('[ReviewWizard MediaStep] Camera error:', error);
      setIsPickerOpen(false);
      triggerHaptic('error');
    }
  }, [handleFilesFromPicker]);

  // Open gallery via native OS picker
  const handleGallery = useCallback(async () => {
    setPermissionDenied(null);
    
    const remainingSlots = MAX_MEDIA_ITEMS - media.length;
    
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
      handleFilesFromPicker(files);
    } catch (error) {
      console.error('[ReviewWizard MediaStep] Gallery picker error:', error);
      setIsPickerOpen(false);
      triggerHaptic('error');
    }
  }, [media.length, handleFilesFromPicker]);


  const canAddMore = media.length < MAX_MEDIA_ITEMS;
  
  // Calculate counts
  const failedCount = media.filter(m => m.status === 'failed').length;
  const processingCount = media.filter(m => m.status === 'uploading' || m.status === 'queued').length;

  // Convert ReviewMediaItem[] to ComposerMediaItem[] for CreateMomentMediaStage
  const composerMedia: ComposerMediaItem[] = media.map((item) => ({
    id: item.id,
    type: item.type,
    previewUrl: item.previewUrl,
    thumbnailUrl: item.posterUrl || item.previewUrl,
    file: (item as any).file,
    order: 0,
    uploadStatus: item.status === 'uploading' || item.status === 'queued' ? 'uploading' : 
                  item.status === 'failed' ? 'failed' : undefined,
    uploadProgress: item.progress?.percent,
  }));

  // Get cover index from coverMediaId
  const coverIndex = coverMediaId ? media.findIndex(m => m.id === coverMediaId) : 0;

  // Handlers for CreateMomentMediaStage
  const handleActiveMediaChange = useCallback((mediaId: string) => {
    setActiveMediaId(mediaId);
  }, []);

  const handleReorder = useCallback((fromIndex: number, toIndex: number) => {
    onReorderMedia(fromIndex, toIndex);
    triggerHaptic('selection');
  }, [onReorderMedia]);

  // Stub getEdits - review wizard doesn't have studio edits
  const getEdits = useCallback(() => ({}), []);

  // Hidden file input for images and videos
  const fileInput = (
    <input
      ref={mediaInputRef}
      type="file"
      accept="image/*,video/*"
      multiple
      onChange={handleMediaSelect}
      className="hidden"
    />
  );

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
        Loading from your library...
      </p>
      <p className="mt-1 text-white/70 text-xs text-center px-8">
        Large videos from iCloud may take a few minutes
      </p>
    </motion.div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="flex flex-col h-full overflow-hidden bg-[#F8FAFC] relative"
    >
      {fileInput}
      
      {/* Loading overlay */}
      <AnimatePresence>
        {isPickerOpen && <LoadingOverlay />}
      </AnimatePresence>

      {/* Status info - show failed count if any */}
      {failedCount > 0 && (
        <div className="bg-destructive/10 rounded-lg px-3 py-2 flex items-center gap-2 mx-4 mt-4">
          <AlertCircle className="h-4 w-4 text-destructive" />
          <span className="text-sm text-destructive font-medium">
            {failedCount} upload{failedCount === 1 ? '' : 's'} failed
          </span>
        </div>
      )}

      {/* Media content */}
      {media.length > 0 ? (
        <div className="flex-1 flex flex-col min-h-0">
          {/* Media stage - takes remaining space */}
          <div className="flex-1 min-h-0 relative" style={{ maxHeight: 'calc(100% - 24px)' }}>
            <CreateMomentMediaStage
              media={composerMedia}
              activeMediaId={activeMediaId}
              coverMediaId={coverMediaId}
              onActiveMediaChange={handleActiveMediaChange}
              onSetCover={onSetCover}
              onRemoveMedia={onRemoveMedia}
              onReorder={handleReorder}
              getEdits={getEdits}
            />
            
            {/* Media counter pill - top left, matching post wizard style */}
            {media.length > 1 && (
              <div className="absolute top-3 left-3 z-30 flex items-center px-2 py-1 rounded-full bg-black/60 backdrop-blur-xl border border-white/10 shadow-lg shadow-black/20">
                <span className="text-[10px] text-white font-medium tabular-nums">
                  {(activeMediaId ? media.findIndex(m => m.id === activeMediaId) : 0) + 1}/{media.length}
                </span>
              </div>
            )}
          </div>
          
          {/* Bottom action bar */}
          <div className="flex-shrink-0 border-t border-border bg-background px-4 py-3 pb-safe">
            {/* Media counter */}
            <div className="text-center mb-2">
              <p className="text-xs text-muted-foreground">
                {media.length}/{MAX_MEDIA_ITEMS} items selected
                {!canAddMore && <span className="text-amber-600 ml-1">• Maximum reached</span>}
                {processingCount > 0 && (
                  <span className="text-blue-600 ml-1">• Processing {processingCount}...</span>
                )}
              </p>
            </div>
            
            <div className="flex items-center justify-center gap-2">
              {/* Add more media - disabled at max or while loading */}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleGallery}
                disabled={!canAddMore || isPickerOpen}
                className="gap-1.5 px-4 py-2.5 h-auto rounded-full bg-muted hover:bg-muted/80 text-sm font-medium transition-colors text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isPickerOpen ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                Add Media
              </Button>
            </div>
          </div>
        </div>
      ) : (
        /* Empty state - matches Post Wizard */
        <div className="h-full flex items-center justify-center p-5 relative">
          {permissionDenied ? (
            <PermissionDeniedCard
              type={permissionDenied}
              onRetry={() => {
                setPermissionDenied(null);
                if (permissionDenied === 'camera') {
                  handleCamera();
                } else {
                  handleGallery();
                }
              }}
            />
          ) : (
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
                  Course highlights
                </h3>
                <p className="text-sm text-muted-foreground text-center mb-5">
                  Views, conditions, and moments
                </p>
                
                {/* CTA buttons */}
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    onClick={handleCamera}
                    disabled={isPickerOpen}
                    className="gap-1.5 bg-muted hover:bg-muted/80 rounded-xl px-5 py-2.5 h-auto text-foreground"
                  >
                    <Camera className="h-4 w-4" />
                    Camera
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={handleGallery}
                    disabled={isPickerOpen}
                    className="gap-1.5 bg-muted hover:bg-muted/80 rounded-xl px-5 py-2.5 h-auto text-foreground"
                  >
                    <Images className="h-4 w-4" />
                    Gallery
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      )}
    </motion.div>
  );
}
