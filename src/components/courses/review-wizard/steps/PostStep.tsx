/**
 * Step 3: Post Your Review
 * Combines media upload + inline review summary + submit CTA
 * Replaces old MediaStep + ConfirmStep
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, AlertCircle, Images, Camera } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { getScoreTier } from '@/utils/getScoreTier';
import { pickMediaFiles, validateMediaFiles } from '@/utils/media/pickMediaFiles';
import { triggerHaptic } from '@/lib/ui/haptics';
import { PermissionDeniedCard } from '@/components/shared/media/PermissionDeniedCard';
import { MediaThumbnail } from '@/components/shared/media/MediaThumbnail';
import { MediaPreviewViewer } from '@/components/shared/media/MediaPreviewViewer';
import type { OrderedMediaItem } from '@/components/shared/media/types';
import type { ReviewMediaItem, ReviewWizardCourse, ReviewBreakdowns, ReviewTaggableEntity } from '../types';

interface PostStepProps {
  course: ReviewWizardCourse | null;
  rating: number | null;
  breakdowns: ReviewBreakdowns;
  title: string;
  review: string;
  media: ReviewMediaItem[];
  coverMediaId: string | null;
  selectedTags: ReviewTaggableEntity[];
  hasUploadsInProgress: boolean;
  isEditMode?: boolean;
  isSubmitting: boolean;
  onAddImages: (files: File[]) => void;
  onAddVideo: (file: File) => void;
  onRemoveMedia: (id: string) => void;
  onSetCover: (id: string) => void;
  onRetryMedia: (id: string) => void;
  onReorderMedia: (from: number, to: number) => void;
  onGoToStep: (step: 1 | 2) => void;
  onSubmit: () => void;
}

const MAX_MEDIA_ITEMS = 10;

const BREAKDOWN_LABELS: Record<keyof ReviewBreakdowns, string> = {
  design: 'Design',
  condition: 'Condition',
  clubhouse: 'Clubhouse',
  facilities: 'Facilities',
};

export function PostStep({
  course,
  rating,
  breakdowns,
  title,
  review,
  media,
  coverMediaId,
  selectedTags,
  hasUploadsInProgress,
  isEditMode = false,
  isSubmitting,
  onAddImages,
  onAddVideo,
  onRemoveMedia,
  onSetCover,
  onRetryMedia,
  onReorderMedia,
  onGoToStep,
  onSubmit,
}: PostStepProps) {
  const [permissionDenied, setPermissionDenied] = useState<'camera' | 'photos' | null>(null);
  const [previewMediaIndex, setPreviewMediaIndex] = useState<number | null>(null);

  // Media file picker
  const handlePickMedia = useCallback(async () => {
    setPermissionDenied(null);
    const remainingSlots = MAX_MEDIA_ITEMS - media.length;
    if (remainingSlots <= 0) {
      toast.error('Limit reached', { description: 'Maximum 10 items per review' });
      return;
    }

    try {
      const files = await pickMediaFiles({
        accept: 'image/*,video/*',
        multiple: remainingSlots > 1,
        maxFiles: remainingSlots,
      });

      if (files.length === 0) return;
      const validFiles = await validateMediaFiles(files);
      if (validFiles.length === 0) return;

      const filesToProcess = validFiles.slice(0, remainingSlots);
      const imageFiles = filesToProcess.filter(f => f.type.startsWith('image/'));
      const videoFiles = filesToProcess.filter(f => f.type.startsWith('video/'));

      if (imageFiles.length > 0) onAddImages(imageFiles);
      videoFiles.forEach(video => onAddVideo(video));

      if (filesToProcess.length > 0) triggerHaptic('success');
    } catch (error) {
      console.error('[PostStep] Gallery picker error:', error);
      triggerHaptic('error');
    }
  }, [media.length, onAddImages, onAddVideo]);

  // Convert for MediaThumbnail
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

  const hasBreakdowns = Object.values(breakdowns).some(v => v !== null);
  const hasText = !!(title || review);
  const canSubmit = rating !== null && !isSubmitting;

  const tierInfo = rating !== null ? getScoreTier(rating) : null;

  return (
    <motion.div
      initial={{ opacity: 0, x: 300 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -300 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="flex-1 flex flex-col min-h-0 px-4 pt-4 pb-6 overflow-y-auto"
      style={{ background: 'transparent' }}
    >
      {/* Header */}
      <div className="text-center pb-5">
        <h2 className="text-[22px] text-foreground" style={{ fontWeight: 900 }}>
          Almost there
        </h2>
        <p className="text-[13px] text-muted-foreground mt-1">
          Add photos, then post your review
        </p>
      </div>

      {/* Media block */}
      <div
        className="rounded-[16px] mb-5 transition-all"
        style={{
          border: media.length > 0
            ? '1.5px solid hsl(var(--border))'
            : '2px dashed rgba(247,147,30,0.3)',
          background: media.length > 0 ? 'transparent' : 'rgba(247,147,30,0.02)',
        }}
      >
        {/* Header row with label + Add more link */}
        <div className="flex items-center justify-between px-3 pt-3 pb-1">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.12em]">
            Photos &amp; Videos · <span className="font-normal normal-case tracking-normal">optional</span>
          </p>
          {media.length > 0 && media.length < MAX_MEDIA_ITEMS && (
            <button
              type="button"
              onClick={handlePickMedia}
              className="text-[13px] font-bold bg-transparent border-none cursor-pointer active:scale-[0.95] transition-all"
              style={{ color: '#F7931E' }}
            >
              + Add more
            </button>
          )}
        </div>
        <div className="px-3 pb-3">
        {permissionDenied && (
          <PermissionDeniedCard type={permissionDenied} onRetry={() => setPermissionDenied(null)} />
        )}

        {media.length === 0 ? (
          /* Empty state */
          <button
            type="button"
            onClick={handlePickMedia}
            className="w-full py-8 flex flex-col items-center gap-2 active:scale-[0.97] transition-all"
          >
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center"
              style={{ background: 'rgba(247,147,30,0.08)' }}
            >
              <Camera className="w-5 h-5" style={{ color: '#F7931E' }} />
            </div>
            <p className="text-[14px] font-semibold text-foreground">Add photos or videos</p>
            <p className="text-[12px] text-muted-foreground">Up to 10 · first photo is cover</p>
          </button>
        ) : (
          /* Thumbnail strip */
          <div>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {composerMedia.map((item, index) => (
                <div key={item.id} className="relative flex-shrink-0">
                  <MediaThumbnail
                    item={item}
                    index={index}
                    isCover={item.id === coverMediaId}
                    totalItems={media.length}
                    onExpand={() => setPreviewMediaIndex(index)}
                    onRemove={() => onRemoveMedia(item.id)}
                    onSetCover={() => onSetCover(item.id)}
                  />
                </div>
              ))}
              {/* Add more button */}
              {media.length < MAX_MEDIA_ITEMS && (
                <button
                  type="button"
                  onClick={handlePickMedia}
                  className="w-[72px] h-[72px] rounded-xl border-2 border-dashed border-border flex items-center justify-center flex-shrink-0 active:scale-[0.95] transition-all"
                >
                  <Plus className="w-5 h-5 text-muted-foreground" />
                </button>
              )}
            </div>
            <p className="text-[11px] text-muted-foreground mt-2 text-center">
              {media.length}/{MAX_MEDIA_ITEMS} · first photo is cover
            </p>
          </div>
        )}
        </div>
      </div>

      {/* Inline review summary */}
      <div className="mb-5">
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[1.5px] mb-2.5">
          Your review
        </p>

        {/* Overall rating tile */}
        {rating !== null && tierInfo && (
          <button
            type="button"
            onClick={() => onGoToStep(1)}
            className="w-full flex items-center justify-between rounded-[14px] p-3.5 mb-2 active:scale-[0.97] transition-all"
            style={{
              background: tierInfo.bg || 'hsl(var(--muted) / 0.5)',
            }}
          >
            <div className="flex items-center gap-3">
              <span className="text-foreground" style={{ fontSize: 30, fontWeight: 900 }}>
                {rating.toFixed(1)}
              </span>
              <span className="text-[13px] font-semibold text-foreground/80">
                {tierInfo.label}
              </span>
            </div>
            <span className="text-[13px] font-semibold" style={{ color: '#F7931E' }}>
              Edit ›
            </span>
          </button>
        )}

        {/* Breakdown grid */}
        {hasBreakdowns && (
          <button
            type="button"
            onClick={() => onGoToStep(1)}
            className="w-full grid grid-cols-2 gap-2 mb-2 active:scale-[0.98] transition-all"
          >
            {(Object.entries(breakdowns) as [keyof ReviewBreakdowns, number | null][])
              .filter(([, v]) => v !== null)
              .map(([key, value]) => {
                const bdTier = getScoreTier(value!);
                return (
                  <div
                    key={key}
                    className="rounded-[10px] p-2.5"
                    style={{ background: 'hsl(var(--muted) / 0.5)' }}
                  >
                    <p className="text-[10px] text-muted-foreground font-medium">
                      {BREAKDOWN_LABELS[key]}
                    </p>
                    <p className="text-[17px] text-foreground" style={{ fontWeight: 900 }}>
                      {value!.toFixed(1)}
                    </p>
                  </div>
                );
              })}
          </button>
        )}

        {/* Text preview */}
        {hasText ? (
          <button
            type="button"
            onClick={() => onGoToStep(2)}
            className="w-full flex items-center justify-between rounded-[14px] p-3.5 mb-2 active:scale-[0.97] transition-all"
            style={{ background: 'hsl(var(--muted) / 0.5)' }}
          >
            <div className="flex-1 min-w-0 text-left">
              {title && (
                <p className="text-[14px] font-bold text-foreground truncate">{title}</p>
              )}
              {review && (
                <p className="text-[13px] text-muted-foreground mt-0.5 line-clamp-2">{review}</p>
              )}
            </div>
            <span className="text-[13px] font-semibold flex-shrink-0 ml-3" style={{ color: '#F7931E' }}>
              Edit ›
            </span>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => onGoToStep(2)}
            className="w-full flex items-center justify-between rounded-[14px] p-3.5 mb-2 active:scale-[0.97] transition-all"
            style={{ background: 'hsl(var(--muted) / 0.5)' }}
          >
            <span className="text-[13px] text-muted-foreground">No written review · ratings only</span>
            <span className="text-[13px] font-semibold" style={{ color: '#F7931E' }}>
              Add ›
            </span>
          </button>
        )}

        {/* Tags */}
        {selectedTags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {selectedTags.map(tag => (
              <span
                key={tag.id}
                className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-muted text-muted-foreground"
              >
                @{tag.username || tag.name}
              </span>
            ))}
          </div>
        )}
      </div>


      {/* Fullscreen media preview */}
      {previewMediaIndex !== null && (
        <MediaPreviewViewer
          items={composerMedia}
          initialIndex={previewMediaIndex}
          onClose={() => setPreviewMediaIndex(null)}
          onSetCover={(index) => {
            const item = composerMedia[index];
            if (item) onSetCover(item.id);
          }}
          coverIndex={composerMedia.findIndex(m => m.id === coverMediaId)}
        />
      )}
    </motion.div>
  );
}
