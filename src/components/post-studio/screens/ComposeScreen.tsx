// ComposeScreen — The single creative step
// Keyboard up on open. Text first. Media additive. Everything in one place.
// Dark. Minimal. Golf-native.

import React, { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import {
  Camera, Layers, BookOpen, AtSign, Wand2, Scissors,
  Image as ImageIcon, X, Play,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { StudioHeader } from '../components/StudioHeader';
import { MediaPreview } from '../components/MediaPreview';
import { CharacterRing } from '../components/CharacterRing';
import { ActorSelector } from '../components/ActorSelector';
import { usePostStudioContext } from '../usePostStudio';
import { validateMediaFile, POST_LIMITS, ALLOWED_VIDEO_TYPES, ALLOWED_IMAGE_TYPES } from '../constants';
import { BG_BASE, TEXT_PRIMARY, TEXT_TERTIARY, AMBER_GRADIENT } from '../tokens';
import type { StudioMediaItem } from '../types';
import type { StudioEdits, StudioTool } from '@/types/studio';
import StudioShelf from '@/components/studio/StudioShelf';

// ─── Media processing helpers ─────────────────────────────────────────────────

async function generatePoster(file: File): Promise<string> {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    video.preload = 'metadata'; video.muted = true; video.playsInline = true;
    const url = URL.createObjectURL(file);
    video.src = url;
    video.onloadeddata = () => { video.currentTime = 0.1; };
    video.onseeked = () => {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth; canvas.height = video.videoHeight;
      canvas.getContext('2d')?.drawImage(video, 0, 0);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL('image/jpeg', 0.7));
    };
    video.onerror = () => { URL.revokeObjectURL(url); resolve(''); };
  });
}

async function getVideoDuration(file: File): Promise<number | null> {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    const url = URL.createObjectURL(file);
    video.src = url;
    video.onloadedmetadata = () => {
      resolve(isFinite(video.duration) ? video.duration : null);
      URL.revokeObjectURL(url);
    };
    video.onerror = () => { URL.revokeObjectURL(url); resolve(null); };
  });
}

async function getImageDimensions(file: File): Promise<{ width: number; height: number } | null> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new window.Image();
    img.onload = () => { resolve({ width: img.naturalWidth, height: img.naturalHeight }); URL.revokeObjectURL(url); };
    img.onerror = () => { URL.revokeObjectURL(url); resolve(null); };
    img.src = url;
  });
}

