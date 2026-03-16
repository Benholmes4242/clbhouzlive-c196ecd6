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
import { CharacterRing } from '../components/CharacterRing';
import { ActorSelector } from '../components/ActorSelector';
import { usePostStudioContext } from '../usePostStudio';
import { validateMediaFile, POST_LIMITS, ALLOWED_VIDEO_TYPES, ALLOWED_IMAGE_TYPES } from '../constants';
import { BG_BASE } from '../tokens';
import type { StudioMediaItem } from '../types';
import type { StudioEdits, StudioTool } from '@/types/studio';
import StudioShelf from '@/components/studio/StudioShelf';

// ─── Golf-native rotating placeholders ────────────────────────────────────────

const GOLF_PLACEHOLDERS = [
  "Which hole broke you today?",
  "The fairway never lies.",
  "Name the course. Tell the story.",
  "Best shot of the round?",
  "What did the back nine teach you?",
  "Pin high. Did it count?",
  "The 19th hole starts here.",
  "Which course deserves more credit?",
  "Birdied it. Bogied it. Either way, share it.",
  "Golf is 90% mental. Vent here.",
  "Which green was the fastest you've ever played?",
  "Links, parkland, heathland — where were you?",
];

function getRandomPlaceholder(): string {
  return GOLF_PLACEHOLDERS[Math.floor(Math.random() * GOLF_PLACEHOLDERS.length)];
}

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

// ─── Adaptive media grid ─────────────────────────────────────────────────────

interface MediaGridProps {
  items: StudioMediaItem[];
  activeIndex: number;
  onSelect: (index: number) => void;
  onRemove: (id: string) => void;
  onAddMore: () => void;
  onEdit: () => void;
  onTrim: () => void;
  onCover: () => void;
  activeIsVideo: boolean;
  activeItem: StudioMediaItem | null;
}

