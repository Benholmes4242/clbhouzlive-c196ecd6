// ComposeScreen — The single creative step
// Keyboard up on open. Text first. Media additive. Everything in one place.
// Dark. Minimal. Golf-native.

import React, { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Camera, SwitchCamera, Layers, BookOpen, AtSign, X, Pencil, Play, Plus, Scissors, Image as ImageIcon,
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
    video.preload = 'auto';
    video.muted = true;
    video.playsInline = true;

    const url = URL.createObjectURL(file);
    let settled = false;

    const capture = () => {
      if (settled) return;
      if (video.videoWidth === 0 || video.videoHeight === 0) return;
      settled = true;
      clearTimeout(timeout);
      try {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        if (ctx) ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        URL.revokeObjectURL(url);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
        resolve(dataUrl.length > 100 ? dataUrl : '');
      } catch {
        URL.revokeObjectURL(url);
        resolve('');
      }
    };

    const timeout = setTimeout(() => {
      if (!settled) { settled = true; URL.revokeObjectURL(url); resolve(''); }
    }, 10000);

    video.onloadedmetadata = () => { video.currentTime = 0.5; };
    video.onseeked = () => { capture(); };
    video.ontimeupdate = () => { if (video.currentTime > 0) capture(); };
    video.onloadeddata = () => { if (video.readyState >= 2) capture(); };
    video.onerror = () => {
      clearTimeout(timeout);
      if (!settled) { settled = true; URL.revokeObjectURL(url); resolve(''); }
    };

    video.src = url;
    video.load();
  });
}

async function getVideoDuration(file: File): Promise<number | null> {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    const url = URL.createObjectURL(file);

    const timeout = setTimeout(() => { URL.revokeObjectURL(url); resolve(null); }, 8000);

    video.onloadedmetadata = () => {
      clearTimeout(timeout);
      URL.revokeObjectURL(url);
      resolve(isFinite(video.duration) && video.duration > 0 ? video.duration : null);
    };
    video.onerror = () => { clearTimeout(timeout); URL.revokeObjectURL(url); resolve(null); };

    video.src = url;
    video.load();
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

// ─── VideoToolSheet — intermediate tool picker for videos ────────────────────

interface VideoToolSheetProps {
  item: StudioMediaItem;
  onEdit: () => void;
  onTrim: () => void;
  onCover: () => void;
  onClose: () => void;
}

function VideoToolSheet({ item, onEdit, onTrim, onCover, onClose }: VideoToolSheetProps) {
  return (
    <AnimatePresence>
      <motion.div
        key="video-tool-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[10000]"
        style={{ background: 'rgba(0,0,0,0.70)' }}
        onClick={onClose}
      />
      <motion.div
        key="video-tool-sheet"
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        className="fixed bottom-0 inset-x-0 z-[10001] w-full max-w-[480px] mx-auto rounded-t-[24px]"
        style={{
          background: 'rgba(10,10,10,0.99)',
          backdropFilter: 'blur(24px)',
          borderTop: '1px solid rgba(255,255,255,0.08)',
          paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 24px)',
        }}
      >
        <div className="flex justify-center pt-3 pb-4">
          <div className="w-9 h-[3px] rounded-full" style={{ background: 'rgba(255,255,255,0.18)' }} />
        </div>

        <div className="mx-4 mb-5 overflow-hidden" style={{ borderRadius: 14, aspectRatio: item.height && item.width && item.height > item.width ? '4/5' : '16/9' }}>
          <video
            src={item.previewUrl}
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            className="w-full h-full object-cover"
            style={{ pointerEvents: 'none' }}
          />
        </div>

        <div className="flex gap-3 px-4 pb-2">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={onEdit}
            className="flex-1 flex flex-col items-center gap-2 py-4 rounded-2xl"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)' }}
          >
            <Pencil className="w-5 h-5" style={{ color: 'rgba(255,255,255,0.80)' }} strokeWidth={2} />
            <span className="text-[13px] font-semibold" style={{ color: 'rgba(255,255,255,0.80)' }}>Edit</span>
            <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.35)' }}>Music, filters, text</span>
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={onTrim}
            className="flex-1 flex flex-col items-center gap-2 py-4 rounded-2xl"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)' }}
          >
            <Scissors className="w-5 h-5" style={{ color: 'rgba(255,255,255,0.80)' }} strokeWidth={2} />
            <span className="text-[13px] font-semibold" style={{ color: 'rgba(255,255,255,0.80)' }}>Trim</span>
            <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.35)' }}>Cut start & end</span>
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={onCover}
            className="flex-1 flex flex-col items-center gap-2 py-4 rounded-2xl"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)' }}
          >
            <ImageIcon className="w-5 h-5" style={{ color: 'rgba(255,255,255,0.80)' }} strokeWidth={2} />
            <span className="text-[13px] font-semibold" style={{ color: 'rgba(255,255,255,0.80)' }}>Cover</span>
            <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.35)' }}>Choose thumbnail</span>
          </motion.button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

