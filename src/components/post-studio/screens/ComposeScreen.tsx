// ComposeScreen — Single dark cinematic creation surface
// Two states: empty "Fairway" (text-first) and media-loaded (strip + edit tray)
// Dark. Cinematic. Golf-native.

import React, { useState, useCallback, useRef, useMemo, useEffect } from 'react';

import {
  Camera, ImagePlus, AtSign, X, Play, Clock, FileText, MapPin, Trophy, Pencil, ChevronRight,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { StudioHeader } from '../components/StudioHeader';
import { CharacterRing } from '../components/CharacterRing';
import { ActorSelector } from '../components/ActorSelector';
import { CinematicHero } from '../components/CinematicHero';
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
    state, setStep, setActiveMedia, setCoverMedia, removeMedia, addMedia,
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
  // Cover is sourced from reducer state (keyed by media ID, persists across remounts/reorders)
  const coverMediaId = state.coverMediaId;
  const coverIndex = coverMediaId
    ? Math.max(0, state.mediaItems.findIndex((m) => m.id === coverMediaId))
    : 0;
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
    const targetId = state.mediaItems[index]?.id;
    if (!targetId) return;
    setCoverMedia(targetId);
    setActiveMedia(index);
    toast.success('Cover updated');
  }, [state.mediaItems, setCoverMedia, setActiveMedia]);

  // ── Publish handler — one-step flow ──
  const handlePublish = useCallback(async () => {
    if (isPublishing) return;
    setIsPublishing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { toast.error('You need to be logged in'); setIsPublishing(false); return; }

      // Reorder so the user-selected cover lands at display_order: 0.
      // Post Studio cover == display_order: 0; there is no is_cover column on post_media.
      const coverIdx = state.coverMediaId
        ? state.mediaItems.findIndex((m) => m.id === state.coverMediaId)
        : 0;
      const orderedMediaItems = coverIdx > 0
        ? [
            state.mediaItems[coverIdx],
            ...state.mediaItems.filter((_, i) => i !== coverIdx),
          ]
        : state.mediaItems;

      const files = orderedMediaItems.map((m) => m.file).filter((f): f is File => !!f);
      const selectedTags = state.mentions.map((m) => ({
        id: m.entityId, entity_id: m.profileId, entity_type: m.entityType,
        name: m.displayName, username: m.username ?? null,
        start_index: m.start, end_index: m.end,
      }));

      const input: UploadJobInput = {
        actorType: state.actorType, actorId: state.actorId ?? user.id, userId: user.id,
        caption: state.caption, files,
        mediaItems: orderedMediaItems.map((item) => ({
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
        media_type: orderedMediaItems[0]?.mediaType ?? 'unknown',
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


  // ── Caption auto-grow constants ──
  const CAPTION_LINE_HEIGHT = 24; // matches lineHeight: 1.5 * fontSize: 16
  const CAPTION_MAX_LINES = 6;
  const CAPTION_MAX_HEIGHT = CAPTION_LINE_HEIGHT * CAPTION_MAX_LINES; // 144

  // Auto-resize textarea on caption change
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, CAPTION_MAX_HEIGHT)}px`;
  }, [state.caption]);

  const handleMentionClick = useCallback(() => {
    const pos = textareaRef.current?.selectionStart ?? state.caption.length;
    const newCaption = state.caption.slice(0, pos) + '@' + state.caption.slice(pos);
    setCaption(newCaption);
    setMentionTriggerIndex(pos);
    openPanel('mention');
  }, [state.caption, setCaption, setMentionTriggerIndex, openPanel]);

  const renderCourseTag = () => {
    const GREEN_DEEP = '#15803D';
    const GREEN_TEXT = '#16A34A';
    const CARD_BG = 'rgba(34,197,94,0.10)';
    const CARD_BORDER = '1px solid rgba(22,163,74,0.30)';

    return (
      <div>
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
              style={{ background: CARD_BG, border: CARD_BORDER }}
            >
              <div
                className="rounded-xl flex items-center justify-center shrink-0"
                style={{ width: 32, height: 32, background: 'rgba(34,197,94,0.18)' }}
              >
                <span className="text-base">⛳</span>
              </div>
              <div className="flex-1 text-left">
                <p style={{ fontSize: 13.5, fontWeight: 700, color: DARK_TEXT, lineHeight: 1.15 }}>
                  Tag where you played
                </p>
                <p style={{ fontSize: 10.5, fontWeight: 600, color: GREEN_DEEP, marginTop: 2, lineHeight: 1.2 }}>
                  Make it part of the course&apos;s story
                </p>
              </div>
              <ChevronRight style={{ width: 15, height: 15, color: GREEN_TEXT, flexShrink: 0 }} strokeWidth={2} />
            </motion.button>
          ) : (
            <motion.div
              key="tagged"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.18 }}
              className="flex flex-col gap-1.5"
            >
              {/* Primary course — rich card */}
              {(() => {
                const primary = state.taggedCourses[0];
                const hasRank = typeof primary.top100Rank === 'number';
                const locationText = [primary.region, primary.country].filter(Boolean).join(', ');
                return (
                  <motion.div
                    key={primary.courseId}
                    layout
                    initial={{ scale: 0.96, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.96, opacity: 0 }}
                    onClick={() => openPanel('course')}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openPanel('course'); } }}
                    className="flex items-stretch w-full overflow-hidden cursor-pointer"
                    style={{ background: CARD_BG, border: CARD_BORDER, borderRadius: 14 }}
                  >
                    {/* Thumbnail column */}
                    <div
                      className="shrink-0 relative"
                      style={{
                        width: 64,
                        alignSelf: 'stretch',
                        background: primary.imageUrl
                          ? `center/cover url(${primary.imageUrl})`
                          : 'rgba(34,197,94,0.18)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {!primary.imageUrl && <span style={{ fontSize: 22 }}>⛳</span>}
                      {/* Bottom gradient over thumb */}
                      {primary.imageUrl && (
                        <div
                          aria-hidden
                          style={{
                            position: 'absolute', inset: 0,
                            background: 'linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.20) 100%)',
                            pointerEvents: 'none',
                          }}
                        />
                      )}
                      {hasRank && (
                        <div
                          style={{
                            position: 'absolute', top: 4, left: 4,
                            background: 'rgba(0,0,0,0.65)',
                            color: '#fff',
                            fontSize: 9, fontWeight: 800, lineHeight: 1,
                            padding: '3px 5px', borderRadius: 5,
                          }}
                        >
                          #{primary.top100Rank}
                        </div>
                      )}
                    </div>

                    {/* Info column */}
                    <div className="flex-1 min-w-0 flex items-center" style={{ padding: '10px 12px', gap: 8 }}>
                      <div className="flex-1 min-w-0">
                        <p
                          style={{
                            fontSize: 13.5, fontWeight: 700, color: DARK_TEXT,
                            lineHeight: 1.2,
                            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                          }}
                        >
                          {primary.courseName}
                        </p>
                        <div
                          className="flex items-center"
                          style={{ marginTop: 3, gap: 6, fontSize: 10.5, fontWeight: 600, color: GREEN_DEEP, minWidth: 0 }}
                        >
                          {locationText && (
                            <span className="flex items-center" style={{ gap: 3, minWidth: 0 }}>
                              <MapPin style={{ width: 9, height: 9, flexShrink: 0 }} strokeWidth={2} />
                              <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {locationText}
                              </span>
                            </span>
                          )}
                          {hasRank && (
                            <>
                              {locationText && <span style={{ opacity: 0.45 }}>·</span>}
                              <span className="flex items-center shrink-0" style={{ gap: 3 }}>
                                <Trophy style={{ width: 9, height: 9 }} strokeWidth={2} />
                                <span>Top 100</span>
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Edit button */}
                      <div
                        role="button"
                        tabIndex={0}
                        aria-label="Edit tagged course"
                        onClick={(e) => { e.stopPropagation(); openPanel('course'); }}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); openPanel('course'); } }}
                        className="flex items-center justify-center shrink-0 cursor-pointer"
                        style={{
                          width: 28, height: 28, borderRadius: 8,
                          background: 'rgba(255,255,255,0.55)',
                        }}
                      >
                        <Pencil style={{ width: 11, height: 11, color: GREEN_DEEP }} strokeWidth={2} />
                      </div>
                    </div>
                  </motion.div>
                );
              })()}

              {/* Secondary courses — small chips */}
              {state.taggedCourses.slice(1).map((course, i) => (
                <motion.button
                  key={course.courseId}
                  layout
                  initial={{ scale: 0.85, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.85, opacity: 0 }}
                  onClick={() => openPanel('course')}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl w-full"
                  style={{ background: CARD_BG, border: CARD_BORDER }}
                >
                  <div
                    style={{
                      width: 24, height: 24, borderRadius: 7, flexShrink: 0,
                      background: 'rgba(34,197,94,0.18)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 12, fontWeight: 700, color: 'rgba(22,163,74,0.85)',
                    }}
                  >
                    {i + 2}
                  </div>
                  <div className="text-left flex-1 min-w-0">
                    <p
                      className="text-[12px] font-semibold leading-none"
                      style={{ color: DARK_TEXT, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                    >
                      {course.courseName}
                    </p>
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
                    padding: '7px 12px',
                    borderRadius: 12,
                    border: '1.5px dashed rgba(34,197,94,0.30)',
                    background: 'transparent',
                    cursor: 'pointer',
                    alignSelf: 'flex-start',
                  }}
                >
                  <span style={{ fontSize: 14 }}>⛳</span>
                  <span className="text-[12.5px] font-semibold" style={{ color: GREEN_DEEP }}>
                    Add another course
                  </span>
                </motion.button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  

  return (
    <div className="flex-1 flex flex-col" style={{ background: COMPOSE_BG, minHeight: 0, overflow: 'hidden' }}>
      <StudioHeader
        centerContent={<ActorSelector compact header />}
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

      {/* ── Scrolling body — single unified layout ── */}
      <div
        className="flex-1 overflow-y-auto"
        style={{
          scrollbarWidth: 'none',
          WebkitOverflowScrolling: 'touch',
          overscrollBehavior: 'contain',
        }}
      >
        {/* Caption */}
        <div className="px-4 pt-4 relative">
          {/* Mention highlight overlay */}
          {state.mentions.length > 0 && (
            <div
              ref={mentionOverlayRef}
              aria-hidden="true"
              style={{
                position: 'absolute',
                top: 16,
                left: 16,
                right: 24,
                maxHeight: CAPTION_MAX_HEIGHT,
                overflowY: 'auto',
                WebkitOverflowScrolling: 'touch',
                pointerEvents: 'none',
                fontSize: 16,
                fontWeight: 500,
                lineHeight: 1.5,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                scrollbarWidth: 'none',
              }}
            >
              {highlightedCaption}
            </div>
          )}
          <textarea
            ref={textareaRef}
            value={state.caption}
            onFocus={() => setTextareaFocused(true)}
            onBlur={() => setTextareaFocused(false)}
            onChange={handleCaptionChange}
            onScroll={(e) => {
              if (mentionOverlayRef.current) {
                mentionOverlayRef.current.scrollTop = e.currentTarget.scrollTop;
              }
            }}
            placeholder="Tell us about your round."
            className="w-full resize-none outline-none placeholder:italic placeholder:text-black/[.40]"
            style={{
              background: 'transparent',
              fontSize: 16,
              lineHeight: 1.5,
              fontWeight: 500,
              color: state.mentions.length > 0 ? 'transparent' : DARK_TEXT,
              caretColor: '#F7931E',
              WebkitTextFillColor: state.mentions.length > 0 ? 'transparent' : undefined,
              minHeight: CAPTION_LINE_HEIGHT,
              maxHeight: CAPTION_MAX_HEIGHT,
              overflowY: 'auto',
              scrollbarWidth: 'none',
              WebkitOverflowScrolling: 'touch',
              paddingRight: 8,
            }}
            maxLength={POST_LIMITS.MAX_CAPTION_LENGTH + 100}
          />
        </div>

        {/* Hairline */}
        <div className="mx-4" style={{ height: 1, background: 'rgba(15,23,42,0.07)', marginTop: 10 }} />

        {/* Course tag — always immediately below hairline */}
        <div className="px-4 pt-3">
          {renderCourseTag()}
        </div>

        {/* Media area: cinematic hero OR empty hint */}
        <div className="px-4 pt-3.5">
          {hasMedia ? (
            <CinematicHero
              mediaItems={state.mediaItems}
              coverMediaId={coverMediaId}
              taggedCourseName={state.taggedCourses[0]?.courseName}
              onSetCover={(mediaId) => {
                setCoverMedia(mediaId);
                const idx = state.mediaItems.findIndex((m) => m.id === mediaId);
                if (idx >= 0) setActiveMedia(idx);
                toast.success('Cover updated');
              }}
              onRemove={(mediaId) => {
                removeMedia(mediaId);
              }}
              onEdit={(mediaId) => {
                const idx = state.mediaItems.findIndex((m) => m.id === mediaId);
                if (idx >= 0) {
                  setActiveMedia(idx);
                  setActiveTool('filter');
                  setShelfOpen(true);
                }
              }}
              onAddMore={() => fileInputRef.current?.click()}
            />
          ) : !state.caption ? (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center justify-center w-full"
              style={{
                minHeight: 180,
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: 0,
              }}
              aria-label="Add photos or a video"
            >
              <div style={{ textAlign: 'center', opacity: 0.55 }}>
                <div
                  style={{
                    width: 56, height: 56, borderRadius: 16,
                    background: 'rgba(15,23,42,0.05)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 12px',
                  }}
                >
                  <ImagePlus style={{ width: 24, height: 24, color: 'rgba(15,23,42,0.55)' }} strokeWidth={1.5} />
                </div>
                <div style={{ fontSize: 12, fontWeight: 500, color: 'rgba(15,23,42,0.50)' }}>
                  Add photos or a video to bring your round to life
                </div>
              </div>
            </button>
          ) : null}
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
              <div className="w-3.5 h-3.5 rounded-full border-2 animate-spin" style={{ borderColor: 'rgba(15,23,42,0.15)', borderTopColor: 'transparent' }} />
              Processing…
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bottom padding so last item isn't flush with toolbar */}
        <div style={{ height: 24 }} />
      </div>

      {/* ── Bottom toolbar — pinned ── */}
      <div
        className="shrink-0"
        style={{
          background: '#ffffff',
          borderTop: '1px solid rgba(15,23,42,0.07)',
          paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 8px)',
        }}
      >
        <div className="flex items-center px-3.5 gap-2.5" style={{ minHeight: 54, paddingTop: 8 }}>
          {/* Library — outline pill with label */}
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => fileInputRef.current?.click()}
            disabled={isProcessing}
            className="flex items-center justify-center gap-2 disabled:opacity-40"
            style={{
              padding: '9px 14px',
              borderRadius: 12,
              background: '#fff',
              border: '1px solid rgba(15,23,42,0.10)',
              boxShadow: '0 1px 2px rgba(15,23,42,0.04)',
              cursor: 'pointer',
            }}
          >
            <ImagePlus style={{ width: 15, height: 15, color: '#0F172A' }} strokeWidth={2} />
            <span style={{ fontSize: 12.5, fontWeight: 700, color: '#0F172A', letterSpacing: 0.1 }}>Library</span>
          </motion.button>

          {/* Camera — outline pill with label */}
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => rearCameraInputRef.current?.click()}
            disabled={isProcessing}
            className="flex items-center justify-center gap-2 disabled:opacity-40"
            style={{
              padding: '9px 14px',
              borderRadius: 12,
              background: '#fff',
              border: '1px solid rgba(15,23,42,0.10)',
              boxShadow: '0 1px 2px rgba(15,23,42,0.04)',
              cursor: 'pointer',
            }}
          >
            <Camera style={{ width: 15, height: 15, color: '#0F172A' }} strokeWidth={2} />
            <span style={{ fontSize: 12.5, fontWeight: 700, color: '#0F172A', letterSpacing: 0.1 }}>Camera</span>
          </motion.button>

          <div className="flex-1" />

          {/* Secondary cluster — @ Schedule Drafts */}
          <div
            className="flex items-center"
            style={{
              gap: 1,
              padding: 2,
              borderRadius: 10,
              background: 'rgba(15,23,42,0.05)',
            }}
          >
            <motion.button
              whileTap={{ scale: 0.92 }}
              onClick={handleMentionClick}
              style={{ width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: 0, cursor: 'pointer' }}
              aria-label="Mention"
            >
              <AtSign style={{ width: 15, height: 15, color: 'rgba(15,23,42,0.55)' }} strokeWidth={2} />
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.92 }}
              onClick={() => openPanel('schedule')}
              style={{ width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: 0, cursor: 'pointer' }}
              aria-label="Schedule"
            >
              <Clock style={{ width: 15, height: 15, color: 'rgba(15,23,42,0.55)' }} strokeWidth={2} />
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.92 }}
              onClick={() => openPanel('drafts')}
              style={{ width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: 0, cursor: 'pointer', position: 'relative' }}
              aria-label="Drafts"
            >
              <FileText style={{ width: 15, height: 15, color: 'rgba(15,23,42,0.55)' }} strokeWidth={2} />
              {draftsCount > 0 && (
                <div style={{
                  position: 'absolute', top: 6, right: 6,
                  width: 5, height: 5, borderRadius: '50%',
                  background: '#F7931E',
                }} />
              )}
            </motion.button>
          </div>

          {/* Char ring — only when typing */}
          {charCount > 0 && (
            <div className="flex items-center justify-center shrink-0" style={{ width: 28, height: 28 }}>
              <CharacterRing count={charCount} size={28} />
            </div>
          )}
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
