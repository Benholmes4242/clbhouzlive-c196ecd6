// ComposeScreen — Single dark cinematic creation surface
// Two states: empty "Fairway" (text-first) and media-loaded (strip + edit tray)
// Dark. Cinematic. Golf-native.

import React, { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Camera, Layers, AtSign, X, Pencil, Play, Plus, Scissors, Image as ImageIcon, Clock, FileText,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { StudioHeader } from '../components/StudioHeader';
import { CharacterRing } from '../components/CharacterRing';
import { ActorSelector } from '../components/ActorSelector';
import { usePostStudioContext } from '../usePostStudio';
import { useSaveDraft } from '../hooks/useSaveDraft';
import { useDrafts } from '@/hooks/useDrafts';
import { validateMediaFile, POST_LIMITS, ALLOWED_VIDEO_TYPES, ALLOWED_IMAGE_TYPES } from '../constants';
import {
  COMPOSE_BG, DARK_TEXT, DARK_TEXT2, DARK_TEXT3, DARK_ICON, DARK_BG, DARK_CARD, DARK_BORDER,
} from '../tokens';
import type { StudioMediaItem } from '../types';
import type { StudioEdits, StudioTool } from '@/types/studio';
import StudioShelf from '@/components/studio/StudioShelf';
import TextOverlayRenderer from '@/components/studio/TextOverlayRenderer';
import { getFilterClass } from '@/utils/studioFilters';
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
        resolve(dataUrl.length > 100 ? dataUrl : URL.createObjectURL(file));
      } catch {
        URL.revokeObjectURL(url);
        resolve(URL.createObjectURL(file));
      }
    };

    const timeout = setTimeout(() => {
      if (!settled) { settled = true; URL.revokeObjectURL(url); resolve(URL.createObjectURL(file)); }
    }, 10000);

    video.onloadedmetadata = () => { video.currentTime = 0.5; };
    video.onseeked = () => { capture(); };
    video.ontimeupdate = () => { if (video.currentTime > 0) capture(); };
    video.onloadeddata = () => { if (video.readyState >= 2) capture(); };
    video.onerror = () => {
      clearTimeout(timeout);
      if (!settled) { settled = true; URL.revokeObjectURL(url); resolve(URL.createObjectURL(file)); }
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
    const isVideo = file.type.startsWith('video/') || 
      file.type === 'video/quicktime' ||
      (!file.type && /\.(mov|mp4|m4v)$/i.test(file.name));
    let duration: number | null = null;
    if (isVideo) duration = await getVideoDuration(file);
    const validation = validateMediaFile(file, duration ?? undefined);
    if (!validation.valid) { onError?.(validation.error ?? `Invalid file: ${file.name}`); continue; }
    const previewUrl = URL.createObjectURL(file);
    if (isVideo) {
      const thumbnailUrl = await generatePoster(file);
      // Attempt to get video dimensions from metadata
      let vWidth: number | null = null;
      let vHeight: number | null = null;
      try {
        const dimVideo = document.createElement('video');
        dimVideo.src = previewUrl;
        await new Promise<void>(r => { dimVideo.onloadedmetadata = () => r(); setTimeout(r, 3000); });
        vWidth = dimVideo.videoWidth || null;
        vHeight = dimVideo.videoHeight || null;
      } catch { /* ignore */ }
      items.push({ id: crypto.randomUUID(), file, mediaType: 'video', previewUrl, thumbnailUrl: thumbnailUrl || undefined, duration, trimStart: 0, trimEnd: duration, posterTimestamp: 0, posterPreviewUrl: null, width: vWidth, height: vHeight, validationError: null });
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

// ─── ComposeScreen ────────────────────────────────────────────────────────────

export function ComposeScreen({ onClose }: { onClose?: () => void }) {
   const {
    state, setStep, setActiveMedia, removeMedia, addMedia,
    setCaption, openPanel, closePanel, updateMediaEdits,
    setMentions, setTaggedCourses, setMentionTriggerIndex, reset, onSuccess, schedulePublishRef,
  } = usePostStudioContext();

  const { saveDraft, isSaving: isSavingDraft } = useSaveDraft(state);
  const { drafts } = useDrafts();
  const draftsCount = drafts?.length ?? 0;
  

  const handleSaveDraft = useCallback(async () => {
    const ok = await saveDraft();
    if (ok && onClose) { reset(); onClose(); }
  }, [saveDraft, reset, onClose]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const rearCameraInputRef = useRef<HTMLInputElement>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const mentionOverlayRef = useRef<HTMLDivElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [textareaFocused, setTextareaFocused] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [shelfOpen, setShelfOpen] = useState(false);
  const [activeTool, setActiveTool] = useState<StudioTool>(null);
  const [activeOverlayId, setActiveOverlayId] = useState<string | null>(null);
  const [coverIndex, setCoverIndex] = useState(0);
  const [trayIndex, setTrayIndex] = useState<number | null>(null);
  const trayAutoOpenedRef = useRef(false);
  const trayPreviewRef = useRef<HTMLDivElement>(null);

  const [videoToolSheetIndex, setVideoToolSheetIndex] = useState<number | null>(null);

  const hasMedia = state.mediaItems.length > 0;
  const activeItem = state.mediaItems[state.activeMediaIndex] ?? null;
  const acceptTypes = [...ALLOWED_VIDEO_TYPES, ...ALLOWED_IMAGE_TYPES].join(',');


  useEffect(() => {
    if (state.mediaItems.length > 0) {
      if (!trayAutoOpenedRef.current) {
        trayAutoOpenedRef.current = true;
        setTrayIndex(0);
      }
    } else {
      trayAutoOpenedRef.current = false;
    }
  }, [state.mediaItems.length]);

  // Close tray if trayIndex is out of bounds
  useEffect(() => {
    if (trayIndex !== null && trayIndex >= state.mediaItems.length) {
      setTrayIndex(null);
    }
  }, [state.mediaItems.length, trayIndex]);

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
        }
      } catch (err) {
        console.error('[ComposeScreen] Failed to process files:', err);
        toast.error('Failed to process some files');
      } finally {
        setIsProcessing(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
        if (rearCameraInputRef.current) rearCameraInputRef.current.value = '';
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
    setActiveTool(null);
    setShelfOpen(true);
  }, [state.mediaItems, setActiveMedia]);

  const handleSetCover = useCallback((index: number) => {
    setCoverIndex(index);
    setActiveMedia(index);
  }, [setActiveMedia]);

  // ── Publish handler — one-step flow ──
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
      closePanel();
      setStep('SUCCESS');
    } catch (err) {
      console.error('[ComposeScreen] Failed to enqueue:', err);
      toast.error('Failed to start upload. Please try again.');
      setIsPublishing(false);
      schedulePublishRef.current = false;
    }
  }, [state, setStep, onSuccess, isPublishing, schedulePublishRef]);

  // Auto-publish once scheduledAt is committed to state
  useEffect(() => {
    if (
      schedulePublishRef.current &&
      state.scheduledAt !== null &&
      state.mediaItems.length > 0 &&
      isValid
    ) {
      schedulePublishRef.current = false;
      handlePublish();
    }
  }, [state.scheduledAt, handlePublish, schedulePublishRef, state.mediaItems.length, isValid]);

  // ── Tray item for inline edit ──
  const trayItem = trayIndex !== null ? state.mediaItems[trayIndex] ?? null : null;

  // ── Shared caption + course tag block ──
  const renderCaptionBlock = (minH: number, maxH: number, pushCourseToBottom = false) => (
    <>
      {/* Caption area */}
      <div className="px-4 relative">
        {/* Mention highlight layer */}
        {state.mentions.length > 0 && (
          <div
            ref={mentionOverlayRef}
            aria-hidden="true"
            style={{
              position: 'absolute',
              top: 0,
              left: 16,
              right: 16,
              height: 72,
              overflowY: 'auto',
              WebkitOverflowScrolling: 'touch',
              pointerEvents: 'none',
              fontSize: 20,
              fontWeight: 500,
              lineHeight: 1.45,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              paddingTop: 10,
              paddingRight: 68,
              scrollbarWidth: 'none',
            }}
          >
            {highlightedCaption}
          </div>
        )}
        {state.caption === '' && !textareaFocused && (
          <div
            style={{
              position: 'absolute',
              top: 10,
              left: 16,
              width: 1.5,
              height: 29,
              background: '#F7931E',
              borderRadius: 0.75,
              animation: 'blink 1s step-end infinite',
              pointerEvents: 'none',
              zIndex: 2,
            }}
          />
        )}
        <style>{`@keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }`}</style>
        <textarea
          ref={textareaRef}
          value={state.caption}
          onFocus={() => setTextareaFocused(true)}
          onBlur={() => setTextareaFocused(false)}
          onChange={(e) => {
            handleCaptionChange(e);
          }}
          onScroll={(e) => {
            if (mentionOverlayRef.current) {
              mentionOverlayRef.current.scrollTop = e.currentTarget.scrollTop;
            }
          }}
          placeholder="What's on your mind?"
          className="w-full resize-none outline-none placeholder:text-white/[.16]"
          style={{
            background: 'transparent',
            fontSize: 20,
            lineHeight: 1.45,
            fontWeight: 500,
            paddingTop: 10,
            color: state.mentions.length > 0 ? 'transparent' : DARK_TEXT,
            caretColor: '#F7931E',
            WebkitTextFillColor: state.mentions.length > 0 ? 'transparent' : undefined,
            height: 72,
            overflowY: 'auto',
            resize: 'none',
            scrollbarWidth: 'none',
            WebkitOverflowScrolling: 'touch',
            paddingRight: 68,
          }}
          maxLength={POST_LIMITS.MAX_CAPTION_LENGTH + 100}
        />
        {/* Amber orb — opens library picker */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => fileInputRef.current?.click()}
          style={{
            position: 'absolute',
            top: 10,
            right: 16,
            width: 42,
            height: 42,
            borderRadius: '50%',
            background: 'rgba(247,147,30,0.10)',
            border: '1px solid rgba(247,147,30,0.28)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            zIndex: 3,
          }}
        >
          <Plus className="w-5 h-5" style={{ color: '#F7931E' }} strokeWidth={2} />
        </motion.button>
      </div>

      {/* Hairline below textarea */}
      <div className="mx-4" style={{ height: 1, background: 'rgba(255,255,255,0.08)', marginTop: 14 }} />

      {pushCourseToBottom && <div className="flex-1" />}

      {/* Course tag */}

      {/* Course tag */}
      <div className="px-4 mt-3 mb-3">
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
                Tag where you played
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
    </>
  );

  return (
    <div className="flex-1 flex flex-col" style={{ background: COMPOSE_BG, minHeight: 0, overflow: 'hidden' }}>
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

      {/* ── Thumbnail strip (media state only) ── */}
      {hasMedia && (
        <div
          className="flex overflow-x-auto shrink-0"
          style={{
            position: 'relative',
            zIndex: 10,
            marginTop: 8,
            gap: 3,
            padding: '3px 0',
            scrollbarWidth: 'none',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
            background: COMPOSE_BG,
          }}
        >
          {state.mediaItems.map((item, i) => {
            const isActive = i === coverIndex;
            return (
              <motion.button
                key={item.id}
                whileTap={{ scale: 0.95 }}
                onTap={() => {
                  if (trayIndex === i) {
                    setTrayIndex(null);
                  } else {
                    setTrayIndex(i);
                    setActiveMedia(i);
                  }
                }}
                className="shrink-0 relative"
                style={{
                  cursor: 'pointer',
                  width: 68,
                  height: 68,
                  borderRadius: 0,
                  overflow: 'hidden',
                  outline: isActive ? '2.5px solid #F7931E' : 'none',
                  outlineOffset: isActive ? '-2.5px' : undefined,
                }}
              >
                <img
                  src={item.thumbnailUrl || item.previewUrl}
                  alt=""
                  className={`w-full h-full object-cover ${item.edits?.filter ? getFilterClass(item.edits.filter) : ''}`}
                />
                {item.mediaType === 'video' && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.60)' }}>
                      <Play className="w-2.5 h-2.5 text-white ml-0.5" fill="white" strokeWidth={0} />
                    </div>
                  </div>
                )}
                {/* Dim overlay on inactive tiles */}
                {!isActive && (
                  <div className="absolute inset-0 pointer-events-none" style={{ background: 'rgba(0,0,0,0.35)' }} />
                )}
                {/* Amber dot for edited tiles */}
                {item.edits && (item.edits.filter && item.edits.filter !== 'normal' || item.edits.textOverlays?.length || item.edits.rotate || item.edits.flipH || item.edits.flipV || item.edits.music) && (
                  <div className="absolute pointer-events-none" style={{ top: 4, right: 4, width: 6, height: 6, borderRadius: '50%', background: '#F7931E', zIndex: 3 }} />
                )}
                {/* Cover pill on active tile */}
                {isActive && (
                  <div className="absolute bottom-1 left-1 pointer-events-none" style={{
                    fontSize: 7, fontWeight: 700, textTransform: 'uppercase',
                    background: 'rgba(247,147,30,0.85)',
                    padding: '2px 6px', borderRadius: 20,
                    color: 'white', letterSpacing: 0.5,
                  }}>
                    Cover
                  </div>
                )}
              </motion.button>
            );
          })}

          {/* Add more tile */}
          {state.mediaItems.length < POST_LIMITS.MAX_MEDIA_COUNT && (
            <motion.button
              whileTap={{ scale: 0.88 }}
              onClick={() => fileInputRef.current?.click()}
              className="shrink-0 flex items-center justify-center"
              style={{
                width: 68,
                height: 68,
                borderRadius: 0,
                background: 'rgba(255,255,255,0.04)',
                borderLeft: '1px dashed rgba(255,255,255,0.10)',
              }}
            >
              <Plus className="w-4 h-4" style={{ color: 'rgba(255,255,255,0.22)' }} strokeWidth={2} />
            </motion.button>
          )}
        </div>
      )}

      {/* ── Edit tray (inline, below strip) ── */}
      <AnimatePresence>
        {trayItem && trayIndex !== null && (
          <motion.div
            key="edit-tray"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{
              flex: 1,
              minHeight: 0,
              display: 'flex',
              flexDirection: 'column',
              position: 'relative',
              zIndex: 10,
              background: 'rgba(18,18,18,0.98)',
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
              {/* Full-width preview */}
              <div ref={trayPreviewRef} className="relative overflow-hidden" style={{ width: '100%', flex: 1, minHeight: 0, background: '#000' }}>
                {/* Letterbox blur for landscape */}
                {trayItem.width && trayItem.height && trayItem.width > trayItem.height && (
                  <>
                    <img src={trayItem.thumbnailUrl || trayItem.previewUrl} alt="" className="absolute inset-0 w-full h-full object-cover" style={{ filter: 'blur(40px) brightness(0.5)', transform: 'scale(1.15)', opacity: 0.6 }} />
                    <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.55)' }} />
                  </>
                )}
                {/* Base image */}
                <img
                  src={trayItem.thumbnailUrl || trayItem.previewUrl}
                  alt=""
                  className="relative z-[1]"
                  style={{
                    width: '100%',
                    height: '100%',
                    maxHeight: '100%',
                    objectFit: trayItem.width && trayItem.height && trayItem.width > trayItem.height ? 'contain' : 'cover',
                    transform: [
                      trayItem.edits?.rotate ? `rotate(${trayItem.edits.rotate}deg)` : '',
                      trayItem.edits?.flipH ? 'scaleX(-1)' : '',
                      trayItem.edits?.flipV ? 'scaleY(-1)' : '',
                    ].filter(Boolean).join(' ') || undefined,
                  }}
                />
                {/* Filter overlay with intensity */}
                {trayItem.edits?.filter && trayItem.edits.filter !== 'normal' && (
                  <img
                    src={trayItem.thumbnailUrl || trayItem.previewUrl}
                    alt=""
                    className={`absolute inset-0 z-[1] ${getFilterClass(trayItem.edits.filter)}`}
                    style={{
                      width: '100%',
                      height: '100%',
                      maxHeight: '100%',
                      objectFit: trayItem.width && trayItem.height && trayItem.width > trayItem.height ? 'contain' : 'cover',
                      opacity: (trayItem.edits?.filterIntensity ?? 100) / 100,
                      transform: [
                        trayItem.edits?.rotate ? `rotate(${trayItem.edits.rotate}deg)` : '',
                        trayItem.edits?.flipH ? 'scaleX(-1)' : '',
                        trayItem.edits?.flipV ? 'scaleY(-1)' : '',
                      ].filter(Boolean).join(' ') || undefined,
                    }}
                  />
                )}
                {/* Text overlays */}
                {trayItem.edits?.textOverlays && trayItem.edits.textOverlays.length > 0 && trayPreviewRef.current && (
                  <div className="absolute inset-0 z-[2] pointer-events-none">
                    <TextOverlayRenderer
                      textOverlays={trayItem.edits.textOverlays}
                      isEditable={false}
                      containerRef={trayPreviewRef as React.RefObject<HTMLDivElement>}
                    />
                  </div>
                )}
                {/* Cover badge */}
                {trayIndex === coverIndex && (
                  <div className="absolute z-[3]" style={{ top: 8, left: 8, background: 'rgba(247,147,30,0.85)', color: '#fff', fontSize: 7, fontWeight: 700, textTransform: 'uppercase', padding: '2px 8px', borderRadius: 20, letterSpacing: 0.5 }}>
                    Cover
                  </div>
                )}
              </div>

              {/* Button row */}
              <div className="shrink-0" style={{
                display: 'grid',
                gridTemplateColumns: trayIndex !== coverIndex ? 'repeat(4,1fr)' : 'repeat(3,1fr)',
                gap: 4,
                padding: '4px 8px 0',
              }}>
                {/* Cover */}
                {trayIndex !== coverIndex && (
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setCoverIndex(trayIndex)}
                    className="flex flex-col items-center justify-center"
                    style={{ background: 'rgba(247,147,30,0.12)', border: '1px solid rgba(247,147,30,0.25)', borderRadius: 8, padding: '6px 0' }}
                  >
                    <ImageIcon className="w-4 h-4" style={{ color: '#F7931E' }} strokeWidth={2} />
                    <span style={{ fontSize: 8, fontWeight: 600, color: '#F7931E', marginTop: 2 }}>Cover</span>
                  </motion.button>
                )}

                {/* Edit */}
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => { setTrayIndex(null); handleEdit(trayIndex); }}
                  className="flex flex-col items-center justify-center"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '6px 0' }}
                >
                  <Pencil className="w-4 h-4" style={{ color: 'rgba(255,255,255,0.70)' }} strokeWidth={2} />
                  <span style={{ fontSize: 8, fontWeight: 600, color: 'rgba(255,255,255,0.70)', marginTop: 2 }}>Edit</span>
                </motion.button>

                {/* Trim */}
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    if (trayItem.mediaType === 'video') {
                      setTrayIndex(null);
                      setActiveMedia(trayIndex);
                      setStep('TRIM');
                    }
                  }}
                  disabled={trayItem.mediaType !== 'video'}
                  className="flex flex-col items-center justify-center"
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 8,
                    padding: '6px 0',
                    opacity: trayItem.mediaType !== 'video' ? 0.4 : 1,
                  }}
                >
                  <Scissors className="w-4 h-4" style={{ color: 'rgba(255,255,255,0.70)' }} strokeWidth={2} />
                  <span style={{ fontSize: 8, fontWeight: 600, color: 'rgba(255,255,255,0.70)', marginTop: 2 }}>Trim</span>
                </motion.button>

                {/* Remove */}
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    const id = trayItem.id;
                    setTrayIndex(null);
                    removeMedia(id);
                    if (coverIndex >= state.mediaItems.length - 1) setCoverIndex(Math.max(0, state.mediaItems.length - 2));
                  }}
                  className="flex flex-col items-center justify-center"
                  style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: 8, padding: '6px 0' }}
                >
                  <X className="w-4 h-4" style={{ color: 'rgba(239,68,68,0.70)' }} strokeWidth={2} />
                  <span style={{ fontSize: 8, fontWeight: 600, color: 'rgba(239,68,68,0.70)', marginTop: 2 }}>Remove</span>
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {hasMedia ? (
        <>
          {/* Spacer — only when tray is closed, pushes caption to bottom */}
          {trayIndex === null && <div className="flex-1" />}

          {/* Caption block — fixed, directly below tray */}
          <div className="shrink-0">
            <div className="mx-4" style={{ height: 1, background: 'rgba(255,255,255,0.08)' }} />
            {renderCaptionBlock(52, 72)}
          </div>

          {/* Processing indicator */}
          <AnimatePresence>
            {isProcessing && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="shrink-0 flex items-center gap-2 px-4 py-2 text-sm"
                style={{ color: DARK_TEXT3 }}
              >
                <div className="w-3.5 h-3.5 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: 'rgba(255,255,255,0.12)', borderTopColor: 'transparent' }} />
                Processing…
              </motion.div>
            )}
          </AnimatePresence>
        </>
      ) : (
        <div
          className="flex-1 overflow-y-auto relative flex flex-col"
          style={{ scrollbarWidth: 'none', overscrollBehavior: 'contain' }}
        >
          <div className="pt-4 flex-1 flex flex-col">
            {renderCaptionBlock(90, 210, true)}
          </div>
        </div>
      )}

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

        <div className="flex items-center px-4" style={{ minHeight: 54, gap: 0, paddingTop: 8 }}>

          {/* Zone A — Library + Camera only */}
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

            {/* Camera */}
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

            <motion.button
              whileTap={{ scale: 0.88 }}
              onClick={() => openPanel('drafts')}
              style={{ width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}
            >
              <FileText className="w-5 h-5" style={{ color: DARK_ICON }} strokeWidth={2} />
              {draftsCount > 0 && (
                <div style={{
                  position: 'absolute', top: 8, right: 8,
                  width: 7, height: 7, borderRadius: '50%',
                  background: '#F7931E',
                }} />
              )}
            </motion.button>
          </div>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Zone C — Character count */}
          <div className="flex items-center justify-center" style={{ width: 36, height: 36, opacity: charCount === 0 ? 0 : 1, transition: 'opacity 0.15s' }}>
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
