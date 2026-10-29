import { mediaCountKey } from './lib/mediaUploadSummary';
/**
 * ReviewComposerV2 - steps 2 and 3 of the unified composer's review path.
 *
 * THE ORDER, AND WHY IT IS THIS ORDER (phase 2 of BRIEF_THE_UNIFIED_COMPOSER):
 *   Step 1 of 3  What are you sharing? + which course   (a sheet, not this file)
 *   Step 2 of 3  Photos and a few words                 (here)
 *   Step 3 of 3  How good is it? - dial AND breakdown   (here, one screen)
 *   then         the receipt                            (rendered by the parent)
 *
 * The old order was Score -> Breakdown -> Words, and the measured funnel says
 * the crowded optional screen at the END was the leak: the old Words step lost
 * 44% of everyone who reached it with every mandatory field already filled,
 * while the Breakdown lost 21%. So words move IN FRONT of the score, the
 * breakdown joins the dial on one screen, and the rating - the thing the flow
 * exists for - is the last thing asked rather than the first.
 *
 * Step 1 retains the shared strip; Step 2 uses its heading's display-only
 * counter. ReviewScoreHeadings owns this choice and the shared category
 * average; SubmitBar measures its fixed score footer for the bottom reserve.
 *
 * All writes flow through the v2 RPCs - the client never touches
 * course_ratings, posts, notifications, user_courses, or
 * user_top10_exclusions directly.
 */

import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { claimOverlayChrome, releaseOverlayChrome } from '@/lib/routeChrome';
import { analyticsEvents } from '@/utils/analyticsEvents';
import { notifyComposerCompleted } from '@/features/composer-flow/composerFlowStore';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { invalidateCourseRatingCaches } from '@/utils/invalidateCourseRatingCaches';
import { toast } from '@/lib/toast';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useActiveActor } from '@/context/ActiveActorContext';
import { MentionsComposerInput } from '@/components/mentions/MentionsComposerInput';
import AccessControl from '@/components/AccessControl';
import { useDraftDismissGuard } from '@/components/ui/useDraftDismissGuard';
import { DiscardDraftDialog } from '@/components/ui/DiscardDraftDialog';
import { useTranslation } from 'react-i18next';

import { RV2 } from './tokens';
import {
  useReviewComposer,
  FIRST_STEP,
  LAST_STEP,
  REVIEW_TOTAL_STEPS,
} from './hooks/useReviewComposer';
import { useReviewSubmit } from './hooks/useReviewSubmit';
import { useReviewMediaPipeline } from './hooks/useReviewMediaPipeline';
import { VoiceDictateButton } from './components/VoiceDictateButton';
import { OverallScrubber } from './components/OverallScrubber';
import { CategoryGrid, type CategoryCopy } from './components/CategoryGrid';
import { MediaTray } from './components/MediaTray';
import { ReviewHoleTags } from './components/ReviewHoleTags';
import { ReviewComposerHeader, PHOTO_HEADER_H_CSS } from './components/ReviewComposerHeader';
import { useReviewHeaderFacts } from './hooks/useReviewHeaderFacts';
import { usePhotoHeaderForm } from './lib/stepOneFold';
import { useReviewHoleTags } from './hooks/useReviewHoleTags';
import { ShareToggle } from './components/ShareToggle';
import { SubmitBar } from './components/SubmitBar';
import { ReviewReceipt, ordinal } from './components/ReviewReceipt';
import { useMyRatedScores, calibrationRank } from './hooks/useMyRatedScores';

import { RemoveReviewSheetV2 } from './components/RemoveReviewSheetV2';
import type { CategoryKey, ExistingMedia, ExistingReview, ReviewV2Course } from './types';
import { RateCoursePageSkeleton } from '@/components/skeletons/RateCoursePageSkeleton';
import { ReviewStepHeading, ReviewCategoriesHeading } from './components/ReviewScoreHeadings';
import { shortCourseName } from '@/features/courses/_shared/courseLabel';
import { useComposerFlowStore } from '@/features/composer-flow/composerFlowStore';
import { useTop100Config } from '@/hooks/top100/useTop100Config';
import { missingScores, scoreAction, scoreFooter, scoreShareKey } from './lib/scoreStepRules';
import { scrollElementIntoView } from '@/lib/getScrollParent';

/**
 * THE HEADER'S OWN GEOMETRY — one expression, two consumers.
 *
 * This page renders in TWO contexts: as a route at /courses/:courseId/rate
 * inside .app-shell, AND as a fixed overlay (position: fixed; inset: 0,
 * App.tsx backgroundLocation path) that is OUTSIDE .app-shell's safe-area
 * padding. The fixed header pays env(safe-area-inset-top) ITSELF in both
 * contexts, so the spacer that clears it must pay it too. A spacer that
 * assumed .app-shell had already paid the inset was correct on the route and
 * hid the step strip in the overlay on any device with a notch.
 *
 * The spacer therefore reads the header's MEASURED height (below), with this
 * expression only as the first-paint fallback. Neither number is retyped.
 */
const RV2_HEADER_CHROME_H = 8 + 6 + 44 + 10 + 1; // pad + row pad + 44 row + pad + rule
const RV2_HEADER_H_CSS = `calc(env(safe-area-inset-top, 0px) + ${RV2_HEADER_CHROME_H}px)`;
/** Breathing room between the header rule and the step strip. */
const RV2_HEADER_GAP = 14;


