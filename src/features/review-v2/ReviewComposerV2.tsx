/**
 * ReviewComposerV2 — the sheet/page shell.
 *
 * Live-assembling feed-card preview at the top; verdict / overall /
 * categories / mentions-aware textarea / media tray / share toggle stack
 * below; pinned submit bar. All writes flow through the v2 RPCs — the
 * client never touches course_ratings, posts, notifications,
 * user_courses, or user_top10_exclusions directly.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { analyticsEvents } from '@/utils/analyticsEvents';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, Trash2 } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { invalidateCourseRatingCaches } from '@/utils/invalidateCourseRatingCaches';
import { toast } from '@/lib/toast';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useActiveActor } from '@/context/ActiveActorContext';
import { MentionsComposerInput } from '@/components/mentions/MentionsComposerInput';
import AccessControl from '@/components/AccessControl';

import { RV2 } from './tokens';
import { useReviewComposer } from './hooks/useReviewComposer';
import { useReviewSubmit } from './hooks/useReviewSubmit';
import { useReviewMediaPipeline } from './hooks/useReviewMediaPipeline';
import { LivePreviewCard } from './components/LivePreviewCard';
import { VoiceDictateButton } from './components/VoiceDictateButton';
import { OverallScrubber } from './components/OverallScrubber';
import { CategoryGrid } from './components/CategoryGrid';
import { MediaTray } from './components/MediaTray';
import { ShareToggle } from './components/ShareToggle';
import { SubmitBar } from './components/SubmitBar';
import { SuccessScreenV2 } from './components/SuccessScreenV2';
import { RemoveReviewSheetV2 } from './components/RemoveReviewSheetV2';
import type { ExistingMedia, ExistingReview, ReviewV2Course } from './types';
import { RateCoursePageSkeleton } from '@/components/skeletons/RateCoursePageSkeleton';
import { useCourseTeeSets, type TeeSet } from '@/features/courses/hooks/useCourseTeeSets';
import { useTranslation } from 'react-i18next';



function Section({ eyebrow, children }: { eyebrow: string; children: React.ReactNode }) {
  return (
    <section style={{ padding: '0 16px 12px' }}>
      <div
        style={{
          fontSize: 10.5,
          fontWeight: 700,
          color: RV2.amber,
          textTransform: 'uppercase',
          letterSpacing: '0.14em',
          marginBottom: 12,
        }}
      >
        {eyebrow}
      </div>
      {children}
    </section>
  );
}

// L6 - Optional tee chip row. Renders only when at least one colour tee exists.
// Reuses useCourseTeeSets (no new fetch path). Selected chip filled ink; tapping
// the selected chip clears the selection back to null.
function TeeChipRow({
  courseId,
  value,
  onChange,
}: {
  courseId: string;
  value: string | null;
  onChange: (label: string | null) => void;
}) {
  const { t } = useTranslation('courses');
  const { data } = useCourseTeeSets(courseId);
  const colourTees = useMemo<TeeSet[]>(
    () => (data ?? []).filter((tee) => tee.label_kind === 'colour'),
    [data],
  );

  // Preselect from L3 continuity key when nothing is picked yet and the stored
  // label matches a returned colour tee. Never required. One-shot per mount.
  const preseededRef = useRef(false);
  useEffect(() => {
    if (preseededRef.current) return;
    if (colourTees.length === 0) return;
    if (value != null) { preseededRef.current = true; return; }
    let stored: string | null = null;
    try {
      stored = typeof window !== 'undefined'
        ? window.localStorage.getItem(`tee-card:${courseId}`)
        : null;
    } catch {
      stored = null;
    }
    if (stored && colourTees.some((tee) => tee.tee_label === stored)) {
      onChange(stored);
    }
    preseededRef.current = true;
  }, [colourTees, courseId, value, onChange]);

  if (colourTees.length === 0) return null;

  return (
    <section style={{ padding: '0 16px 12px' }}>
      <div
        style={{
          fontSize: 10.5,
          fontWeight: 700,
          color: RV2.amber,
          textTransform: 'uppercase',
          letterSpacing: '0.14em',
          marginBottom: 10,
        }}
      >
        {t('review.teesPlayed.eyebrow', { defaultValue: 'TEES PLAYED (OPTIONAL)' })}
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {colourTees.map((tee) => {
          const selected = value === tee.tee_label;
          return (
            <button
              key={tee.tee_label}
              type="button"
              aria-pressed={selected}
              onClick={() => {
                if (selected) {
                  onChange(null);
                } else {
                  onChange(tee.tee_label);
                  // review_tee_selected - composer chip select
                  analyticsEvents.track('review_tee_selected', {
                    course_id: courseId,
                    tee_label: tee.tee_label,
                  });
                }
              }}
              style={{
                padding: '6px 12px',
                borderRadius: 999,
                border: selected ? `1px solid ${RV2.ink}` : `1px solid ${RV2.hairlineStrong}`,
                background: selected ? RV2.ink : '#FFFFFF',
                color: selected ? '#FFFFFF' : RV2.ink,
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: '0.01em',
                cursor: 'pointer',
              }}
            >
              {tee.tee_label}
            </button>
          );
        })}
      </div>
    </section>
  );
}

function InnerComposer() {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const { user, loading: sessionLoading } = useSupabaseSession();
  const userId = user?.id ?? null;




  const courseQ = useQuery({
    queryKey: ['rv2-course', courseId],
    enabled: !!courseId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('golf_courses')
        .select('id, name, thumbnail_image, country, sub_country, region')
        .eq('id', courseId!)
        .single();
      if (error) throw error;
      return data as ReviewV2Course;
    },
  });

  const existingQ = useQuery({
    queryKey: ['rv2-existing', courseId, userId],
    enabled: !!courseId && !!userId,
    queryFn: async () => {
      // L6: 'tee_label' column may not yet exist in generated types until DB migration ships.
      const { data } = await (supabase.from('course_ratings') as any)
        .select('id, rating, design_score, condition_score, clubhouse_score, facilities_score, review, verdict, share_to_feed, tee_label')
        .eq('course_id', courseId!)
        .eq('user_id', userId!)
        .maybeSingle();
      return (data as ExistingReview | null) ?? null;
    },
  });

  const existingMediaQ = useQuery({
    queryKey: ['rv2-existing-media', existingQ.data?.id],
    enabled: !!existingQ.data?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from('course_review_media')
        .select('id, media_url, media_type, poster_url, stream_id')
        .eq('review_id', existingQ.data!.id);
      return (data as ExistingMedia[] | null) ?? [];
    },
  });

  const profileQ = useQuery({
    queryKey: ['rv2-me', userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data } = await supabase
        .from('user_profiles')
        .select('id, display_name, username, profile_photo_url')
        .eq('id', userId!)
        .maybeSingle();
      return (data as { display_name?: string | null; username?: string | null; profile_photo_url?: string | null } | null) ?? null;
    },
  });

  const ready =
    !!courseQ.data &&
    !sessionLoading &&
    (!userId
      ? true // signed-out: nothing to prefill
      : !profileQ.isLoading && !existingQ.isLoading && (!existingQ.data || !existingMediaQ.isLoading));

  if (courseQ.isError) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: RV2.canvas,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0 24px',
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: 17, fontWeight: 700, color: RV2.ink, marginBottom: 6 }}>
          Couldn&apos;t load this course
        </div>
        <div style={{ fontSize: 13, color: RV2.secondary, marginBottom: 20, maxWidth: 280 }}>
          Check your connection and try again.
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            type="button"
            onClick={() => navigate(-1)}
            style={{
              background: '#FFFFFF',
              border: `1px solid ${RV2.hairlineStrong}`,
              borderRadius: 999,
              padding: '10px 18px',
              fontSize: 14,
              fontWeight: 600,
              color: RV2.ink,
              cursor: 'pointer',
            }}
          >
            Go back
          </button>
          <button
            type="button"
            onClick={() => courseQ.refetch()}
            style={{
              background: RV2.dark,
              color: '#F5F6F7',
              border: 0,
              borderRadius: 999,
              padding: '10px 18px',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!ready) {
    return <RateCoursePageSkeleton />;
  }

  return (
    <Composer
      key={`${courseId}:${existingQ.data?.id ?? 'new'}`}
      course={courseQ.data!}
      userId={userId}
      existing={existingQ.data}
      existingMedia={existingMediaQ.data ?? []}
      author={{
        displayName:
          profileQ.data?.display_name ||
          profileQ.data?.username ||
          'You',
        avatarUrl: profileQ.data?.profile_photo_url ?? null,
        username: profileQ.data?.username ?? null,
      }}
      onExit={() => {
        const hs = window.history.state as { idx?: number } | null;
        if (hs && typeof hs.idx === 'number' && hs.idx > 0) {
          navigate(-1);
        } else if (courseId) {
          navigate(`/courses/${courseId}`, { replace: true });
        } else {
          navigate('/', { replace: true });
        }
      }}
    />
  );
}

interface ComposerProps {
  course: ReviewV2Course;
  userId: string | null;
  existing: ExistingReview | null | undefined;
  existingMedia: ExistingMedia[];
  author: { displayName: string; avatarUrl: string | null; username: string | null };
  onExit: () => void;
}

function Composer({ course, userId, existing, existingMedia, author, onExit }: ComposerProps) {
  const isEditMode = !!existing;
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { activeActor } = useActiveActor();

  const media = useReviewMediaPipeline({
    userId,
    existingMedia,
    identity: userId
      ? {
          actorType: 'personal',
          actorId: userId,
          viewerActorType: (activeActor?.type ?? 'personal') as 'personal' | 'business',
          viewerActorId: activeActor?.id ?? userId,
          authorName: author.displayName,
          authorAvatarUrl: author.avatarUrl,
          authorUsername: author.username,
          courseId: course.id,
          courseName: course.name,
        }
      : undefined,
  });
  const composer = useReviewComposer(existing, media.hasNewMedia);
  const submit = useReviewSubmit();


  const [success, setSuccess] = useState<{ ratingId: string; shareToFeed: boolean } | null>(null);
  const [removeOpen, setRemoveOpen] = useState(false);
  const [exitGuardOpen, setExitGuardOpen] = useState(false);
  const [dictationFlashKey, setDictationFlashKey] = useState(0);

  // rating_modal_opened: fired once when the composer mounts (open == mounted)
  useEffect(() => {
    analyticsEvents.ratings.modalOpened({
      courseId: course.id,
      courseName: course.name,
      isEditMode,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // rating_slider_changed: first slider interaction per open (ref guard, no state churn)
  const sliderFiredRef = useRef(false);
  useEffect(() => {
    if (sliderFiredRef.current) return;
    if (
      composer.state.overall == null &&
      composer.state.scores.design == null &&
      composer.state.scores.condition == null &&
      composer.state.scores.clubhouse == null &&
      composer.state.scores.facilities == null
    ) return;
    sliderFiredRef.current = true;
    const s = composer.state.scores;
    const first: 'overall' | 'design' | 'condition' | 'clubhouse' | 'facilities' =
      composer.state.overall != null ? 'overall'
      : s.design != null ? 'design'
      : s.condition != null ? 'condition'
      : s.clubhouse != null ? 'clubhouse'
      : 'facilities';
    const value =
      first === 'overall' ? composer.state.overall!
      : (s[first] as number);
    analyticsEvents.ratings.sliderChanged({
      courseId: course.id,
      courseName: course.name,
      category: first,
      value,
    });
  }, [composer.state.overall, composer.state.scores, course.id, course.name]);

  const isDirty = useMemo(() => {
    if (isEditMode) {
      return (
        composer.state.overall !== (existing?.rating ?? null) ||
        composer.state.reviewText !== (existing?.review ?? '') ||
        composer.state.shareToFeed !== (existing?.share_to_feed !== false) ||
        composer.state.scores.design !== (existing?.design_score ?? null) ||
        composer.state.scores.condition !== (existing?.condition_score ?? null) ||
        composer.state.scores.clubhouse !== (existing?.clubhouse_score ?? null) ||
        composer.state.scores.facilities !== (existing?.facilities_score ?? null) ||
        media.hasNewMedia()
      );
    }
    return (
      composer.state.overall != null ||
      composer.state.reviewText.trim().length > 0 ||
      composer.state.scores.design != null ||
      composer.state.scores.condition != null ||
      composer.state.scores.clubhouse != null ||
      composer.state.scores.facilities != null ||
      media.hasNewMedia()
    );
  }, [isEditMode, existing, composer.state, media]);

  const handleBack = useCallback(() => {
    if (isDirty && !success) {
      setExitGuardOpen(true);
      return;
    }
    onExit();
  }, [isDirty, success, onExit]);

  const handleSubmit = useCallback(async () => {
    try {
      const { ratingId, shareToFeed } = await submit.submit({
        courseId: course.id,
        state: composer.state,
      });
      // Fire uploads AFTER the RPC (media picked before submit is held locally).
      media.flushToReview(ratingId, { caption: composer.state.reviewText }).catch(() => { /* per-item errors surfaced in tray */ });
      invalidateCourseRatingCaches(qc);
      setSuccess({ ratingId, shareToFeed });
      analyticsEvents.ratings.submitted({
        courseId: course.id,
        courseName: course.name,
        isNewReview: !isEditMode,
        overallRating: composer.state.overall ?? 0,
        design: composer.state.scores.design ?? undefined,
        condition: composer.state.scores.condition ?? undefined,
        clubhouse: composer.state.scores.clubhouse ?? undefined,
        facilities: composer.state.scores.facilities ?? undefined,
      });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't save your review");
    }
  }, [submit, media, composer.state, course.id, qc]);

  const handleRemove = useCallback(async () => {
    if (!existing) return;
    try {
      await submit.remove(existing.id);
      invalidateCourseRatingCaches(qc);
      // Clean up any storage assets for existing media in ONE call.
      if (existingMedia.length > 0) {
        supabase.functions
          .invoke('cleanup-review-media', {
            body: {
              mediaItems: existingMedia.map((m) => ({
                id: m.id,
                media_url: m.media_url,
                media_type: m.media_type === 'video' ? 'video' : 'image',
                stream_id: m.stream_id ?? null,
              })),
            },
          })
          .catch((err) => { console.warn('[review-v2] cleanup-review-media failed', err); });
      }
      setRemoveOpen(false);
      onExit();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't remove your review");
    }
  }, [existing, submit, existingMedia, onExit, qc]);


  if (success) {
    const courseUrl = `${window.location.origin}/courses/${course.id}`;
    return (
      <SuccessScreenV2
        course={course}
        author={author}
        overall={composer.state.overall}
        verdict={composer.state.verdict}
        reviewText={composer.state.reviewText}
        scores={composer.state.scores}
        media={media.items}
        shareToFeed={success.shareToFeed}
        onViewReview={() => navigate(`/courses/${course.id}`, { replace: true })}
        onShare={async () => {
          const title = `My review of ${course.name}`;
          if (typeof navigator !== 'undefined' && navigator.share) {
            try {
              await navigator.share({ title, url: courseUrl });
              return;
            } catch (err) {
              if ((err as Error)?.name === 'AbortError') return;
              // fall through to clipboard
            }
          }
          try {
            await navigator.clipboard.writeText(courseUrl);
            const { toast } = await import('sonner');
            toast.success('Link copied');
          } catch {
            /* noop */
          }
        }}
        onDone={onExit}
      />
    );
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: RV2.canvas,
        color: RV2.ink,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header — pinned under the notch (fixed, so no --sat race) */}
      <header
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          margin: '0 auto',
          width: '100%',
          maxWidth: 480,
          zIndex: 50,
          background: RV2.canvas,
          borderBottom: `0.5px solid ${RV2.hairline}`,
          paddingTop: 'calc(env(safe-area-inset-top, 0px) + 8px)',
        }}
      >

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '6px 12px 10px',
          }}
        >
          <button
            type="button"
            onClick={handleBack}
            aria-label="Back"
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              border: 'none',
              background: 'transparent',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <ChevronLeft size={20} color={RV2.ink} />
          </button>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: RV2.ink, letterSpacing: '-0.01em' }}>
              {isEditMode ? 'Edit review' : 'Write a review'}
            </div>
            <div
              style={{
                fontSize: 11.5,
                color: RV2.secondary,
                marginTop: 1,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {course.name}
            </div>
          </div>
          {isEditMode && (
            <button
              type="button"
              onClick={() => setRemoveOpen(true)}
              aria-label="Remove review"
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                border: 'none',
                background: 'transparent',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: '#EF4444',
              }}
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
        {/* Amber progress hairline */}
        <div style={{ height: 2, background: RV2.hairline, position: 'relative' }}>
          <div
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              bottom: 0,
              width: `${composer.progressPct}%`,
              background: RV2.amber,
              transition: 'width 200ms ease',
            }}
          />
        </div>
      </header>
      {/* Spacer: reserves the fixed header's content height in flow.
          (.app-shell's own --sat padding covers the safe area.) */}
      <div aria-hidden style={{ height: 54, flexShrink: 0 }} />

      {/* Live preview */}

      <div style={{ padding: '16px 16px 12px' }}>
        <LivePreviewCard
          course={course}
          author={author}
          overall={composer.state.overall}
          verdict={composer.state.verdict}
          reviewText={composer.state.reviewText}
          scores={composer.state.scores}
          media={media.items}
        />
      </div>

      {/* Overall */}
      <Section eyebrow="Overall">
        <div
          style={{
            background: '#FFFFFF',
            border: `1px solid ${RV2.hairline}`,
            borderRadius: RV2.panelRadius,
            padding: '12px 16px 12px',
          }}
        >
          <OverallScrubber value={composer.state.overall} onChange={composer.setOverall} />
        </div>
      </Section>

      {/* Categories */}
      <Section eyebrow="Category scores">
        <CategoryGrid values={composer.state.scores} onChange={composer.setCategory} />
      </Section>

      {/* L6 - Optional tees played (renders only when colour tees exist for this course) */}
      <TeeChipRow
        courseId={course.id}
        value={composer.state.teeLabel}
        onChange={composer.setTeeLabel}
      />

      {/* Words */}
      <section style={{ padding: '0 16px 12px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 12,
          }}
        >
          <div
            style={{
              fontSize: 10.5,
              fontWeight: 700,
              color: RV2.amber,
              textTransform: 'uppercase',
              letterSpacing: '0.14em',
            }}
          >
            Words
          </div>
          <VoiceDictateButton
            onAppend={(text) => {
              const prev = composer.state.reviewText;
              const joiner = prev.length === 0 || /\s$/.test(prev) ? '' : ' ';
              composer.setReviewText(`${prev}${joiner}${text}`);
              setDictationFlashKey((k) => k + 1);
            }}
          />
        </div>
        <div
          key={dictationFlashKey}
          style={{
            background: '#FFFFFF',
            border: `1px solid ${RV2.hairline}`,
            borderRadius: RV2.panelRadius,
            padding: '4px 12px',
            minHeight: 96,
            animation: dictationFlashKey > 0 ? 'rv2-dictation-flash 900ms ease-out' : 'none',
          }}
        >
          <style>{`
            @keyframes rv2-dictation-flash {
              0%   { background-color: rgba(247,147,30,0.16); box-shadow: 0 0 0 2px rgba(247,147,30,0.28); }
              100% { background-color: #FFFFFF; box-shadow: 0 0 0 0 rgba(247,147,30,0); }
            }
            @media (prefers-reduced-motion: reduce) {
              [data-rv2-flash="1"] { animation: none !important; }
            }
          `}</style>
          <MentionsComposerInput
            value={composer.state.reviewText}
            onChange={composer.setReviewText}
            placeholder="Best hole? Green speeds? @mention your fourball..."
            currentUserId={userId}
            textStyle={{ fontSize: 14, lineHeight: '20px', minHeight: 80, maxHeight: 260, padding: '10px 0', color: RV2.ink, caretColor: RV2.ink }}
          />
        </div>
      </section>




      {/* Media */}
      <Section eyebrow="Photos & video">
        <MediaTray
          items={media.items}
          onPick={media.addFiles}
          onRemove={media.removeItem}
          pickerError={media.pickerError}
          onClearError={media.clearPickerError}
        />
      </Section>

      {/* Share toggle */}
      <div style={{ padding: '0 16px 12px' }}>
        <ShareToggle value={composer.state.shareToFeed} onChange={composer.setShareToFeed} />
      </div>

      <div style={{ flex: 1, minHeight: 16 }} />

      <SubmitBar
        canSubmit={composer.canSubmit}
        submitting={submit.submitting}
        onSubmit={handleSubmit}
        isEditMode={isEditMode}
      />

      <RemoveReviewSheetV2
        open={removeOpen}
        submitting={submit.submitting}
        onCancel={() => setRemoveOpen(false)}
        onConfirm={handleRemove}
      />

      <DiscardReviewSheet
        open={exitGuardOpen}
        onKeep={() => setExitGuardOpen(false)}
        onDiscard={() => {
          setExitGuardOpen(false);
          onExit();
        }}
      />
    </div>
  );
}

