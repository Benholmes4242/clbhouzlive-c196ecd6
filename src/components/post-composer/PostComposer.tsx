// PostComposer — hybrid Post / Review composer.
// Chrome aligned with ReviewWizard (portal + spring slide-up + light tokens +
// scroll-lock + matching header pill chrome + bottom scroll fade).

import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { X, ImagePlus, MapPin, Trophy, Search } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { usePostSubmission } from '@/hooks/usePostSubmission';
import { useActiveActor } from '@/context/ActiveActorContext';
import { CourseSearchSheet } from './CourseSearchSheet';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import type { TaggedCourse, StudioActorType } from './types';

const MAX_CAPTION = 2000;
const COUNTER_THRESHOLD = 100;

type Mode = 'post' | 'review';

interface PostComposerProps {
  open: boolean;
  onClose: () => void;
  initialMedia?: File[];
  initialActorType?: StudioActorType;
  initialActorId?: string | null;
}

export function PostComposer({
  open,
  onClose,
  initialMedia = [],
  initialActorType = 'personal',
  initialActorId = null,
}: PostComposerProps) {
  const navigate = useNavigate();
  const { availableActors } = useActiveActor();
  const { submitPost, isSubmitting } = usePostSubmission();

  const [mode, setMode] = useState<Mode>('post');
  const [caption, setCaption] = useState('');
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [taggedCourse, setTaggedCourse] = useState<TaggedCourse | null>(null);
  const [courseSearchOpen, setCourseSearchOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const isBusiness = initialActorType === 'business';

  const actorInfo = useMemo(() => {
    if (isBusiness && initialActorId) {
      const biz = availableActors.find((a) => a.type === 'business' && a.id === initialActorId);
      return biz ? { name: biz.name, avatarUrl: biz.avatarUrl } : { name: 'Business', avatarUrl: null };
    }
    const personal = availableActors.find((a) => a.type === 'personal');
    return personal
      ? { name: personal.name, avatarUrl: personal.avatarUrl }
      : { name: 'You', avatarUrl: null };
  }, [availableActors, isBusiness, initialActorId]);

  // Initialize from props when opened
  useEffect(() => {
    if (!open) return;
    setMode('post');
    setCaption('');
    setTaggedCourse(null);
    if (initialMedia.length > 0) {
      setMediaFiles(initialMedia);
      setPreviewUrls(initialMedia.map((f) => URL.createObjectURL(f)));
    } else {
      setMediaFiles([]);
      setPreviewUrls([]);
    }
    setTimeout(() => textareaRef.current?.focus(), 120);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    return () => {
      previewUrls.forEach((url) => URL.revokeObjectURL(url));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [previewUrls]);

  // Body scroll lock — mirrors ReviewWizard
  useLayoutEffect(() => {
    if (!open) return;
    const scrollY = window.scrollY;
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.left = '0';
    document.body.style.right = '0';
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.left = '';
      document.body.style.right = '';
      document.body.style.overflow = '';
      window.scrollTo(0, scrollY);
    };
  }, [open]);

  const handleAddMedia = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    setMediaFiles((prev) => [...prev, ...files]);
    setPreviewUrls((prev) => [...prev, ...files.map((f) => URL.createObjectURL(f))]);
    e.target.value = '';
  }, []);

  const handleRemoveMedia = useCallback((index: number) => {
    setMediaFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviewUrls((prev) => {
      const next = prev.filter((_, i) => i !== index);
      const removed = prev[index];
      if (removed) URL.revokeObjectURL(removed);
      return next;
    });
  }, []);

  const canPost = (caption.trim().length > 0 || mediaFiles.length > 0) && !isSubmitting;

  const handlePost = useCallback(async () => {
    if (!canPost) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error('You must be signed in to post');
      return;
    }
    await submitPost({
      user,
      content: caption,
      mediaFiles,
      selectedTags: [],
      courseInfo: taggedCourse
        ? { id: taggedCourse.courseId, name: taggedCourse.courseName, country: taggedCourse.country ?? '' }
        : null,
      actorType: initialActorType,
      actorId: initialActorId ?? user.id,
      onSuccess: () => {
        toast.success('Posted');
        onClose();
      },
      onError: () => {},
    });
  }, [canPost, submitPost, caption, mediaFiles, taggedCourse, initialActorType, initialActorId, onClose]);

  const handleCourseSelectReview = useCallback(
    (course: TaggedCourse) => {
      onClose();
      navigate(`/courses/${course.courseId}/rate`);
    },
    [navigate, onClose]
  );

  const remaining = MAX_CAPTION - caption.length;
  const showCounter = remaining <= COUNTER_THRESHOLD;

  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className={cn(
              'light fixed inset-0 z-[9999]',
              'flex flex-col overscroll-contain'
            )}
            style={{
              touchAction: 'pan-y',
              backgroundColor: 'var(--bg-page)',
            }}
            role="dialog"
            aria-modal="true"
          >
            {/* ── Header ── */}
            <header
              className="sticky top-0 z-10 flex flex-col px-3"
              style={{
                paddingTop: 'max(env(safe-area-inset-top, 0px), 47px)',
                minHeight: 'calc(48px + max(env(safe-area-inset-top, 0px), 47px))',
                background: 'transparent',
              }}
            >
              <div className="flex items-center justify-between">
                {/* Left: close */}
                <div className="flex items-center min-w-[72px]">
                  <button
                    onClick={onClose}
                    className="w-11 h-11 rounded-full flex items-center justify-center active:scale-[0.97] transition-all duration-100"
                    style={{ background: '#F5F5F7' }}
                    aria-label="Close"
                  >
                    <X className="h-[18px] w-[18px]" style={{ color: '#8E8E93' }} strokeWidth={2} />
                  </button>
                </div>

                {/* Center: segmented Post / Review */}
                <div className="flex-1 flex justify-center">
                  <div
                    role="tablist"
                    aria-label="Composer mode"
                    className="flex"
                    style={{
                      background: '#F5F5F7',
                      borderRadius: 999,
                      padding: 3,
                    }}
                  >
                    {(['post', 'review'] as const).map((m) => {
                      const active = mode === m;
                      const disabled = m === 'review' && isBusiness;
                      return (
                        <button
                          key={m}
                          role="tab"
                          aria-selected={active}
                          disabled={disabled}
                          onClick={() => !disabled && setMode(m)}
                          style={{
                            padding: '7px 18px',
                            borderRadius: 999,
                            fontSize: 12,
                            fontWeight: 700,
                            letterSpacing: '0.04em',
                            textTransform: 'uppercase',
                            color: disabled
                              ? '#C7C7CC'
                              : active
                                ? '#FFFFFF'
                                : '#1C1C1E',
                            background: active && !disabled ? '#1C1C1E' : 'transparent',
                            border: 'none',
                            cursor: disabled ? 'not-allowed' : 'pointer',
                            transition: 'all 180ms ease',
                          }}
                          title={disabled ? 'Reviews are personal' : undefined}
                        >
                          {m === 'post' ? 'Post' : 'Review'}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Right: CTA (post mode only) */}
                <div className="flex items-center min-w-[72px] justify-end">
                  {mode === 'post' ? (
                    <button
                      onClick={handlePost}
                      disabled={!canPost}
                      className="text-[13px] font-semibold px-[14px] min-h-[36px] flex items-center rounded-full transition-all duration-200 active:scale-[0.96]"
                      style={{
                        background: canPost ? '#F7931E' : '#F5F5F7',
                        color: canPost ? '#FFFFFF' : '#AEAEB2',
                        boxShadow: canPost ? '0 2px 12px rgba(247,147,30,0.22)' : 'none',
                        pointerEvents: canPost ? 'auto' : 'none',
                      }}
                    >
                      {isSubmitting ? 'Posting…' : 'Post'}
                    </button>
                  ) : (
                    <div style={{ width: 64 }} />
                  )}
                </div>
              </div>
            </header>

            {/* Slim divider (matches wizard's progress-bar slot) */}
            <div style={{ padding: '4px 16px 8px' }}>
              <div
                style={{
                  height: 1,
                  background: 'rgba(15,23,42,0.06)',
                }}
              />
            </div>

            {/* Posting-as subline */}
            <div className="px-5 pb-3 flex items-center gap-2">
              <SquircleAvatar
                src={actorInfo.avatarUrl ?? undefined}
                alt={actorInfo.name}
                size={22}
                hideRing
              />
              <span style={{ fontSize: 12, color: 'rgba(15,23,42,0.55)' }}>
                Posting as{' '}
                <span style={{ color: '#0F172A', fontWeight: 600 }}>{actorInfo.name}</span>
                {isBusiness && (
                  <span style={{ marginLeft: 6, color: 'rgba(15,23,42,0.45)' }}>· Business</span>
                )}
              </span>
            </div>

            {/* ── Body ── */}
            <div className="flex-1 flex flex-col min-h-0 relative">
              <div className="flex-1 overflow-y-auto">
                <AnimatePresence mode="wait">
                  {mode === 'post' ? (
                    <motion.div
                      key="post"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.18 }}
                      className="px-5 pt-2 pb-10"
                    >
                      {/* Caption */}
                      <textarea
                        ref={textareaRef}
                        value={caption}
                        onChange={(e) => setCaption(e.target.value.slice(0, MAX_CAPTION))}
                        placeholder="Share a thought…"
                        rows={5}
                        style={{
                          width: '100%',
                          background: 'transparent',
                          border: 'none',
                          outline: 'none',
                          resize: 'none',
                          fontSize: 17,
                          lineHeight: 1.45,
                          color: '#0F172A',
                          caretColor: '#F7931E',
                          letterSpacing: '-0.005em',
                        }}
                      />
                      {showCounter && (
                        <div className="flex justify-end">
                          <span
                            style={{
                              fontSize: 11,
                              fontVariantNumeric: 'tabular-nums',
                              color: remaining <= 0 ? '#DC2626' : 'rgba(15,23,42,0.45)',
                            }}
                          >
                            {remaining}
                          </span>
                        </div>
                      )}

                      {/* Course tag chip */}
                      <div className="mt-5">
                        {taggedCourse ? (
                          <div
                            className="inline-flex items-center gap-2"
                            style={{
                              padding: '7px 10px 7px 10px',
                              borderRadius: 999,
                              background: '#FFFFFF',
                              border: '1px solid rgba(15,23,42,0.10)',
                              boxShadow: '0 1px 2px rgba(15,23,42,0.04)',
                            }}
                          >
                            <MapPin className="w-3.5 h-3.5" style={{ color: '#0F172A' }} strokeWidth={2} />
                            <span style={{ fontSize: 13, fontWeight: 600, color: '#0F172A' }}>
                              {taggedCourse.courseName}
                            </span>
                            {taggedCourse.globalRank != null && (
                              <span
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 4,
                                  fontSize: 10,
                                  fontWeight: 700,
                                  color: '#F7931E',
                                  letterSpacing: '0.04em',
                                  textTransform: 'uppercase',
                                }}
                              >
                                <Trophy className="w-3 h-3" strokeWidth={2.5} />
                                Top 100
                              </span>
                            )}
                            <button
                              onClick={() => setTaggedCourse(null)}
                              className="flex items-center justify-center"
                              style={{
                                width: 18,
                                height: 18,
                                borderRadius: '50%',
                                background: 'rgba(15,23,42,0.08)',
                                border: 'none',
                                marginLeft: 2,
                              }}
                              aria-label="Remove course"
                            >
                              <X className="w-2.5 h-2.5" style={{ color: 'rgba(15,23,42,0.65)' }} strokeWidth={3} />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setCourseSearchOpen(true)}
                            className="inline-flex items-center gap-2 active:scale-[0.98] transition-transform"
                            style={{
                              padding: '8px 13px',
                              borderRadius: 999,
                              background: '#FFFFFF',
                              border: '1px solid rgba(15,23,42,0.10)',
                              fontSize: 13,
                              fontWeight: 600,
                              color: '#0F172A',
                              cursor: 'pointer',
                              boxShadow: '0 1px 2px rgba(15,23,42,0.04)',
                            }}
                          >
                            <MapPin className="w-3.5 h-3.5" style={{ color: 'rgba(15,23,42,0.55)' }} strokeWidth={2} />
                            Tag a course
                          </button>
                        )}
                      </div>

                      {/* Media row */}
                      <div className="mt-6">
                        <div
                          className="flex gap-2 overflow-x-auto"
                          style={{ scrollbarWidth: 'none' }}
                        >
                          <button
                            onClick={() => fileInputRef.current?.click()}
                            className="flex-shrink-0 flex flex-col items-center justify-center active:scale-[0.98] transition-transform"
                            style={{
                              width: 92,
                              height: 92,
                              borderRadius: 16,
                              background: '#FFFFFF',
                              border: '1px solid rgba(15,23,42,0.10)',
                              boxShadow: '0 1px 2px rgba(15,23,42,0.04)',
                              cursor: 'pointer',
                              color: 'rgba(15,23,42,0.70)',
                            }}
                            aria-label="Add photos or video"
                          >
                            <ImagePlus className="w-5 h-5 mb-1" strokeWidth={1.8} />
                            <span style={{ fontSize: 11, fontWeight: 600 }}>Add media</span>
                          </button>

                          {previewUrls.map((url, i) => {
                            const isVideo = mediaFiles[i]?.type.startsWith('video/');
                            return (
                              <div
                                key={i}
                                className="relative flex-shrink-0"
                                style={{
                                  width: 92,
                                  height: 92,
                                  borderRadius: 16,
                                  overflow: 'hidden',
                                  background: 'rgba(15,23,42,0.06)',
                                  boxShadow: '0 1px 2px rgba(15,23,42,0.04)',
                                }}
                              >
                                {isVideo ? (
                                  <video
                                    src={url}
                                    muted
                                    playsInline
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                  />
                                ) : (
                                  <img
                                    src={url}
                                    alt=""
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                  />
                                )}
                                <button
                                  onClick={() => handleRemoveMedia(i)}
                                  className="absolute flex items-center justify-center"
                                  style={{
                                    top: 5,
                                    right: 5,
                                    width: 22,
                                    height: 22,
                                    borderRadius: '50%',
                                    background: 'rgba(15,23,42,0.72)',
                                    border: 'none',
                                    cursor: 'pointer',
                                  }}
                                  aria-label="Remove"
                                >
                                  <X className="w-3 h-3" style={{ color: '#FFFFFF' }} strokeWidth={3} />
                                </button>
                              </div>
                            );
                          })}
                        </div>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*,video/*"
                          multiple
                          onChange={handleAddMedia}
                          style={{ display: 'none' }}
                        />
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="review"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.18 }}
                      className="px-5 pt-6 pb-10"
                    >
                      {/* Editorial heading — mirrors WriteStep typography */}
                      <div
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          letterSpacing: '0.16em',
                          color: '#F7931E',
                          textTransform: 'uppercase',
                          marginBottom: 8,
                        }}
                      >
                        Step 1 of 3
                      </div>
                      <h2
                        style={{
                          fontSize: 26,
                          fontWeight: 700,
                          letterSpacing: '-0.02em',
                          color: '#0F172A',
                          lineHeight: 1.15,
                        }}
                      >
                        Review a course
                      </h2>
                      <p
                        style={{
                          fontSize: 14,
                          color: 'rgba(15,23,42,0.55)',
                          marginTop: 6,
                          lineHeight: 1.4,
                        }}
                      >
                        Pick a course you've played to start the rating wizard.
                      </p>

                      <button
                        onClick={() => setCourseSearchOpen(true)}
                        className="w-full flex items-center gap-2.5 mt-6 active:scale-[0.99] transition-transform"
                        style={{
                          background: '#FFFFFF',
                          border: '1px solid rgba(15,23,42,0.10)',
                          borderRadius: 14,
                          padding: '14px 16px',
                          cursor: 'pointer',
                          textAlign: 'left',
                          boxShadow: '0 1px 2px rgba(15,23,42,0.04)',
                        }}
                      >
                        <Search className="w-4 h-4" style={{ color: 'rgba(15,23,42,0.50)' }} strokeWidth={2} />
                        <span style={{ fontSize: 14, color: 'rgba(15,23,42,0.55)' }}>
                          Search for a course…
                        </span>
                      </button>

                      <p
                        style={{
                          fontSize: 11,
                          color: 'rgba(15,23,42,0.40)',
                          marginTop: 16,
                          textAlign: 'center',
                          letterSpacing: '0.01em',
                        }}
                      >
                        Selecting a course opens the rating wizard.
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Bottom scroll fade — matches ReviewWizard */}
              <div
                className="absolute bottom-0 left-0 right-0 h-8 pointer-events-none z-10"
                style={{
                  background:
                    'linear-gradient(to top, var(--bg-page), transparent)',
                }}
              />
            </div>
          </motion.div>

          <CourseSearchSheet
            open={courseSearchOpen}
            onClose={() => setCourseSearchOpen(false)}
            onSelect={
              mode === 'review'
                ? handleCourseSelectReview
                : (c) => {
                    setTaggedCourse(c);
                    setCourseSearchOpen(false);
                  }
            }
            title={mode === 'review' ? 'Review a course' : 'Tag a course'}
            subtitle={mode === 'review' ? 'Pick a course to rate' : 'Where did you play?'}
          />
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}

export default PostComposer;