// ─── OverflowSheet — access hidden items beyond the 4-tile grid ──────────────

interface OverflowSheetProps {
  items: StudioMediaItem[];
  startIndex: number;
  onEdit: (index: number) => void;
  onClose: () => void;
}

function OverflowSheet({ items, startIndex, onEdit, onClose }: OverflowSheetProps) {
  return (
    <AnimatePresence>
      <motion.div
        key="overflow-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[10000]"
        style={{ background: 'rgba(0,0,0,0.70)' }}
        onClick={onClose}
      />
      <motion.div
        key="overflow-sheet"
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        className="fixed bottom-0 inset-x-0 z-[10001] w-full max-w-[480px] mx-auto rounded-t-[24px]"
        style={{
          background: 'rgba(10,10,10,0.99)',
          backdropFilter: 'blur(24px)',
          borderTop: '1px solid rgba(255,255,255,0.08)',
          paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 24px)',
        }}
      >
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-9 h-[3px] rounded-full" style={{ background: 'rgba(255,255,255,0.18)' }} />
        </div>

        <div className="px-5 pb-3">
          <p className="text-[11px] font-semibold uppercase tracking-[1.5px]" style={{ color: 'rgba(255,255,255,0.30)' }}>
            More media
          </p>
        </div>

        <div className="flex gap-3 overflow-x-auto px-5 pb-2" style={{ scrollbarWidth: 'none' }}>
          {items.map((item, i) => {
            const actualIndex = startIndex + i;
            return (
              <div key={item.id} className="relative shrink-0" style={{ width: 100 }}>
                <div className="overflow-hidden" style={{ borderRadius: 12, aspectRatio: '1/1' }}>
                  {item.mediaType === 'video' ? (
                    <video
                      src={item.previewUrl}
                      autoPlay
                      muted
                      loop
                      playsInline
                      preload="auto"
                      className="w-full h-full object-cover"
                      style={{ pointerEvents: 'none' }}
                    />
                  ) : (
                    <img
                      src={item.thumbnailUrl || item.previewUrl}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  )}
                  {item.mediaType === 'video' && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.50)' }}>
                        <Play className="w-3.5 h-3.5 text-white ml-0.5" fill="white" strokeWidth={0} />
                      </div>
                    </div>
                  )}
                </div>
                <motion.button
                  whileTap={{ scale: 0.88 }}
                  onClick={() => { onEdit(actualIndex); onClose(); }}
                  className="absolute bottom-1.5 right-1.5 w-7 h-7 flex items-center justify-center rounded-full"
                  style={{ background: 'rgba(0,0,0,0.65)', border: '1px solid rgba(255,255,255,0.20)' }}
                >
                  <Pencil className="w-3 h-3 text-white" strokeWidth={2} />
                </motion.button>
                <div
                  className="absolute top-1.5 left-1.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold"
                  style={{ background: 'rgba(0,0,0,0.55)', color: 'rgba(255,255,255,0.80)' }}
                >
                  {actualIndex + 1}
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

// ─── Adaptive media grid with per-tile edit + cover selection ─────────────────

interface MediaGridProps {
  items: StudioMediaItem[];
  activeIndex: number;
  coverIndex: number;
  onSelect: (index: number) => void;
  onRemove: (id: string) => void;
  onEdit: (index: number) => void;
  onSetCover: (index: number) => void;
  onOverflow: () => void;
  onAddMore: () => void;
}

function MediaGrid({
  items, activeIndex, coverIndex,
  onSelect, onRemove, onEdit, onSetCover, onOverflow, onAddMore,
}: MediaGridProps) {
  if (items.length === 0) return null;

  const GAP = 2;
  const MAX_VISIBLE = 4;
  const visible = items.slice(0, MAX_VISIBLE);
  const overflow = items.length - MAX_VISIBLE;

  function Tile({
    item, index, style, borderRadius,
  }: {
    item: StudioMediaItem;
    index: number;
    style?: React.CSSProperties;
    borderRadius?: string;
  }) {
    const isCover = index === coverIndex;
    const isOverflowTile = index === MAX_VISIBLE - 1 && overflow > 0;

    return (
      <div
        className="relative overflow-hidden cursor-pointer"
        style={{ borderRadius: borderRadius ?? 14, ...style }}
        onClick={() => onSelect(index)}
      >
        {item.mediaType === 'video' ? (
          <video
            src={item.previewUrl}
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            className="w-full h-full object-cover"
            style={{ pointerEvents: 'none' }}
          />
        ) : (
          <img
            src={item.thumbnailUrl || item.previewUrl}
            alt=""
            className="w-full h-full object-cover"
          />
        )}

        {isOverflowTile && (
          <motion.div
            whileTap={{ scale: 0.97 }}
            className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer"
            style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}
            onClick={(e) => { e.stopPropagation(); onOverflow(); }}
          >
            <span className="text-[22px] font-bold text-white">+{overflow + 1}</span>
            <span className="text-[10px] mt-1" style={{ color: 'rgba(255,255,255,0.55)' }}>tap to edit</span>
          </motion.div>
        )}

        {!isOverflowTile && (
          <>
            <motion.button
              whileTap={{ scale: 0.92 }}
              onClick={(e) => { e.stopPropagation(); if (!isCover) onSetCover(index); }}
              className="absolute top-2 left-2 z-10 px-2 py-0.5 rounded-full text-[10px] font-semibold"
              style={isCover ? {
                background: 'rgba(255,255,255,0.92)',
                color: '#0D0D0D',
                border: 'none',
              } : {
                background: 'rgba(0,0,0,0.45)',
                color: 'rgba(255,255,255,0.65)',
                border: '1px solid rgba(255,255,255,0.30)',
                backdropFilter: 'blur(8px)',
              }}
            >
              Cover
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.85 }}
              onClick={(e) => { e.stopPropagation(); onRemove(item.id); }}
              className="absolute top-2 right-2 w-7 h-7 flex items-center justify-center rounded-full z-10"
              style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.15)' }}
            >
              <X className="w-3 h-3 text-white" strokeWidth={2.5} />
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.85 }}
              onClick={(e) => { e.stopPropagation(); onEdit(index); }}
              className="absolute bottom-2 right-2 w-7 h-7 flex items-center justify-center rounded-full z-10"
              style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.15)' }}
            >
              <Pencil className="w-3 h-3 text-white" strokeWidth={2} />
            </motion.button>
          </>
        )}
      </div>
    );
  }

  if (items.length === 1) {
    const item = items[0];
    const ratio = item.width && item.height
      ? Math.min(Math.max(item.width / item.height, 4 / 5), 16 / 9)
      : 4 / 3;
    return (
      <div className="mx-4 mb-2" style={{ borderRadius: 14, overflow: 'hidden', aspectRatio: String(ratio) }}>
        <Tile item={item} index={0} style={{ width: '100%', height: '100%' }} borderRadius="14px" />
      </div>
    );
  }

  if (items.length === 2) {
    return (
      <div className="mx-4 mb-2 flex" style={{ borderRadius: 14, overflow: 'hidden', gap: GAP, aspectRatio: '16/9' }}>
        <Tile item={items[0]} index={0} style={{ flex: 1, height: '100%' }} borderRadius="14px 0 0 14px" />
        <Tile item={items[1]} index={1} style={{ flex: 1, height: '100%' }} borderRadius="0 14px 14px 0" />
      </div>
    );
  }

  if (items.length === 3) {
    return (
      <div className="mx-4 mb-2 flex" style={{ borderRadius: 14, overflow: 'hidden', gap: GAP, aspectRatio: '4/3' }}>
        <Tile item={items[0]} index={0} style={{ flex: 1, height: '100%' }} borderRadius="14px 0 0 14px" />
        <div className="flex flex-col flex-1" style={{ gap: GAP }}>
          <Tile item={items[1]} index={1} style={{ flex: 1 }} borderRadius="0 14px 0 0" />
          <Tile item={items[2]} index={2} style={{ flex: 1 }} borderRadius="0 0 14px 0" />
        </div>
      </div>
    );
  }

  const cornerRadii = ['14px 0 0 0', '0 14px 0 0', '0 0 0 14px', '0 0 14px 0'];
  return (
    <div className="mx-4 mb-2 grid grid-cols-2" style={{ borderRadius: 14, overflow: 'hidden', gap: GAP, aspectRatio: '1/1' }}>
      {visible.map((item, i) => (
        <Tile key={item.id} item={item} index={i} style={{ aspectRatio: '1/1' }} borderRadius={cornerRadii[i]} />
      ))}
    </div>
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
  const rearCameraInputRef = useRef<HTMLInputElement>(null);
  const frontCameraInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const placeholderRef = useRef(getRandomPlaceholder());
  const [isProcessing, setIsProcessing] = useState(false);
  const [shelfOpen, setShelfOpen] = useState(false);
  const [activeTool, setActiveTool] = useState<StudioTool>(null);
  const [activeOverlayId, setActiveOverlayId] = useState<string | null>(null);
  const [coverIndex, setCoverIndex] = useState(0);

  const [videoToolSheetIndex, setVideoToolSheetIndex] = useState<number | null>(null);
  const [overflowSheetOpen, setOverflowSheetOpen] = useState(false);

  const hasMedia = state.mediaItems.length > 0;
  const activeItem = state.mediaItems[state.activeMediaIndex] ?? null;
  const activeIsVideo = activeItem?.mediaType === 'video';
  const acceptTypes = [...ALLOWED_VIDEO_TYPES, ...ALLOWED_IMAGE_TYPES].join(',');

  useEffect(() => {
    const timer = setTimeout(() => {
      textareaRef.current?.focus();
    }, 150);
    return () => clearTimeout(timer);
  }, []);

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
        if (rearCameraInputRef.current) rearCameraInputRef.current.value = '';
        if (frontCameraInputRef.current) frontCameraInputRef.current.value = '';
      }
    },
    [state.mediaItems.length, addMedia]
  );

  const handleCaptionChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    const prev = state.caption;
    const cursorPos = e.target.selectionStart ?? val.length;

    if (val.length === prev.length + 1) {
      if (val[cursorPos - 1] === '@') {
        setMentionTriggerIndex(cursorPos - 1);
        openPanel('mention');
      }
    }

    if (state.mentions.length > 0 && val !== prev) {
      let changeStart = 0;
      while (
        changeStart < prev.length &&
        changeStart < val.length &&
        prev[changeStart] === val[changeStart]
      ) {
        changeStart++;
      }
      const delta = val.length - prev.length;

      const updatedMentions = state.mentions
        .map(m => {
          if (changeStart <= m.start) {
            return { ...m, start: m.start + delta, end: m.end + delta };
          }
          if (changeStart < m.end) {
            return null;
          }
          return m;
        })
        .filter((m): m is NonNullable<typeof m> => {
          if (!m) return false;
          if (m.start < 0 || m.end > val.length) return false;
          const textAtPosition = val.slice(m.start, m.end);
          const expectedText = `@${m.displayName}`;
          return textAtPosition === expectedText;
        });

      setMentions(updatedMentions);
    }

    setCaption(val);
  }, [state.caption, state.mentions, setCaption, setMentions, openPanel, setMentionTriggerIndex]);

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

  const handleEdit = useCallback((index: number) => {
    const item = state.mediaItems[index];
    if (!item) return;
    setActiveMedia(index);
    if (item.mediaType === 'video') {
      setVideoToolSheetIndex(index);
    } else {
      setActiveTool(null);
      setShelfOpen(true);
    }
  }, [state.mediaItems, setActiveMedia]);



  return (
    <div className="flex-1 flex flex-col" style={{ background: BG_BASE }}>
      <StudioHeader
        centerContent={<ActorSelector compact header />}
        step="COMPOSE"
        leftAction={onClose ? { label: '', onClick: onClose, icon: 'close' as const } : undefined}
        rightAction={
          isValid
            ? { label: 'Next', onClick: () => setStep('PUBLISH'), variant: 'primary' as const }
            : undefined
        }
      />

      <input ref={fileInputRef} type="file" accept={acceptTypes} multiple onChange={handleFileSelect} className="hidden" />
      <input ref={rearCameraInputRef} type="file" accept="image/*,video/*" capture="environment" onChange={handleFileSelect} className="hidden" />
      <input ref={frontCameraInputRef} type="file" accept="image/*,video/*" capture="user" onChange={handleFileSelect} className="hidden" />

      {/* ── Scrollable compose area ── */}
      <div
        className="flex-1 overflow-y-auto relative"
        style={{ scrollbarWidth: 'none', overscrollBehavior: 'contain' }}
      >
        {/* ── Ambient empty state — visible only when canvas is blank ── */}
        {!hasMedia && state.caption.length === 0 && (
          <div
            className="absolute inset-0 pointer-events-none overflow-hidden"
            style={{ zIndex: 0 }}
          >
            <div style={{
              position: 'absolute',
              top: '22%',
              left: '50%',
              transform: 'translateX(-50%)',
              width: 320,
              height: 320,
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.025) 50%, transparent 75%)',
              animation: 'studio-orb-breathe 5s ease-in-out infinite',
            }} />
            <div style={{
              position: 'absolute',
              top: '28%',
              left: '62%',
              width: 140,
              height: 140,
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(245,166,35,0.04) 0%, transparent 70%)',
              animation: 'studio-orb-breathe 6s ease-in-out infinite reverse',
            }} />
            <div style={{
              position: 'absolute',
              top: '35%',
              left: '60%',
              width: 180,
              height: 180,
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(255,255,255,0.025) 0%, transparent 70%)',
              animation: 'studio-orb-breathe 7s ease-in-out infinite reverse',
            }} />
            <div style={{
              position: 'absolute', inset: 0,
              opacity: 0.35,
              backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.85\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\' opacity=\'0.05\'/%3E%3C/svg%3E")',
              backgroundSize: '120px 120px',
            }} />
          </div>
        )}

        {/* ── Centering wrapper — centres content when empty, anchors top when active ── */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            minHeight: '100%',
            justifyContent: hasMedia || state.caption.length > 0 ? 'flex-start' : 'center',
            paddingBottom: 16,
          }}
        >

        {/* ── Today's Prompt — visible when canvas is blank ── */}
        {state.caption.length === 0 && !hasMedia && (
           <div
            onClick={() => textareaRef.current?.focus()}
            style={{
            padding: '28px 24px 16px',
            textAlign: 'center' as const,
            position: 'relative',
            zIndex: 1,
            cursor: 'text',
          }}>
            <p style={{
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: 2.5,
              textTransform: 'uppercase' as const,
              color: 'rgba(255,255,255,0.28)',
              marginBottom: 12,
            }}>
              What's on your mind?
            </p>
            <p style={{
              fontSize: 22,
              fontWeight: 600,
              color: 'rgba(255,255,255,0.70)',
              lineHeight: 1.4,
              letterSpacing: '-0.025em',
            }}>
              {placeholderRef.current}
            </p>
            <div style={{
              width: 28,
              height: 1,
              background: 'rgba(255,255,255,0.15)',
              margin: '18px auto 0',
            }} />
          </div>
        )}

        {/* ── Text input — fixed height, scrolls internally ── */}
        <div className="px-4 pt-3 pb-2 relative">
          {/* Flashing cursor — shows when canvas is blank, replaces placeholder */}
          {state.caption.length === 0 && !hasMedia && (
            <div style={{
              position: 'absolute',
              top: 12,
              left: 16,
              width: 2,
              height: 22,
              background: 'rgba(255,255,255,0.80)',
              borderRadius: 1,
              animation: 'studio-cursor-blink 1s step-end infinite',
              zIndex: 2,
              pointerEvents: 'none',
            }} />
          )}
          {/* Mention highlight layer */}
          {state.mentions.length > 0 && (
            <div
              aria-hidden="true"
              className="absolute inset-x-4 top-3 text-[17px] leading-relaxed pointer-events-none whitespace-pre-wrap break-words"
              style={{ wordBreak: 'break-word', height: hasMedia ? 80 : 120, overflowY: 'auto' }}
            >
              {highlightedCaption}
            </div>
          )}
          <textarea
            ref={textareaRef}
            value={state.caption}
            onChange={handleCaptionChange}
            placeholder=""
            className="w-full resize-none outline-none leading-relaxed"
            style={{
              background: 'transparent',
              fontSize: 17,
              fontWeight: 400,
              color: state.mentions.length > 0 ? 'transparent' : 'rgba(255,255,255,0.90)',
              caretColor: 'rgba(255,255,255,0.80)',
              WebkitTextFillColor: state.mentions.length > 0 ? 'transparent' : undefined,
              height: hasMedia ? 80 : 120,
              overflowY: 'auto',
              resize: 'none',
              WebkitOverflowScrolling: 'touch',
            }}
            maxLength={POST_LIMITS.MAX_CAPTION_LENGTH + 100}
          />
        </div>

        {/* ── Inline media zone — visible only when no media added ── */}
        <AnimatePresence>
          {state.mediaItems.length === 0 && (
            <motion.div
              key="media-zone"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4, scale: 0.98 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              className="px-4 mb-0"
            >
              <div
                style={{
                  borderRadius: 18,
                  border: '1.5px dashed rgba(255,255,255,0.13)',
                  background: 'rgba(255,255,255,0.025)',
                  overflow: 'hidden',
                }}
              >
                <div style={{ display: 'flex' }}>
                  {/* Library — primary, left */}
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isProcessing}
                    style={{
                      flex: 1.2,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                      padding: '20px 12px',
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      borderRight: '1px solid rgba(255,255,255,0.07)',
                    }}
                  >
                    <div style={{
                      width: 52, height: 52, borderRadius: 16,
                      background: 'rgba(255,255,255,0.10)',
                      border: '1px solid rgba(255,255,255,0.15)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <ImageIcon className="w-[22px] h-[22px]" style={{ color: 'rgba(255,255,255,0.88)' }} strokeWidth={1.75} />
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.88)', marginBottom: 2 }}>
                        Add from Library
                      </div>
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>
                        Photos & videos
                      </div>
                    </div>
                  </motion.button>

                  {/* Camera — secondary, right */}
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={() => rearCameraInputRef.current?.click()}
                    disabled={isProcessing}
                    style={{
                      flex: 1,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                      padding: '20px 12px',
                      background: 'rgba(0,0,0,0.15)',
                      border: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{
                      width: 44, height: 44, borderRadius: 14,
                      background: 'rgba(255,255,255,0.06)',
                      border: '1px solid rgba(255,255,255,0.09)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Camera className="w-5 h-5" style={{ color: 'rgba(255,255,255,0.75)' }} strokeWidth={1.75} />
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.55)', marginBottom: 2 }}>
                        Take a Photo
                      </div>
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)' }}>
                        Camera
                      </div>
                    </div>
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Media grid — visible when media added ── */}
        {state.mediaItems.length > 0 && (
          <MediaGrid
            items={state.mediaItems}
            activeIndex={state.activeMediaIndex}
            coverIndex={coverIndex}
            onSelect={setActiveMedia}
            onRemove={removeMedia}
            onEdit={handleEdit}
            onSetCover={(index) => { setCoverIndex(index); setActiveMedia(index); }}
            onOverflow={() => setOverflowSheetOpen(true)}
            onAddMore={() => fileInputRef.current?.click()}
          />
        )}

        {/* Add more — below grid when < 10 items */}
        {state.mediaItems.length > 0 && state.mediaItems.length < POST_LIMITS.MAX_MEDIA_COUNT && (
          <div className="px-4 mb-2">
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5"
              style={{
                padding: '6px 12px 6px 8px',
                borderRadius: 10,
                border: '1.5px dashed rgba(255,255,255,0.13)',
                background: 'rgba(255,255,255,0.02)',
              }}
            >
              <div style={{
                width: 22, height: 22, borderRadius: 6,
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.10)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Plus className="w-3 h-3" style={{ color: 'rgba(255,255,255,0.40)' }} strokeWidth={2} />
              </div>
              <span className="text-[12px]" style={{ color: 'rgba(255,255,255,0.30)' }}>Add more</span>
            </motion.button>
          </div>
        )}

        {/* 12px spacer between media zone / grid and course tag */}
        <div className="h-3" />

        {/* ── Course tag ── */}
        <div className="px-4 mb-3">
          <AnimatePresence mode="wait">
            {state.taggedCourses.length === 0 ? (
              <motion.button
                key="prompt"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.18 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => openPanel('course')}
                className="flex items-center gap-3 w-full px-3.5 py-3 rounded-2xl"
                style={{
                  background: 'rgba(34,197,94,0.06)',
                  border: '1px solid rgba(34,197,94,0.14)',
                }}
              >
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: 'rgba(34,197,94,0.10)', border: '1px solid rgba(34,197,94,0.18)' }}
                >
                  <span className="text-base">⛳</span>
                </div>
                <span className="flex-1 text-left text-[14px]" style={{ color: 'rgba(255,255,255,0.35)' }}>
                  Where did you play?
                </span>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ color: 'rgba(34,197,94,0.35)', flexShrink: 0 }}>
                  <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
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
                      background: 'rgba(34,197,94,0.07)',
                      border: '1px solid rgba(34,197,94,0.16)',
                    }}
                  >
                    <div style={{
                      width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                      background: 'rgba(34,197,94,0.12)',
                      border: '1px solid rgba(34,197,94,0.20)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 14,
                    }}>⛳</div>
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
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={(e) => {
                        e.stopPropagation();
                        setTaggedCourses(state.taggedCourses.filter(c => c.courseId !== course.courseId));
                      }}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); setTaggedCourses(state.taggedCourses.filter(c => c.courseId !== course.courseId)); } }}
                      className="ml-1 w-4 h-4 rounded-full flex items-center justify-center cursor-pointer"
                      style={{ background: 'rgba(255,255,255,0.12)' }}
                    >
                      <X className="w-2.5 h-2.5" style={{ color: 'rgba(255,255,255,0.55)' }} strokeWidth={2.5} />
                    </div>
                  </motion.button>
                ))}
                {state.taggedCourses.length < 5 && (
                  <motion.button
                    layout
                    whileTap={{ scale: 0.95 }}
                    onClick={() => openPanel('course')}
                    className="flex items-center gap-1.5"
                    style={{
                      display: 'inline-flex',
                      alignSelf: 'flex-start',
                      padding: '7px 12px 7px 8px',
                      borderRadius: 12,
                      border: '1.5px dashed rgba(34,197,94,0.20)',
                      background: 'transparent',
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{
                      width: 24, height: 24, borderRadius: 7, flexShrink: 0,
                      background: 'rgba(34,197,94,0.08)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 12,
                    }}>⛳</div>
                    <span className="text-[12.5px] font-medium" style={{ color: 'rgba(34,197,94,0.50)' }}>
                      Add course
                    </span>
                  </motion.button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Close centering wrapper */}
        </div>

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

      {/* ── Bottom action rail ── */}
      <div
        className="shrink-0"
        style={{
          background: 'rgba(8,8,8,0.98)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 8px)',
        }}
      >
        {/* White hairline at top */}
        <div style={{
          height: 1,
          background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.10) 20%, rgba(255,255,255,0.18) 50%, rgba(255,255,255,0.10) 80%, transparent 100%)',
        }} />

        <div className="flex items-center px-4" style={{ minHeight: 60, gap: 0 }}>

          {/* Zone A — Capture */}
          <div className="flex items-center" style={{ gap: 4 }}>
            {/* Rear — solid white, primary */}
            <motion.button
              whileTap={{ scale: 0.88 }}
              onClick={() => rearCameraInputRef.current?.click()}
              disabled={isProcessing}
              className="flex flex-col items-center justify-center disabled:opacity-40"
              style={{ width: 52, height: 54, gap: 3 }}
            >
              <div style={{
                width: 40, height: 40, borderRadius: 13,
                background: 'rgba(255,255,255,0.96)',
                boxShadow: '0 2px 14px rgba(0,0,0,0.35)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Camera className="w-[18px] h-[18px]" style={{ color: '#0D0D0D' }} strokeWidth={2} />
              </div>
              <span style={{ fontSize: 9, fontWeight: 600, letterSpacing: 0.6, color: 'rgba(255,255,255,0.50)', textTransform: 'uppercase' }}>Rear</span>
            </motion.button>

            {/* Front */}
            <motion.button
              whileTap={{ scale: 0.88 }}
              onClick={() => frontCameraInputRef.current?.click()}
              disabled={isProcessing}
              className="flex flex-col items-center justify-center disabled:opacity-40"
              style={{ width: 52, height: 54, gap: 3 }}
            >
              <div style={{
                width: 40, height: 40, borderRadius: 13,
                background: 'rgba(255,255,255,0.07)',
                border: '1px solid rgba(255,255,255,0.10)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <SwitchCamera className="w-[18px] h-[18px]" style={{ color: 'rgba(255,255,255,0.60)' }} strokeWidth={2} />
              </div>
              <span style={{ fontSize: 9, fontWeight: 600, letterSpacing: 0.6, color: 'rgba(255,255,255,0.28)', textTransform: 'uppercase' }}>Front</span>
            </motion.button>

            {/* Library */}
            <motion.button
              whileTap={{ scale: 0.88 }}
              onClick={() => fileInputRef.current?.click()}
              disabled={isProcessing}
              className="flex flex-col items-center justify-center disabled:opacity-40"
              style={{ width: 52, height: 54, gap: 3 }}
            >
              <div style={{
                width: 40, height: 40, borderRadius: 13,
                background: 'rgba(255,255,255,0.07)',
                border: '1px solid rgba(255,255,255,0.10)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Layers className="w-[18px] h-[18px]" style={{ color: 'rgba(255,255,255,0.60)' }} strokeWidth={2} />
              </div>
              <span style={{ fontSize: 9, fontWeight: 600, letterSpacing: 0.6, color: 'rgba(255,255,255,0.28)', textTransform: 'uppercase' }}>Library</span>
            </motion.button>
          </div>

          {/* Divider */}
          <div style={{ width: 1, height: 28, background: 'rgba(255,255,255,0.08)', margin: '0 10px' }} />

          {/* Zone B — Text tools */}
          <div className="flex items-center" style={{ gap: 0 }}>
            <motion.button
              whileTap={{ scale: 0.88 }}
              onClick={() => {
                const pos = textareaRef.current?.selectionStart ?? state.caption.length;
                const newCaption = state.caption.slice(0, pos) + '@' + state.caption.slice(pos);
                setCaption(newCaption);
                setMentionTriggerIndex(pos);
                openPanel('mention');
              }}
              style={{ width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <AtSign className="w-5 h-5" style={{ color: 'rgba(255,255,255,0.45)' }} strokeWidth={2} />
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.88 }}
              onClick={() => openPanel('drafts')}
              style={{ width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <BookOpen className="w-5 h-5" style={{ color: 'rgba(255,255,255,0.45)' }} strokeWidth={2} />
            </motion.button>
          </div>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Zone C — Character count */}
          <div className="flex items-center justify-center" style={{ width: 36, height: 36 }}>
            <CharacterRing count={charCount} />
          </div>
        </div>
      </div>

      {/* Video tool picker sheet */}
      {videoToolSheetIndex !== null && state.mediaItems[videoToolSheetIndex] &&
        createPortal(
          <VideoToolSheet
            item={state.mediaItems[videoToolSheetIndex]}
            onEdit={() => {
              setVideoToolSheetIndex(null);
              setActiveTool(null);
              setShelfOpen(true);
            }}
            onTrim={() => {
              setVideoToolSheetIndex(null);
              setStep('TRIM');
            }}
            onCover={() => {
              if (videoToolSheetIndex !== null) setActiveMedia(videoToolSheetIndex);
              setVideoToolSheetIndex(null);
              setStep('POSTER');
            }}
            onClose={() => setVideoToolSheetIndex(null)}
          />,
          document.body
        )
      }

      {/* Overflow sheet — hidden items beyond tile 4 */}
      {overflowSheetOpen &&
        createPortal(
          <OverflowSheet
            items={state.mediaItems.slice(3)}
            startIndex={3}
            onEdit={(index) => {
              setActiveMedia(index);
              const item = state.mediaItems[index];
              if (!item) return;
              if (item.mediaType === 'video') {
                setVideoToolSheetIndex(index);
              } else {
                setActiveTool(null);
                setShelfOpen(true);
              }
            }}
            onClose={() => setOverflowSheetOpen(false)}
          />,
          document.body
        )
      }

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
