/**
 * Review Wizard — Single-canvas review composer.
 * Mirrors the Post composer structure (scroll body + docked action bar)
 * and reuses the Post media subsystem verbatim (MediaStage / MediaEditor /
 * FrameChooser / bakeFrameCrop / filesToComposerMedia).
 *
 * Public contract preserved (name, path, props). Data layer untouched —
 * we still drive useReviewWizard / ReviewUploadManager / submitReview.
 */

import React, {
  useState,
  useEffect,
  useCallback,
  useLayoutEffect,
  useRef,
  useMemo,
} from 'react';
import { createPortal } from 'react-dom';
import { lockBodyScroll, unlockBodyScroll } from '@/lib/bodyScrollLock';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ImagePlus, Mic, Square, RotateCw, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigationGuard } from '@/hooks/useNavigationGuard';
import { CourseSearchSheet } from '@/components/courses/CourseSearchSheet';
import { cn } from '@/lib/utils';
import { ratingTextColor } from '@/lib/ratingTier';
import { OverlayPortalProvider } from '@/context/OverlayPortalContext';
import { toast } from 'sonner';
import { useShareReview } from '@/hooks/useShareReview';
import { useActiveActor } from '@/context/ActiveActorContext';
import { useMedianStatusBar } from '@/hooks/useMedianStatusBar';
import { formatCourseLocation } from '@/utils/courseLocation';
import { MentionBottomSheet, type MentionSuggestion } from '@/components/shared/media/MentionBottomSheet';
import { useVoiceRecorder } from '@/hooks/useVoiceRecorder';
import { transcribeAudio } from '@/lib/transcribeAudio';

import { MediaStage } from '@/components/post-composer/MediaStage';
import { MediaEditor } from '@/components/post-composer/MediaEditor';
import { bakeFrameCrop } from '@/components/post-composer/bakeFrameCrop';
import {
  filesToComposerMedia,
  type ComposerMediaItem,
} from '@/components/post-composer/composerMedia';

import { DiscardActionSheet } from './DiscardActionSheet';
import { RemoveReviewActionSheet } from './RemoveReviewActionSheet';
import { SuccessScreen } from './SuccessScreen';
import { LuminousCellRating as TickScrubber } from './LuminousCellRating';
import { useReviewWizard } from './useReviewWizard';
import type {
  ReviewWizardProps,
  ReviewWizardCourse,
  ReviewBreakdowns,
} from './types';

/* ── Tokens (Post Studio) ─────────────────────────────────────────────────── */
const INK = '#0F172A';
const INK_MUTE = '#64748B';
const INK_FAINT = '#94A3B8';
const PAGE = '#F8FAFC';
const SURFACE = '#FFFFFF';
const CHIP = '#F5F5F7';
const HAIR = 'rgba(15,23,42,0.07)';
const AMBER = '#F7931E';
const AMBER_SOFT = '#FEF3E7';
const GOLD_DEEP = '#D97706';

const MAX_REVIEW_LENGTH = 4000;
const PAD_X = 'clamp(12px, 4vw, 16px)';

const BREAKDOWNS: Array<{ key: keyof ReviewBreakdowns; label: string; desc: string }> = [
  { key: 'design', label: 'Course Design', desc: 'Layout, design and landscape' },
  { key: 'condition', label: 'Course Condition', desc: 'Greens, fairways and upkeep' },
  { key: 'clubhouse', label: 'Clubhouse', desc: 'Building, food and welcome' },
  { key: 'facilities', label: 'Practice Facilities', desc: 'Range, putting and short game' },
];


/* ── Component ────────────────────────────────────────────────────────────── */

