// ComposerScreen — Step 2: The creative canvas
// Dark immersive studio. Media front and centre. Tools feel pro, not form-like.

import React, { useCallback, useRef } from 'react';
import { AtSign, Flag, Scissors, Image as ImageIcon, Star, Plus, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { StudioHeader } from '../components/StudioHeader';
import { MediaPreview } from '../components/MediaPreview';
import { MediaReel } from '../components/MediaReel';
import { CharacterRing } from '../components/CharacterRing';
import { ActorSelector } from '../components/ActorSelector';
import { usePostStudioContext } from '../usePostStudio';
import { ALLOWED_VIDEO_TYPES, ALLOWED_IMAGE_TYPES, POST_LIMITS } from '../constants';
import type { StudioMediaItem } from '../types';
import { toast } from 'sonner';

const CARD_STYLE: React.CSSProperties = {
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.07)',
  borderRadius: 20,
};

export function ComposerScreen() {
  const {
    state, setStep, setActiveMedia, removeMedia, addMedia,
    setCaption, openPanel, setPostType, setReviewRating,
  } = usePostStudioContext();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const activeItem = state.mediaItems[state.activeMediaIndex] ?? null;
  const activeIsVideo = activeItem?.mediaType === 'video';

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
    <div className="flex-1 flex flex-col" style={{ background: '#0D0D0D' }}>
      <StudioHeader
        title="Compose"
        step="COMPOSER"
        leftAction={{ label: 'Back', onClick: () => setStep('MEDIA_PICKER') }}
        rightAction={{ label: 'Next', onClick: () => setStep('PUBLISH'), variant: 'primary', disabled: !isValid }}
      />

      <input ref={fileInputRef} type="file" accept={acceptTypes} multiple onChange={handleFileSelect} className="hidden" />

      <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
        {activeItem && (
          <div className="mx-4 mt-3 rounded-[20px] overflow-hidden" style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}>
            <MediaPreview item={activeItem} onSwipeLeft={handleSwipeLeft} onSwipeRight={handleSwipeRight} />
            {activeIsVideo && (
              <div className="flex items-center gap-2 px-3 py-2" style={{ background: 'rgba(0,0,0,0.70)', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                <motion.button whileTap={{ scale: 0.93 }} onClick={() => setStep('TRIM')} className="flex items-center gap-1.5 px-3 py-2 rounded-xl min-h-[44px] text-sm font-medium" style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.80)', border: '1px solid rgba(255,255,255,0.10)' }}>
                  <Scissors className="w-4 h-4" strokeWidth={1.75} /> Trim
                </motion.button>
                <motion.button whileTap={{ scale: 0.93 }} onClick={() => setStep('POSTER')} className="flex items-center gap-1.5 px-3 py-2 rounded-xl min-h-[44px] text-sm font-medium" style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.80)', border: '1px solid rgba(255,255,255,0.10)' }}>
                  <ImageIcon className="w-4 h-4" strokeWidth={1.75} /> Cover
                </motion.button>
                {(activeItem.trimStart > 0 || (activeItem.trimEnd !== null && activeItem.trimEnd !== activeItem.duration)) && (
                  <span className="ml-auto text-[11px] font-semibold px-2 py-0.5 rounded-full" style={{ background: 'rgba(245,158,11,0.20)', color: 'rgba(245,158,11,0.90)' }}>Trimmed</span>
                )}
              </div>
            )}
          </div>
        )}

        <ActorSelector />
        <MediaReel items={state.mediaItems} activeIndex={state.activeMediaIndex} onSelect={setActiveMedia} onRemove={removeMedia} onAddMore={() => fileInputRef.current?.click()} />

        <div className="mx-4 mt-3" style={CARD_STYLE}>
          <div className="px-4 pt-4 pb-3 relative">
            <textarea
              ref={textareaRef}
              value={state.caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="What happened out there…"
              rows={4}
              className="w-full text-sm resize-none outline-none min-h-[100px] leading-relaxed"
              style={{ background: 'transparent', color: 'rgba(255,255,255,0.85)', caretColor: '#f59e0b' }}
              maxLength={POST_LIMITS.MAX_CAPTION_LENGTH + 100}
            />
            <div className="absolute bottom-3 right-4">
              <CharacterRing count={charCount} />
            </div>
          </div>

          <AnimatePresence>
            {state.taggedCourses.length > 0 && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                <div className="flex flex-wrap gap-1.5 px-4 py-2" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                  {state.taggedCourses.map((course) => (
                    <span key={course.courseId} className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium" style={{ background: 'rgba(245,158,11,0.15)', color: 'rgba(245,158,11,0.90)', border: '1px solid rgba(245,158,11,0.25)' }}>
                      ⛳ {course.courseName}
                    </span>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex items-center gap-2 px-3 py-3 flex-wrap" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <motion.button whileTap={{ scale: 0.93 }} onClick={() => openPanel('mention')} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium min-h-[40px]" style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.60)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <AtSign className="w-4 h-4" strokeWidth={2} /> Mention
            </motion.button>
            <motion.button whileTap={{ scale: 0.93 }} onClick={() => openPanel('course')} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium min-h-[40px]" style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.60)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <Flag className="w-4 h-4" strokeWidth={2} /> Course
            </motion.button>
            <motion.button layout whileTap={{ scale: 0.93 }} onClick={() => setPostType(state.postType === 'standard' ? 'review' : 'standard')} className="ml-auto flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-bold min-h-[40px]"
              style={state.postType === 'review' ? { background: 'rgba(245,158,11,0.20)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.35)' } : { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.45)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <Star className="w-3.5 h-3.5" strokeWidth={2} fill={state.postType === 'review' ? '#f59e0b' : 'none'} />
              {state.postType === 'review' ? 'Review' : 'Post'}
            </motion.button>
          </div>
        </div>

        <AnimatePresence>
          {state.postType === 'review' && (
            <motion.div initial={{ height: 0, opacity: 0, y: -8 }} animate={{ height: 'auto', opacity: 1, y: 0 }} exit={{ height: 0, opacity: 0, y: -8 }} transition={{ type: 'spring', damping: 28, stiffness: 360 }} className="overflow-hidden mx-4 mt-2">
              <div className="p-4 rounded-[20px]" style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.08) 0%, rgba(245,158,11,0.04) 100%)', border: '1px solid rgba(245,158,11,0.20)' }}>
                <p className="text-[11px] font-semibold uppercase tracking-[1.5px] mb-3" style={{ color: 'rgba(245,158,11,0.70)' }}>Course Rating</p>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => {
                    const isActive = (state.reviewRating ?? 0) >= star;
                    return (
                      <motion.button key={star} whileTap={{ scale: 0.85 }} onClick={() => setReviewRating(star === state.reviewRating ? null : star)} className="flex items-center justify-center" style={{ minWidth: 44, minHeight: 44 }}>
                        <motion.div animate={{ scale: isActive ? 1.15 : 1 }} transition={{ type: 'spring', damping: 20, stiffness: 400 }}>
                          <Star className="w-8 h-8" strokeWidth={1.5} style={{ fill: isActive ? '#f59e0b' : 'transparent', color: isActive ? '#f59e0b' : 'rgba(255,255,255,0.20)', filter: isActive ? 'drop-shadow(0 0 6px rgba(245,158,11,0.6))' : 'none' }} />
                        </motion.div>
                      </motion.button>
                    );
                  })}
                  {state.reviewRating && (
                    <motion.span initial={{ opacity: 0, x: -4 }} animate={{ opacity: 1, x: 0 }} className="ml-2 text-sm font-bold" style={{ color: '#f59e0b' }}>{state.reviewRating}/5</motion.span>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div className="h-6" />
      </div>
    </div>
  );
}