function DiscardReviewSheet({
  open,
  onKeep,
  onDiscard,
}: {
  open: boolean;
  onKeep: () => void;
  onDiscard: () => void;
}) {
  if (!open) return null;
  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10000,
        background: 'rgba(15,23,42,0.4)',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
      }}
      onClick={onKeep}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 480,
          background: '#FFFFFF',
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          padding: '16px 16px calc(env(safe-area-inset-bottom, 0px) + 16px)',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <div style={{ width: 36, height: 4, borderRadius: 999, background: 'rgba(15,23,42,0.16)' }} />
        </div>
        <div style={{ padding: '4px 4px 0' }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: RV2.ink }}>Discard this review?</div>
          <div style={{ fontSize: 12.5, color: RV2.secondary, marginTop: 4 }}>
            Your scores and words won't be saved.
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            type="button"
            onClick={onKeep}
            style={{
              flex: 1,
              padding: 12,
              borderRadius: 12,
              background: '#FFFFFF',
              border: `1px solid ${RV2.hairline}`,
              fontSize: 14,
              fontWeight: 600,
              color: RV2.ink,
              cursor: 'pointer',
            }}
          >
            Keep writing
          </button>
          <button
            type="button"
            onClick={onDiscard}
            style={{
              flex: 1,
              padding: 12,
              borderRadius: 12,
              background: '#EF4444',
              border: 'none',
              fontSize: 14,
              fontWeight: 700,
              color: '#FFFFFF',
              cursor: 'pointer',
            }}
          >
            Discard
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ReviewComposerV2() {
  return (
    <AccessControl requireAuth={true} noBlockingLoader={true}>
      <div className="w-full md:max-w-[440px] md:mx-auto">
        <InnerComposer />
      </div>
    </AccessControl>
  );
}
