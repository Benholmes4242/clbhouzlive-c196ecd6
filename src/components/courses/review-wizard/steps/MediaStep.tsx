/**
 * Step 3: Add Photos & Videos
 * PostWizard-style thumbnail strip with fullscreen viewer
 */

import React, { useRef, useCallback, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, AlertCircle, Images, Loader2 } from 'lucide-react';
import { formatCourseLocation } from '@/utils/courseLocation';
import type { ReviewMediaItem } from '../types';
import type { ReviewWizardCourse } from '../types';
import { ComposerMediaItem } from '@/hooks/useSnapModal';
import { pickMediaFiles, validateMediaFiles } from '@/utils/media/pickMediaFiles';
import { triggerHaptic } from '@/lib/ui/haptics';
import { PermissionDeniedCard } from '@/components/post/post-wizard/components/PermissionDeniedCard';
import { StudioEdits } from '@/types/studio';
import { toast } from 'sonner';
import { MediaThumbnail } from '@/components/post/post-wizard/components/MediaThumbnail';
import { MediaPreviewViewer } from '@/components/post/post-wizard/components/MediaPreviewViewer';
import type { OrderedMediaItem } from '@/components/post/post-wizard/types';

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
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState<'camera' | 'photos' | null>(null);
  const [previewMediaIndex, setPreviewMediaIndex] = useState<number | null>(null);
  const [showMaxPulse, setShowMaxPulse] = useState(false);
  const prevMediaCountRef = useRef(media.length);

  useEffect(() => {
    if (media.length === MAX_MEDIA_ITEMS && prevMediaCountRef.current < MAX_MEDIA_ITEMS) {
      setShowMaxPulse(true);
      const timer = setTimeout(() => setShowMaxPulse(false), 600);
      return () => clearTimeout(timer);
    }
    prevMediaCountRef.current = media.length;
  }, [media.length]);

  const handleFilesFromPicker = useCallback(async (files: File[]) => {
    if (files.length === 0) return;
    
    const validFiles = await validateMediaFiles(files);
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

  const handlePickMedia = useCallback(async () => {
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

  // Convert ReviewMediaItem[] to OrderedMediaItem[] for PostWizard components
  const composerMedia: OrderedMediaItem[] = media.map((item, index) => ({
    id: item.id,
    type: item.type,
    previewUrl: item.previewUrl,
    thumbnailUrl: item.posterUrl || item.previewUrl,
    file: (item as any).file,
    order: index,
    uploadStatus: item.status === 'uploading' || item.status === 'queued' ? 'uploading' : 
                  item.status === 'failed' ? 'failed' : undefined,
    uploadProgress: item.progress?.percent,
  }));

  const coverMediaIndex = media.findIndex(m => m.id === coverMediaId);

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
      {/* Course context bar */}
      {course && (
         <motion.div 
          className="shrink-0 flex items-center gap-3 px-4 py-3 border-b"
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
              className="w-14 h-14 rounded-xl object-cover shrink-0"
            />
          ) : (
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-green-400 to-blue-500 shrink-0" />
          )}
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-foreground truncate">{course.name}</p>
            {locationText && (
              <p className="text-[11px] text-muted-foreground truncate">{locationText}</p>
            )}
          </div>
        </motion.div>
      )}

      {/* Upload error banner */}
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
        <div className="flex-1 flex flex-col min-h-0 px-5 pt-2">
          {/* Horizontal scrolling thumbnail strip */}
          <div className="flex gap-2 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
            {composerMedia.map((item, index) => (
              <MediaThumbnail
                key={item.id}
                item={item}
                index={index}
                isCover={index === coverMediaIndex}
                totalItems={composerMedia.length}
                hasStudioEdits={false}
                showStudio={false}
                onRemove={() => onRemoveMedia(item.id)}
                onExpand={() => setPreviewMediaIndex(index)}
                onStudio={() => {}}
                onSetCover={() => onSetCover(item.id)}
                isViewerOpen={previewMediaIndex !== null}
              />
            ))}

            {/* "+" add more tile */}
            {canAddMore && (
              <button
                onClick={handlePickMedia}
                disabled={isPickerOpen}
                className="flex-shrink-0 w-[160px] h-[160px] rounded-2xl flex items-center justify-center disabled:opacity-50"
                style={{ border: '1.5px dashed rgba(245,158,11,0.25)' }}
              >
                {isPickerOpen ? (
                  <Loader2 className="w-6 h-6 animate-spin" style={{ color: '#f59e0b' }} />
                ) : (
                  <Plus className="w-6 h-6" style={{ color: '#f59e0b' }} />
                )}
              </button>
            )}
          </div>

          {/* Counter */}
          <p
            className="text-[11px] font-medium tabular-nums text-center mt-1"
            style={{
              color: media.length >= MAX_MEDIA_ITEMS ? '#EF4444' : '#AEAEB2',
            }}
          >
            {media.length}/{MAX_MEDIA_ITEMS}
          </p>
        </div>
      ) : (
        /* Empty state — dashed amber tile */
        <div 
          className="flex-1 flex flex-col items-center justify-center p-5"
          style={{ background: 'transparent' }}
        >
          {permissionDenied ? (
            <PermissionDeniedCard
              type={permissionDenied}
              onRetry={() => {
                setPermissionDenied(null);
                handlePickMedia();
              }}
            />
          ) : (
            <motion.div 
              className="w-full max-w-sm flex flex-col items-center"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              <button
                onClick={handlePickMedia}
                disabled={isPickerOpen}
                className="w-full aspect-[16/10] rounded-2xl flex flex-col items-center justify-center gap-3 disabled:opacity-50"
                style={{
                  border: '2px dashed rgba(245, 158, 11, 0.3)',
                  background: 'rgba(245, 158, 11, 0.02)',
                }}
              >
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center"
                  style={{
                    background: 'linear-gradient(135deg, rgba(245,158,11,0.12), rgba(245,158,11,0.05))',
                  }}
                >
                  {isPickerOpen ? (
                    <Loader2 className="w-6 h-6 animate-spin" style={{ color: '#f59e0b' }} />
                  ) : (
                    <Images className="w-6 h-6" style={{ color: '#f59e0b' }} />
                  )}
                </div>
                <span className="text-sm font-semibold text-foreground">Add photo or video</span>
              </button>
              <p className="text-xs text-muted-foreground/60 mt-3 text-center">
                Share up to {MAX_MEDIA_ITEMS} photos & videos
              </p>
            </motion.div>
          )}
        </div>
      )}

      {/* Fullscreen media viewer */}
      <AnimatePresence>
        {previewMediaIndex !== null && (
          <MediaPreviewViewer
            items={composerMedia}
            initialIndex={previewMediaIndex}
            onClose={() => setPreviewMediaIndex(null)}
            onSetCover={(index) => {
              const item = composerMedia[index];
              if (item) onSetCover(item.id);
            }}
            coverIndex={coverMediaIndex}
            showStudio={false}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
