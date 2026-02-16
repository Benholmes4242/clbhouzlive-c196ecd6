/**
 * Step 3: Add Photos & Videos
 * Uses native OS picker via pickMediaFiles utility
 * Amber-themed empty state, media stage + footer with Studio & Badges
 */

import React, { useRef, useCallback, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Camera, AlertCircle, Images, Loader2, Check, Wand2, Award } from 'lucide-react';
import { formatCourseLocation } from '@/utils/courseLocation';
import type { ReviewMediaItem } from '../types';
import type { ReviewWizardCourse } from '../types';
import CreateMomentMediaStage from '@/components/post/create-moment/CreateMomentMediaStage';
import { ComposerMediaItem } from '@/hooks/useSnapModal';
import { pickMediaFiles, validateMediaFiles } from '@/utils/media/pickMediaFiles';
import { triggerHaptic } from '@/lib/ui/haptics';
import { PermissionDeniedCard } from '@/components/post/post-wizard/components/PermissionDeniedCard';
import { useFirstRunFlag } from '@/hooks/useFirstRunFlag';
import { StudioEdits } from '@/types/studio';

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
  onOpenStudio: () => void;
  onOpenBadges: () => void;
  studioEditsByMediaId?: Record<string, StudioEdits>;
  activeMediaId: string | null;
  onActiveMediaChange: (mediaId: string) => void;
}

