// ComposeScreen — Single dark cinematic creation surface
// Two states: empty "Fairway" (text-first) and media-loaded (strip + edit tray)
// Dark. Cinematic. Golf-native.

import React, { useState, useCallback, useRef, useMemo, useEffect } from 'react';

import {
  Camera, ImagePlus, AtSign, X, Pencil, Play, Plus, Clock, FileText,
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

import { getFilterClass } from '@/utils/studioFilters';
import { enqueuePostUpload } from '@/uploads/uploadPipeline';
import { supabase } from '@/integrations/supabase/client';
import { analyticsEvents } from '@/utils/analyticsEvents';
import type { UploadJobInput } from '@/uploads/types';

// ─── Media processing helpers ─────────────────────────────────────────────────


const wait = (ms: number) => new Promise<void>((resolve) => window.setTimeout(resolve, ms));

function isLikelyBlackFrame(canvas: HTMLCanvasElement): boolean {
  const probe = document.createElement('canvas');
  probe.width = 16;
  probe.height = 16;
  const probeCtx = probe.getContext('2d');
  if (!probeCtx) return false;

  probeCtx.drawImage(canvas, 0, 0, 16, 16);
  const { data } = probeCtx.getImageData(0, 0, 16, 16);

  let min = 255;
  let max = 0;
  let total = 0;

  for (let i = 0; i < data.length; i += 4) {
    const luminance = (0.299 * data[i]) + (0.587 * data[i + 1]) + (0.114 * data[i + 2]);
    min = Math.min(min, luminance);
    max = Math.max(max, luminance);
    total += luminance;
  }

  const avg = total / (data.length / 4);
  return max < 18 || (avg < 10 && max - min < 8);
}

async function generatePoster(file: File): Promise<string> {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;
    video.setAttribute('muted', 'true');
    video.setAttribute('playsinline', 'true');

    const url = URL.createObjectURL(file);
    let settled = false;
    let lastDataUrl = '';
    let seekTimes: number[] = [0.001];
    let seekIndex = 0;

    const cleanup = () => {
      video.onloadedmetadata = null;
      video.onseeked = null;
      video.onerror = null;
      video.src = '';
      URL.revokeObjectURL(url);
    };

    const buildSeekTimes = (duration: number) => {
      const safeDuration = Number.isFinite(duration) && duration > 0 ? duration : 0;
      const candidates = [
        0.001,
        0.1,
        safeDuration > 0 ? Math.min(0.35, safeDuration / 3) : 0.35,
        safeDuration > 0 ? Math.min(0.75, safeDuration / 2) : 0.75,
      ]
        .filter((time) => safeDuration <= 0 || time < safeDuration)
        .map((time) => Math.max(0.001, Number(time.toFixed(3))));

      return Array.from(new Set(candidates));
    };

    const seekTo = (time: number) => {
      window.setTimeout(() => {
        if (settled) return;
        try {
          video.currentTime = time;
        } catch (error) {
          // error seeking
          finish(lastDataUrl || '');
        }
      }, 1);
    };

    const finish = (result: string) => {
      if (settled) return;
      settled = true;
      cleanup();
      
      resolve(result);
    };

    const capture = async () => {
      if (settled) return;
      if (video.videoWidth === 0 || video.videoHeight === 0) return;

      try {
        await wait(120);

        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          finish(lastDataUrl || '');
          return;
        }

        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
        const blank = isLikelyBlackFrame(canvas);
        

        if (dataUrl.length > 100) {
          lastDataUrl = dataUrl;
        }

        if (!blank || seekIndex >= seekTimes.length - 1) {
          finish(lastDataUrl || '');
          return;
        }

        seekIndex += 1;
        
        seekTo(seekTimes[seekIndex]);
      } catch (error) {
        
        finish(lastDataUrl || '');
      }
    };

    const timeout = setTimeout(() => {
      if (!settled) {
        
        finish(lastDataUrl || '');
      }
    }, 12000);

    video.onloadedmetadata = () => {
      
      seekTimes = buildSeekTimes(video.duration);
      seekIndex = 0;
      seekTo(seekTimes[seekIndex] ?? 0.001);
    };
    video.onseeked = () => {
      
      void capture();
    };
    video.onerror = (error) => {
      clearTimeout(timeout);
      if (!settled) {
        
        finish(lastDataUrl || '');
      }
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
      const mediaItem: StudioMediaItem = { id: crypto.randomUUID(), file, mediaType: 'video', previewUrl, thumbnailUrl: thumbnailUrl || undefined, duration, trimStart: 0, trimEnd: duration, posterTimestamp: 0, posterPreviewUrl: null, width: vWidth, height: vHeight, validationError: null };
      items.push(mediaItem);
      
    } else {
      const dims = await getImageDimensions(file);
      const mediaItem: StudioMediaItem = { id: crypto.randomUUID(), file, mediaType: 'image', previewUrl, duration: null, trimStart: 0, trimEnd: null, posterTimestamp: 0, posterPreviewUrl: null, width: dims?.width ?? null, height: dims?.height ?? null, validationError: null };
      items.push(mediaItem);
      
    }
  }
  return items;
}