/** Step 1 section heading (BRIEF_REVIEW_STEP_ONE §3). */
const STEP1_HEADING: React.CSSProperties = {
  fontSize: 10.5, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'rgba(248,250,252,0.42)',
};

/* THE TEE ROW IS GONE FROM THE COMPOSER (phase 2 §7).
 *
 * A tee is a fact about the ROUND, not part of a review, and no screen in the
 * flow asks for one any more. `p_tee_label` and the `teeLabel` state stay: the
 * RPC parameter is unchanged and an EDIT still carries forward whatever label
 * the published review already holds, so editing a review never silently drops
 * its tee.
 *
 * THE DERIVATION IS NOT WIRED, DELIBERATELY. The brief has it resolved at
 * submit from the member's most recent gam_round_stats row at the course, read
 * from tee_marker - and tee_marker is NULL on all 3,563 rows in that table, so
 * the derivation would be a guaranteed null dressed up as a lookup. Reported
 * rather than shipped; see the reply accompanying this phase.
 *
 * review_tee_selected stays registered in eventLabels and stops firing. Its flat
 * line from this date is this removal, not a regression.
 */

interface ReceiptState {
  ratingId: string | null;
  pending?: boolean;
  uploadKey?: string | null;
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
  const [photoHeader, setPhotoHeader] = useState(false);

  // The claim stack owns the notch in both route and overlay contexts.
  // Only the photo form is transparent; loading, compact and receipt retain canvas.
  useLayoutEffect(() => {
    claimOverlayChrome({
      id: 'review-composer',
      statusBarStyle: 'light',
      statusBarColor: photoHeader ? '00000000' : 'FF' + RV2.canvas.replace('#', '').toUpperCase(),
      shieldColor: photoHeader ? 'transparent' : RV2.canvas,
    });
  }, [photoHeader]);
  useLayoutEffect(() => () => releaseOverlayChrome('review-composer'), []);


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


