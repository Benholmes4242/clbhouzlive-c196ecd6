/**
 * ReviewComposerV2 - the three-step review wizard shell.
 *
 * Step 0 Score, step 1 Breakdown, step 2 Words, then the confirmation
 * receipt. All writes flow through the v2 RPCs - the client never touches
 * course_ratings, posts, notifications, user_courses, or
 * user_top10_exclusions directly.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { analyticsEvents } from '@/utils/analyticsEvents';
import { useNavigate, useParams } from 'react-router-dom';
import { Trash2 } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { invalidateCourseRatingCaches } from '@/utils/invalidateCourseRatingCaches';
import { toast } from '@/lib/toast';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useActiveActor } from '@/context/ActiveActorContext';
import { MentionsComposerInput } from '@/components/mentions/MentionsComposerInput';
import AccessControl from '@/components/AccessControl';
import { useTranslation } from 'react-i18next';

import { RV2 } from './tokens';
import { useReviewComposer, type WizardStep } from './hooks/useReviewComposer';
import { useReviewSubmit } from './hooks/useReviewSubmit';
import { useReviewMediaPipeline } from './hooks/useReviewMediaPipeline';
import { VoiceDictateButton } from './components/VoiceDictateButton';
import { OverallScrubber } from './components/OverallScrubber';
import { CategoryGrid, type CategoryCopy } from './components/CategoryGrid';
import { MediaTray } from './components/MediaTray';
import { ShareToggle } from './components/ShareToggle';
import { SubmitBar } from './components/SubmitBar';
import { ReviewReceipt, ordinal } from './components/ReviewReceipt';
import { useMyRatedScores, calibrationRank } from './hooks/useMyRatedScores';

import { RemoveReviewSheetV2 } from './components/RemoveReviewSheetV2';
import type { CategoryKey, ExistingMedia, ExistingReview, ReviewV2Course } from './types';
import { RateCoursePageSkeleton } from '@/components/skeletons/RateCoursePageSkeleton';
import { useCourseTeeSets, type TeeSet } from '@/features/courses/hooks/useCourseTeeSets';

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontSize: 10.5,
        fontWeight: 700,
        color: RV2.eyebrow,
        textTransform: 'uppercase',
        letterSpacing: '0.14em',
        marginBottom: 12,
      }}
    >
      {children}
    </div>
  );
}

// Optional tee chip row. Renders only when at least one colour tee exists.
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
    <section style={{ padding: '0 16px 16px' }}>
      <Eyebrow>{t('review.wizard.step2.teesEyebrow')}</Eyebrow>
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

interface ReceiptState {
  ratingId: string;
  shareToFeed: boolean;
  overall: number | null;
  scores: Record<CategoryKey, number | null>;
}

function InnerComposer() {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const { user, loading: sessionLoading } = useSupabaseSession();
  const userId = user?.id ?? null;

  // Receipt + submitted flag live in this outer instance so they outlive the
  // keyed <Composer /> remount that follows a successful submit.
  const [success, setSuccess] = useState<ReceiptState | null>(null);
  const submittedRef = useRef(false);


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
      ? true
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

  // The receipt lives HERE, above the keyed <Composer />, so it survives the
  // create-to-edit remount caused by invalidateCourseRatingCaches refetching
  // existingQ (the key flips from ":new" to ":<rating id>").
  if (success && courseQ.data) {
    return (
      <ReviewReceipt
        ratingId={success.ratingId}
        course={courseQ.data}
        overall={success.overall}
        scores={success.scores}
        shareToFeed={success.shareToFeed}
        onClubhouse={() => navigate('/clubhouse')}
        onBack={() => navigate(`/courses/${courseQ.data!.id}`, { replace: true })}
        onNextCourse={(nextId) => {
          navigate(`/courses/${nextId}/review`, { replace: true });
        }}
      />
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
      submittedRef={submittedRef}
      onSuccess={(payload) => {
        submittedRef.current = true;
        setSuccess(payload);
      }}
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
  /** Shared across remounts: true once any instance submitted successfully. */
  submittedRef: React.MutableRefObject<boolean>;
  onSuccess: (payload: ReceiptState) => void;
}