function getPreviewStillSrc(item: StudioMediaItem): string {
  if (item.mediaType === 'video') {
    return item.posterPreviewUrl || item.thumbnailUrl || '';
  }

  return item.thumbnailUrl || item.previewUrl;
}

function getPreviewTransform(edits?: StudioEdits): string | undefined {
  return [
    edits?.rotate ? `rotate(${edits.rotate}deg)` : '',
    edits?.flipH ? 'scaleX(-1)' : '',
    edits?.flipV ? 'scaleY(-1)' : '',
  ].filter(Boolean).join(' ') || undefined;
}

function getPreviewObjectFit(item: StudioMediaItem): 'contain' | 'cover' {
  return item.width && item.height && item.width > item.height ? 'contain' : 'cover';
}

function hasActiveFilter(edits?: StudioEdits): boolean {
  return !!edits?.filter && edits.filter !== 'normal';
}

// VideoToolSheet removed — edit actions now inline on each thumbnail tile

// ─── ComposeScreen ────────────────────────────────────────────────────────────

export function ComposeScreen({ onClose }: { onClose?: () => void }) {
   const {
    state, setStep, setActiveMedia, removeMedia, addMedia,
    setCaption, openPanel, closePanel, updateMediaEdits, updateTrim,
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
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressFiredRef = useRef(false);


  const hasMedia = state.mediaItems.length > 0;
  const activeItem = state.mediaItems[state.activeMediaIndex] ?? null;
  const acceptTypes = [...ALLOWED_VIDEO_TYPES, ...ALLOWED_IMAGE_TYPES].join(',');


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
      parts.push(<span key={`m-${partIndex++}`} style={{ color: '#0F172A', fontWeight: 600 }}>{state.caption.slice(m.start, m.end)}</span>);
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
    setActiveTool('filter');
    setShelfOpen(true);
  }, [state.mediaItems, setActiveMedia]);

  const handleSetCover = useCallback((index: number) => {
    setCoverIndex(index);
    setActiveMedia(index);
    toast.success('Cover updated');
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


  // ── Shared caption + course tag block ──
  const renderCaptionBlock = (minH: number, maxH: number, pushCourseToBottom = false, includeCourseTag = true) => (
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
              height: 97,
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
              background: 'rgba(15,23,42,0.75)',
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
          className="w-full resize-none outline-none placeholder:text-black/[.25]"
          style={{
            background: 'transparent',
            fontSize: 20,
            lineHeight: 1.45,
            fontWeight: 500,
            paddingTop: 10,
            color: state.mentions.length > 0 ? 'transparent' : DARK_TEXT,
            caretColor: '#F7931E',
            WebkitTextFillColor: state.mentions.length > 0 ? 'transparent' : undefined,
            height: 97,
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
            background: 'rgba(15,23,42,0.05)',
            border: '1px solid rgba(15,23,42,0.07)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            zIndex: 3,
          }}
        >
          <ImagePlus className="w-5 h-5" style={{ color: 'rgba(15,23,42,0.65)' }} strokeWidth={2} />
        </motion.button>
      </div>

      {/* Hairline below textarea */}
      <div className="mx-4" style={{ height: 1, background: 'rgba(15,23,42,0.07)', marginTop: 14 }} />

      {pushCourseToBottom && <div className="flex-1" />}

      {/* Course tag */}
      {includeCourseTag && renderCourseTag()}
    </>
  );

  const renderCourseTag = () => (
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
                  style={{ background: 'rgba(15,23,42,0.06)' }}
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

      {/* ── Media state: caption at top, then carousel ── */}
      {hasMedia ? (
        <>
          {/* Caption block — at top, directly below topbar */}
          <div className="shrink-0">
            {renderCaptionBlock(52, 72, false, false)}
          </div>

          {/* 24px gap above carousel */}
          <div style={{ flexShrink: 0, height: 24 }} />

          {/* ── Scrollable thumbnail carousel ── */}
          <div style={{
            flex: 1,
            minHeight: 0,
            display: 'flex',
            alignItems: 'center',
            overflowX: 'auto',
            overflowY: 'hidden',
            scrollbarWidth: 'none',
            gap: 5,
            padding: '0 16px',
          }}>
            {state.mediaItems.map((item, i) => {
              const isActive = i === coverIndex;
              const isCover = i === coverIndex;
              const stillSrc = getPreviewStillSrc(item);
              const previewTransform = getPreviewTransform(item.edits);
              return (
                <motion.div
                  key={item.id}
                  onTap={() => {
                    if (longPressFiredRef.current) return;
                    setActiveMedia(i);
                  }}
                  onPointerDown={() => {
                    longPressFiredRef.current = false;
                    longPressTimerRef.current = setTimeout(() => {
                      longPressFiredRef.current = true;
                      handleSetCover(i);
                    }, 400);
                  }}
                  onPointerUp={() => { if (longPressTimerRef.current) { clearTimeout(longPressTimerRef.current); longPressTimerRef.current = null; } }}
                  onPointerCancel={() => { if (longPressTimerRef.current) { clearTimeout(longPressTimerRef.current); longPressTimerRef.current = null; } }}
                  style={{
                    position: 'relative',
                    flexShrink: 0,
                    height: '80%',
                    aspectRatio: '1',
                    borderRadius: 12,
                    overflow: 'hidden',
                    outline: 'none',
                    cursor: 'pointer',
                  }}
                >
                  {/* Media render */}
                  {item.mediaType === 'video' ? (
                    <>
                      {stillSrc ? (
                        <>
                          <img src={stillSrc} alt="" className="w-full h-full object-cover" style={{ transform: previewTransform }} />
                          {hasActiveFilter(item.edits) && (
                            <img
                              src={stillSrc}
                              alt=""
                              className={`absolute inset-0 w-full h-full object-cover ${getFilterClass(item.edits!.filter!)}`}
                              style={{ opacity: (item.edits?.filterIntensity ?? 100) / 100, transform: previewTransform }}
                            />
                          )}
                        </>
                      ) : (
                        <video
                          src={item.previewUrl}
                          poster={item.thumbnailUrl || undefined}
                          className={`w-full h-full object-cover ${item.edits?.filter ? getFilterClass(item.edits.filter) : ''}`}
                          style={{ transform: previewTransform }}
                          playsInline muted preload="metadata"
                        />
                      )}
                      {/* Play icon */}
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.60)' }}>
                          <Play className="w-3.5 h-3.5 text-white ml-0.5" fill="white" strokeWidth={0} />
                        </div>
                      </div>
                    </>
                  ) : (
                    <img
                      src={item.thumbnailUrl || item.previewUrl}
                      alt=""
                      className={`w-full h-full object-cover ${item.edits?.filter ? getFilterClass(item.edits.filter) : ''}`}
                      style={{ transform: previewTransform }}
                    />
                  )}

                  {/* Inactive dim */}
                  {!isActive && <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.40)', pointerEvents: 'none' }} />}

                  {/* Text overlay indicator — top-right */}
                  {item.edits?.textOverlays && item.edits.textOverlays.length > 0 && (
                    <div style={{
                      position: 'absolute', top: 6, right: 6,
                      width: 16, height: 16, borderRadius: 5,
                      background: 'rgba(0,0,0,0.55)',
                      backdropFilter: 'blur(6px)',
                      border: '1px solid rgba(255,255,255,0.18)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 8, fontWeight: 800, color: 'rgba(255,255,255,0.85)',
                      pointerEvents: 'none', zIndex: 3,
                    }}>
                      T
                    </div>
                  )}


                  {isCover && (
                    <div style={{
                      position: 'absolute', top: 7, left: 7,
                      display: 'flex', alignItems: 'center', gap: 3,
                      background: 'rgba(0,0,0,0.58)',
                      backdropFilter: 'blur(8px)',
                      WebkitBackdropFilter: 'blur(8px)',
                      border: '1px solid rgba(255,255,255,0.20)',
                      borderRadius: 7,
                      padding: '3px 6px',
                      pointerEvents: 'none',
                      zIndex: 4,
                    }}>
                      <svg width="7" height="7" viewBox="0 0 24 24" fill="rgba(255,255,255,0.90)" stroke="none">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                      </svg>
                      <span style={{ fontSize: 8, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.6, color: 'rgba(255,255,255,0.90)' }}>
                        Cover
                      </span>
                    </div>
                  )}

                  {/* Edit button — bottom-right */}
                  <button
                    onPointerDown={e => e.stopPropagation()}
                    onClick={e => { e.stopPropagation(); handleEdit(i); }}
                    style={{
                      position: 'absolute', bottom: 8, right: 8,
                      display: 'flex', alignItems: 'center', gap: 4,
                      background: 'rgba(0,0,0,0.58)',
                      backdropFilter: 'blur(8px)',
                      WebkitBackdropFilter: 'blur(8px)',
                      border: '1px solid rgba(255,255,255,0.16)',
                      borderRadius: 8, padding: '4px 8px',
                      cursor: 'pointer', color: '#fff',
                      zIndex: 4,
                    }}
                  >
                    <Pencil className="w-[11px] h-[11px]" />
                    <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: 0.2 }}>Edit</span>
                  </button>
                </motion.div>
              );
            })}

            {/* Add more tile */}
            {state.mediaItems.length < POST_LIMITS.MAX_MEDIA_COUNT && (
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => fileInputRef.current?.click()}
                style={{
                  flexShrink: 0,
                  height: '80%',
                  aspectRatio: '1',
                  borderRadius: 12,
                  background: 'rgba(255,255,255,0.04)',
                  border: '1.5px dashed rgba(255,255,255,0.12)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <Plus className="w-5 h-5" style={{ color: 'rgba(255,255,255,0.25)' }} />
              </motion.button>
            )}
          </div>

          {/* 24px gap below carousel */}
          <div style={{ flexShrink: 0, height: 24 }} />

          {/* Course tag — below carousel */}
          <div className="shrink-0">
            {renderCourseTag()}
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
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.12)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <ImagePlus className="w-[18px] h-[18px]" style={{ color: 'rgba(255,255,255,0.70)' }} strokeWidth={2} />
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
                  background: 'rgba(255,255,255,0.85)',
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


      {/* Studio Shelf */}
      {state.mediaItems[state.activeMediaIndex] && (
        <StudioShelf
          open={shelfOpen}
          onClose={() => setShelfOpen(false)}
          activeTool={activeTool}
          setActiveTool={setActiveTool}
          activeMediaId={state.mediaItems[state.activeMediaIndex].id}
          activeMediaType={state.mediaItems[state.activeMediaIndex].mediaType}
          activeMediaPreviewUrl={state.mediaItems[state.activeMediaIndex].previewUrl}
          activeMediaThumbnailUrl={state.mediaItems[state.activeMediaIndex].thumbnailUrl}
          edits={state.mediaItems[state.activeMediaIndex].edits ?? {}}
          updateEdits={handleUpdateEdits}
          clearEdits={handleClearEdits}
          activeOverlayId={activeOverlayId}
          onSelectOverlay={setActiveOverlayId}
          allMediaItems={state.mediaItems.map(m => ({
            id: m.id,
            mediaType: m.mediaType,
            previewUrl: m.previewUrl,
            thumbnailUrl: m.thumbnailUrl,
          }))}
          activeMediaIndex={state.activeMediaIndex}
          onNavigateMedia={(index) => setActiveMedia(index)}
          trimStart={state.mediaItems[state.activeMediaIndex].trimStart || 0}
          trimEnd={state.mediaItems[state.activeMediaIndex].trimEnd ?? state.mediaItems[state.activeMediaIndex].duration ?? 0}
          duration={state.mediaItems[state.activeMediaIndex].duration ?? 0}
          onTrimChange={(start, end) => {
            const item = state.mediaItems[state.activeMediaIndex];
            if (item) updateTrim(item.id, start, end);
          }}
        />
      )}

    </div>
  );
}
