/**
 * Step 3: Add Photos & Videos
 * Amber-themed empty state with pill buttons, clean media stage
 */

import React, { useRef, useCallback, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Camera, AlertCircle, Images, Loader2 } from 'lucide-react';
import { formatCourseLocation } from '@/utils/courseLocation';
import type { ReviewMediaItem } from '../types';
import type { ReviewWizardCourse } from '../types';
import CreateMomentMediaStage from '@/components/post/create-moment/CreateMomentMediaStage';
import { ComposerMediaItem } from '@/hooks/useSnapModal';
import { pickMediaFiles, validateMediaFiles } from '@/utils/media/pickMediaFiles';
import { triggerHaptic } from '@/lib/ui/haptics';
import { PermissionDeniedCard } from '@/components/post/post-wizard/components/PermissionDeniedCard';
import { StudioEdits } from '@/types/studio';
import { toast } from 'sonner';

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
  studioEditsByMediaId = {},
  activeMediaId,
  onActiveMediaChange,
}: MediaStepProps) {
  const mediaInputRef = useRef<HTMLInputElement>(null);
  
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState<'camera' | 'photos' | null>(null);
  
  const prevMediaCountRef = useRef(media.length);
  const [showMaxPulse, setShowMaxPulse] = useState(false);

  useEffect(() => {
    if (media.length === 0) {
      // no-op
    } else if (activeMediaId && !media.find(m => m.id === activeMediaId)) {
      onActiveMediaChange(media[0]?.id || '');
    } else if (!activeMediaId && media.length > 0) {
      onActiveMediaChange(media[0].id);
    }
  }, [media, activeMediaId, onActiveMediaChange]);
  
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

    if (imageFiles.length > 0) onAddImages(imageFiles);
    videoFiles.forEach(video => onAddVideo(video));

    if (mediaInputRef.current) {
      mediaInputRef.current.value = '';
    }
  }, [media.length, onAddImages, onAddVideo]);

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

  const handleGallery = useCallback(async () => {
    setPermissionDenied(null);
    
    const remainingSlots = MAX_MEDIA_ITEMS - media.length;
    
    if (remainingSlots <= 0) {
      toast.error("Limit reached", { description: "Maximum 10 items per review" });
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
  const failedCount = media.filter(m => m.status === 'failed').length;

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

  const getEdits = useCallback((mediaId: string): StudioEdits => {
    return studioEditsByMediaId[mediaId] ?? {};
  }, [studioEditsByMediaId]);

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
      
      {/* Course context bar */}
      {course && (
        <motion.div 
          className="shrink-0 flex items-center gap-3 px-4 py-2.5 border-b"
          style={{ borderColor: 'hsl(var(--border) / 0.3)' }}
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

      {/* Status info */}
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
            
            {/* Media counter pill */}
            {media.length > 1 && (
              <div className="absolute top-3 left-3 z-30 flex items-center px-2 py-1 rounded-full bg-black/60 backdrop-blur-xl border border-white/10 shadow-lg shadow-black/20">
                <span className="text-[10px] text-white font-medium tabular-nums">
                  {(activeMediaId ? media.findIndex(m => m.id === activeMediaId) : 0) + 1}/{media.length}
                </span>
              </div>
            )}
          </div>
          
          {/* Bottom footer bar */}
          <div 
            className="flex-shrink-0 px-4 py-3"
            style={{ 
              borderTop: '1px solid hsl(var(--border) / 0.3)',
              paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 24px)',
            }}
          >
            <p
              className="text-sm font-medium tabular-nums text-center mb-2"
              style={{
                color: media.length >= MAX_MEDIA_ITEMS ? 'hsl(var(--destructive))' : 'hsl(var(--muted-foreground))',
              }}
            >
              {media.length}/{MAX_MEDIA_ITEMS}
            </p>
            
            <div className="flex items-center justify-center">
              {canAddMore && (
                <button
                  onClick={handleGallery}
                  disabled={isPickerOpen}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-full text-sm font-medium text-foreground active:scale-[0.97] transition-all disabled:opacity-50"
                  style={{
                    background: 'hsl(var(--muted) / 0.8)',
                    border: '1.5px solid hsl(var(--border))',
                  }}
                >
                  {isPickerOpen ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                  Add
                </button>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Empty state — amber-themed */
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
              {/* Amber-tinted icon */}
              <div
                className="w-20 h-20 rounded-3xl flex items-center justify-center mb-5"
                style={{
                  background: 'linear-gradient(135deg, rgba(245,158,11,0.1), rgba(245,158,11,0.05))',
                  border: '1.5px solid rgba(245,158,11,0.15)',
                }}
              >
                <Camera className="w-8 h-8" style={{ color: '#f59e0b' }} />
              </div>
              
              <h3 className="text-lg font-bold text-foreground">
                Course Highlights
              </h3>
              <p className="text-sm text-muted-foreground mt-1 text-center">
                Show off the course — up to {MAX_MEDIA_ITEMS} photos & videos
              </p>
              
              {/* Action buttons — pill style */}
              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleCamera}
                  disabled={isPickerOpen}
                  className="flex items-center gap-2 px-6 py-3 rounded-full text-sm font-semibold text-white active:scale-[0.97] transition-all disabled:opacity-50"
                  style={{ background: '#1C1C1E' }}
                >
                  <Camera className="w-4 h-4" />
                  Camera
                </button>
                <button
                  onClick={handleGallery}
                  disabled={isPickerOpen}
                  className="flex items-center gap-2 px-6 py-3 rounded-full text-sm font-semibold text-foreground active:scale-[0.97] transition-all disabled:opacity-50"
                  style={{
                    background: 'hsl(var(--muted) / 0.8)',
                    border: '1.5px solid hsl(var(--border))',
                  }}
                >
                  <Images className="w-4 h-4" />
                  Gallery
                </button>
              </div>
              
              {/* Suggestion labels — non-interactive */}
              <div className="flex flex-wrap justify-center gap-2 mt-5">
                {TIP_CHIPS.map(tip => (
                  <span
                    key={tip}
                    className="text-xs text-muted-foreground/70 px-2.5 py-1 rounded-full select-none"
                    style={{ background: 'hsl(var(--muted) / 0.4)' }}
                  >
                    {tip}
                  </span>
                ))}
              </div>
              
              <p className="text-xs text-muted-foreground/60 mt-4 text-center">
                Optional — your ratings and review speak for themselves
              </p>
            </motion.div>
          )}
        </div>
      )}
    </motion.div>
  );
}
