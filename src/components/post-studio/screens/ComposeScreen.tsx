// ComposeScreen — Single dark cinematic creation surface
// No step progress dots. No review step for standard posts.
// Dark. Cinematic. Golf-native.

import React, { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Camera, Layers, AtSign, X, Pencil, Play, Plus, Scissors, Image as ImageIcon, Clock,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { StudioHeader } from '../components/StudioHeader';
import { CharacterRing } from '../components/CharacterRing';
import { ActorSelector } from '../components/ActorSelector';
import { usePostStudioContext } from '../usePostStudio';
import { useSaveDraft } from '../hooks/useSaveDraft';
import { validateMediaFile, POST_LIMITS, ALLOWED_VIDEO_TYPES, ALLOWED_IMAGE_TYPES } from '../constants';
import {
  COMPOSE_BG, DARK_TEXT, DARK_TEXT2, DARK_TEXT3, DARK_ICON, DARK_BG, DARK_CARD, DARK_BORDER,
  ICON_COLOR, TEXT_PRIMARY, TEXT_TERTIARY,
} from '../tokens';
import type { StudioMediaItem } from '../types';
import type { StudioEdits, StudioTool } from '@/types/studio';
import StudioShelf from '@/components/studio/StudioShelf';
import { enqueuePostUpload } from '@/uploads/uploadPipeline';
import { supabase } from '@/integrations/supabase/client';
import { analyticsEvents } from '@/utils/analyticsEvents';
import type { UploadJobInput } from '@/uploads/types';

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
        style={{ background: 'rgba(0,0,0,0.55)' }}
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
          background: 'rgba(16,16,16,0.99)',
          backdropFilter: 'blur(40px)',
          borderTop: '1px solid rgba(255,255,255,0.08)',
          paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 24px)',
          boxShadow: '0 -20px 60px rgba(0,0,0,0.6)',
        }}
      >
        <div className="flex justify-center pt-3 pb-4">
          <div className="w-9 h-[3px] rounded-full" style={{ background: 'rgba(255,255,255,0.12)' }} />
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
            style={{ background: DARK_CARD, border: `1px solid ${DARK_BORDER}` }}
          >
            <Pencil className="w-5 h-5" style={{ color: DARK_ICON }} strokeWidth={2} />
            <span className="text-[13px] font-semibold" style={{ color: DARK_TEXT }}>Edit</span>
            <span className="text-[10px]" style={{ color: DARK_TEXT3 }}>Music, filters, text</span>
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={onTrim}
            className="flex-1 flex flex-col items-center gap-2 py-4 rounded-2xl"
            style={{ background: DARK_CARD, border: `1px solid ${DARK_BORDER}` }}
          >
            <Scissors className="w-5 h-5" style={{ color: DARK_ICON }} strokeWidth={2} />
            <span className="text-[13px] font-semibold" style={{ color: DARK_TEXT }}>Trim</span>
            <span className="text-[10px]" style={{ color: DARK_TEXT3 }}>Cut start & end</span>
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={onCover}
            className="flex-1 flex flex-col items-center gap-2 py-4 rounded-2xl"
            style={{ background: DARK_CARD, border: `1px solid ${DARK_BORDER}` }}
          >
            <ImageIcon className="w-5 h-5" style={{ color: DARK_ICON }} strokeWidth={2} />
            <span className="text-[13px] font-semibold" style={{ color: DARK_TEXT }}>Cover</span>
            <span className="text-[10px]" style={{ color: DARK_TEXT3 }}>Choose thumbnail</span>
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
        style={{ background: 'rgba(0,0,0,0.55)' }}
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
          background: 'rgba(16,16,16,0.99)',
          backdropFilter: 'blur(40px)',
          borderTop: '1px solid rgba(255,255,255,0.08)',
          paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 24px)',
          boxShadow: '0 -20px 60px rgba(0,0,0,0.6)',
        }}
      >
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-9 h-[3px] rounded-full" style={{ background: 'rgba(255,255,255,0.12)' }} />
        </div>

        <div className="px-5 pb-3">
          <p className="text-[11px] font-semibold uppercase tracking-[1.5px]" style={{ color: DARK_TEXT3 }}>
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

interface TileProps {
  item: StudioMediaItem;
  index: number;
  coverIndex: number;
  maxVisible: number;
  overflow: number;
  onSelect: (index: number) => void;
  onRemove: (id: string) => void;
  onEdit: (index: number) => void;
  onSetCover: (index: number) => void;
  onOverflow: () => void;
  style?: React.CSSProperties;
  borderRadius?: string;
}

