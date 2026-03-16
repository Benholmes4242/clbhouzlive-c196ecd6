// ComposerScreen — Step 2: The creative canvas
// Dark immersive studio. Media front and centre. Tools feel pro, not form-like.

import React, { useState, useCallback, useRef, useMemo } from 'react';
import { AtSign, Scissors, Image as ImageIcon, Plus, ChevronRight, Wand2, X } from 'lucide-react';
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
    setMentions,
    setTaggedCourses,
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

  // Detect @ typed in textarea → open mention panel
  const handleCaptionChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setCaption(val);
    const prev = state.caption;
    if (val.length === prev.length + 1) {
      const newChar = val[e.target.selectionStart! - 1];
      if (newChar === '@') openPanel('mention');
    }
  }, [state.caption, setCaption, openPanel]);

  // Render caption with amber @mention highlights
  const highlightedCaption = useMemo(() => {
    if (!state.mentions.length) return null;
    const parts: React.ReactNode[] = [];
    let last = 0;
    let partIndex = 0;
    const sorted = [...state.mentions].sort((a, b) => a.start - b.start);
    for (const m of sorted) {
      if (m.start > last) {
        parts.push(<span key={`t-${partIndex++}`}>{state.caption.slice(last, m.start)}</span>);
      }
      parts.push(
        <span key={`m-${partIndex++}`} style={{ color: 'rgba(232,152,10,0.90)', fontWeight: 500 }}>
          {state.caption.slice(m.start, m.end)}
        </span>
      );
      last = m.end;
    }
    if (last < state.caption.length) {
      parts.push(<span key={`t-${partIndex++}`}>{state.caption.slice(last)}</span>);
    }
    return parts;
  }, [state.caption, state.mentions]);

  const acceptTypes = [...ALLOWED_VIDEO_TYPES, ...ALLOWED_IMAGE_TYPES].join(',');

  return (
    <div className="flex-1 flex flex-col" style={{ background: BG_BASE }}>
      <StudioHeader
        title="Moment"
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
            {/* Video tool bar — Edit / Trim / Cover with inline status dots */}
            <div className="absolute bottom-3 left-3 right-3 flex gap-1.5 z-10">
              {/* Edit — all media */}
              <motion.button
                whileTap={{ scale: 0.93 }}
                onClick={() => { setActiveTool(null); setShelfOpen(true); }}
                className="flex items-center gap-1 px-2.5 py-1.5 text-[12px] font-medium"
                style={{ background: 'rgba(0,0,0,0.60)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.13)', borderRadius: 10, color: 'rgba(255,255,255,0.85)' }}
              >
                <Wand2 className="w-3.5 h-3.5" strokeWidth={1.75} />
                Edit
                {activeItem.edits && Object.values(activeItem.edits).some(Boolean) && (
                  <span className="w-1.5 h-1.5 rounded-full ml-0.5" style={{ background: 'rgba(232,152,10,0.90)', flexShrink: 0 }} />
                )}
              </motion.button>

              {/* Trim — video only */}
              {activeIsVideo && (
                <motion.button
                  whileTap={{ scale: 0.93 }}
                  onClick={() => setStep('TRIM')}
                  className="flex items-center gap-1 px-2.5 py-1.5 text-[12px] font-medium"
                  style={{ background: 'rgba(0,0,0,0.60)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.13)', borderRadius: 10, color: 'rgba(255,255,255,0.85)' }}
                >
                  <Scissors className="w-3.5 h-3.5" strokeWidth={1.75} />
                  Trim
                  {(activeItem.trimStart > 0 || (activeItem.trimEnd !== null && activeItem.trimEnd !== activeItem.duration)) && (
                    <span className="w-1.5 h-1.5 rounded-full ml-0.5" style={{ background: 'rgba(232,152,10,0.90)', flexShrink: 0 }} />
                  )}
                </motion.button>
              )}

              {/* Cover — video only */}
              {activeIsVideo && (
                <motion.button
                  whileTap={{ scale: 0.93 }}
                  onClick={() => setStep('POSTER')}
                  className="flex items-center gap-1 px-2.5 py-1.5 text-[12px] font-medium"
                  style={{ background: 'rgba(0,0,0,0.60)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.13)', borderRadius: 10, color: 'rgba(255,255,255,0.85)' }}
                >
                  <ImageIcon className="w-3.5 h-3.5" strokeWidth={1.75} />
                  Cover
                  {activeItem.posterPreviewUrl && (
                    <span className="w-1.5 h-1.5 rounded-full ml-0.5" style={{ background: 'rgba(232,152,10,0.90)', flexShrink: 0 }} />
                  )}
                </motion.button>
              )}
            </div>
          </div>
        )}

        <ActorSelector />
        <MediaReel items={state.mediaItems} activeIndex={state.activeMediaIndex} onSelect={setActiveMedia} onRemove={removeMedia} onAddMore={() => fileInputRef.current?.click()} />

        {/* Caption card */}
        <div className="mx-4 mt-2" style={{ background: 'rgba(255,255,255,0.055)', border: '1px solid rgba(255,255,255,0.10)', borderRadius: 24 }}>
          <div className="px-4 pt-4 pb-3 relative">
            {/* Highlight layer — sits behind textarea, mirrors its text */}
            {state.mentions.length > 0 && (
              <div
                aria-hidden="true"
                className="absolute inset-x-4 top-4 text-sm leading-relaxed min-h-[120px] pointer-events-none whitespace-pre-wrap break-words"
                style={{ color: 'transparent', wordBreak: 'break-word' }}
              >
                {highlightedCaption}
              </div>
            )}
            <textarea
              ref={textareaRef}
              value={state.caption}
              onChange={handleCaptionChange}
              placeholder="Tell the story…"
              rows={4}
              className="w-full text-sm resize-none outline-none min-h-[120px] leading-relaxed relative"
              style={{
                background: 'transparent',
                color: state.mentions.length > 0 ? 'transparent' : 'rgba(255,255,255,0.85)',
                caretColor: 'rgba(255,255,255,0.70)',
                WebkitTextFillColor: state.mentions.length > 0 ? 'transparent' : undefined,
              }}
              maxLength={POST_LIMITS.MAX_CAPTION_LENGTH + 100}
            />
          </div>

          <AnimatePresence>
            {state.taggedCourses.length > 0 && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                <div className="flex flex-wrap gap-1.5 px-4 py-2" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                  {state.taggedCourses.map((course) => (
                    <span key={course.courseId} className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium" style={{ background: AMBER_GHOST, color: 'rgba(232,152,10,0.90)', border: '1px solid rgba(232,152,10,0.25)' }}>
                      ⛳ {course.courseName}
                      <button
                        onClick={() => setTaggedCourses(state.taggedCourses.filter(c => c.courseId !== course.courseId))}
                        className="flex items-center justify-center w-3.5 h-3.5 rounded-full"
                        style={{ background: 'rgba(232,152,10,0.20)', marginLeft: 1 }}
                      >
                        <X className="w-2 h-2" style={{ color: 'rgba(232,152,10,0.85)' }} strokeWidth={2.5} />
                      </button>
                    </span>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Toolbar — hairline separator */}
          <div className="flex items-center gap-2 px-3 py-3 flex-wrap" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
            {/* Icon-only Mention */}
            <motion.button whileTap={{ scale: 0.93 }} onClick={() => openPanel('mention')} className="flex items-center justify-center rounded-xl" style={{ width: 40, height: 40, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}>
              <AtSign className="w-[18px] h-[18px]" strokeWidth={2} style={{ color: 'rgba(255,255,255,0.75)' }} />
            </motion.button>
            <motion.button whileTap={{ scale: 0.93 }} onClick={() => openPanel('course')} className="flex items-center justify-center rounded-xl" style={{ width: 40, height: 40, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}>
              <span className="text-base leading-none">⛳</span>
            </motion.button>
            {/* Character ring pushed right */}
            <div className="ml-auto flex items-center justify-center" style={{ width: 40, height: 40 }}>
              <CharacterRing count={charCount} />
            </div>
          </div>
        </div>

        <div className="h-10" />
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
