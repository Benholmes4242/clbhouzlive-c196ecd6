/**
 * Step 3: Add Photos & Videos
 * Uses native OS picker via pickMediaFiles utility
 * Polish: Amber-themed empty state, course context bar, max-media completion, tip chips
 */

import React, { useRef, useCallback, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Camera, AlertCircle, Images, Loader2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { formatCourseLocation } from '@/utils/courseLocation';
import type { ReviewMediaItem } from '../types';
import type { ReviewWizardCourse } from '../types';
import CreateMomentMediaStage from '@/components/post/create-moment/CreateMomentMediaStage';
import { ComposerMediaItem } from '@/hooks/useSnapModal';
import { pickMediaFiles, validateMediaFiles } from '@/utils/media/pickMediaFiles';
import { triggerHaptic } from '@/lib/ui/haptics';
import { PermissionDeniedCard } from '@/components/post/post-wizard/components/PermissionDeniedCard';

interface MediaStepProps {
  media: ReviewMediaItem[];
  coverMediaId: string | null;
  course: ReviewWizardCourse | null;
  onAddImages: (files: File[]) => void;
  onAddVideo: (file: File) => void;
  onRemoveMedia: (id: string) => void;
  onSetCover: (id: string) => void;
  onRetryMedia?: (id: string) => void;
  onReorderMedia: (fromIndex: number, toIndex: number) => void;
}

const MAX_MEDIA_ITEMS = 6;

const TIP_CHIPS = ['Fairways & greens', 'Signature holes', 'Clubhouse & views'];

export function MediaStep({
  media,
  coverMediaId,
  course,
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
  
  // Track previous media count to detect max reached
  const prevMediaCountRef = useRef(media.length);
  const [showMaxPulse, setShowMaxPulse] = useState(false);

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
  
  // Detect when max is reached for pulse animation
  useEffect(() => {
    if (media.length === MAX_MEDIA_ITEMS && prevMediaCountRef.current < MAX_MEDIA_ITEMS) {
      setShowMaxPulse(true);
      const timer = setTimeout(() => setShowMaxPulse(false), 600);
      return () => clearTimeout(timer);
    }
    prevMediaCountRef.current = media.length;
  }, [media.length]);
  
  // NOTE: Auto-launch removed - iOS blocks programmatic input.click() without user gesture

  const handleMediaSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const remainingSlots = MAX_MEDIA_ITEMS - media.length;
    const filesToProcess = files.slice(0, remainingSlots);

    const imageFiles: File[] = [];
    const videoFiles: File[] = [];

    filesToProcess.forEach(file => {
      if (file.type.startsWith('video/')) {
        videoFiles.push(file);
      } else if (file.type.startsWith('image/')) {
        imageFiles.push(file);
      }
    });

    if (imageFiles.length > 0) {
      onAddImages(imageFiles);
    }

    videoFiles.forEach(video => {
      onAddVideo(video);
    });

    if (mediaInputRef.current) {
      mediaInputRef.current.value = '';
    }
  }, [media.length, onAddImages, onAddVideo]);

  // Process files from picker
  const handleFilesFromPicker = useCallback((files: File[]) => {
    if (files.length === 0) return;
    
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

  // Course location text for context bar
  const locationText = course ? formatCourseLocation({
    sub_country: course.sub_country,
    region: course.region,
    country: course.country,
  }) : '';

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="flex flex-col h-full overflow-hidden bg-background relative"
    >
      {fileInput}
      
      {/* Course context bar — visual continuity from Steps 1-2 hero */}
      {course && (
        <motion.div 
          className="shrink-0 flex items-center gap-3 px-4 py-2.5 bg-muted/20 border-b border-border/20"
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
        >
          {course.thumbnail_image ? (
            <img 
              src={course.thumbnail_image} 
              alt={course.name}
              loading="eager"
              className="w-10 h-10 rounded-lg object-cover shrink-0"
            />
          ) : (
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-400 to-blue-500 shrink-0" />
          )}
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-foreground truncate">{course.name}</p>
            {locationText && (
              <p className="text-[11px] text-muted-foreground truncate">{locationText}</p>
            )}
          </div>
        </motion.div>
      )}
      
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
                {!canAddMore && (
                  <motion.span 
                    className="text-emerald-600 ml-1"
                    initial={showMaxPulse ? { scale: 1 } : false}
                    animate={showMaxPulse ? { scale: [1, 1.05, 1] } : { scale: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    · Maximum reached
                  </motion.span>
                )}
                {processingCount > 0 && (
                  <span className="text-blue-600 ml-1">· Processing {processingCount}...</span>
                )}
              </p>
            </div>
            
            <div className="flex items-center justify-center gap-2">
              {canAddMore ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleGallery}
                  disabled={isPickerOpen}
                  className="gap-1.5 px-4 py-2.5 h-auto rounded-full bg-muted hover:bg-muted/80 text-sm font-medium transition-colors text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isPickerOpen ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                  Add Media
                </Button>
              ) : (
                <motion.div 
                  className="flex items-center gap-1.5 text-sm text-emerald-600 font-medium py-2.5"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.2 }}
                >
                  <Check className="h-4 w-4" />
                  All {MAX_MEDIA_ITEMS} slots filled
                </motion.div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Empty state — amber-themed, full-width, no card container */
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
              className="text-center flex flex-col items-center w-full max-w-sm"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              {/* Amber-themed icon with pulse */}
              <motion.div 
                className="h-16 w-16 rounded-full bg-amber-50 flex items-center justify-center mb-5"
                animate={{ scale: [1, 1.04, 1] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
              >
                <Camera className="h-7 w-7 text-amber-500" />
              </motion.div>
              
              {/* Text - visible hierarchy */}
              <h3 className="text-lg font-semibold text-foreground mb-1.5">
                Course highlights
              </h3>
              <p className="text-sm text-muted-foreground text-center mb-6">
                Show off the course — up to {MAX_MEDIA_ITEMS} photos & videos
              </p>
              
              {/* CTA buttons — differentiated */}
              <div className="flex gap-3 mb-5">
                <Button
                  onClick={handleCamera}
                  disabled={isPickerOpen}
                  className="gap-2 rounded-xl px-6 py-2.5 h-auto bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  <Camera className="h-4 w-4" />
                  Camera
                </Button>
                <Button
                  variant="outline"
                  onClick={handleGallery}
                  disabled={isPickerOpen}
                  className="gap-2 rounded-xl px-6 py-2.5 h-auto border-border text-foreground hover:bg-muted/60"
                >
                  <Images className="h-4 w-4" />
                  Gallery
                </Button>
              </div>
              
              {/* Review-specific tip chips */}
              <div className="flex flex-wrap justify-center gap-2 mb-4">
                {TIP_CHIPS.map(chip => (
                  <span 
                    key={chip}
                    className="text-[11px] bg-muted/30 text-muted-foreground rounded-full px-3 py-1"
                  >
                    {chip}
                  </span>
                ))}
              </div>
              
              {/* Optional indicator */}
              <p className="text-[11px] text-muted-foreground/50">
                Optional — your ratings and review speak for themselves
              </p>
            </motion.div>
          )}
        </div>
      )}
    </motion.div>
  );
}