function MediaGrid({
  items, activeIndex, onSelect, onRemove, onAddMore,
  onEdit, onTrim, onCover, activeIsVideo, activeItem,
}: MediaGridProps) {
  if (items.length === 0) return null;

  const GAP = 2;

  // Single item — full width, native ratio
  if (items.length === 1) {
    const item = items[0];
    const ratio = item.width && item.height
      ? Math.min(Math.max(item.width / item.height, 4 / 5), 16 / 9)
      : 4 / 3;
    return (
      <div className="mx-4 mb-2 relative overflow-hidden" style={{ borderRadius: 14, aspectRatio: String(ratio) }}>
        <img src={item.thumbnailUrl || item.previewUrl} alt="" className="w-full h-full object-cover" />
        {item.mediaType === 'video' && <VideoOverlay />}
        <RemoveButton onRemove={() => onRemove(item.id)} />
        <ToolBar item={item} onEdit={onEdit} onTrim={onTrim} onCover={onCover} activeIsVideo={activeIsVideo} />
      </div>
    );
  }

  // 2 items — side by side
  if (items.length === 2) {
    return (
      <div className="mx-4 mb-2 flex overflow-hidden" style={{ borderRadius: 14, gap: GAP, aspectRatio: '16/9' }}>
        {items.map((item, i) => (
          <div
            key={item.id}
            className="relative flex-1 overflow-hidden cursor-pointer"
            style={{ borderRadius: i === 0 ? '14px 0 0 14px' : '0 14px 14px 0' }}
            onClick={() => onSelect(i)}
          >
            <img src={item.thumbnailUrl || item.previewUrl} alt="" className="w-full h-full object-cover" />
            {item.mediaType === 'video' && <VideoOverlay />}
            <RemoveButton onRemove={() => onRemove(item.id)} />
            {i === activeIndex && <ToolBar item={item} onEdit={onEdit} onTrim={onTrim} onCover={onCover} activeIsVideo={activeIsVideo} />}
          </div>
        ))}
      </div>
    );
  }

  // 3 items — large left, 2 stacked right
  if (items.length === 3) {
    return (
      <div className="mx-4 mb-2 flex overflow-hidden" style={{ borderRadius: 14, gap: GAP, aspectRatio: '4/3' }}>
        {/* Left — large */}
        <div
          className="relative flex-1 overflow-hidden cursor-pointer"
          style={{ borderRadius: '14px 0 0 14px' }}
          onClick={() => onSelect(0)}
        >
          <img src={items[0].thumbnailUrl || items[0].previewUrl} alt="" className="w-full h-full object-cover" />
          {items[0].mediaType === 'video' && <VideoOverlay />}
          <RemoveButton onRemove={() => onRemove(items[0].id)} />
          {activeIndex === 0 && <ToolBar item={items[0]} onEdit={onEdit} onTrim={onTrim} onCover={onCover} activeIsVideo={activeIsVideo} />}
        </div>
        {/* Right — 2 stacked */}
        <div className="flex flex-col flex-1 overflow-hidden" style={{ gap: GAP }}>
          {items.slice(1).map((item, i) => (
            <div
              key={item.id}
              className="relative flex-1 overflow-hidden cursor-pointer"
              style={{ borderRadius: i === 0 ? '0 14px 0 0' : '0 0 14px 0' }}
              onClick={() => onSelect(i + 1)}
            >
              <img src={item.thumbnailUrl || item.previewUrl} alt="" className="w-full h-full object-cover" />
              {item.mediaType === 'video' && <VideoOverlay />}
              <RemoveButton onRemove={() => onRemove(item.id)} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 4+ items — 2×2 grid with overflow count on last tile
  const visible = items.slice(0, 4);
  const overflow = items.length - 4;
  return (
    <div className="mx-4 mb-2 grid grid-cols-2 overflow-hidden" style={{ borderRadius: 14, gap: GAP, aspectRatio: '1/1' }}>
      {visible.map((item, i) => {
        const isLast = i === 3;
        const corners = [
          '14px 0 0 0',
          '0 14px 0 0',
          '0 0 0 14px',
          '0 0 14px 0',
        ];
        return (
          <div
            key={item.id}
            className="relative overflow-hidden cursor-pointer"
            style={{ borderRadius: corners[i] }}
            onClick={() => onSelect(i)}
          >
            <img src={item.thumbnailUrl || item.previewUrl} alt="" className="w-full h-full object-cover" />
            {item.mediaType === 'video' && <VideoOverlay />}
            {!isLast && <RemoveButton onRemove={() => onRemove(item.id)} />}
            {/* Overflow count overlay on last tile */}
            {isLast && overflow > 0 && (
              <div
                className="absolute inset-0 flex items-center justify-center"
                style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}
              >
                <span className="text-[22px] font-bold text-white">+{overflow + 1}</span>
              </div>
            )}
            {i === activeIndex && !isLast && <ToolBar item={item} onEdit={onEdit} onTrim={onTrim} onCover={onCover} activeIsVideo={activeIsVideo} />}
          </div>
        );
      })}
    </div>
  );
}

// Sub-components for the grid

function VideoOverlay() {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(8px)' }}>
        <Play className="w-4 h-4 text-white ml-0.5" fill="white" strokeWidth={0} />
      </div>
    </div>
  );
}

function RemoveButton({ onRemove }: { onRemove: () => void }) {
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onRemove(); }}
      className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center z-10"
      style={{ background: 'rgba(0,0,0,0.60)', border: '1px solid rgba(255,255,255,0.20)' }}
    >
      <X className="w-3 h-3 text-white" strokeWidth={2.5} />
    </button>
  );
}