const MAX_MEDIA_ITEMS = 10;

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
  onOpenStudio,
  onOpenBadges,
  studioEditsByMediaId = {},
  activeMediaId,
  onActiveMediaChange,
}: MediaStepProps) {
  const mediaInputRef = useRef<HTMLInputElement>(null);
  
  // Loading states
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState<'camera' | 'photos' | null>(null);
  
  // First-run flags for Studio & Badges discovery
  const studioFirstRun = useFirstRunFlag('reviewWizard:studio');
  const badgesFirstRun = useFirstRunFlag('reviewWizard:badges');
  
  // Track previous media count to detect max reached
  const prevMediaCountRef = useRef(media.length);
  const [showMaxPulse, setShowMaxPulse] = useState(false);

  // Keep activeMediaId in sync when media changes
  useEffect(() => {
    if (media.length === 0) {
      // no-op, parent handles
    } else if (activeMediaId && !media.find(m => m.id === activeMediaId)) {
      onActiveMediaChange(media[0]?.id || '');
    } else if (!activeMediaId && media.length > 0) {
      onActiveMediaChange(media[0].id);
    }
  }, [media, activeMediaId, onActiveMediaChange]);
  
  // Detect when max is reached for pulse animation
  useEffect(() => {
    if (media.length === MAX_MEDIA_ITEMS && prevMediaCountRef.current < MAX_MEDIA_ITEMS) {
      setShowMaxPulse(true);
      const timer = setTimeout(() => setShowMaxPulse(false), 600);
      return () => clearTimeout(timer);
    }
    prevMediaCountRef.current = media.length;
  }, [media.length]);

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

  const handleReorder = useCallback((fromIndex: number, toIndex: number) => {
    onReorderMedia(fromIndex, toIndex);
    triggerHaptic('selection');
  }, [onReorderMedia]);

  // Get edits for a specific media item
  const getEdits = useCallback((mediaId: string): StudioEdits => {
    return studioEditsByMediaId[mediaId] ?? {};
  }, [studioEditsByMediaId]);

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

  // Course location text for context bar
  const locationText = course ? formatCourseLocation({
    sub_country: course.sub_country,
    region: course.region,
    country: course.country,
  }) : '';

  return (
    <motion.div
      initial={{ opacity: 0, x: 300 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -300 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="flex flex-col h-full overflow-hidden relative"
      style={{ background: 'transparent' }}
    >
      {fileInput}
      
      {/* Course context bar — visual continuity from Steps 1-2 hero */}
      {course && (
        <motion.div 
          className="shrink-0 flex items-center gap-3 px-4 py-2.5 border-b"
          style={{ 
            borderColor: 'rgba(251, 191, 36, 0.15)',
          }}
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
          <div className="flex-1 min-h-0 relative">
            <CreateMomentMediaStage
              media={composerMedia}
              activeMediaId={activeMediaId}
              coverMediaId={coverMediaId}
              onActiveMediaChange={onActiveMediaChange}
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
          
          {/* Bottom footer bar — counter + 3 buttons, matching Post Wizard */}
          <div 
            className="flex-shrink-0 border-t border-amber-200/30 px-4 py-3"
            style={{ 
              paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 24px)',
            }}
          >
            {/* Counter — centered */}
            <p className="text-sm text-amber-600 font-medium tabular-nums text-center mb-2">
              {media.length}/{MAX_MEDIA_ITEMS}
            </p>
            
            {/* Three buttons row */}
            <div className="flex items-center justify-center gap-4">
              {/* Add button */}
              <button
                onClick={handleGallery}
                disabled={!canAddMore || isPickerOpen}
                className={`flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-amber-100/80 text-sm font-medium text-amber-700 active:bg-amber-200/80 transition-colors ${!canAddMore ? 'opacity-30 cursor-not-allowed' : ''}`}
              >
                {isPickerOpen ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                Add
              </button>
              
              {/* Studio button */}
              <button
                onClick={() => {
                  studioFirstRun.markSeen();
                  onOpenStudio();
                }}
                className="relative flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-amber-100/80 text-sm font-medium text-amber-700 active:bg-amber-200/80 transition-colors"
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
                className="relative flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-amber-100/80 text-sm font-medium text-amber-700 active:bg-amber-200/80 transition-colors"
              >
                <Award className="h-4 w-4" />
                Badges
                {!badgesFirstRun.hasSeen && (
                  <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                )}
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Empty state — amber-themed, matching Post Wizard */
        <div 
          className="h-full flex items-center justify-center p-5 relative"
          style={{ background: 'transparent' }}
        >
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
              {/* Amber-themed icon with ping */}
              <div className="relative mb-5">
                <motion.div 
                  className="h-20 w-20 bg-amber-100 flex items-center justify-center"
                  style={{ borderRadius: '28%' }}
                >
                  <Camera className="h-9 w-9 text-amber-600" />
                </motion.div>
                {/* Ping animation */}
                <div 
                  className="absolute inset-0 bg-amber-50 animate-ping"
                  style={{ borderRadius: '28%', animationDuration: '3s' }}
                />
              </div>
              
              {/* Text - visible hierarchy */}
              <h3 className="text-xl font-bold tracking-tight text-gray-900 mb-1.5">
                Course Highlights
              </h3>
              <p className="text-sm font-medium text-gray-500 text-center mb-1">
                Show off the course
              </p>
              <p className="text-xs text-gray-400 text-center mb-6">
                Up to {MAX_MEDIA_ITEMS} photos & videos
              </p>
              
              {/* CTA cards — matching Post Wizard */}
              <div className="flex gap-3 mb-5 w-full">
                <button
                  onClick={handleCamera}
                  disabled={isPickerOpen}
                  className="flex-1 py-5 rounded-2xl text-white font-medium shadow-sm active:scale-[0.97] transition-all duration-100 flex items-center justify-center gap-2 disabled:opacity-50"
                  style={{ background: 'linear-gradient(135deg, #fbbf24, #f59e0b)' }}
                >
                  <Camera className="h-5 w-5" />
                  Camera
                </button>
                <button
                  onClick={handleGallery}
                  disabled={isPickerOpen}
                  className="flex-1 py-5 rounded-2xl bg-white border border-gray-200 text-gray-700 font-medium shadow-sm active:scale-[0.97] transition-all duration-100 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Images className="h-5 w-5" />
                  Gallery
                </button>
              </div>
              
              {/* Review-specific tip chips */}
              <div className="flex flex-wrap justify-center gap-2 mb-4">
                {TIP_CHIPS.map(chip => (
                  <span 
                    key={chip}
                    className="text-[11px] bg-amber-50 text-amber-700 rounded-full px-3 py-1"
                  >
                    {chip}
                  </span>
                ))}
              </div>
              
              {/* Optional indicator */}
              <p className="text-[11px] text-gray-400">
                Optional — your ratings and review speak for themselves
              </p>
            </motion.div>
          )}
        </div>
      )}
    </motion.div>
  );
}