    // eslint-disable-next-line settled/no-not-loading-empty-check -- this is a readiness gate over composed loading flags, not a claim that data is absent.
    !!courseQ.data &&
    !sessionLoading &&
    (!userId
      ? true
      // eslint-disable-next-line settled/no-not-loading-empty-check -- readiness gate: the branch already requires courseQ.data and a resolved userId.
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
        <div style={{ fontSize: 14, color: RV2.secondary, marginBottom: 20, maxWidth: 280 }}>
          Check your connection and try again.
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            type="button"
            onClick={() => navigate(-1)}
            style={{
              background: RV2.ghost,
              border: `1px solid ${RV2.hairlineStrong}`,
              borderRadius: 999,
              padding: '10px 18px',
              /* CAPS ACTION (§5) at the size the brief's table gives. */
              fontSize: 15,
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.10em',
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
              background: RV2.ink,
              color: RV2.canvas,
              border: 0,
              borderRadius: 999,
              padding: '10px 18px',
              /* CAPS ACTION (§5). */
              fontSize: 15,
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.10em',
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
        pending={!!success.pending}
        uploadKey={success.uploadKey ?? null}
        onPublished={(ratingId: string) =>
          setSuccess((s) =>
            s && (s.pending || s.ratingId !== ratingId) ? { ...s, ratingId, pending: false } : s)}
        course={courseQ.data}
        overall={success.overall}
        scores={success.scores}
        shareToFeed={success.shareToFeed}
        onClubhouse={() => navigate('/clubhouse')}
        onBack={() => navigate(`/courses/${courseQ.data!.id}`, { replace: true })}
        onNextCourse={(nextId) => {
          navigate(`/courses/${nextId}/rate`, { replace: true });
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
      onHeaderFormChange={setPhotoHeader}
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
  onHeaderFormChange: (photo: boolean) => void;
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

function Composer({ course, userId, existing, existingMedia, author, onExit, submittedRef, onSuccess, onHeaderFormChange }: ComposerProps) {

  const isEditMode = !!existing;
  const mode = isEditMode ? 'edit' : 'new';
  const { t } = useTranslation('courses');
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { activeActor } = useActiveActor();

  /* WHY THE PIPELINE IS MOUNTED HERE AND NOT INSIDE STEP 2.
     `step` is state in THIS component, and the media pipeline and the composer
     state sit above the step branches, so crossing between step 2 and step 3
     re-renders one component - it does not remount anything that holds the
     member's work. MediaTray itself carries no state but a ref to its hidden
     input, and every preview URL belongs to the pipeline's items, so the tray
     unmounting on step 3 costs nothing: back from the dial restores the words
     and the attached files from LIVE state, never from the draft (which cannot
     carry media at all - it only counts it).
     DO NOT move this hook, or the composer state, inside a step block, and do
     not key the step bodies. Either would look like tidying and would silently
     lose a member's photographs the moment they went back to change a word. */
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
  /* LOCAL items only (_05 §1): media already on the server carries
     status 'existing' and is never at risk, so counting it would warn about
     something that is still there. */
  const draftMediaCounts = useMemo(() => {
    let photos = 0;
    let videos = 0;
    for (const it of media.items) {
      if (it.status === 'existing') continue;
      if (it.type === 'video') videos += 1;
      else photos += 1;
    }
    return { photos, videos };
  }, [media.items]);
  /* PHASE 3 RETRY. Arriving from a failed staged review's card: the member
     finished this review and the upload failed, so the part-finished draft
     notice is the wrong story. One line replaces it. Read BEFORE
     useReviewComposer so the retry flag can steer the draft key. */
  const retryLocation = useLocation();
  const retryOfPendingId =
    (retryLocation.state as { retryOfPendingId?: string } | null)?.retryOfPendingId ?? null;

  const composer = useReviewComposer(existing, course.id, draftMediaCounts, {
    retry: !!retryOfPendingId,
  });

  /* The one sentence that names the loss (_05 §1). Built from separate singular
     and plural keys rather than an interpolated count, because the six locales
     do not share one plural rule; the joiner is a key too, for the same reason.
     Null when the restored draft recorded no attached media. */

  const restoredMediaLine = useMemo(() => {
    const c = composer.restoredMediaCounts;
    if (!c) return null;
    const parts: string[] = [];
    if (c.photos > 0) {
      parts.push(
        c.photos === 1
          ? t('review.wizard.draftRestored.mediaPhoto', { count: 1 })
          : t('review.wizard.draftRestored.mediaPhotos', { count: c.photos }),
      );
    }
    if (c.videos > 0) {
      parts.push(
        c.videos === 1
          ? t('review.wizard.draftRestored.mediaVideo', { count: 1 })
          : t('review.wizard.draftRestored.mediaVideos', { count: c.videos }),
      );
    }
    if (!parts.length) return null;
    const subject = parts.join(t('review.wizard.draftRestored.mediaJoin'));
    return t('review.wizard.draftRestored.mediaLost', { subject });
  }, [composer.restoredMediaCounts, t]);


  const submit = useReviewSubmit();
  const holeTags = useReviewHoleTags(course.id, userId, media.items);

  // ONE fetch of the member's own overall ratings (this course excluded, so an
  // edit never ranks the member against themselves). The ordinal below is
  // computed client-side on every drag - no query per drag.
  const myRatedQ = useMyRatedScores(userId, course.id);
  const calibration = calibrationRank(composer.state.overall, myRatedQ.data);


  const [removeOpen, setRemoveOpen] = useState(false);

  const [dictationFlashKey, setDictationFlashKey] = useState(0);
  /** Recording or transcribing from the Speak card (folds the photo header). */
  const [voiceActive, setVoiceActive] = useState(false);
  /** The tray chip's request to open the tagging sheet on one shot. */
  const [tagShotId, setTagShotId] = useState<string | null>(null);
  const headerFacts = useReviewHeaderFacts(course.id);

  const step = composer.step;
  const shortName = shortCourseName(course.name ?? '');

  /* DID STEP 1 PUT US HERE? A member who came through the tiles has a step to
     go BACK to, and backing out returns them to it (the phase 1 handoff record
     reopens the sheet). A member who arrived through /courses/:id/rate, a
     course page, or an edit has no step behind them, so their leading control
     is a CLOSE, not a back arrow that would go somewhere they never were. */
  const cameFromStepOne = useComposerFlowStore((st) => st.handoff != null);
  const leadingIsClose = step === FIRST_STEP && !cameFromStepOne;

  /* THE THRESHOLD LINE'S TWO FACTS: how many ratings this course already has,
     and how many it needs before the course page prints the four bars. Both are
     reads; neither gates anything. */
  const { subscoreMinRatings } = useTop100Config();
  const ratingCountQ = useQuery({
    queryKey: ['rv2-rating-count', course.id],
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { count } = await supabase
        .from('course_ratings')
        .select('id', { count: 'exact', head: true })
        .eq('course_id', course.id);
      return count ?? 0;
    },
  });

  // ---- instrumentation -------------------------------------------------
  const mountedAtRef = useRef(Date.now());
  const stepEnteredAtRef = useRef(Date.now());
  // submittedRef comes from the parent - it must survive this instance.

  const abandonRef = useRef({ step: FIRST_STEP as number, hasOverall: false, catsSet: 0 });
  abandonRef.current = {
    step,
    hasOverall: composer.overallTouched,
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
  /* THE DRAFT GUARD (BRIEF_SHEET_BACK_BEHAVIOUR_03 §1a, amended by _04 §1).
   *
   * This is the longest authored text in the app and the back arrow at step 0
   * used to call clearDraft() and leave — several paragraphs of prose destroyed
   * by one 44px target with no question asked. It now asks.
   *
   * WHAT COUNTS AS DIRTY: anything the member put in — the overall score, any
   * category score, typed words, or an attached photo. NOT the tee label or
   * share toggle alone, which are defaults the member never touched.
   *
   * PATHS: this component is a ROUTE, not a sheet, so it has one in-app dismiss
   * (the header back arrow) and that is the path guarded. An OS or browser back
   * leaves the route WITHOUT calling this — and BOTH MODES now survive it,
   * because useReviewComposer writes the 24h sessionStorage draft for a create
   * AND for an edit (_04 §1). The guard is kept as well: a prompt helps the
   * member who is paying attention, a draft helps the one who was not, and this
   * is the one surface holding paragraphs of a member's own prose.
   *
   * WHAT THE DRAFT COVERS: overall score, the four category scores, the review
   * text, share-to-feed and tee label, plus the wizard step. WHAT IT DOES NOT:
   * ATTACHED MEDIA. Photos and video live in the upload pipeline, are not
   * serialisable to sessionStorage, and are still lost on an OS back.
   */

  const draftDirty =
    composer.overallTouched ||
    composer.catsSet > 0 ||
    composer.state.reviewText.trim().length > 0 ||
    media.count > 0;

  const exitForReal = useCallback(() => {
    composer.clearDraft();
    onExit();
  }, [composer, onExit]);

  const exitGuard = useDraftDismissGuard(draftDirty, exitForReal);

  const handleBack = useCallback(() => {
    if (step === LAST_STEP) {
      composer.setStep(FIRST_STEP);
      return;
    }
    exitGuard.requestClose();
  }, [step, composer, exitGuard]);

  /**
   * PHASE 2 — STAGED REVIEWS. handleSubmit splits on whether there is anything
   * to upload. No new files: submit_course_review_v2 directly, instant, as
   * before. Files attached: stage_course_review writes ONLY pending_reviews,
   * the member goes straight to the receipt, and reviewUploadController
   * uploads every file then publishes in one transaction — or marks the
   * staged row failed. The review never exists half-finished.
   */
  const handleSubmit = useCallback(async () => {
    if (!composer.canSubmit || submit.submitting) return;
    const overallTouched = composer.state.overall != null;
    try {
      const mediaExpected = media.pendingMediaCount();
      const holeJob = holeTags.capture();

      if (mediaExpected === 0) {
        // ---- NO NEW FILES: today's path, unchanged, and still instant. ----
        const { ratingId } = await submit.submit({
          courseId: course.id,
          state: composer.state,
        });
        submittedRef.current = true;
        notifyComposerCompleted();
        composer.clearDraft();

        media.writeUploadedHolePhotos(holeJob);
        const attached = await media.attachToReview(ratingId, {
          queryClient: qc,
          caption: composer.state.reviewText,
        });
        if (attached.failed > 0) toast.error(t('review.toast.mediaAttachFailed'));
        else if (attached.held > 0) toast.error(t('review.toast.mediaAttachHeld'));

        invalidateCourseRatingCaches(qc);
        onSuccess({
          ratingId,
          pending: false,
          shareToFeed: composer.state.shareToFeed,
          overall: composer.state.overall,
          scores: composer.state.scores,
        });
      } else {
        // ---- FILES ATTACHED: stage, leave, let the controller finish. ----
        const pendingId = await submit.stage({
          courseId: course.id,
          state: composer.state,
          mediaExpected,
        });
        submittedRef.current = true;
        notifyComposerCompleted();
        composer.clearDraft();

        // NOT AWAITED, and NO cache sweep here: nothing the app reads has
        // changed yet; a refetch now would show the old review as current.
        media.writeUploadedHolePhotos(holeJob);
        media.startBackgroundPublish(pendingId, { queryClient: qc, holeJob });

        onSuccess({
          ratingId: null,
          pending: true,
          uploadKey: media.uploadKey,
          shareToFeed: composer.state.shareToFeed,
          overall: composer.state.overall,
          scores: composer.state.scores,
        });
      }

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
        share_to_feed: composer.state.shareToFeed,
        staged: mediaExpected > 0,
        media_expected: mediaExpected,
        overall_touched: overallTouched,
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
      // R1 §1.3a — the silent `.catch(() => {})` that used to swallow the whole
      // flush is gone. Every failure in this function now ends in a sentence.
      toast.error(e instanceof Error ? e.message : "Couldn't save your review");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submit, media, composer, course.id, course.name, qc, isEditMode, mode, holeTags]);

  const overallCardRef = useRef<HTMLDivElement>(null);
  const scoreRowsRef = useRef<HTMLDivElement>(null);
  const [flaggedCategories, setFlaggedCategories] = useState<CategoryKey[]>([]);
  const [overallPulsing, setOverallPulsing] = useState(false);
  const pulseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (pulseTimer.current) clearTimeout(pulseTimer.current); }, []);
  const handlePrimary = useCallback(() => {
    if (submit.submitting) return;
    if (step === LAST_STEP) {
      const missing = missingScores(composer.state);
      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (missing.overall) {
        analyticsEvents.track('review_score_nudge', { missing: 'overall', count: 1 });
        if (overallCardRef.current) scrollElementIntoView(overallCardRef.current, { offset: 100, behavior: reduced ? 'auto' : 'smooth' });
        if (!reduced) {
          setOverallPulsing(true);
          if (pulseTimer.current) clearTimeout(pulseTimer.current);
          pulseTimer.current = setTimeout(() => setOverallPulsing(false), 600);
        }
        return;
      }
      if (missing.categories.length) {
        analyticsEvents.track('review_score_nudge', { missing: 'categories', count: missing.categories.length });
        setFlaggedCategories(missing.categories);
        const row = scoreRowsRef.current?.querySelector(`[data-score-category="${missing.categories[0]}"]`);
        if (row) scrollElementIntoView(row, { offset: 100, behavior: reduced ? 'auto' : 'smooth' });
        return;
      }
    }
    analyticsEvents.track('review_step_completed', {
      course_id: course.id, step, ms_on_step: Math.round(Date.now() - stepEnteredAtRef.current),
    });
    if (step === FIRST_STEP) composer.setStep(LAST_STEP);
    else void handleSubmit();
  }, [step, composer, course.id, handleSubmit, submit.submitting]);

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


  // Incomplete actions remain enabled: they guide, never implicitly score.
  const action = scoreAction(composer.state, isEditMode, submit.submitting);
  const buttonLabel = step === FIRST_STEP && !submit.submitting
    ? t('review.wizard.stepOne.continueToScore')
    : t(`review.wizard.${action.key}`, { count: action.count, category: action.category ? t(`review.subscore.${action.category}`) : undefined });

  /* THE FOOTER SUMMARY names what is actually there, and is omitted - never a
     placeholder - when there is nothing to name. */
  const hasWords = composer.state.reviewText.trim().length > 0;
  const hasAnyText = composer.state.reviewText.length > 0;
  /* THE EMPTY RULE (BRIEF_REVIEW_STEP_ONE §1). Photo header and heading only
     while step 1 holds nothing and nothing is under way; once anything starts
     the header folds and stays compact for the rest of the flow. */
  const photoForm = usePhotoHeaderForm({
    onFirstStep: step === FIRST_STEP,
    textLength: composer.state.reviewText.length,
    mediaCount: media.count,
    voiceActive,
    isEditMode,
  });
  useLayoutEffect(() => { onHeaderFormChange(photoForm); }, [photoForm, onHeaderFormChange]);
  const appendDictation = (text: string) => {
    const prev = composer.state.reviewText;
    const joiner = prev.length === 0 || /\s$/.test(prev) ? '' : ' ';
    composer.setReviewText(`${prev}${joiner}${text}`);
    setDictationFlashKey((k) => k + 1);
  };
  const hasMedia = media.count > 0;

  let footerSummary: string | null = null;
  if (step === FIRST_STEP) {
    const parts: string[] = [];
    if (hasMedia) {
      parts.push(
        t(`review.wizard.step2.${mediaCountKey(media.items)}`, { count: media.count }),
      );
    }
    if (hasWords) parts.push(t('review.wizard.step2.summaryWords'));
    if (parts.length > 0) {
      footerSummary = t('review.wizard.step2.summary', {
        what: parts.join(t('review.wizard.step2.summaryJoin')),
      });
    }
  }

  const existingRatings = ratingCountQ.data;
  const thresholdLine = existingRatings != null && existingRatings < subscoreMinRatings
    ? t('review.wizard.step3.threshold', { ordinal: ordinal(existingRatings + 1) }) : null;
  if (step === LAST_STEP) {
    const line = scoreFooter(composer.state, thresholdLine);
    footerSummary = line?.threshold ?? null;
  }
  // Step 1's empty-state skip remains; the score step has no path-changing skip.
  const skipLabel = step === FIRST_STEP && !hasMedia && !hasWords ? t('review.wizard.stepOne.skipToScore') : null;

  const cats: CategoryCopy[] = [
    { key: 'design', label: t('review.subscore.design'), hint: t('review.wizard.hint.design') },
    { key: 'condition', label: t('review.subscore.condition'), hint: t('review.wizard.hint.condition') },
    { key: 'clubhouse', label: t('review.subscore.clubhouse'), hint: t('review.wizard.hint.clubhouse') },
    { key: 'facilities', label: t('review.subscore.facilities'), hint: t('review.wizard.hint.facilities') },
  ];

  const region = [course.region, course.sub_country || course.country].filter(Boolean).join(', ');

  // The spacer cannot hold its own opinion about how tall the header is: it
  // measures the header's BOTTOM EDGE against its own TOP EDGE (which is
  // independent of its height) and reserves exactly the difference. That is
  // one derivation, correct in BOTH render contexts — it never has to know
  // whether .app-shell or the fixed header paid env(safe-area-inset-top).
  const headerRef = useRef<HTMLElement | null>(null);
  const spacerRef = useRef<HTMLDivElement | null>(null);
  const [spacerH, setSpacerH] = useState<number | null>(null);
  const [scoreFooterH, setScoreFooterH] = useState(0);
  useEffect(() => {
    const header = headerRef.current;
    const spacer = spacerRef.current;
    if (!header || !spacer) return;
    const read = () => {
      const overlap = header.getBoundingClientRect().bottom - spacer.getBoundingClientRect().top;
      setSpacerH(Math.max(0, Math.round(overlap)) + (photoForm ? 6 : RV2_HEADER_GAP));
    };
    read();
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(read) : null;
    ro?.observe(header);
    // Safe-area values can land after first paint on a cold launch.
    const timer = window.setTimeout(read, 300);
    window.addEventListener('resize', read);
    return () => {
      ro?.disconnect();
      window.clearTimeout(timer);
      window.removeEventListener('resize', read);
    };
  }, [photoForm]);


  return (

    <div
      style={{
        minHeight: '100vh',
        background: RV2.canvas,
        color: RV2.ink,
        display: 'flex',
        flexDirection: 'column',
        paddingBottom: step === LAST_STEP ? scoreFooterH : undefined,
      }}
    >
      {/* Header (BRIEF_REVIEW_STEP_ONE §1): photo while empty, compact after. */}
      <ReviewComposerHeader
        ref={headerRef}
        form={photoForm ? 'photo' : 'compact'}
        name={course.name}
        region={region}
        thumbnail={course.thumbnail_image}
        facts={headerFacts}
        courseId={course.id}
        courseRegion={course.region}
        subCountry={course.sub_country}
        country={course.country}
        leadingIsClose={leadingIsClose}
        onBack={handleBack}
        isEditMode={isEditMode}
        onDelete={() => setRemoveOpen(true)}
      />
      {/* THE RESERVATION for the FIXED header above.
          This page renders BOTH as a route at /courses/:courseId/rate inside
          .app-shell AND as a fixed overlay (position: fixed; inset: 0, the
          App.tsx backgroundLocation path) OUTSIDE it. The header is fixed and
          pays env(safe-area-inset-top) itself in both contexts; .app-shell
          additionally pays var(--sat) on the route path only. So "who paid the
          inset" has two different answers, and the old flat 69 assumed one of
          them — true on the route, false in the overlay, which is why the step
          strip vanished behind the header on any device with a notch.
          DO NOT REPLACE THIS WITH ARITHMETIC. The obvious instinct is
          `env(safe-area-inset-top) + 69 + 14`, and it is wrong: that is right
          in the OVERLAY (where only the header pays the inset) and wrong on the
          ROUTE (where .app-shell pays var(--sat) and the fixed header pays
          env(safe-area-inset-top) again, so the sum double-counts the notch).
          Any fixed number, or any sum, has to assume an answer to "who paid the
          inset" — and there are two answers on this one page, so the assumption
          drifts the moment the render context changes.
          The spacer therefore holds NO opinion of its own: it measures the
          header's bottom edge against its own top edge and reserves exactly
          the overlap plus the gap. That derivation needs no answer at all. The
          CSS value below is the first-paint fallback only (the header's full
          self-paid box), replaced on layout. */}
      <div
        ref={spacerRef}
        aria-hidden
        style={{
          height:
            spacerH != null
              ? `${spacerH}px`
              : `calc(${photoForm ? PHOTO_HEADER_H_CSS : RV2_HEADER_H_CSS} + ${photoForm ? 6 : RV2_HEADER_GAP}px)`,
          flexShrink: 0,
        }}
      />



      {/* THE SHARED COUNTER (phase 2 §3). The composer's own three-step strip -
          SCORE / BREAKDOWN / WORDS - is gone: it numbered a different flow and
          disagreed with step 1's counter at the boundary. ComposerStepHeader is
          the one implementation of "Step N of 3" and the segmented bar for the
          whole flow. left="none": the fixed header above already owns the one
          leading control (back arrow, or × when nothing is behind us), and two
          back buttons on one screen is a worse answer than a counter beneath. */}
      {step === FIRST_STEP && <ReviewStepHeading step={step - 1} total={REVIEW_TOTAL_STEPS - 1} />}

      {/* RESTORED EDIT DRAFT (_04 §1). Says so out loud, and offers the way back
          to the published version. Not amber: amber means the viewing member. */}
      {retryOfPendingId && (
        <div
          role="status"
          style={{
            margin: '0 16px 16px',
            padding: '12px 14px',
            border: `1px solid ${RV2.hairline}`,
            borderRadius: 12,
            fontSize: 12.5,
            lineHeight: 1.45,
            color: RV2.secondary,
          }}
        >
          {t('review.pending.retryNotice')}
        </div>
      )}

      {!retryOfPendingId && composer.restoredFromDraft && (
        <div
          role="status"
          style={{
            margin: '0 16px 16px',
            padding: '12px 14px',
            border: `1px solid ${RV2.hairline}`,
            borderRadius: 12,
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}
        >
          <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.10em', textTransform: 'uppercase', color: RV2.ink }}>
            {t('review.wizard.draftRestored.title')}
          </div>
          <div style={{ fontSize: 12.5, lineHeight: 1.45, color: RV2.secondary }}>
            {t('review.wizard.draftRestored.body')}
          </div>
          {/* WHAT IT COULD NOT KEEP (_05 §1). Named inside the same notice, so a
              member reading one sentence reads both. */}
          {restoredMediaLine && (
            <div style={{ fontSize: 12.5, lineHeight: 1.45, color: RV2.secondary }}>
              {restoredMediaLine}
            </div>
          )}
          <button
            type="button"
            onClick={composer.discardRestoredDraft}
            style={{
              alignSelf: 'flex-start',
              background: 'transparent',
              border: 'none',
              padding: 0,
              fontSize: 11.5,
              fontWeight: 700,
              letterSpacing: '0.10em',
              textTransform: 'uppercase',
              color: RV2.danger,
              cursor: 'pointer',
            }}
          >
            {t('review.wizard.draftRestored.discard')}
          </button>
        </div>
      )}

      {/* CREATE MODE (_05 §1). A create restore stays otherwise silent — there
          is no published version to differ from — but silence is exactly what
          made the media loss invisible, so the media sentence stands alone and
          is dismissible without discarding the words. */}
      {!retryOfPendingId && !composer.restoredFromDraft && restoredMediaLine && (
        <div
          role="status"
          style={{
            margin: '0 16px 16px',
            padding: '12px 14px',
            border: `1px solid ${RV2.hairline}`,
            borderRadius: 12,
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}
        >
          <div style={{ fontSize: 12.5, lineHeight: 1.45, color: RV2.secondary }}>
            {restoredMediaLine}
          </div>
          <button
            type="button"
            onClick={composer.acknowledgeRestoredMedia}
            style={{
              alignSelf: 'flex-start',
              background: 'transparent',
              border: 'none',
              padding: 0,
              fontSize: 11.5,
              fontWeight: 700,
              letterSpacing: '0.10em',
              textTransform: 'uppercase',
              color: RV2.secondary,
              cursor: 'pointer',
            }}
          >
            {t('review.wizard.draftRestored.mediaDismiss')}
          </button>
        </div>
      )}




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
        {t('review.wizard.a11yStepNumber', { n: step, m: REVIEW_TOTAL_STEPS })}
      </div>

      {/* ================= STEP 2 of 3 - PHOTOS AND A FEW WORDS =================
          TWO BLOCKS, NOT FOUR: the media tray, then the words. The tee row is
          gone (§7) and the share toggle has moved to step 3 (§6), where the
          footer can name it on the same screen as the button that sends it.

          THE PIPELINE IS PATH-SPECIFIC AND THE SHELL IS NOT. This layout is
          shared with the post path; its ENGINE is not. The review path renders
          review-v2's MediaTray over useReviewMediaPipeline /
          reviewUploadController, and the post path keeps its own tray and
          postUploadController. Different upload semantics, different retry
          behaviour, different cache sweeps - not to be unified or adapted. */}
      {step === FIRST_STEP && (
        <>
          {/* THE HEADING folds away with the photo header (§2). */}
          {photoForm && (
            <section data-step1-heading style={{ padding: '14px 20px 0' }}>
              <h1 style={{ fontSize: 24, fontWeight: 700, lineHeight: 1.15, margin: 0, color: '#F8FAFC' }}>
                {t('review.wizard.stepOne.headingStep1')}
              </h1>
              <p style={{ marginTop: 6, marginBottom: 0, fontSize: 13.5, color: 'rgba(248,250,252,0.62)' }}>
                {t('review.wizard.stepOne.ledeStep1')}
              </p>
            </section>
          )}

          {/* YOUR WORDS (§3). The box is always present; the Speak card sits above it. */}
          <section data-step1-words style={{ padding: '0 20px' }}>
            <div style={{ ...STEP1_HEADING, marginTop: photoForm ? 18 : 16 }}>
              {t('review.wizard.stepOne.wordsHeading')}
            </div>
            <div style={{ marginTop: 10 }}>
              <VoiceDictateButton
                idleVariant="hero"
                hasText={hasAnyText}
                onAppend={appendDictation}
                onActiveChange={setVoiceActive}
                onStart={() => {
                  // Analytics callsite: review_voice_started
                  analyticsEvents.track('review_voice_started', { has_text: hasAnyText });
                }}
              />
            </div>
            {!hasAnyText && (
              <div data-or-type-it aria-hidden style={{ margin: '14px 2px 0', display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
                <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.16em', color: 'rgba(248,250,252,0.42)' }}>
                  {t('review.wizard.stepOne.orTypeIt')}
                </span>
                <span style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
              </div>
            )}
            <div
              key={dictationFlashKey}
              data-step1-box
              style={{
                marginTop: hasAnyText ? 10 : 12,
                background: 'rgba(255,255,255,0.05)',
                // The flash keyframe cannot read a JS token, so the resting
                // colour is published to CSS as a custom property (§2.3).
                ['--rv2-flash-rest' as string]: 'rgba(255,255,255,0.05)',
                border: `1px solid ${hasAnyText ? 'rgba(255,255,255,0.20)' : 'rgba(255,255,255,0.12)'}`,
                borderRadius: 16,
                padding: '13px 14px',
                minHeight: hasAnyText ? 110 : 76,
                boxSizing: 'border-box',
                animation: dictationFlashKey > 0 ? 'rv2-dictation-flash 900ms ease-out' : 'none',
              }}
            >
              <style>{`
                @keyframes rv2-dictation-flash {
                  0%   { background-color: rgba(247,147,30,0.16); box-shadow: 0 0 0 2px rgba(247,147,30,0.28); }
                  100% { background-color: var(--rv2-flash-rest); box-shadow: 0 0 0 0 rgba(247,147,30,0); }
                }
                @media (prefers-reduced-motion: reduce) {
                  [data-rv2-flash="1"] { animation: none !important; }
                }
              `}</style>
              <MentionsComposerInput
                value={composer.state.reviewText}
                onChange={composer.setReviewText}
                placeholder={t('review.wizard.stepOne.typePlaceholder')}
                currentUserId={userId}
                textStyle={{
                  fontSize: 15,
                  // PX, NOT A FACTOR: a unitless line-height is computed per
                  // element, so the two layers can resolve it differently.
                  lineHeight: '22px',
                  minHeight: 44,
                  maxHeight: 260,
                  padding: '0',
                  color: '#F8FAFC',
                  caretColor: '#F8FAFC',
                  placeholderColor: 'rgba(248,250,252,0.42)',
                }}
              />
            </div>
          </section>

          {/* PHOTOS AND VIDEOS (§4). Tray chips open the existing tagging sheet. */}
          <section data-step1-photos style={{ padding: '0 20px' }}>
            <div style={{ marginTop: hasMedia || hasAnyText ? 18 : 22, marginBottom: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={STEP1_HEADING}>{t('review.wizard.stepOne.photosHeading')}</div>
              <div data-photos-count style={{ fontSize: 11.5, color: 'rgba(248,250,252,0.42)' }}>
                {hasMedia ? t('review.wizard.stepOne.photosCount', { n: media.count }) : t('review.wizard.stepOne.photosUpTo')}
              </div>
            </div>
            {/* R1 §1.3c — onRetry wired: with no reviewId the item returns to
                pending and the pending set re-uploads. */}
            <MediaTray
              appearance="step1"
              items={media.items}
              onPick={media.addFiles}
              onRemove={media.removeItem}
              onRetry={(id) => { void media.retryItem(id); }}
              pickerError={media.pickerError}
              onClearError={media.clearPickerError}
              emptyAside={holeTags.holes.length > 0 ? (
                <span data-hole-guide-hint style={{ fontSize: 12, lineHeight: 1.45, color: 'rgba(248,250,252,0.62)' }}>
                  {t('review.wizard.stepOne.holeGuideHint', { course: shortName })}
                </span>
              ) : null}
              renderChip={holeTags.holes.length > 0 ? (it) => {
                const hole = holeTags.assignments[it.id];
                const tagged = hole != null;
                return (
                  <button
                    type="button"
                    data-hole-chip={tagged ? 'tagged' : 'untagged'}
                    aria-label={tagged ? `Tagged to the ${ordinal(hole)}` : 'Tag hole'}
                    onClick={(e) => { e.stopPropagation(); setTagShotId(it.id); }}
                    style={{
                      position: 'absolute', left: 6, bottom: 6, height: 22, borderRadius: 7, padding: '0 7px',
                      border: 'none', display: 'inline-flex', alignItems: 'center', gap: 4,
                      fontSize: 10.5, fontWeight: 700, cursor: 'pointer', zIndex: 2,
                      background: tagged ? 'rgba(14,14,16,0.78)' : 'rgba(243,245,247,0.94)',
                      color: tagged ? '#F8FAFC' : '#0A0A0C',
                    }}
                  >
                    {tagged ? (
                      <>
                        <svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                          <path d="M5 21V4" />
                          <path d="M5 4h11l-2 4 2 4H5" />
                        </svg>
                        {ordinal(hole)}
                      </>
                    ) : t('review.wizard.stepOne.tagHole')}
                  </button>
                );
              } : undefined}
            />
          </section>

          <ReviewHoleTags
            {...holeTags}
            hideShotList
            focusShotId={tagShotId}
            onFocusClosed={() => setTagShotId(null)}
          />
        </>
      )}

      {/* Signed-off Step 2: the frozen compact/shared headers remain above. */}
      {step === LAST_STEP && (
        <div className="review-score-theme">
          <ReviewStepHeading step={step - 1} total={REVIEW_TOTAL_STEPS - 1} />
          <div ref={overallCardRef} className="review-overall-card" data-pulsing={overallPulsing}>
            <OverallScrubber value={composer.state.overall} onChange={composer.setOverall}
              caption={t('review.wizard.step3.rulerHint')} ariaLabel={t('review.wizard.step0.a11y')}
              calibration={calibration ? t(`review.wizard.step3.${calibration.ordinal === 1 ? 'calibrationFirst' : 'calibration'}`, {
                ordinal: ordinal(calibration.ordinal), count: calibration.total,
              }) : null} />
          </div>
          <ReviewCategoriesHeading scores={composer.state.scores} />
          <div ref={scoreRowsRef}>
            <CategoryGrid values={composer.state.scores} cats={cats} flagged={flaggedCategories}
              tapToScore={t('review.wizard.step3.tapToScore')} stillToScore={t('review.wizard.step3.stillToScore')}
              onChange={(key, value) => { composer.setCategory(key, value); setFlaggedCategories(old => old.filter(k => k !== key)); }} />
          </div>
        </div>
      )}

      {step !== LAST_STEP && <div style={{ flex: 1, minHeight: 16 }} />}

      <div className={step === LAST_STEP ? "review-score-theme" : undefined}>
      <SubmitBar
        appearance={step === FIRST_STEP ? 'step1' : 'score'}
        quiet={action.quiet}
        label={buttonLabel}
        enabled={!submit.submitting}
        onPress={handlePrimary}
        summary={footerSummary}
        onHeightChange={step === LAST_STEP ? setScoreFooterH : undefined}
        share={step === LAST_STEP ? <ShareToggle appearance="score" value={composer.state.shareToFeed} onChange={composer.setShareToFeed}
          title={t('review.wizard.step3.shareTitle')}
          sub={t(`review.wizard.step3.${scoreShareKey(media.count, hasWords)}`, { count: media.count })} /> : undefined}
        skipLabel={skipLabel}
        onSkip={skipLabel ? handlePrimary : undefined}
      />
      </div>

      {/* §1a: the one question before several paragraphs are thrown away. */}
      <DiscardDraftDialog
        open={exitGuard.confirmOpen}
        onKeepEditing={exitGuard.keepEditing}
        onDiscard={exitGuard.discard}
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