function Composer({ course, userId, existing, existingMedia, author, onExit, submittedRef, onSuccess }: ComposerProps) {

  const isEditMode = !!existing;
  const mode = isEditMode ? 'edit' : 'new';
  const { t } = useTranslation('courses');
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
  const composer = useReviewComposer(existing, course.id);
  const submit = useReviewSubmit();

  // ONE fetch of the member's own overall ratings (this course excluded, so an
  // edit never ranks the member against themselves). The ordinal below is
  // computed client-side on every drag - no query per drag.
  const myRatedQ = useMyRatedScores(userId, course.id);
  const calibration = calibrationRank(composer.state.overall, myRatedQ.data);


  const [removeOpen, setRemoveOpen] = useState(false);

  const [dictationFlashKey, setDictationFlashKey] = useState(0);

  const step = composer.step;
  const stepLabels = [
    t('review.wizard.rail.score'),
    t('review.wizard.rail.breakdown'),
    t('review.wizard.rail.words'),
  ];

  // ---- instrumentation -------------------------------------------------
  const mountedAtRef = useRef(Date.now());
  const stepEnteredAtRef = useRef(Date.now());
  // submittedRef comes from the parent - it must survive this instance.

  const abandonRef = useRef({ step: 0, hasOverall: false, catsSet: 0 });
  abandonRef.current = {
    step,
    hasOverall: composer.state.overall != null,
    catsSet: composer.catsSet,
  };

  useEffect(() => {
    // review_wizard_opened
    analyticsEvents.track('review_wizard_opened', { course_id: course.id, mode });
    return () => {
      if (submittedRef.current) return;
      // review_wizard_abandoned
      analyticsEvents.track('review_wizard_abandoned', {
        course_id: course.id,
        step: abandonRef.current.step,
        has_overall: abandonRef.current.hasOverall,
        cats_set: abandonRef.current.catsSet,
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const seenStepsRef = useRef<Set<number>>(new Set());
  useEffect(() => {
    stepEnteredAtRef.current = Date.now();
    if (seenStepsRef.current.has(step)) return;
    seenStepsRef.current.add(step);
    // review_step_viewed
    analyticsEvents.track('review_step_viewed', { course_id: course.id, step, mode });
  }, [step, course.id, mode]);

  // rating_modal_opened: fired once when the composer mounts (open == mounted)
  useEffect(() => {
    analyticsEvents.ratings.modalOpened({
      courseId: course.id,
      courseName: course.name,
      isEditMode,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // rating_slider_changed: first slider interaction per open
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
    const first: 'overall' | CategoryKey =
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

  // ---- navigation ------------------------------------------------------
  const handleBack = useCallback(() => {
    if (step > 0) {
      composer.setStep((step - 1) as WizardStep);
      return;
    }
    composer.clearDraft();
    onExit();
  }, [step, composer, onExit]);

  const handleSubmit = useCallback(async () => {
    try {
      const { ratingId, shareToFeed } = await submit.submit({
        courseId: course.id,
        state: composer.state,
      });
      submittedRef.current = true;
      composer.clearDraft();
      media.flushToReview(ratingId, { caption: composer.state.reviewText, queryClient: qc }).catch(() => { /* per-item errors surfaced in tray */ });
      invalidateCourseRatingCaches(qc);
      onSuccess({
        ratingId,
        shareToFeed,
        overall: composer.state.overall,
        scores: composer.state.scores,
      });

      // review_submitted
      analyticsEvents.track('review_submitted', {
        course_id: course.id,
        mode,
        overall: composer.state.overall ?? 0,
        cats_set: composer.catsSet,
        has_text: composer.state.reviewText.trim().length > 0,
        text_len: composer.state.reviewText.trim().length,
        media_count: media.items.length,
        tee_set: composer.state.teeLabel != null,
        share_to_feed: shareToFeed,
        total_ms: Math.round(Date.now() - mountedAtRef.current),
      });
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submit, media, composer, course.id, course.name, qc, isEditMode, mode]);

  const handlePrimary = useCallback(() => {
    if (step < 2) {
      // review_step_completed
      analyticsEvents.track('review_step_completed', {
        course_id: course.id,
        step,
        ms_on_step: Math.round(Date.now() - stepEnteredAtRef.current),
      });
      composer.setStep((step + 1) as WizardStep);
      return;
    }
    analyticsEvents.track('review_step_completed', {
      course_id: course.id,
      step,
      ms_on_step: Math.round(Date.now() - stepEnteredAtRef.current),
    });
    void handleSubmit();
  }, [step, composer, course.id, handleSubmit]);

  const handleRemove = useCallback(async () => {
    if (!existing) return;
    try {
      await submit.remove(existing.id);
      // review_removed - fired only after the removal actually succeeded.
      analyticsEvents.track('review_removed', {
        course_id: course.id,
        rating_id: existing.id,
        had_text: (existing.review ?? '').trim().length > 0,
        media_count: existingMedia.length,
      });
      invalidateCourseRatingCaches(qc);
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
  }, [existing, submit, existingMedia, onExit, qc, course.id]);

  // The confirmation receipt renders in the parent (InnerComposer) so it
  // outlives this instance across the create-to-edit remount.


  // ---- gates and label -------------------------------------------------
  const gateMet = step === 0 ? composer.step0Gate : step === 1 ? composer.step1Gate : true;
  const remaining = 4 - composer.catsSet;

  let buttonLabel: string;
  if (submit.submitting) {
    buttonLabel = isEditMode ? t('review.wizard.saving') : t('review.wizard.posting');
  } else if (step === 2) {
    buttonLabel = isEditMode ? t('review.wizard.save') : t('review.wizard.post');
  } else if (!gateMet) {
    buttonLabel = step === 0
      ? t('review.wizard.step0.gate')
      : t('review.wizard.step1.gate', { count: remaining });
  } else {
    buttonLabel = t('review.wizard.continue');
  }

  const cats: CategoryCopy[] = [
    { key: 'design', label: t('review.subscore.design'), hint: t('review.wizard.hint.design') },
    { key: 'condition', label: t('review.subscore.condition'), hint: t('review.wizard.hint.condition') },
    { key: 'clubhouse', label: t('review.subscore.clubhouse'), hint: t('review.wizard.hint.clubhouse') },
    { key: 'facilities', label: t('review.subscore.facilities'), hint: t('review.wizard.hint.facilities') },
  ];

  const region = [course.region, course.sub_country || course.country].filter(Boolean).join(', ');

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
      {/* Header */}
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
          borderBottom: `1px solid ${RV2.hairline}`,
          paddingTop: 'calc(env(safe-area-inset-top, 0px) + 8px)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 12px 10px' }}>
          <button
            type="button"
            onClick={handleBack}
            aria-label={t('review.wizard.backA11y')}
            style={{
              width: 44,
              height: 44,
              borderRadius: 10,
              border: 'none',
              background: 'transparent',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              fontSize: 21,
              lineHeight: 1,
              color: RV2.ink,
            }}
          >
            {'\u2039'}
          </button>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: 14.5,
                fontWeight: 700,
                letterSpacing: '-0.015em',
                color: RV2.ink,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {course.name}
            </div>
            <div style={{ fontSize: 11.5, color: RV2.secondary }}>{region}</div>
          </div>
          {isEditMode && (
            <button
              type="button"
              onClick={() => setRemoveOpen(true)}
              aria-label={t('review.wizard.deleteA11y')}
              style={{
                width: 44,
                height: 44,
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
      </header>
      <div aria-hidden style={{ height: 54, flexShrink: 0 }} />

      {/* Step rail */}
      <div
        aria-hidden="true"
        style={{ display: 'flex', gap: 6, padding: '14px 16px 18px' }}
      >
        {stepLabels.map((label, i) => (
          <div key={label} style={{ flex: 1 }}>
            <div
              style={{
                height: 3,
                borderRadius: 999,
                marginBottom: 6,
                background: i <= step ? RV2.dark : 'rgba(15,23,42,0.10)',
              }}
            />
            <div
              style={{
                fontSize: 9,
                fontWeight: 700,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: i <= step ? RV2.ink : RV2.muted,
              }}
            >
              {label}
            </div>
          </div>
        ))}
      </div>

      <div
        aria-live="polite"
        style={{
          position: 'absolute',
          width: 1,
          height: 1,
          overflow: 'hidden',
          clip: 'rect(0 0 0 0)',
          whiteSpace: 'nowrap',
        }}
      >
        {t('review.wizard.a11yStep', { n: step + 1, label: stepLabels[step] })}
      </div>

      {/* Step 0 - Score */}
      {step === 0 && (
        <section style={{ padding: '0 16px 16px' }}>
          <h1
            style={{
              fontSize: 20,
              fontWeight: 700,
              letterSpacing: '-0.02em',
              marginBottom: 16,
              color: RV2.ink,
            }}
          >
            {t('review.wizard.step0.heading')}
          </h1>
          <div
            style={{
              background: RV2.cardBg,
              borderRadius: RV2.cardRadius,
              border: `1px solid ${RV2.hairline}`,
              padding: '18px 18px 16px',
            }}
          >
            <OverallScrubber
              value={composer.state.overall}
              onChange={composer.setOverall}
              caption={
                composer.state.overall == null
                  ? t('review.wizard.step0.captionEmpty')
                  : t('review.wizard.step0.captionSet')
              }
              ariaLabel={t('review.wizard.step0.a11y')}
              bandLabels={{
                low: t('review.wizard.step0.bandLow'),
                mid: t('review.wizard.step0.bandMid'),
                high: t('review.wizard.step0.bandHigh'),
              }}
              calibration={
                calibration
                  ? t('review.wizard.step0.calibration', {
                      ordinal: ordinal(calibration.ordinal),
                      count: calibration.total,
                    })
                  : null
              }
            />

          </div>
        </section>
      )}

      {/* Step 1 - Breakdown */}
      {step === 1 && (
        <section style={{ padding: '0 16px 16px' }}>
          <h1
            style={{
              fontSize: 20,
              fontWeight: 700,
              letterSpacing: '-0.02em',
              marginBottom: 4,
              color: RV2.ink,
            }}
          >
            {t('review.wizard.step1.heading')}
          </h1>
          <p
            style={{
              fontSize: 12.5,
              color: RV2.secondary,
              lineHeight: 1.55,
              marginBottom: 16,
            }}
          >
            {t('review.wizard.step1.body')}
          </p>
          <CategoryGrid
            values={composer.state.scores}
            onChange={composer.setCategory}
            cats={cats}
          />
        </section>
      )}

      {/* Step 2 - Words */}
      {step === 2 && (
        <>
          <section style={{ padding: '0 16px 16px' }}>
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
                  color: RV2.eyebrow,
                  textTransform: 'uppercase',
                  letterSpacing: '0.14em',
                }}
              >
                {t('review.wizard.step2.wordsEyebrow')}
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
                borderRadius: 14,
                padding: 14,
                minHeight: 100,
                boxSizing: 'border-box',
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
                placeholder={t('review.wizard.step2.placeholder')}
                currentUserId={userId}
                textStyle={{
                  fontSize: 14,
                  lineHeight: '1.55',
                  minHeight: 72,
                  maxHeight: 260,
                  padding: '0',
                  color: RV2.ink,
                  caretColor: RV2.ink,
                }}
              />
            </div>
            <div style={{ fontSize: 11, color: RV2.muted, marginTop: 8 }}>
              {t('review.wizard.step2.optionalNote')}
            </div>
          </section>

          <section style={{ padding: '0 16px 16px' }}>
            <Eyebrow>{t('review.wizard.step2.photosEyebrow')}</Eyebrow>
            <MediaTray
              items={media.items}
              onPick={media.addFiles}
              onRemove={media.removeItem}
              pickerError={media.pickerError}
              onClearError={media.clearPickerError}
            />
          </section>

          <TeeChipRow
            courseId={course.id}
            value={composer.state.teeLabel}
            onChange={composer.setTeeLabel}
          />

          <div style={{ padding: '0 16px 16px' }}>
            <div
              style={{
                background: RV2.cardBg,
                borderRadius: 14,
                border: `1px solid ${RV2.hairline}`,
                padding: '13px 14px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 600, color: RV2.ink }}>
                    {t('review.wizard.step2.shareTitle')}
                  </div>
                  <div style={{ fontSize: 11.5, color: RV2.secondary }}>
                    {t('review.wizard.step2.shareSub')}
                  </div>
                </div>
              </div>
              <div style={{ marginTop: 10 }}>
                <ShareToggle value={composer.state.shareToFeed} onChange={composer.setShareToFeed} />
              </div>
            </div>
          </div>
        </>
      )}

      <div style={{ flex: 1, minHeight: 16 }} />

      <SubmitBar
        label={buttonLabel}
        enabled={gateMet && !submit.submitting}
        onPress={handlePrimary}
      />

      <RemoveReviewSheetV2
        open={removeOpen}
        submitting={submit.submitting}
        onCancel={() => setRemoveOpen(false)}
        onConfirm={handleRemove}
      />
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