function ToolBar({
  item, onEdit, onTrim, onCover, activeIsVideo,
}: {
  item: StudioMediaItem;
  onEdit: () => void;
  onTrim: () => void;
  onCover: () => void;
  activeIsVideo: boolean;
}) {
  return (
    <>
      <div className="absolute bottom-0 left-0 right-0 pointer-events-none" style={{ height: 48, background: 'linear-gradient(to top, rgba(0,0,0,0.70), transparent)' }} />
      <div className="absolute bottom-2 left-2 flex gap-1 z-10">
        <motion.button
          whileTap={{ scale: 0.93 }}
          onClick={(e) => { e.stopPropagation(); onEdit(); }}
          className="flex items-center gap-1 px-2 py-1 text-[11px] font-medium"
          style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8, color: 'rgba(255,255,255,0.90)' }}
        >
          <Wand2 className="w-3 h-3" strokeWidth={2} />
          Edit
          {item.edits && Object.values(item.edits).some(Boolean) && (
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.80)' }} />
          )}
        </motion.button>
        {activeIsVideo && (
          <motion.button
            whileTap={{ scale: 0.93 }}
            onClick={(e) => { e.stopPropagation(); onTrim(); }}
            className="flex items-center gap-1 px-2 py-1 text-[11px] font-medium"
            style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8, color: 'rgba(255,255,255,0.90)' }}
          >
            <Scissors className="w-3 h-3" strokeWidth={2} />
            Trim
          </motion.button>
        )}
        {activeIsVideo && (
          <motion.button
            whileTap={{ scale: 0.93 }}
            onClick={(e) => { e.stopPropagation(); onCover(); }}
            className="flex items-center gap-1 px-2 py-1 text-[11px] font-medium"
            style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8, color: 'rgba(255,255,255,0.90)' }}
          >
            <ImageIcon className="w-3 h-3" strokeWidth={2} />
            Cover
          </motion.button>
        )}
      </div>
    </>
  );
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
  const placeholderRef = useRef(getRandomPlaceholder());
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
        {/* Actor selector moved to bottom toolbar */}

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
            placeholder={placeholderRef.current}
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
        </div>

        {/* ── Course tag — elevated, first-class ── */}
        <div className="px-4 mb-1">
          <AnimatePresence mode="wait">
            {state.taggedCourses.length === 0 ? (
              <motion.button
                key="prompt"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.18 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => openPanel('course')}
                className="flex items-center gap-2.5 w-full py-2"
              >
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.10)' }}
                >
                  <span className="text-sm">⛳</span>
                </div>
                <span className="text-[14px]" style={{ color: 'rgba(255,255,255,0.30)' }}>
                  Where did you play?
                </span>
              </motion.button>
            ) : (
              <motion.div
                key="tagged"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.18 }}
                className="flex flex-wrap gap-1.5 py-1"
              >
                {state.taggedCourses.map((course) => (
                  <motion.button
                    key={course.courseId}
                    layout
                    initial={{ scale: 0.85, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.85, opacity: 0 }}
                    onClick={() => openPanel('course')}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-xl"
                    style={{
                      background: 'rgba(255,255,255,0.08)',
                      border: '1px solid rgba(255,255,255,0.14)',
                    }}
                  >
                    <span className="text-sm">⛳</span>
                    <div className="text-left">
                      <p className="text-[13px] font-semibold leading-none" style={{ color: 'rgba(255,255,255,0.90)' }}>
                        {course.courseName}
                      </p>
                      {course.country && (
                        <p className="text-[10px] mt-0.5 leading-none" style={{ color: 'rgba(255,255,255,0.40)' }}>
                          {course.region ? `${course.region}, ${course.country}` : course.country}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setTaggedCourses(state.taggedCourses.filter(c => c.courseId !== course.courseId));
                      }}
                      className="ml-1 w-4 h-4 rounded-full flex items-center justify-center"
                      style={{ background: 'rgba(255,255,255,0.12)' }}
                    >
                      <X className="w-2.5 h-2.5" style={{ color: 'rgba(255,255,255,0.55)' }} strokeWidth={2.5} />
                    </button>
                  </motion.button>
                ))}
                {state.taggedCourses.length < 5 && (
                  <motion.button
                    layout
                    whileTap={{ scale: 0.95 }}
                    onClick={() => openPanel('course')}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl"
                    style={{ border: '1.5px dashed rgba(255,255,255,0.15)', background: 'transparent' }}
                  >
                    <span className="text-sm">⛳</span>
                    <span className="text-[12px]" style={{ color: 'rgba(255,255,255,0.30)' }}>Add course</span>
                  </motion.button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Adaptive media grid ── */}
        <MediaGrid
          items={state.mediaItems}
          activeIndex={state.activeMediaIndex}
          onSelect={setActiveMedia}
          onRemove={removeMedia}
          onAddMore={() => fileInputRef.current?.click()}
          onEdit={() => { setActiveTool(null); setShelfOpen(true); }}
          onTrim={() => setStep('TRIM')}
          onCover={() => setStep('POSTER')}
          activeIsVideo={activeIsVideo}
          activeItem={activeItem}
        />

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
        {/* Actor avatar — compact profile switcher */}
        <ActorSelector compact />

        {/* Spacer between avatar and camera */}
        <div className="w-2" />

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
          onClick={() => {
            const pos = textareaRef.current?.selectionStart ?? state.caption.length;
            const newCaption = state.caption.slice(0, pos) + '@' + state.caption.slice(pos);
            setCaption(newCaption);
            setMentionTriggerIndex(pos);
            openPanel('mention');
          }}
          className="flex items-center justify-center mr-3"
          style={{ width: 40, height: 40 }}
        >
          <AtSign className="w-5 h-5" style={{ color: 'rgba(255,255,255,0.45)' }} strokeWidth={2} />
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
