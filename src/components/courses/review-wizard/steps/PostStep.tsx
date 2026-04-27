/**
 * Step 3: Post Your Review
 * Dispatch-styled media upload + inline review summary
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
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
  onSetMediaOrder: (items: ReviewMediaItem[]) => void;
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
  onSetMediaOrder,
  onGoToStep,
  onSubmit,
}: PostStepProps) {
  const [permissionDenied, setPermissionDenied] = useState<'camera' | 'photos' | null>(null);
  const [previewMediaIndex, setPreviewMediaIndex] = useState<number | null>(null);

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

  // Conditional Post step copy: branches on whether any media has been added
  const hasMedia = media.length > 0;
  const eyebrow = hasMedia ? 'READY TO POST' : 'ADD PHOTOS';
  const headline = hasMedia ? 'Ready to post' : 'Add photos?';
  const subline = hasMedia
    ? 'Looking great, post when ready'
    : 'Bring your review to life, or post as-is';

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
      <div style={{ textAlign: 'center', paddingBottom: 20 }}>
        <div style={{ fontSize: 8.5, fontWeight: 900, color: '#F7931E', letterSpacing: '0.16em', textTransform: 'uppercase' as const, marginBottom: 6 }}>⚡ {eyebrow}</div>
        <div style={{ fontSize: 22, fontWeight: 900, color: '#0F172A', letterSpacing: '-0.03em' }}>{headline}</div>
        <div style={{ fontSize: 13, color: '#94A3B8', marginTop: 4 }}>{subline}</div>
      </div>

      {/* Media block */}
      <div
        style={{
          borderRadius: 12,
          marginBottom: 20,
          border: media.length > 0 ? '1px solid rgba(15,23,42,0.07)' : '2px dashed rgba(247,147,30,0.3)',
          background: media.length > 0 ? 'transparent' : 'rgba(247,147,30,0.02)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 12px 4px' }}>
          <span style={{ fontSize: 8.5, fontWeight: 900, color: '#CBD5E1', letterSpacing: '0.12em', textTransform: 'uppercase' as const }}>
            Photos &amp; Videos · <span style={{ fontWeight: 400, letterSpacing: 'normal', textTransform: 'none' as const }}>optional</span>
          </span>
          {media.length > 0 && media.length < MAX_MEDIA_ITEMS && (
            <button
              type="button"
              onClick={handlePickMedia}
              style={{ fontSize: 13, fontWeight: 700, color: '#F7931E', background: 'transparent', border: 'none', cursor: 'pointer' }}
              className="active:scale-[0.95] transition-all"
            >
              + Add more
            </button>
          )}
        </div>

        <div style={{ padding: '0 12px 12px' }}>
        {permissionDenied && (
          <PermissionDeniedCard type={permissionDenied} onRetry={() => setPermissionDenied(null)} />
        )}

        {media.length === 0 ? (
          <button
            type="button"
            onClick={handlePickMedia}
            className="w-full py-8 flex flex-col items-center gap-2 active:scale-[0.97] transition-all"
            style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}
          >
            <div
              style={{ width: 48, height: 48, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(247,147,30,0.08)' }}
            >
              <Camera className="w-5 h-5" style={{ color: '#F7931E' }} />
            </div>
            <p style={{ fontSize: 14, fontWeight: 600, color: '#0F172A' }}>Add photos or videos</p>
            <p style={{ fontSize: 12, color: '#94A3B8' }}>Up to 10 · first photo is cover</p>
          </button>
        ) : (
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
              {media.length}/{MAX_MEDIA_ITEMS}
            </p>
          </div>
        )}
        </div>
      </div>

      {/* Inline review summary */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <div style={{ width: 3, height: 12, background: '#F7931E', borderRadius: 1, flexShrink: 0 }} />
          <span style={{ fontSize: 8.5, fontWeight: 900, color: '#CBD5E1', letterSpacing: '0.14em', textTransform: 'uppercase' as const }}>Your Review Summary</span>
        </div>

        <div style={{ border: '1px solid rgba(15,23,42,0.07)', borderRadius: 12, overflow: 'hidden' }}>
          {/* Score + tier row */}
          {rating !== null && tierInfo && (
            <button
              type="button"
              onClick={() => onGoToStep(1)}
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'transparent', border: 'none', borderBottom: '0.5px solid rgba(15,23,42,0.07)', cursor: 'pointer', textAlign: 'left' as const }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 22, fontWeight: 900, color: '#0F172A', letterSpacing: '-0.04em', fontVariantNumeric: 'tabular-nums' }}>
                    {rating.toFixed(1)}
                  </span>
                  <span style={{ fontSize: 10, fontWeight: 700, color: '#0F172A', textTransform: 'uppercase' as const, letterSpacing: '0.05em' }}>
                    {tierInfo.label}
                  </span>
                </div>
              </div>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#F7931E' }}>Edit ›</span>
            </button>
          )}

          {/* Breakdown strip — 4-col grid */}
          {hasBreakdowns && (
            <button
              type="button"
              onClick={() => onGoToStep(1)}
              style={{ width: '100%', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', borderBottom: '0.5px solid rgba(15,23,42,0.07)', background: 'transparent', border: 'none', borderBottomStyle: 'solid', borderBottomWidth: 0.5, borderBottomColor: 'rgba(15,23,42,0.07)', padding: 0, cursor: 'pointer' }}
            >
              {(Object.entries(breakdowns) as [keyof ReviewBreakdowns, number | null][]).map(([key, value], i) => (
                <div key={key} style={{ padding: '7px 0', textAlign: 'center' as const, borderRight: i < 3 ? '0.5px solid rgba(15,23,42,0.07)' : 'none' }}>
                  <div style={{ fontSize: 8, fontWeight: 900, color: '#CBD5E1', letterSpacing: '0.08em', textTransform: 'uppercase' as const, marginBottom: 2 }}>
                    {key === 'clubhouse' ? 'CLBHS' : BREAKDOWN_LABELS[key].slice(0, 4).toUpperCase()}
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 800, color: value !== null ? '#0F172A' : 'rgba(15,23,42,0.2)' }}>
                    {value !== null ? value.toFixed(1) : '—'}
                  </div>
                </div>
              ))}
            </button>
          )}

          {/* Written review preview */}
          {hasText ? (
            <button
              type="button"
              onClick={() => onGoToStep(2)}
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left' as const }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                {title && <div style={{ fontSize: 14, fontWeight: 700, color: '#0F172A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{title}</div>}
                {review && <div style={{ fontSize: 13, color: '#94A3B8', marginTop: 2, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const }}>{review}</div>}
              </div>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#F7931E', flexShrink: 0, marginLeft: 12 }}>Edit ›</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onGoToStep(2)}
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left' as const }}
            >
              <span style={{ fontSize: 13, color: '#94A3B8' }}>No written review · ratings only</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#F7931E' }}>Add ›</span>
            </button>
          )}
        </div>

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