export function ReviewWizard({
  course,
  isOpen,
  onClose,
  isEditMode = false,
  alreadyShared = false,
  existingRating,
  initialMediaFiles,
}: ReviewWizardProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { notifyReviewShared } = useShareReview();
  useActiveActor();

  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showCourseSearch, setShowCourseSearch] = useState(false);
  const [activeCourse, setActiveCourse] = useState<ReviewWizardCourse | null>(course);
  const [sharedPostId, setSharedPostId] = useState<string | null>(null);
  const [verdictFocused, setVerdictFocused] = useState(false);
  const autoShareAttempted = useRef(false);
  const previousRatingRef = useRef<number | null>(existingRating?.rating ?? null);
  const stablePreviousRating = previousRatingRef.current;

  const overlayRootRef = useRef<HTMLDivElement>(null);
  const [overlayRoot, setOverlayRoot] = useState<HTMLElement | null>(null);

  useEffect(() => {
    if (isOpen && overlayRootRef.current) setOverlayRoot(overlayRootRef.current);
    else setOverlayRoot(null);
  }, [isOpen]);

  // Scroll lock — shared, reference-counted util
  useLayoutEffect(() => {
    if (!isOpen) return;
    lockBodyScroll();
    return () => unlockBodyScroll();
  }, [isOpen]);

  useEffect(() => {
    if (course) setActiveCourse(course);
  }, [course]);

  const wizard = useReviewWizard({
    course: activeCourse,
    isEditMode,
    existingRating,
    initialMediaFiles,
    onSuccess: () => wizard.goToStep('success'),
  });

  useMedianStatusBar('light', 'transparent', isOpen, false);

  /* ── Local ComposerMediaItem mirror for pending files ─────────────────── */
  // Source of truth for pending files = wizard.allMedia (pending entries).
  // We keep a parallel ComposerMediaItem[] indexed by File reference so the
  // MediaEditor (frame + pos) can run; on submit we bake and swap pendingFiles.
  const [pendingItems, setPendingItems] = useState<ComposerMediaItem[]>([]);
  const pendingByFile = useRef(new Map<File, ComposerMediaItem>());

  const pendingMedia = useMemo(
    () => wizard.allMedia.filter((m) => m.status === 'pending' && m.file),
    [wizard.allMedia]
  );

  // Sync local items with wizard.pendingFiles by File ref. Measure any new
  // files (image/video) to capture width/height + previewUrl.
  useEffect(() => {
    let cancelled = false;
    const currentFiles = pendingMedia.map((m) => m.file as File);
    const needMeasure = currentFiles.filter((f) => !pendingByFile.current.has(f));
    (async () => {
      if (needMeasure.length) {
        const measured = await filesToComposerMedia(needMeasure);
        if (cancelled) return;
        measured.forEach((m) => pendingByFile.current.set(m.file, m));
      }
      // Drop files no longer present
      const present = new Set(currentFiles);
      for (const f of Array.from(pendingByFile.current.keys())) {
        if (!present.has(f)) pendingByFile.current.delete(f);
      }
      if (cancelled) return;
      setPendingItems(
        currentFiles
          .map((f) => pendingByFile.current.get(f))
          .filter((m): m is ComposerMediaItem => Boolean(m))
      );
    })();
    return () => {
      cancelled = true;
    };
  }, [pendingMedia]);

  // Existing media tiles (edit mode) — map to MediaStage-compatible shape.
  const existingTiles = useMemo(
    () =>
      wizard.allMedia
        .filter((m) => m.status === 'existing')
        .map((m) => ({
          kind: 'existing' as const,
          id: m.id,
          type: m.type,
          stageItem: {
            id: m.id,
            type: m.type,
            previewUrl: m.previewUrl || m.uploadedUrl || '',
            posterUrl: m.posterUrl || undefined,
            width: 16,
            height: 9,
            pos: { x: 50, y: 50 },
          },
        })),
    [wizard.allMedia]
  );

  const pendingTiles = useMemo(
    () =>
      pendingItems.map((item) => ({
        kind: 'pending' as const,
        id: item.id,
        type: item.type,
        item,
      })),
    [pendingItems]
  );

  const hasMedia = existingTiles.length + pendingTiles.length > 0;

  /* ── Media editor state ──────────────────────────────────────────────── */
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorIndex, setEditorIndex] = useState(0);

  const openEditor = useCallback(
    (idx: number) => {
      if (!pendingItems[idx]) return;
      setEditorIndex(idx);
      setEditorOpen(true);
    },
    [pendingItems]
  );

  const onEditorDone = useCallback((updated: ComposerMediaItem[]) => {
    updated.forEach((m) => pendingByFile.current.set(m.file, m));
    setPendingItems(updated);
    setEditorOpen(false);
  }, []);

  /* ── Discard / unsaved-changes ───────────────────────────────────────── */
  const hasAnyBreakdown = Object.values(wizard.state.breakdowns).some((v) => v !== null);
  const hasUnsavedChanges =
    wizard.state.rating !== null ||
    hasAnyBreakdown ||
    wizard.state.review.length > 0 ||
    wizard.allMedia.length > 0;

  const isPostSubmit = wizard.state.step === 'success';

  useNavigationGuard({
    active: wizard.isSubmitting || (hasUnsavedChanges && !isPostSubmit),
    message: wizard.isSubmitting
      ? 'Your review is still being submitted.'
      : 'You have unsaved changes. Are you sure you want to leave?',
  });

  const handleClose = useCallback(() => {
    if (isPostSubmit) {
      wizard.cleanup();
      onClose();
      return;
    }
    if (hasUnsavedChanges) setShowCloseConfirm(true);
    else {
      wizard.cleanup();
      onClose();
    }
  }, [hasUnsavedChanges, isPostSubmit, wizard, onClose]);

  const confirmClose = useCallback(() => {
    setShowCloseConfirm(false);
    wizard.cleanup();
    onClose();
  }, [wizard, onClose]);

  /* ── Auto-share notification ─────────────────────────────────────────── */
  useEffect(() => {
    if (
      wizard.state.step === 'success' &&
      !isEditMode &&
      !alreadyShared &&
      !autoShareAttempted.current &&
      wizard.submittedRatingId
    ) {
      autoShareAttempted.current = true;
      const t = window.setTimeout(async () => {
        try {
          const result = await notifyReviewShared({ ratingId: wizard.submittedRatingId! });
          if (result.success) setSharedPostId(result.postId || null);
        } catch (err) {
          console.error('[ReviewWizard] Auto-share notify failed:', err);
        }
      }, 1500);
      return () => window.clearTimeout(t);
    }
  }, [wizard.state.step, isEditMode, alreadyShared, wizard.submittedRatingId, notifyReviewShared]);

  /* ── Success handlers ────────────────────────────────────────────────── */
  const handleViewReview = useCallback(() => {
    if (wizard.submittedRatingId && activeCourse) {
      wizard.cleanup();
      onClose();
      navigate(
        `/courses/${activeCourse.id}?tab=reviews&review=${wizard.submittedRatingId}`,
        { replace: true }
      );
    }
  }, [wizard, activeCourse, onClose, navigate]);

  const handleDone = useCallback(() => {
    wizard.cleanup();
    onClose();
  }, [wizard, onClose]);

  /* ── Delete (edit mode) ──────────────────────────────────────────────── */
  const handleRemoveReviewClick = useCallback(() => setShowDeleteConfirm(true), []);
  const confirmDeleteReview = useCallback(async () => {
    if (!activeCourse) return;
    try {
      await wizard.deleteReview();
      setShowDeleteConfirm(false);
      toast.success('Review removed');
      wizard.cleanup();
      navigate(`/courses/${activeCourse.id}`, { replace: true });
    } catch {
      setShowDeleteConfirm(false);
    }
  }, [activeCourse, wizard, navigate]);

  /* ── File picker + add ──────────────────────────────────────────────── */
  const fileRef = useRef<HTMLInputElement>(null);

  const handlePickFiles = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files ?? []);
      if (files.length) {
        // Split images vs videos to match wizard API
        const images = files.filter((f) => !f.type.startsWith('video/'));
        const videos = files.filter((f) => f.type.startsWith('video/'));
        if (images.length) wizard.addImages(images);
        videos.forEach((v) => wizard.addVideo(v));
      }
      e.target.value = '';
    },
    [wizard]
  );

  const removeMediaTile = useCallback(
    (id: string) => {
      // Remove from local map if pending (by id)
      const pendingItem = pendingItems.find((p) => p.id === id);
      if (pendingItem) pendingByFile.current.delete(pendingItem.file);
      wizard.removeMedia(id);
    },
    [pendingItems, wizard]
  );

  // Pending tile id uses the local ComposerMediaItem.id; wizard expects
  // `pending-<index>` ids. Translate before calling removeMedia.
  const removePendingTile = useCallback(
    (localId: string) => {
      const idx = pendingItems.findIndex((p) => p.id === localId);
      if (idx < 0) return;
      const item = pendingItems[idx];
      pendingByFile.current.delete(item.file);
      wizard.removeMedia(`pending-${idx}`);
    },
    [pendingItems, wizard]
  );

  /* ── Category set count ──────────────────────────────────────────────── */
  const setCount = Object.values(wizard.state.breakdowns).filter((x) => x != null).length;

  /* ── Verdict textarea ───────────────────────────────────────────────── */
  const taRef = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    const el = taRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, [wizard.state.review]);


  // Mentions
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [cursorPos, setCursorPos] = useState(0);

  const handleReviewChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const value = e.target.value;
      const cursor = e.target.selectionStart || 0;
      wizard.setReview(value.slice(0, MAX_REVIEW_LENGTH));
      setCursorPos(cursor);
      const before = value.slice(0, cursor);
      const match = before.match(/@(\w*)$/);
      if (match) {
        setMentionQuery(match[1]);
        setShowMentions(true);
      } else {
        setShowMentions(false);
        setMentionQuery('');
      }
    },
    [wizard]
  );

  const handleMentionSelect = useCallback(
    (mention: MentionSuggestion) => {
      const review = wizard.state.review;
      const before = review.slice(0, cursorPos);
      const after = review.slice(cursorPos);
      const beforeMention = before.replace(/@\w*$/, '');
      const display = mention.username || mention.name;
      wizard.setReview(`${beforeMention}@${display} ${after}`);
      setShowMentions(false);
      setMentionQuery('');
      if (!wizard.state.selectedTags.some((t) => t.id === mention.id)) {
        wizard.setTags([...wizard.state.selectedTags, mention]);
      }
    },
    [wizard, cursorPos]
  );

  /* ── Voice mic (record → Whisper) ────────────────────────────────────── */
  type VoiceState = 'idle' | 'listening' | 'processing';
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const recorder = useVoiceRecorder();
  const MAX_VOICE_MS = 60_000;
  const voiceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasMicSupport =
    typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia;

  const stopListening = useCallback(() => {
    if (voiceTimeoutRef.current) {
      clearTimeout(voiceTimeoutRef.current);
      voiceTimeoutRef.current = null;
    }
    recorder.stopRecording();
    setVoiceState('processing');
  }, [recorder]);

  const startListening = useCallback(async () => {
    setVoiceState('listening');
    await recorder.startRecording();
    voiceTimeoutRef.current = setTimeout(() => stopListening(), MAX_VOICE_MS);
  }, [recorder, stopListening]);

  // When the blob is ready, transcribe and merge into the review text.
  useEffect(() => {
    if (voiceState !== 'processing' || !recorder.audioBlob) return;
    let cancelled = false;
    (async () => {
      try {
        const text = await transcribeAudio(recorder.audioBlob!);
        if (cancelled) return;
        if (text) {
          const cur = wizard.state.review;
          const merged = cur
            ? cur + (cur.endsWith(' ') ? '' : ' ') + text
            : text.charAt(0).toUpperCase() + text.slice(1);
          wizard.setReview(merged.slice(0, MAX_REVIEW_LENGTH));
        }
      } catch {
        toast.error("Couldn't transcribe — try again");
      } finally {
        if (!cancelled) {
          setVoiceState('idle');
          recorder.resetRecording();
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [voiceState, recorder.audioBlob, wizard, recorder]);

  // Surface recorder errors (e.g. permission denied) and reset state.
  useEffect(() => {
    if (recorder.error && voiceState !== 'idle') {
      if (voiceTimeoutRef.current) {
        clearTimeout(voiceTimeoutRef.current);
        voiceTimeoutRef.current = null;
      }
      setVoiceState('idle');
    }
  }, [recorder.error, voiceState]);

  // Cleanup on unmount.
  useEffect(() => {
    return () => {
      if (voiceTimeoutRef.current) clearTimeout(voiceTimeoutRef.current);
      recorder.cancelRecording();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── Keyboard docking (visualViewport) ───────────────────────────────── */
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const update = () => {
      const h = window.innerHeight - vv.height - vv.offsetTop;
      setKeyboardHeight(Math.max(0, Math.round(h)));
    };
    update();
    vv.addEventListener('resize', update);
    vv.addEventListener('scroll', update);
    return () => {
      vv.removeEventListener('resize', update);
      vv.removeEventListener('scroll', update);
    };
  }, []);

  /* ── Post (submit) ───────────────────────────────────────────────────── */
  const canPost = wizard.state.rating != null && !wizard.isSubmitting;
  const handlePost = useCallback(async () => {
    if (!canPost) return;
    // Bake non-original image frames into new Files, preserving order
    const baked: File[] = [];
    for (const item of pendingItems) {
      if (item.type === 'image' && item.frame !== 'original') {
        try {
          baked.push(await bakeFrameCrop(item.file, item.frame, item.pos));
        } catch {
          baked.push(item.file);
        }
      } else {
        baked.push(item.file);
      }
    }
    // Pass baked files straight into submit — no state round-trip, no timer.
    wizard.submit(baked);
  }, [canPost, pendingItems, wizard]);

  if (!isOpen) return null;

  const locationText = activeCourse
    ? formatCourseLocation({
        sub_country: activeCourse.sub_country,
        region: activeCourse.region,
        country: activeCourse.country,
      })
    : '';

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className={cn(
              'light fixed inset-0 z-[9999]',
              'flex flex-col',
              'overscroll-contain'
            )}
            style={{ touchAction: 'pan-y', background: PAGE, overflowX: 'hidden' }}
          >
            <div ref={overlayRootRef} className="contents" />
            <OverlayPortalProvider container={overlayRoot}>
              {wizard.state.step === 'success' ? (
                <SuccessScreen
                  key="success"
                  variant="standard"
                  course={activeCourse}
                  ratingId={wizard.submittedRatingId || ''}
                  rating={wizard.state.rating}
                  isEditMode={isEditMode}
                  previousRating={stablePreviousRating}
                  onViewReview={handleViewReview}
                  onDone={handleDone}
                />
              ) : (
                <>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*,video/*"
                    multiple
                    onChange={handlePickFiles}
                    style={{ display: 'none' }}
                  />

                  {/* Header */}
                  <div
                    style={{
                      background: PAGE,
                      borderBottom: `0.5px solid ${HAIR}`,
                      paddingTop: 'max(env(safe-area-inset-top, 0px), 14px)',
                      position: 'sticky',
                      top: 0,
                      zIndex: 5,
                    }}
                  >
                    <div style={{ width: '100%', maxWidth: 480, marginInline: 'auto', display: 'flex', alignItems: 'center', padding: `10px ${PAD_X}`, gap: 8 }}>
                    <button
                      onClick={handleClose}
                      aria-label="Close"
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: '50%',
                        background: CHIP,
                        border: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        color: INK_MUTE,
                      }}
                    >
                      <X size={16} strokeWidth={2.25} />
                    </button>
                    <div
                      style={{
                        flex: 1,
                        textAlign: 'center',
                        fontSize: 13,
                        fontWeight: 800,
                        letterSpacing: '0.04em',
                        color: INK,
                      }}
                    >
                      {isEditMode ? 'Edit review' : 'Review'}
                    </div>
                    {isEditMode && (
                      <button
                        onClick={handleRemoveReviewClick}
                        aria-label="Delete review"
                        style={{
                          width: 34,
                          height: 34,
                          borderRadius: '50%',
                          background: CHIP,
                          border: 'none',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          color: '#DC2626',
                          marginRight: 4,
                        }}
                      >
                        <Trash2 size={15} strokeWidth={2.25} />
                      </button>
                    )}
                    <button
                      onClick={handlePost}
                      disabled={!canPost}
                      style={{
                        fontSize: 13,
                        fontWeight: 800,
                        padding: '8px 18px',
                        borderRadius: 20,
                        border: 'none',
                        background: canPost ? INK : CHIP,
                        color: canPost ? '#fff' : INK_FAINT,
                        cursor: canPost ? 'pointer' : 'default',
                        boxShadow: canPost ? '0 2px 10px rgba(15,23,42,0.18)' : 'none',
                      }}
                    >
                      {wizard.isSubmitting
                        ? (isEditMode ? 'Updating…' : 'Publishing…')
                        : (isEditMode ? 'Update' : 'Publish')}
                    </button>
                  </div>
                  </div>

                  {/* Scroll body */}
                  <div
                    style={{
                      flex: 1,
                      overflowY: 'auto',
                      overflowX: 'hidden',
                      WebkitOverflowScrolling: 'touch',
                      paddingBottom: `calc(${keyboardHeight}px + 64px + env(safe-area-inset-bottom, 0px) + 16px)`,
                    }}
                  >
                    <div style={{ width: '100%', maxWidth: 480, marginInline: 'auto' }}>
                    {/* Course row */}
                    <button
                      onClick={() => !course && setShowCourseSearch(true)}
                      disabled={!!course}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        padding: `12px ${PAD_X}`,
                        borderBottom: `0.5px solid ${HAIR}`,
                        background: 'transparent',
                        border: 'none',
                        textAlign: 'left',
                        cursor: course ? 'default' : 'pointer',
                      }}
                    >
                      {activeCourse?.thumbnail_image ? (
                        <img
                          src={activeCourse.thumbnail_image}
                          alt={activeCourse.name}
                          style={{
                            width: 46,
                            height: 46,
                            borderRadius: 11,
                            objectFit: 'cover',
                            flexShrink: 0,
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            width: 46,
                            height: 46,
                            borderRadius: 11,
                            background: 'rgba(15,23,42,0.06)',
                            flexShrink: 0,
                          }}
                        />
                      )}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: 15,
                            fontWeight: 700,
                            color: INK,
                            overflowWrap: 'anywhere',
                          }}
                        >
                          {activeCourse?.name || 'Pick a course'}
                        </div>
                        {locationText && (
                          <div
                            style={{
                              fontSize: 13,
                              color: INK_FAINT,
                              marginTop: 1,
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}
                          >
                            {locationText}
                          </div>
                        )}
                      </div>
                    </button>

                    {/* Hero scrubber */}
                    <div style={{ padding: `16px ${PAD_X} 8px` }}>
                      <TickScrubber
                        value={wizard.state.rating}
                        onChange={wizard.setRating}
                        hero
                        ariaLabel="Overall rating"
                      />
                    </div>

                    <div style={{ height: 0.5, background: HAIR, margin: `8px ${PAD_X} 0` }} />

                    {/* Categories — always visible 2×2 grid */}
                    <div style={{ padding: `12px ${PAD_X} 12px` }}>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '4px 0 2px',
                        }}
                      >
                        <span
                          style={{
                            fontSize: 10.5,
                            fontWeight: 800,
                            color: INK_FAINT,
                            letterSpacing: '0.14em',
                            textTransform: 'uppercase',
                          }}
                        >
                          Category detail
                        </span>
                        {setCount > 0 && (
                          <span
                            style={{
                              fontSize: 11,
                              fontWeight: 800,
                              color: GOLD_DEEP,
                              background: AMBER_SOFT,
                              padding: '2px 7px',
                              borderRadius: 10,
                            }}
                          >
                            {setCount}/4
                          </span>
                        )}
                      </div>

                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                          gap: '18px 14px',
                          alignItems: 'start',
                          paddingTop: 12,
                        }}
                      >
                        {BREAKDOWNS.map(({ key, label, desc }) => {
                          const val = wizard.state.breakdowns[key];
                          return (
                            <div key={key} style={{ minWidth: 0 }}>
                              <div style={{ fontSize: 13.5, fontWeight: 700, color: INK, lineHeight: 1.2 }}>
                                {label}
                              </div>
                              <div
                                style={{
                                  fontSize: 11,
                                  color: INK_FAINT,
                                  marginTop: 2,
                                  marginBottom: 8,
                                  lineHeight: 1.25,
                                }}
                              >
                                {desc}
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <TickScrubber
                                    value={val}
                                    onChange={(v) => wizard.setBreakdown(key, v)}
                                    ariaLabel={label}
                                    compact
                                  />
                                </div>
                                <span
                                  style={{
                                    fontSize: 13,
                                    fontWeight: 800,
                                    color: val != null ? ratingTextColor(val) : 'rgba(15,23,42,0.20)',
                                    flexShrink: 0,
                                    fontVariantNumeric: 'tabular-nums',
                                  }}
                                >
                                  {val != null ? val.toFixed(1) : '—'}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div style={{ height: 0.5, background: HAIR, margin: `8px ${PAD_X} 0` }} />

                    {/* Verdict */}
                    <div style={{ padding: `14px ${PAD_X} 4px` }}>
                      <span
                        style={{
                          fontSize: 10.5,
                          fontWeight: 800,
                          color: INK_FAINT,
                          letterSpacing: '0.14em',
                          textTransform: 'uppercase',
                        }}
                      >
                        Your verdict
                      </span>
                    </div>
                    <div
                      onClick={() => taRef.current?.focus()}
                      style={{
                        margin: `0 ${PAD_X}`,
                        border: `1px solid ${
                          verdictFocused ? 'rgba(247,147,30,0.55)' : HAIR
                        }`,
                        borderRadius: 16,
                        background: SURFACE,
                        padding: 12,
                        minHeight: 96,
                        cursor: 'text',
                        transition: 'border-color 140ms ease, box-shadow 140ms ease',
                        boxShadow: verdictFocused
                          ? '0 0 0 3px rgba(247,147,30,0.10)'
                          : 'none',
                      }}
                    >
                      <textarea
                        ref={taRef}
                        value={wizard.state.review}
                        onChange={handleReviewChange}
                        onFocus={() => setVerdictFocused(true)}
                        onBlur={() => setVerdictFocused(false)}
                        placeholder="What stood out? Best holes, conditions, the welcome…"
                        style={{
                          width: '100%',
                          boxSizing: 'border-box',
                          border: 'none',
                          outline: 'none',
                          resize: 'none',
                          padding: 0,
                          fontSize: 16,
                          lineHeight: 1.45,
                          color: INK,
                          background: 'transparent',
                          minHeight: 64,
                          fontFamily: 'inherit',
                          overflow: 'hidden',
                          caretColor: AMBER,
                        }}
                      />

                      {/* Voice mic */}
                      {SpeechRecognitionClass && (
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10,
                            marginTop: 8,
                          }}
                        >
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              voiceState === 'listening' ? stopListening() : startListening();
                            }}
                            aria-label={voiceState === 'listening' ? 'Stop voice input' : 'Voice input'}
                            style={{
                              width: 38,
                              height: 38,
                              borderRadius: '50%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              border: 'none',
                              cursor: 'pointer',
                              background:
                                voiceState === 'listening'
                                  ? 'rgba(239,68,68,0.12)'
                                  : voiceState === 'processing'
                                  ? 'rgba(247,147,30,0.10)'
                                  : CHIP,
                              color:
                                voiceState === 'listening'
                                  ? '#EF4444'
                                  : voiceState === 'processing'
                                  ? AMBER
                                  : INK_MUTE,
                            }}
                          >
                            {voiceState === 'listening' ? (
                              <Square size={14} fill="#EF4444" color="#EF4444" />
                            ) : voiceState === 'processing' ? (
                              <RotateCw size={16} className="animate-spin" />
                            ) : (
                              <Mic size={16} />
                            )}
                          </button>
                          <span style={{ fontSize: 12, color: INK_MUTE }}>
                            {voiceState === 'listening'
                              ? 'Listening… tap to stop'
                              : 'Tap mic to speak'}
                          </span>
                        </div>
                      )}
                    </div>


                    {/* Media carousel */}
                    {hasMedia && (
                      <div style={{ padding: '4px 0 14px' }}>
                        <div
                          style={{
                            display: 'flex',
                            gap: 8,
                            overflowX: 'auto',
                            scrollSnapType: 'x mandatory',
                            WebkitOverflowScrolling: 'touch',
                            scrollbarWidth: 'none',
                            padding: `0 ${PAD_X}`,
                          }}
                        >
                          {existingTiles.map((tile) => (
                            <MediaTile
                              key={tile.id}
                              stageItem={tile.stageItem}
                              type={tile.type}
                              onRemove={() => removeMediaTile(tile.id)}
                            />
                          ))}
                          {pendingTiles.map((tile, i) => (
                            <MediaTile
                              key={tile.id}
                              stageItem={tile.item}
                              frame={tile.item.frame}
                              type={tile.type}
                              onTap={() => openEditor(i)}
                              onRemove={() => removePendingTile(tile.id)}
                            />
                          ))}
                        </div>
                        {wizard.allMedia.length < 10 && (
                          <div style={{ padding: `10px ${PAD_X} 0` }}>
                            <button
                              onClick={() => fileRef.current?.click()}
                              style={{
                                width: '100%',
                                padding: '11px 0',
                                borderRadius: 12,
                                border: '1px dashed rgba(15,23,42,0.18)',
                                background: 'transparent',
                                fontSize: 13,
                                fontWeight: 700,
                                color: INK,
                                cursor: 'pointer',
                              }}
                            >
                              ＋ Add more
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                    </div>
                  </div>

                  {/* Docked action bar */}
                  <div
                    style={{
                      position: 'fixed',
                      left: 0,
                      right: 0,
                      bottom: keyboardHeight,
                      borderTop: `0.5px solid ${HAIR}`,
                      background: SURFACE,
                      transition: 'bottom 0.2s ease',
                      zIndex: 40,
                    }}
                  >
                    <div style={{ width: '100%', maxWidth: 480, marginInline: 'auto', display: 'flex', gap: 10, padding: keyboardHeight > 0 ? `10px ${PAD_X}` : `12px ${PAD_X} calc(env(safe-area-inset-bottom, 0px) + 18px)` }}>
                    {wizard.allMedia.length < 10 && (
                      <button
                        onClick={() => fileRef.current?.click()}
                        style={{
                          flex: 1,
                          padding: '13px 0',
                          borderRadius: 999,
                          border: 'none',
                          background: AMBER_SOFT,
                          color: GOLD_DEEP,
                          fontSize: 13.5,
                          fontWeight: 800,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 8,
                        }}
                      >
                        <ImagePlus size={16} strokeWidth={2} />
                        {hasMedia ? 'Add more' : 'Add photo / video'}
                      </button>
                    )}
                    </div>
                  </div>

                  {/* Media editor overlay */}
                  <MediaEditor
                    open={editorOpen}
                    items={pendingItems}
                    startIndex={editorIndex}
                    onCancel={() => setEditorOpen(false)}
                    onDone={onEditorDone}
                  />

                  {/* Mentions */}
                  <MentionBottomSheet
                    isOpen={showMentions}
                    onClose={() => setShowMentions(false)}
                    query={mentionQuery}
                    onSelect={handleMentionSelect}
                  />
                </>
              )}
            </OverlayPortalProvider>
          </motion.div>

          {/* Discard / delete / course sheets */}
          <DiscardActionSheet
            open={showCloseConfirm}
            onDiscard={confirmClose}
            onKeepEditing={() => setShowCloseConfirm(false)}
            isEditMode={isEditMode}
          />
          <RemoveReviewActionSheet
            open={showDeleteConfirm}
            onCancel={() => setShowDeleteConfirm(false)}
            onRemove={confirmDeleteReview}
            isRemoving={wizard.isDeleting}
          />
          <CourseSearchSheet
            isOpen={showCourseSearch}
            onClose={() => setShowCourseSearch(false)}
            onSelectCourse={(selectedCourse) => {
              setActiveCourse(selectedCourse);
              setShowCourseSearch(false);
            }}
          />
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}

/* ── Tile ─────────────────────────────────────────────────────────────────── */

function MediaTile({
  stageItem,
  frame = 'original',
  type,
  onTap,
  onRemove,
}: {
  stageItem: React.ComponentProps<typeof MediaStage>['item'];
  frame?: 'original' | '4:5' | '1:1';
  type: 'image' | 'video';
  onTap?: () => void;
  onRemove: () => void;
}) {
  const TILE = 200;
  return (
    <div
      style={{
        position: 'relative',
        flex: '0 0 min(200px, 42vw)',
        width: 'min(200px, 42vw)',
        height: TILE,
        scrollSnapAlign: 'start',
      }}
    >
      <button
        onClick={onTap}
        disabled={!onTap}
        style={{
          display: 'block',
          width: '100%',
          height: '100%',
          padding: 0,
          border: 'none',
          background: 'transparent',
          cursor: onTap ? 'pointer' : 'default',
        }}
      >
        <MediaStage
          item={stageItem}
          frame={frame}
          height={TILE}
          borderRadius={12}
          showPlayGlyph={type === 'video'}
        />
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        aria-label="Remove"
        style={{
          position: 'absolute',
          top: 8,
          right: 8,
          width: 26,
          height: 26,
          borderRadius: '50%',
          background: 'rgba(0,0,0,0.55)',
          WebkitBackdropFilter: 'blur(8px)',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255,255,255,0.3)',
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          zIndex: 3,
        }}
      >
        <X size={12} strokeWidth={2.5} />
      </button>
    </div>
  );
}

export default ReviewWizard;
