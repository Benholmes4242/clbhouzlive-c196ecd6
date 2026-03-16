// ComposerScreen — Step 2: The creative canvas
// Dark immersive studio. Media front and centre. Tools feel pro, not form-like.

import React, { useState, useCallback, useRef } from 'react';
import { AtSign, Scissors, Image as ImageIcon, Plus, ChevronRight, Wand2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { StudioHeader } from '../components/StudioHeader';
import { MediaPreview } from '../components/MediaPreview';
import { MediaReel } from '../components/MediaReel';
import { CharacterRing } from '../components/CharacterRing';
import { ActorSelector } from '../components/ActorSelector';
import { usePostStudioContext } from '../usePostStudio';
import { ALLOWED_VIDEO_TYPES, ALLOWED_IMAGE_TYPES, POST_LIMITS } from '../constants';
import { BG_BASE, BG_CARD, AMBER, AMBER_DEEP, AMBER_DIM, AMBER_GHOST, AMBER_GRADIENT, BORDER_CARD, TEXT_PRIMARY, TEXT_SECONDARY, TEXT_TERTIARY } from '../tokens';
import type { StudioMediaItem } from '../types';
import type { StudioEdits, StudioTool } from '@/types/studio';
import StudioShelf from '@/components/studio/StudioShelf';
import { toast } from 'sonner';

export function ComposerScreen() {
  const {
    state, setStep, setActiveMedia, removeMedia, addMedia,
    setCaption, openPanel,
    updateMediaEdits,
  } = usePostStudioContext();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const activeItem = state.mediaItems[state.activeMediaIndex] ?? null;
  const activeIsVideo = activeItem?.mediaType === 'video';

  const [shelfOpen, setShelfOpen] = useState(false);
  const [activeTool, setActiveTool] = useState<StudioTool>(null);
  const [activeOverlayId, setActiveOverlayId] = useState<string | null>(null);

  const handleUpdateEdits = useCallback(
    (patch: Partial<StudioEdits>) => {
      if (!activeItem) return;
      const merged = { ...(activeItem.edits ?? {}), ...patch };
      updateMediaEdits(activeItem.id, merged);
    },
    [activeItem, updateMediaEdits]
  );

  const handleClearEdits = useCallback(() => {
    if (!activeItem) return;
    updateMediaEdits(activeItem.id, {});
  }, [activeItem, updateMediaEdits]);

  const charCount = (() => {
    try {
      const S = (Intl as Record<string, unknown>).Segmenter as
        | (new (l: string, o: { granularity: string }) => { segment: (s: string) => Iterable<unknown> })
        | undefined;
      if (S) return [...new S('en', { granularity: 'grapheme' }).segment(state.caption)].length;
      return state.caption.length;
    } catch { return state.caption.length; }
  })();

  const isValid = state.mediaItems.length > 0 && charCount <= POST_LIMITS.MAX_CAPTION_LENGTH;

  const handleSwipeLeft = useCallback(() => {
    if (state.activeMediaIndex < state.mediaItems.length - 1) setActiveMedia(state.activeMediaIndex + 1);
  }, [state.activeMediaIndex, state.mediaItems.length, setActiveMedia]);

  const handleSwipeRight = useCallback(() => {
    if (state.activeMediaIndex > 0) setActiveMedia(state.activeMediaIndex - 1);
  }, [state.activeMediaIndex, setActiveMedia]);

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const fileList = e.target.files;
      if (!fileList) return;
      const files = Array.from(fileList);
      const remaining = POST_LIMITS.MAX_MEDIA_COUNT - state.mediaItems.length;
      if (files.length > remaining) toast.error(`Max ${POST_LIMITS.MAX_MEDIA_COUNT} items per post`);
      const toProcess = files.slice(0, Math.max(0, remaining));
      const items: StudioMediaItem[] = [];
      for (const file of toProcess) {
        const isVideo = file.type.startsWith('video/');
        items.push({
          id: crypto.randomUUID(), file, mediaType: isVideo ? 'video' : 'image',
          previewUrl: URL.createObjectURL(file),
          duration: null, trimStart: 0, trimEnd: null, posterTimestamp: 0,
          posterPreviewUrl: null, width: null, height: null, validationError: null,
        });
      }
      if (items.length > 0) addMedia(items);
      if (fileInputRef.current) fileInputRef.current.value = '';
    },
    [state.mediaItems.length, addMedia]
  );

  const acceptTypes = [...ALLOWED_VIDEO_TYPES, ...ALLOWED_IMAGE_TYPES].join(',');

  return (
    <div className="flex-1 flex flex-col" style={{ background: BG_BASE }}>
      <StudioHeader
        title="Compose"
        step="COMPOSER"
        leftAction={{ label: 'Back', onClick: () => setStep('MEDIA_PICKER') }}
        rightAction={{ label: 'Review', onClick: () => setStep('PUBLISH'), variant: 'primary', disabled: !isValid }}
      />

      <input ref={fileInputRef} type="file" accept={acceptTypes} multiple onChange={handleFileSelect} className="hidden" />

      <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: 'none', overscrollBehavior: 'contain' }}>
        {/* Full-bleed media preview */}
        {activeItem && (
          <div className="relative overflow-hidden" style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}>
            <MediaPreview item={activeItem} onSwipeLeft={handleSwipeLeft} onSwipeRight={handleSwipeRight} />
            {/* Bottom scrim gradient */}
            <div className="absolute bottom-0 left-0 right-0 pointer-events-none" style={{ height: 60, background: `linear-gradient(to top, rgba(8,8,8,0.8), transparent)` }} />
            {/* Edit button — all media types */}
            <div className="absolute bottom-3 left-3 z-10">
              <motion.button whileTap={{ scale: 0.93 }} onClick={() => { setActiveTool(null); setShelfOpen(true); }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium"
                style={{
                  background: 'rgba(0,0,0,0.65)',
                  backdropFilter: 'blur(12px)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  borderRadius: 12,
                  color: 'rgba(255,255,255,0.85)',
                }}
              >
                <Wand2 className="w-4 h-4" strokeWidth={1.75} />
                Edit
              </motion.button>
            </div>

            {/* Floating trim/cover buttons for video */}
            {activeIsVideo && (
              <div className="absolute bottom-3 right-3 flex gap-2 z-10">
                <motion.button whileTap={{ scale: 0.93 }} onClick={() => setStep('TRIM')} className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium" style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 12, color: 'rgba(255,255,255,0.85)' }}>
                  <Scissors className="w-4 h-4" strokeWidth={1.75} /> Trim
                </motion.button>
                <motion.button whileTap={{ scale: 0.93 }} onClick={() => setStep('POSTER')} className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium" style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 12, color: 'rgba(255,255,255,0.85)' }}>
                  <ImageIcon className="w-4 h-4" strokeWidth={1.75} /> Cover
                </motion.button>
                {(activeItem.trimStart > 0 || (activeItem.trimEnd !== null && activeItem.trimEnd !== activeItem.duration)) && (
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full self-center" style={{ background: 'rgba(245,158,11,0.20)', color: 'rgba(245,158,11,0.90)' }}>Trimmed</span>
                )}
              </div>
            )}
          </div>
        )}

        <ActorSelector />
        <MediaReel items={state.mediaItems} activeIndex={state.activeMediaIndex} onSelect={setActiveMedia} onRemove={removeMedia} onAddMore={() => fileInputRef.current?.click()} />

        {/* Caption card */}
        <div className="mx-4 mt-3" style={{ background: BG_CARD, border: BORDER_CARD, borderRadius: 24 }}>
          <div className="px-4 pt-4 pb-3 relative">
            <textarea
              ref={textareaRef}
              value={state.caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Tell the story…"
              rows={4}
              className="w-full text-sm resize-none outline-none min-h-[120px] leading-relaxed"
              style={{ background: 'transparent', color: 'rgba(255,255,255,0.85)', caretColor: AMBER }}
              maxLength={POST_LIMITS.MAX_CAPTION_LENGTH + 100}
            />
          </div>

          <AnimatePresence>
            {state.taggedCourses.length > 0 && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                <div className="flex flex-wrap gap-1.5 px-4 py-2" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                  {state.taggedCourses.map((course) => (
                    <span key={course.courseId} className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium" style={{ background: AMBER_GHOST, color: 'rgba(245,158,11,0.90)', border: '1px solid rgba(245,158,11,0.25)' }}>
                      ⛳ {course.courseName}
                    </span>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Toolbar — hairline separator */}
          <div className="flex items-center gap-2 px-3 py-3 flex-wrap" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
            {/* Icon-only Mention */}
            <motion.button whileTap={{ scale: 0.93 }} onClick={() => openPanel('mention')} className="flex items-center justify-center rounded-xl" style={{ width: 40, height: 40, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <AtSign className="w-[18px] h-[18px]" strokeWidth={2} style={{ color: 'rgba(255,255,255,0.60)' }} />
            </motion.button>
            {/* Icon-only Course with golf flag */}
            <motion.button whileTap={{ scale: 0.93 }} onClick={() => openPanel('course')} className="flex items-center justify-center rounded-xl" style={{ width: 40, height: 40, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <span className="text-base leading-none">⛳</span>
            </motion.button>
            {/* Review toggle pushed right */}
            <motion.button layout whileTap={{ scale: 0.93 }} onClick={() => setPostType(state.postType === 'standard' ? 'review' : 'standard')}
              className="ml-auto flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-bold min-h-[40px]"
              style={
                state.postType === 'review'
                  ? { background: AMBER_GHOST, color: AMBER, border: '1px solid rgba(245,158,11,0.35)' }
                  : { background: 'rgba(245,158,11,0.08)', color: 'rgba(245,158,11,0.60)', border: '1px solid rgba(245,158,11,0.18)' }
              }
            >
              <Star className="w-3.5 h-3.5" strokeWidth={2} fill={state.postType === 'review' ? AMBER : 'none'} />
              {state.postType === 'review' ? 'Review on' : 'Add review'}
            </motion.button>
          </div>
        </div>

        {/* Review rating card */}
        <AnimatePresence>
          {state.postType === 'review' && (
            <motion.div initial={{ height: 0, opacity: 0, y: -8 }} animate={{ height: 'auto', opacity: 1, y: 0 }} exit={{ height: 0, opacity: 0, y: -8 }} transition={{ type: 'spring', damping: 28, stiffness: 360 }} className="overflow-hidden mx-4 mt-2">
              <div className="p-4 rounded-[24px]" style={{ background: `linear-gradient(135deg, ${AMBER_GHOST} 0%, rgba(245,158,11,0.04) 100%)`, border: '1px solid rgba(245,158,11,0.20)' }}>
                <p className="text-[13px] font-medium mb-3 text-center" style={{ color: AMBER_DIM }}>Course Rating</p>
                <div className="flex items-center justify-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => {
                    const isActive = (state.reviewRating ?? 0) >= star;
                    return (
                      <motion.button key={star} whileTap={{ scale: 0.85 }} onClick={() => setReviewRating(star === state.reviewRating ? null : star)} className="flex items-center justify-center" style={{ minWidth: 44, minHeight: 44 }}>
                        <motion.div animate={{ scale: isActive ? 1.15 : 1 }} transition={{ type: 'spring', damping: 20, stiffness: 400 }}>
                          <Star className="w-9 h-9" strokeWidth={1.5} style={{ fill: isActive ? AMBER : 'transparent', color: isActive ? AMBER : 'rgba(255,255,255,0.20)', filter: isActive ? 'drop-shadow(0 0 8px rgba(245,158,11,0.7))' : 'none' }} />
                        </motion.div>
                      </motion.button>
                    );
                  })}
                </div>
                {/* Animated rating label */}
                <AnimatePresence>
                  {state.reviewRating && (
                    <motion.p
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 6 }}
                      className="text-3xl font-bold text-center mt-3"
                      style={{ color: AMBER }}
                    >
                      {state.reviewRating}.0 ★
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div className="h-6" />
      </div>

      {/* Studio Shelf — crop, filter, text, music */}
      {activeItem && (
        <StudioShelf
          open={shelfOpen}
          onClose={() => setShelfOpen(false)}
          activeTool={activeTool}
          setActiveTool={setActiveTool}
          activeMediaId={activeItem.id}
          activeMediaType={activeItem.mediaType}
          activeMediaPreviewUrl={activeItem.previewUrl}
          activeMediaThumbnailUrl={activeItem.thumbnailUrl ?? null}
          edits={activeItem.edits ?? {}}
          updateEdits={handleUpdateEdits}
          clearEdits={handleClearEdits}
          activeOverlayId={activeOverlayId}
          onSelectOverlay={setActiveOverlayId}
        />
      )}
    </div>
  );
}