async function filesToMediaItems(
  files: File[],
  onError?: (msg: string) => void
): Promise<StudioMediaItem[]> {
  const items: StudioMediaItem[] = [];
  for (const file of files) {
    const isVideo = file.type.startsWith('video/');
    let duration: number | null = null;
    if (isVideo) duration = await getVideoDuration(file);
    const validation = validateMediaFile(file, duration ?? undefined);
    if (!validation.valid) { onError?.(validation.error ?? `Invalid file: ${file.name}`); continue; }
    const previewUrl = URL.createObjectURL(file);
    if (isVideo) {
      const thumbnailUrl = await generatePoster(file);
      items.push({ id: crypto.randomUUID(), file, mediaType: 'video', previewUrl, thumbnailUrl: thumbnailUrl || undefined, duration, trimStart: 0, trimEnd: duration, posterTimestamp: 0, posterPreviewUrl: null, width: null, height: null, validationError: null });
    } else {
      const dims = await getImageDimensions(file);
      items.push({ id: crypto.randomUUID(), file, mediaType: 'image', previewUrl, duration: null, trimStart: 0, trimEnd: null, posterTimestamp: 0, posterPreviewUrl: null, width: dims?.width ?? null, height: dims?.height ?? null, validationError: null });
    }
  }
  return items;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

// ─── ComposeScreen ────────────────────────────────────────────────────────────

export function ComposeScreen({ onClose }: { onClose?: () => void }) {
  const {
    state, setStep, setActiveMedia, removeMedia, addMedia,
    setCaption, openPanel, updateMediaEdits,
    setMentions, setTaggedCourses, setMentionTriggerIndex,
  } = usePostStudioContext();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [shelfOpen, setShelfOpen] = useState(false);
  const [activeTool, setActiveTool] = useState<StudioTool>(null);
  const [activeOverlayId, setActiveOverlayId] = useState<string | null>(null);

  const hasMedia = state.mediaItems.length > 0;
  const activeItem = state.mediaItems[state.activeMediaIndex] ?? null;
  const activeIsVideo = activeItem?.mediaType === 'video';
  const acceptTypes = [...ALLOWED_VIDEO_TYPES, ...ALLOWED_IMAGE_TYPES].join(',');

  // Open keyboard immediately on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      textareaRef.current?.focus();
    }, 150);
    return () => clearTimeout(timer);
  }, []);

  // Character count with grapheme support
  const charCount = useMemo(() => {
    try {
      const S = (Intl as Record<string, unknown>).Segmenter as
        | (new (l: string, o: { granularity: string }) => { segment: (s: string) => Iterable<unknown> })
        | undefined;
      if (S) return [...new S('en', { granularity: 'grapheme' }).segment(state.caption)].length;
      return state.caption.length;
    } catch { return state.caption.length; }
  }, [state.caption]);

  const isValid = charCount <= POST_LIMITS.MAX_CAPTION_LENGTH && (hasMedia || state.caption.trim().length > 0);

  // File selection and processing
  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const fileList = e.target.files;
      if (!fileList || fileList.length === 0) return;
      const files = Array.from(fileList);
      const remaining = POST_LIMITS.MAX_MEDIA_COUNT - state.mediaItems.length;
      if (files.length > remaining) toast.error(`Max ${POST_LIMITS.MAX_MEDIA_COUNT} items per post`);
      const toProcess = files.slice(0, Math.max(0, remaining));
      if (toProcess.length === 0) return;
      setIsProcessing(true);
      try {
        const items = await filesToMediaItems(toProcess, (msg) => toast.error(msg));
        if (items.length > 0) addMedia(items);
      } catch (err) {
        console.error('[ComposeScreen] Failed to process files:', err);
        toast.error('Failed to process some files');
      } finally {
        setIsProcessing(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    },
    [state.mediaItems.length, addMedia]
  );

  // Caption change — detect @ for mention trigger
  const handleCaptionChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setCaption(val);
    const prev = state.caption;
    if (val.length === prev.length + 1) {
      const cursorPos = e.target.selectionStart! - 1;
      if (val[cursorPos] === '@') {
        setMentionTriggerIndex(cursorPos);
        openPanel('mention');
      }
    }
  }, [state.caption, setCaption, openPanel, setMentionTriggerIndex]);

  // Mention highlight layer
  const highlightedCaption = useMemo(() => {
    if (!state.mentions.length) return null;
    const parts: React.ReactNode[] = [];
    let last = 0;
    let partIndex = 0;
    const sorted = [...state.mentions].sort((a, b) => a.start - b.start);
    for (const m of sorted) {
      if (m.start > last) parts.push(<span key={`t-${partIndex++}`} style={{ color: 'rgba(255,255,255,0.85)' }}>{state.caption.slice(last, m.start)}</span>);
      parts.push(<span key={`m-${partIndex++}`} style={{ color: 'rgba(255,255,255,0.90)', fontWeight: 600 }}>{state.caption.slice(m.start, m.end)}</span>);
      last = m.end;
    }
    if (last < state.caption.length) parts.push(<span key={`t-${partIndex++}`} style={{ color: 'rgba(255,255,255,0.85)' }}>{state.caption.slice(last)}</span>);
    return parts;
  }, [state.caption, state.mentions]);

  const handleUpdateEdits = useCallback((patch: Partial<StudioEdits>) => {
    if (!activeItem) return;
    updateMediaEdits(activeItem.id, { ...(activeItem.edits ?? {}), ...patch });
  }, [activeItem, updateMediaEdits]);

  const handleClearEdits = useCallback(() => {
    if (!activeItem) return;
    updateMediaEdits(activeItem.id, {});
  }, [activeItem, updateMediaEdits]);

  const handleSwipeLeft = useCallback(() => {
    if (state.activeMediaIndex < state.mediaItems.length - 1) setActiveMedia(state.activeMediaIndex + 1);
  }, [state.activeMediaIndex, state.mediaItems.length, setActiveMedia]);

  const handleSwipeRight = useCallback(() => {
    if (state.activeMediaIndex > 0) setActiveMedia(state.activeMediaIndex - 1);
  }, [state.activeMediaIndex, setActiveMedia]);

  return (
    <div className="flex-1 flex flex-col" style={{ background: BG_BASE }}>
      <StudioHeader
        title="New Moment"
        step="COMPOSE"
        leftAction={onClose ? { label: '', onClick: onClose, icon: 'close' as const } : undefined}
        rightAction={
          isValid
            ? { label: 'Review', onClick: () => setStep('PUBLISH'), variant: 'primary' as const }
            : undefined
        }
      />

      <input ref={fileInputRef} type="file" accept={acceptTypes} multiple onChange={handleFileSelect} className="hidden" />

      {/* ── Scrollable compose area ── */}
      <div
        className="flex-1 overflow-y-auto"
        style={{ scrollbarWidth: 'none', overscrollBehavior: 'contain' }}
      >
        {/* Actor selector — who is posting */}
        <ActorSelector />

        {/* ── Text input ── */}
        <div className="px-4 pt-3 pb-2 relative">
          {/* Mention highlight layer */}
          {state.mentions.length > 0 && (
            <div
              aria-hidden="true"
              className="absolute inset-x-4 top-3 text-[17px] leading-relaxed pointer-events-none whitespace-pre-wrap break-words"
              style={{ wordBreak: 'break-word', minHeight: 120 }}
            >
              {highlightedCaption}
            </div>
          )}
          <textarea
            ref={textareaRef}
            value={state.caption}
            onChange={handleCaptionChange}
            placeholder="What happened on the course?"
            className="w-full resize-none outline-none leading-relaxed"
            style={{
              background: 'transparent',
              fontSize: 17,
              fontWeight: 400,
              color: state.mentions.length > 0 ? 'transparent' : 'rgba(255,255,255,0.90)',
              caretColor: 'rgba(255,255,255,0.80)',
              WebkitTextFillColor: state.mentions.length > 0 ? 'transparent' : undefined,
              minHeight: hasMedia ? 80 : 160,
              maxHeight: hasMedia ? 160 : 400,
            }}
            maxLength={POST_LIMITS.MAX_CAPTION_LENGTH + 100}
          />

          {/* Tagged course pills */}
          <AnimatePresence>
            {state.taggedCourses.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="flex flex-wrap gap-1.5 mt-1"
              >
                {state.taggedCourses.map((course) => (
                  <span
                    key={course.courseId}
                    className="inline-flex items-center gap-1.5 text-sm px-3 py-1 rounded-full"
                    style={{ background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.70)', border: '1px solid rgba(255,255,255,0.12)' }}
                  >
                    ⛳ {course.courseName}
                    <button
                      onClick={() => setTaggedCourses(state.taggedCourses.filter(c => c.courseId !== course.courseId))}
                      className="flex items-center justify-center w-4 h-4 rounded-full"
                      style={{ background: 'rgba(255,255,255,0.12)' }}
                    >
                      <X className="w-2.5 h-2.5" style={{ color: 'rgba(255,255,255,0.60)' }} strokeWidth={2.5} />
                    </button>
                  </span>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Media: full-bleed active preview ── */}
        {activeItem && (
          <div className="relative mx-4 mb-2 overflow-hidden" style={{ borderRadius: 16, boxShadow: '0 4px 20px rgba(0,0,0,0.40)' }}>
            <MediaPreview item={activeItem} onSwipeLeft={handleSwipeLeft} onSwipeRight={handleSwipeRight} />
            {/* Bottom scrim */}
            <div className="absolute bottom-0 left-0 right-0 pointer-events-none" style={{ height: 56, background: 'linear-gradient(to top, rgba(8,8,8,0.75), transparent)' }} />
            {/* Tool buttons */}
            <div className="absolute bottom-2.5 left-3 flex gap-1.5 z-10">
              <motion.button
                whileTap={{ scale: 0.93 }}
                onClick={() => { setActiveTool(null); setShelfOpen(true); }}
                className="flex items-center gap-1 px-2.5 py-1.5 text-[12px] font-medium"
                style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.13)', borderRadius: 10, color: 'rgba(255,255,255,0.85)' }}
              >
                <Wand2 className="w-3.5 h-3.5" strokeWidth={2} />
                Edit
                {activeItem.edits && Object.values(activeItem.edits).some(Boolean) && (
                  <span className="w-1.5 h-1.5 rounded-full ml-0.5" style={{ background: 'rgba(255,255,255,0.80)', flexShrink: 0 }} />
                )}
              </motion.button>
              {activeIsVideo && (
                <motion.button
                  whileTap={{ scale: 0.93 }}
                  onClick={() => setStep('TRIM')}
                  className="flex items-center gap-1 px-2.5 py-1.5 text-[12px] font-medium"
                  style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.13)', borderRadius: 10, color: 'rgba(255,255,255,0.85)' }}
                >
                  <Scissors className="w-3.5 h-3.5" strokeWidth={2} />
                  Trim
                  {(activeItem.trimStart > 0 || (activeItem.trimEnd !== null && activeItem.trimEnd !== activeItem.duration)) && (
                    <span className="w-1.5 h-1.5 rounded-full ml-0.5" style={{ background: 'rgba(255,255,255,0.80)', flexShrink: 0 }} />
                  )}
                </motion.button>
              )}
              {activeIsVideo && (
                <motion.button
                  whileTap={{ scale: 0.93 }}
                  onClick={() => setStep('POSTER')}
                  className="flex items-center gap-1 px-2.5 py-1.5 text-[12px] font-medium"
                  style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.13)', borderRadius: 10, color: 'rgba(255,255,255,0.85)' }}
                >
                  <ImageIcon className="w-3.5 h-3.5" strokeWidth={2} />
                  Cover
                  {activeItem.posterPreviewUrl && (
                    <span className="w-1.5 h-1.5 rounded-full ml-0.5" style={{ background: 'rgba(255,255,255,0.80)', flexShrink: 0 }} />
                  )}
                </motion.button>
              )}
            </div>
          </div>
        )}

        {/* ── Media thumbnail strip — shows when 2+ items ── */}
        {state.mediaItems.length > 1 && (
          <div className="flex items-center gap-2 overflow-x-auto px-4 pb-2" style={{ scrollbarWidth: 'none' }}>
            <AnimatePresence>
              {state.mediaItems.map((item, index) => {
                const isActive = index === state.activeMediaIndex;
                return (
                  <motion.div
                    key={item.id}
                    initial={{ scale: 0.85, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.85, opacity: 0 }}
                    transition={{ type: 'spring', damping: 22, stiffness: 380 }}
                    onClick={() => setActiveMedia(index)}
                    className="relative shrink-0 rounded-lg overflow-hidden cursor-pointer"
                    style={{
                      width: 56, height: 56,
                      border: isActive ? '2px solid rgba(255,255,255,0.80)' : '1px solid rgba(255,255,255,0.10)',
                      transform: isActive ? 'scale(1.06)' : 'scale(1)',
                      transition: 'transform 0.2s, border 0.2s',
                    }}
                  >
                    <img src={item.thumbnailUrl || item.previewUrl} alt="" className="w-full h-full object-cover" />
                    {item.mediaType === 'video' && (
                      <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.25)' }}>
                        <Play className="w-3 h-3 text-white" fill="white" strokeWidth={0} />
                      </div>
                    )}
                    <button
                      onClick={(e) => { e.stopPropagation(); removeMedia(item.id); }}
                      className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full flex items-center justify-center"
                      style={{ background: 'rgba(0,0,0,0.70)' }}
                    >
                      <X className="w-2.5 h-2.5 text-white" strokeWidth={2.5} />
                    </button>
                  </motion.div>
                );
              })}
            </AnimatePresence>
            {state.mediaItems.length < POST_LIMITS.MAX_MEDIA_COUNT && (
              <motion.button
                whileTap={{ scale: 0.93 }}
                onClick={() => fileInputRef.current?.click()}
                className="shrink-0 rounded-lg flex items-center justify-center"
                style={{ width: 56, height: 56, border: '1.5px dashed rgba(255,255,255,0.18)', background: 'rgba(255,255,255,0.04)' }}
              >
                <ImageIcon className="w-4 h-4" style={{ color: 'rgba(255,255,255,0.40)' }} strokeWidth={2} />
              </motion.button>
            )}
          </div>
        )}

        {/* Processing indicator */}
        <AnimatePresence>
          {isProcessing && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2 px-4 py-2 text-sm"
              style={{ color: 'rgba(255,255,255,0.35)' }}
            >
              <div className="w-3.5 h-3.5 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: 'rgba(255,255,255,0.20)', borderTopColor: 'transparent' }} />
              Processing…
            </motion.div>
          )}
        </AnimatePresence>

        <div className="h-4" />
      </div>

      {/* ── Bottom toolbar — always visible above keyboard ── */}
      <div
        className="shrink-0 flex items-center px-4"
        style={{
          height: 52,
          borderTop: '1px solid rgba(255,255,255,0.07)',
          background: 'rgba(8,8,8,0.98)',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        }}
      >
        {/* Camera — primary action, white circle */}
        <motion.button
          whileTap={{ scale: 0.92 }}
          onClick={() => fileInputRef.current?.click()}
          disabled={isProcessing}
          className="flex items-center justify-center disabled:opacity-40 mr-4"
          style={{
            width: 40, height: 40, borderRadius: '50%',
            background: 'rgba(255,255,255,0.96)',
            boxShadow: '0 2px 12px rgba(0,0,0,0.30)',
          }}
        >
          <Camera className="w-5 h-5" style={{ color: '#0D0D0D' }} strokeWidth={2} />
        </motion.button>

        {/* Gallery */}
        <motion.button
          whileTap={{ scale: 0.92 }}
          onClick={() => fileInputRef.current?.click()}
          disabled={isProcessing}
          className="flex items-center justify-center disabled:opacity-40 mr-4"
          style={{ width: 40, height: 40 }}
        >
          <Layers className="w-5 h-5" style={{ color: 'rgba(255,255,255,0.45)' }} strokeWidth={2} />
        </motion.button>

        {/* Divider */}
        <div className="w-px h-5 mr-4" style={{ background: 'rgba(255,255,255,0.10)' }} />

        {/* Mention */}
        <motion.button
          whileTap={{ scale: 0.92 }}
          onClick={() => { setMentionTriggerIndex(state.caption.length); openPanel('mention'); }}
          className="flex items-center justify-center mr-3"
          style={{ width: 40, height: 40 }}
        >
          <AtSign className="w-5 h-5" style={{ color: 'rgba(255,255,255,0.45)' }} strokeWidth={2} />
        </motion.button>

        {/* Course tag */}
        <motion.button
          whileTap={{ scale: 0.92 }}
          onClick={() => openPanel('course')}
          className="flex items-center justify-center mr-3"
          style={{ width: 40, height: 40 }}
        >
          <span className="text-xl" style={{ opacity: 0.50 }}>⛳</span>
        </motion.button>

        {/* Drafts */}
        <motion.button
          whileTap={{ scale: 0.92 }}
          onClick={() => openPanel('drafts')}
          className="flex items-center justify-center"
          style={{ width: 40, height: 40 }}
        >
          <BookOpen className="w-5 h-5" style={{ color: 'rgba(255,255,255,0.45)' }} strokeWidth={2} />
        </motion.button>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Character ring */}
        <div className="flex items-center justify-center" style={{ width: 36, height: 36 }}>
          <CharacterRing count={charCount} />
        </div>
      </div>

      {/* Studio Shelf */}
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
