// PostComposer — hybrid Post / Review composer.
// Replaces the legacy multi-screen Post Studio. ~250 lines, no reducer.

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, ImagePlus, MapPin, Trophy } from 'lucide-react';
import { toast } from 'sonner';
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

  // Resolve actor display info from available actors
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
    setTimeout(() => textareaRef.current?.focus(), 80);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Revoke preview URLs on unmount / change
  useEffect(() => {
    return () => {
      previewUrls.forEach((url) => URL.revokeObjectURL(url));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [previewUrls]);

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
      onError: () => {
        // toast handled inside submitPost
      },
    });
  }, [canPost, submitPost, caption, mediaFiles, taggedCourse, initialActorType, initialActorId, onClose]);

  const handleCourseSelectReview = useCallback(
    (course: TaggedCourse) => {
      onClose();
      navigate(`/courses/${course.courseId}/rate`);
    },
    [navigate, onClose]
  );

  if (!open) return null;

  const remaining = MAX_CAPTION - caption.length;
  const showCounter = remaining <= COUNTER_THRESHOLD;

  return (
    <>
      <div
        className="fixed inset-0 z-[70] flex flex-col"
        style={{ background: '#F8FAFC' }}
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-4"
          style={{
            paddingTop: 'max(env(safe-area-inset-top, 0px), 47px)',
            paddingBottom: 10,
            background: 'transparent',
          }}
        >
          <button
            onClick={onClose}
            className="flex items-center justify-center active:scale-[0.97] transition-all duration-100"
            style={{
              width: 44,
              height: 44,
              borderRadius: '50%',
              background: '#F5F5F7',
              border: 'none',
            }}
            aria-label="Close composer"
          >
            <X size={18} color="#8E8E93" strokeWidth={2} />
          </button>

          {/* Segmented toggle */}
          <div
            className="flex"
            role="tablist"
            aria-label="Composer mode"
            style={{
              background: '#F5F5F7',
              borderRadius: 999,
              padding: 3,
              border: '1px solid rgba(15,23,42,0.04)',
            }}
          >
            <button
              role="tab"
              aria-selected={mode === 'post'}
              onClick={() => setMode('post')}
              style={{
                padding: '6px 18px',
                borderRadius: 999,
                fontSize: 13,
                fontWeight: 700,
                color: mode === 'post' ? '#ffffff' : '#1C1C1E',
                background: mode === 'post' ? '#1C1C1E' : 'transparent',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              Post
            </button>
            <button
              role="tab"
              aria-selected={mode === 'review'}
              disabled={isBusiness}
              onClick={() => !isBusiness && setMode('review')}
              style={{
                padding: '6px 18px',
                borderRadius: 999,
                fontSize: 13,
                fontWeight: 700,
                color: isBusiness
                  ? '#AEAEB2'
                  : mode === 'review'
                    ? '#ffffff'
                    : '#1C1C1E',
                background: mode === 'review' && !isBusiness ? '#1C1C1E' : 'transparent',
                border: 'none',
                cursor: isBusiness ? 'not-allowed' : 'pointer',
              }}
              title={isBusiness ? 'Reviews are personal' : undefined}
            >
              Review
            </button>
          </div>

          {/* Right slot: Post CTA (post mode) or spacer */}
          {mode === 'post' ? (
            <button
              onClick={handlePost}
              disabled={!canPost}
              className="inline-flex items-center justify-center active:scale-[0.96] transition-transform"
              style={{
                minHeight: 36,
                padding: '0 14px',
                borderRadius: 999,
                fontSize: 13,
                fontWeight: 600,
                color: canPost ? '#ffffff' : '#AEAEB2',
                background: canPost ? '#F7931E' : '#F5F5F7',
                border: 'none',
                cursor: canPost ? 'pointer' : 'not-allowed',
                boxShadow: canPost ? '0 2px 12px rgba(247,147,30,0.22)' : 'none',
                minWidth: 64,
              }}
            >
              {isSubmitting ? 'Posting…' : 'Post'}
            </button>
          ) : (
            <div style={{ width: 64 }} />
          )}
        </div>

        {/* Posting-as subline */}
        <div
          className="px-5 py-2 flex items-center gap-2"
          style={{ background: 'transparent' }}
        >
          <SquircleAvatar
            src={actorInfo.avatarUrl ?? undefined}
            alt={actorInfo.name}
            size={20}
            hideRing
          />

          <span style={{ fontSize: 12, color: 'rgba(28,28,30,0.55)' }}>
            Posting as <span style={{ color: '#1C1C1E', fontWeight: 600 }}>{actorInfo.name}</span>
            {isBusiness && (
              <span style={{ marginLeft: 6, color: 'rgba(28,28,30,0.45)' }}>· Business</span>
            )}
          </span>
        </div>


        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {mode === 'post' ? (
            <div className="px-5 pt-4 pb-8">
              <textarea
                ref={textareaRef}
                value={caption}
                onChange={(e) =>
                  setCaption(e.target.value.slice(0, MAX_CAPTION))
                }
                placeholder="Share a thought…"
                rows={5}
                style={{
                  width: '100%',
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  resize: 'none',
                  fontSize: 16,
                  lineHeight: 1.4,
                  color: '#0F172A',
                  caretColor: '#F7931E',
                }}
              />
              {showCounter && (
                <div className="flex justify-end">
                  <span
                    style={{
                      fontSize: 11,
                      color: remaining <= 0 ? '#DC2626' : 'rgba(15,23,42,0.45)',
                    }}
                  >
                    {remaining}
                  </span>
                </div>
              )}

              {/* Course tag chip */}
              <div className="mt-4">
                {taggedCourse ? (
                  <div
                    className="inline-flex items-center gap-2"
                    style={{
                      padding: '6px 10px 6px 10px',
                      borderRadius: 999,
                      background: 'rgba(15,23,42,0.05)',
                      border: '1px solid rgba(15,23,42,0.10)',
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
                    className="inline-flex items-center gap-2"
                    style={{
                      padding: '7px 12px',
                      borderRadius: 999,
                      background: '#ffffff',
                      border: '1px dashed rgba(15,23,42,0.25)',
                      fontSize: 13,
                      fontWeight: 600,
                      color: '#0F172A',
                      cursor: 'pointer',
                    }}
                  >
                    <MapPin className="w-3.5 h-3.5" style={{ color: 'rgba(15,23,42,0.55)' }} strokeWidth={2} />
                    Tag a course
                  </button>
                )}
              </div>

              {/* Media row */}
              <div className="mt-5">
                <div className="flex gap-2 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-shrink-0 flex flex-col items-center justify-center"
                    style={{
                      width: 88,
                      height: 88,
                      borderRadius: 14,
                      background: '#ffffff',
                      border: '1px dashed rgba(15,23,42,0.25)',
                      cursor: 'pointer',
                      color: 'rgba(15,23,42,0.65)',
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
                          width: 88,
                          height: 88,
                          borderRadius: 14,
                          overflow: 'hidden',
                          background: 'rgba(15,23,42,0.06)',
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
                            top: 4,
                            right: 4,
                            width: 22,
                            height: 22,
                            borderRadius: '50%',
                            background: 'rgba(15,23,42,0.70)',
                            border: 'none',
                            cursor: 'pointer',
                          }}
                          aria-label="Remove"
                        >
                          <X className="w-3 h-3" style={{ color: '#ffffff' }} strokeWidth={3} />
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
            </div>
          ) : (
            // REVIEW MODE
            <div className="px-5 pt-8 pb-8">
              <h2
                style={{
                  fontSize: 22,
                  fontWeight: 700,
                  letterSpacing: '-0.02em',
                  color: '#0F172A',
                }}
              >
                Review a course
              </h2>
              <p style={{ fontSize: 14, color: 'rgba(15,23,42,0.55)', marginTop: 4 }}>
                Rate a course you've played.
              </p>

              <button
                onClick={() => setCourseSearchOpen(true)}
                className="w-full flex items-center gap-2.5 mt-6"
                style={{
                  background: '#ffffff',
                  border: '1px solid rgba(15,23,42,0.10)',
                  borderRadius: 14,
                  padding: '14px 16px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  boxShadow: '0 2px 10px rgba(15,23,42,0.04)',
                }}
              >
                <MapPin className="w-4 h-4" style={{ color: 'rgba(15,23,42,0.50)' }} strokeWidth={2} />
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
                }}
              >
                Selecting a course opens the rating wizard.
              </p>
            </div>
          )}
        </div>
      </div>

      <CourseSearchSheet
        open={courseSearchOpen}
        onClose={() => setCourseSearchOpen(false)}
        onSelect={mode === 'review' ? handleCourseSelectReview : (c) => {
          setTaggedCourse(c);
          setCourseSearchOpen(false);
        }}
        title={mode === 'review' ? 'Review a course' : 'Tag a course'}
        subtitle={mode === 'review' ? 'Pick a course to rate' : 'Where did you play?'}
      />
    </>
  );
}

export default PostComposer;