function Tile({
  item, index, coverIndex, maxVisible, overflow,
  onSelect, onRemove, onEdit, onSetCover, onOverflow,
  style, borderRadius,
}: TileProps) {
  const isCover = index === coverIndex;
  const isOverflowTile = index === maxVisible - 1 && overflow > 0;

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

const MediaGrid = React.memo(function MediaGrid({
  items, activeIndex, coverIndex,
  onSelect, onRemove, onEdit, onSetCover, onOverflow, onAddMore,
}: MediaGridProps) {
  if (items.length === 0) return null;

  const GAP = 2;
  const MAX_VISIBLE = 4;
  const visible = items.slice(0, MAX_VISIBLE);
  const overflow = items.length - MAX_VISIBLE;

  const tileProps = {
    coverIndex, maxVisible: MAX_VISIBLE, overflow,
    onSelect, onRemove, onEdit, onSetCover, onOverflow,
  };

  if (items.length === 1) {
    const item = items[0];
    const ratio = item.width && item.height
      ? Math.min(Math.max(item.width / item.height, 4 / 5), 16 / 9)
      : 4 / 3;
    return (
      <div className="mx-4 mb-2" style={{ borderRadius: 14, overflow: 'hidden', aspectRatio: String(ratio) }}>
        <Tile item={item} index={0} style={{ width: '100%', height: '100%' }} borderRadius="14px" {...tileProps} />
      </div>
    );
  }

  if (items.length === 2) {
    return (
      <div className="mx-4 mb-2 flex" style={{ borderRadius: 14, overflow: 'hidden', gap: GAP, aspectRatio: '16/9' }}>
        <Tile item={items[0]} index={0} style={{ flex: 1, height: '100%' }} borderRadius="14px 0 0 14px" {...tileProps} />
        <Tile item={items[1]} index={1} style={{ flex: 1, height: '100%' }} borderRadius="0 14px 14px 0" {...tileProps} />
      </div>
    );
  }

  if (items.length === 3) {
    return (
      <div className="mx-4 mb-2 flex" style={{ borderRadius: 14, overflow: 'hidden', gap: GAP, aspectRatio: '4/3' }}>
        <Tile item={items[0]} index={0} style={{ flex: 1, height: '100%' }} borderRadius="14px 0 0 14px" {...tileProps} />
        <div className="flex flex-col flex-1" style={{ gap: GAP }}>
          <Tile item={items[1]} index={1} style={{ flex: 1 }} borderRadius="0 14px 0 0" {...tileProps} />
          <Tile item={items[2]} index={2} style={{ flex: 1 }} borderRadius="0 0 14px 0" {...tileProps} />
        </div>
      </div>
    );
  }

  const cornerRadii = ['14px 0 0 0', '0 14px 0 0', '0 0 0 14px', '0 0 14px 0'];
  return (
    <div className="mx-4 mb-2 grid grid-cols-2" style={{ borderRadius: 14, overflow: 'hidden', gap: GAP, aspectRatio: '1/1' }}>
      {visible.map((item, i) => (
        <Tile key={item.id} item={item} index={i} style={{ aspectRatio: '1/1' }} borderRadius={cornerRadii[i]} {...tileProps} />
      ))}
    </div>
  );
});

// ─── ComposeScreen ────────────────────────────────────────────────────────────

export function ComposeScreen({ onClose }: { onClose?: () => void }) {
  const {
    state, setStep, setActiveMedia, removeMedia, addMedia,
    setCaption, openPanel, updateMediaEdits,
    setMentions, setTaggedCourses, setMentionTriggerIndex, reset, onSuccess,
  } = usePostStudioContext();

  const { saveDraft, isSaving: isSavingDraft } = useSaveDraft(state);

  const handleSaveDraft = useCallback(async () => {
    const ok = await saveDraft();
    if (ok && onClose) { reset(); onClose(); }
  }, [saveDraft, reset, onClose]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const rearCameraInputRef = useRef<HTMLInputElement>(null);
  const frontCameraInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  // static placeholder — no rotating prompts
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
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

  // Re-focus textarea after media is added (file input steals focus)
  useEffect(() => {
    if (state.mediaItems.length > 0) {
      const timer = setTimeout(() => textareaRef.current?.focus(), 150);
      return () => clearTimeout(timer);
    }
  }, [state.mediaItems.length]);

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
        if (items.length > 0) {
          addMedia(items);
          setTimeout(() => textareaRef.current?.focus(), 100);
        }
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
      if (m.start > last) parts.push(<span key={`t-${partIndex++}`} style={{ color: DARK_TEXT }}>{state.caption.slice(last, m.start)}</span>);
      parts.push(<span key={`m-${partIndex++}`} style={{ color: '#F7931E', fontWeight: 600 }}>{state.caption.slice(m.start, m.end)}</span>);
      last = m.end;
    }
    if (last < state.caption.length) parts.push(<span key={`t-${partIndex++}`} style={{ color: DARK_TEXT }}>{state.caption.slice(last)}</span>);
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

  const handleSetCover = useCallback((index: number) => {
    setCoverIndex(index);
    setActiveMedia(index);
  }, [setActiveMedia]);

  const handleOverflow = useCallback(() => {
    setOverflowSheetOpen(true);
  }, []);

  const handleAddMore = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  // ── Publish handler (moved from PublishScreen — one-step flow) ──
  const handlePublish = useCallback(async () => {
    if (isPublishing) return;
    setIsPublishing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { toast.error('You need to be logged in'); setIsPublishing(false); return; }

      const files = state.mediaItems.map((m) => m.file).filter((f): f is File => !!f);
      const selectedTags = state.mentions.map((m) => ({
        id: m.entityId, entity_id: m.profileId, entity_type: m.entityType,
        name: m.displayName, username: m.username ?? null,
        start_index: m.start, end_index: m.end,
      }));

      const input: UploadJobInput = {
        actorType: state.actorType, actorId: state.actorId ?? user.id, userId: user.id,
        caption: state.caption, files,
        mediaItems: state.mediaItems.map((item) => ({
          id: item.id, file: item.file, type: item.mediaType,
          width: item.width ?? undefined, height: item.height ?? undefined,
          duration: item.duration ?? undefined,
          trimStart: item.trimStart || null, trimEnd: item.trimEnd || null,
          posterTimestamp: item.posterTimestamp || null,
        })),
        studioEditsByMediaId: Object.fromEntries(
          state.mediaItems
            .filter((item) => item.edits && Object.keys(item.edits).length > 0)
            .map((item) => [item.id, item.edits!])
        ),
        courseIds: state.taggedCourses.map((c) => c.courseId),
        courseInfo: state.taggedCourses[0]
          ? { id: state.taggedCourses[0].courseId, name: state.taggedCourses[0].courseName, country: state.taggedCourses[0].country ?? '' }
          : null,
        selectedTags,
        visibility: state.visibility,
        scheduledAt: state.scheduledAt,
      };

      enqueuePostUpload(input);
      analyticsEvents.track('post_published', {
        media_count: state.mediaItems.length,
        media_type: state.mediaItems[0]?.mediaType ?? 'unknown',
        has_caption: state.caption.trim().length > 0,
        has_tagged_course: state.taggedCourses.length > 0,
        visibility: state.visibility,
        is_scheduled: !!state.scheduledAt,
      });
      onSuccess?.('');
      setStep('SUCCESS');
    } catch (err) {
      console.error('[ComposeScreen] Failed to enqueue:', err);
      toast.error('Failed to start upload. Please try again.');
      setIsPublishing(false);
    }
  }, [state, setStep, onSuccess, isPublishing]);


  return (
    <div className="flex-1 flex flex-col" style={{ background: COMPOSE_BG }}>
      <StudioHeader
        centerContent={
          <ActorSelector
            compact
            header
            visibilityIcon={
              state.visibility === 'anyone' ? '🌍'
              : state.visibility === 'followers' ? '👥'
              : '🔒'
            }
            visibilityLabel={
              state.visibility === 'anyone' ? 'Everyone'
              : state.visibility === 'followers' ? 'Friends'
              : 'Only me'
            }
          />
        }
        step="COMPOSE"
        darkMode={true}
        leftAction={onClose ? { label: '', onClick: onClose, icon: 'close' as const } : undefined}
        rightAction={
          isValid && !isPublishing
            ? { label: 'Share', onClick: handlePublish, variant: 'primary' as const }
            : isPublishing
              ? { label: 'Sharing…', onClick: () => {}, disabled: true, variant: 'primary' as const }
              : state.isDirty
                ? { label: 'Save', onClick: handleSaveDraft, disabled: isSavingDraft }
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
        {/* ── Centering wrapper — centres content when empty, anchors top when active ── */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            minHeight: '100%',
            justifyContent: hasMedia || state.caption.length > 0 ? 'flex-start' : 'center',
            paddingBottom: 'clamp(12px, 3vh, 24px)',
          }}
        >

        {/* ── Media Zone ── */}
        {hasMedia ? (
          <>
            {/* Full bleed 4:5 hero — no horizontal padding */}
            <div
              style={{
                aspectRatio: '4/5',
                overflow: 'hidden',
                position: 'relative',
                background: 'rgba(0,0,0,0.95)',
              }}
            >
              {/* Blurred background for letterboxing */}
              {(() => {
                const item = state.mediaItems[coverIndex] ?? state.mediaItems[0];
                if (!item) return null;
                const isLandscape = item.width && item.height && item.width > item.height;
                if (!isLandscape) return null;
                return (
                  <>
                    <div className="absolute inset-0" style={{ filter: 'blur(40px) brightness(0.4)', transform: 'scale(1.3)' }}>
                      {item.mediaType === 'video' ? (
                        <video src={item.previewUrl} autoPlay muted loop playsInline className="w-full h-full object-cover" style={{ pointerEvents: 'none' }} />
                      ) : (
                        <img src={item.previewUrl} alt="" className="w-full h-full object-cover" />
                      )}
                    </div>
                    <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.55)' }} />
                  </>
                );
              })()}

              {/* Main media — object-contain */}
              {(() => {
                const item = state.mediaItems[coverIndex] ?? state.mediaItems[0];
                if (!item) return null;
                return item.mediaType === 'video' ? (
                  <video
                    src={item.previewUrl}
                    autoPlay muted loop playsInline
                    className="absolute inset-0 w-full h-full object-contain"
                    style={{ pointerEvents: 'none' }}
                  />
                ) : (
                  <img
                    src={item.previewUrl}
                    alt=""
                    className="absolute inset-0 w-full h-full object-contain"
                  />
                );
              })()}

              {/* Top scrim for overlays */}
              <div className="absolute top-0 inset-x-0 h-20 z-[1]" style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.45), transparent)' }} />

              {/* Count badge — top left */}
              <div className="absolute top-3 left-3 z-10">
                <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold" style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(8px)', color: 'rgba(255,255,255,0.80)', border: '1px solid rgba(255,255,255,0.12)' }}>
                  {coverIndex + 1} / {state.mediaItems.length}
                </span>
              </div>

              {/* Edit pill — top right */}
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => handleEdit(state.activeMediaIndex)}
                className="absolute top-3 right-3 z-10 flex items-center gap-1.5 px-2.5 py-1.5 rounded-full"
                style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.15)' }}
              >
                <Pencil className="w-3 h-3 text-white" strokeWidth={2} />
                <span className="text-[11px] font-semibold text-white">Edit</span>
              </motion.button>
            </div>

            {/* Full bleed thumbnail strip — 68px, sharp corners, all items */}
            {state.mediaItems.length > 1 && (
              <div
                className="flex overflow-x-auto"
                style={{ gap: 4, scrollbarWidth: 'none', padding: '4px 0' }}
              >
                {state.mediaItems.map((item, i) => (
                  <motion.button
                    key={item.id}
                    whileTap={{ scale: 0.92 }}
                    onClick={() => { setCoverIndex(i); setActiveMedia(i); }}
                    className="shrink-0 overflow-hidden relative"
                    style={{
                      width: 68,
                      height: 68,
                      borderRadius: 0,
                      border: i === coverIndex ? '2px solid #F7931E' : 'none',
                    }}
                  >
                    {item.mediaType === 'video' ? (
                      <video src={item.previewUrl} muted playsInline preload="metadata" className="w-full h-full object-cover" style={{ pointerEvents: 'none' }} />
                    ) : (
                      <img src={item.thumbnailUrl || item.previewUrl} alt="" className="w-full h-full object-cover" />
                    )}
                    {/* Dim overlay on inactive tiles */}
                    {i !== coverIndex && (
                      <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.40)' }} />
                    )}
                  </motion.button>
                ))}

                {state.mediaItems.length < POST_LIMITS.MAX_MEDIA_COUNT && (
                  <motion.button
                    whileTap={{ scale: 0.88 }}
                    onClick={() => fileInputRef.current?.click()}
                    className="shrink-0 flex items-center justify-center"
                    style={{
                      width: 68,
                      height: 68,
                      borderRadius: 0,
                      background: 'rgba(255,255,255,0.05)',
                      border: '1.5px dashed rgba(255,255,255,0.15)',
                    }}
                  >
                    <Plus className="w-4 h-4" style={{ color: 'rgba(255,255,255,0.40)' }} strokeWidth={2} />
                  </motion.button>
                )}
              </div>
            )}
          </>
        ) : (
          /* Change 1 — Compact empty state */
          <button
            onClick={() => fileInputRef.current?.click()}
            style={{
              width: '100%',
              padding: '28px 0 24px',
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', gap: 10,
              borderRadius: 18,
              background: 'rgba(255,255,255,0.03)',
              border: `1.5px dashed rgba(247,147,30,0.25)`,
              cursor: 'pointer',
              margin: '8px 16px',
            }}
          >
            <ImageIcon className="w-7 h-7" style={{ color: 'rgba(247,147,30,0.80)' }} strokeWidth={1.5} />
            <div className="text-center">
              <p className="text-[14px] font-semibold" style={{ color: DARK_TEXT }}>Add photo or video</p>
              <p className="text-[12px] mt-1" style={{ color: DARK_TEXT3 }}>Tap Library or Camera below</p>
            </div>
          </button>
        )}

        {/* ── Text input — dark text, static placeholder ── */}
        <div className="px-4 pt-3 pb-2 relative">
          {/* Flashing cursor — shows when canvas is blank */}
          {state.caption.length === 0 && (
            <div style={{
              position: 'absolute',
              top: 12,
              left: 16,
              width: 2,
              height: 22,
              background: '#F7931E',
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
              className="absolute inset-x-4 top-3 text-[17px] pointer-events-none whitespace-pre-wrap break-words"
              style={{ wordBreak: 'break-word', lineHeight: 1.55, minHeight: 26, maxHeight: 79, overflowY: 'auto' }}
            >
              {highlightedCaption}
            </div>
          )}
          <textarea
            ref={textareaRef}
            value={state.caption}
            onChange={(e) => {
              handleCaptionChange(e);
              // Auto-resize textarea
              const el = e.target;
              el.style.height = 'auto';
              el.style.height = Math.min(el.scrollHeight, 79) + 'px';
            }}
            placeholder="What's on your mind?"
            className="w-full resize-none outline-none"
            style={{
              background: 'transparent',
              fontSize: 17,
              lineHeight: 1.55,
              fontWeight: 400,
              color: state.mentions.length > 0 ? 'transparent' : DARK_TEXT,
              caretColor: '#F7931E',
              WebkitTextFillColor: state.mentions.length > 0 ? 'transparent' : undefined,
              minHeight: 26,
              maxHeight: 79,
              overflowY: 'auto',
              resize: 'none',
              scrollbarWidth: 'none',
              WebkitOverflowScrolling: 'touch',
            }}
            maxLength={POST_LIMITS.MAX_CAPTION_LENGTH + 100}
          />
        </div>

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
                  background: 'rgba(34,197,94,0.08)',
                  border: '1px solid rgba(34,197,94,0.18)',
                }}
              >
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.22)' }}
                >
                  <span className="text-base">⛳</span>
                </div>
                <span className="flex-1 text-left text-[14px]" style={{ color: DARK_TEXT3 }}>
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
                className="flex flex-col gap-1.5 py-1"
              >
                {/* Section label for multi-course */}
                {state.taggedCourses.length > 1 && (
                  <p className="text-[10px] font-bold uppercase tracking-[1.5px] mb-1" style={{ color: DARK_TEXT3 }}>
                    Courses tagged
                  </p>
                )}
                {state.taggedCourses.map((course, i) => (
                  <motion.button
                    key={course.courseId}
                    layout
                    initial={{ scale: 0.85, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.85, opacity: 0 }}
                    onClick={() => openPanel('course')}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-xl w-full"
                    style={{
                      background: 'rgba(34,197,94,0.08)',
                      border: '1px solid rgba(34,197,94,0.18)',
                    }}
                  >
                    {/* Numbered badge for multi-course, golf emoji for single */}
                    <div style={{
                      width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                      background: 'rgba(34,197,94,0.12)',
                      border: '1px solid rgba(34,197,94,0.20)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: state.taggedCourses.length > 1 ? 13 : 14,
                      fontWeight: 700,
                      color: state.taggedCourses.length > 1 ? 'rgba(34,197,94,0.80)' : undefined,
                    }}>
                      {state.taggedCourses.length > 1 ? i + 1 : '⛳'}
                    </div>
                    <div className="text-left flex-1">
                      <p className="text-[13px] font-semibold leading-none" style={{ color: DARK_TEXT }}>
                        {course.courseName}
                      </p>
                      {course.country && (
                        <p className="text-[10px] mt-0.5 leading-none" style={{ color: DARK_TEXT3 }}>
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
                      style={{ background: 'rgba(255,255,255,0.08)' }}
                    >
                      <X className="w-2.5 h-2.5" style={{ color: DARK_ICON }} strokeWidth={2.5} />
                    </div>
                  </motion.button>
                ))}
                {state.taggedCourses.length < 5 && (
                  <motion.button
                    layout
                    whileTap={{ scale: 0.95 }}
                    onClick={() => openPanel('course')}
                    className="flex items-center gap-2"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '7px 12px',
                      borderRadius: 12,
                      border: '1.5px dashed rgba(34,197,94,0.18)',
                      background: 'transparent',
                      cursor: 'pointer',
                    }}
                  >
                    <span style={{ fontSize: 14 }}>⛳</span>
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
              style={{ color: DARK_TEXT3 }}
            >
              <div className="w-3.5 h-3.5 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: 'rgba(255,255,255,0.12)', borderTopColor: 'transparent' }} />
              Processing…
            </motion.div>
          )}
        </AnimatePresence>

        <div className="h-2" />
      </div>

      {/* ── Bottom action rail — always dark ── */}
      <div
        className="shrink-0"
        style={{
          background: 'rgba(13,13,13,0.98)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 8px)',
        }}
      >
        {/* Hairline at top */}
        <div style={{
          height: 1,
          background: `linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.06) 20%, rgba(255,255,255,0.10) 50%, rgba(255,255,255,0.06) 80%, transparent 100%)`,
        }} />

        <div className="flex items-center px-4" style={{ minHeight: 54, gap: 0 }}>

          {/* Zone A — Library first (amber primary), then Camera */}
          <div className="flex items-center" style={{ gap: 4 }}>
            {/* Library — amber tinted, primary action */}
            <motion.button
              whileTap={{ scale: 0.88 }}
              onClick={() => fileInputRef.current?.click()}
              disabled={isProcessing}
              className="flex flex-col items-center justify-center disabled:opacity-40"
              style={{ width: 52, height: 54, gap: 3 }}
            >
              <div style={{
                width: 40, height: 40, borderRadius: 13,
                background: 'rgba(247,147,30,0.12)',
                border: '1px solid rgba(247,147,30,0.25)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Layers className="w-[18px] h-[18px]" style={{ color: '#F7931E' }} strokeWidth={2} />
              </div>
              <span style={{ fontSize: 9, fontWeight: 600, letterSpacing: 0.6, color: DARK_TEXT3, textTransform: 'uppercase' }}>Library</span>
            </motion.button>

            {/* Rear camera */}
            <motion.button
              whileTap={{ scale: 0.88 }}
              onClick={() => rearCameraInputRef.current?.click()}
              disabled={isProcessing}
              className="flex flex-col items-center justify-center disabled:opacity-40"
              style={{ width: 52, height: 54, gap: 3 }}
            >
              <div style={{
                width: 40, height: 40, borderRadius: 13,
                background: DARK_CARD,
                border: `1px solid ${DARK_BORDER}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Camera className="w-[18px] h-[18px]" style={{ color: DARK_ICON }} strokeWidth={2} />
              </div>
              <span style={{ fontSize: 9, fontWeight: 600, letterSpacing: 0.6, color: DARK_TEXT3, textTransform: 'uppercase' }}>Camera</span>
            </motion.button>

          </div>

          {/* Divider */}
          <div style={{ width: 1, height: 28, background: DARK_BORDER, margin: '0 10px' }} />

          {/* Zone B — @ and Schedule */}
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
              <AtSign className="w-5 h-5" style={{ color: DARK_ICON }} strokeWidth={2} />
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.88 }}
              onClick={() => openPanel('schedule')}
              style={{ width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <Clock className="w-5 h-5" style={{ color: DARK_ICON }} strokeWidth={2} />
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
          activeMediaThumbnailUrl={activeItem.thumbnailUrl}
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