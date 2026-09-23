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
 * THE COUNTER IS SHARED. ComposerStepHeader draws "Step N of 3" and the
 * segmented bar on every step of the flow, including these two; this file no
 * longer draws a step strip of its own, so a member crossing the sheet/route
 * boundary mid-flow cannot tell.
 *
 * All writes flow through the v2 RPCs - the client never touches
 * course_ratings, posts, notifications, user_courses, or
 * user_top10_exclusions directly.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { analyticsEvents } from '@/utils/analyticsEvents';
import { notifyComposerCompleted } from '@/features/composer-flow/composerFlowStore';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Trash2 } from 'lucide-react';
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
import { ShareToggle } from './components/ShareToggle';
import { SubmitBar } from './components/SubmitBar';
import { ReviewReceipt, ordinal } from './components/ReviewReceipt';
import { useMyRatedScores, calibrationRank } from './hooks/useMyRatedScores';

import { RemoveReviewSheetV2 } from './components/RemoveReviewSheetV2';
import type { CategoryKey, ExistingMedia, ExistingReview, ReviewV2Course } from './types';
import { RateCoursePageSkeleton } from '@/components/skeletons/RateCoursePageSkeleton';
import ComposerStepHeader from '@/features/composer-flow/components/ComposerStepHeader';
import { courseShortName } from '@/features/composer-flow/courseShortName';
import { useComposerFlowStore } from '@/features/composer-flow/composerFlowStore';
import { usePostStudioStore } from '@/stores/usePostStudioStore';
import { useTop100Config } from '@/hooks/top100/useTop100Config';

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


function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        /* READ floor. 10.5 -> 11. */
        fontSize: 11,
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

  // ONE fetch of the member's own overall ratings (this course excluded, so an
  // edit never ranks the member against themselves). The ordinal below is
  // computed client-side on every drag - no query per drag.
  const myRatedQ = useMyRatedScores(userId, course.id);
  const calibration = calibrationRank(composer.state.overall, myRatedQ.data);


  const [removeOpen, setRemoveOpen] = useState(false);

  const [dictationFlashKey, setDictationFlashKey] = useState(0);

  const step = composer.step;
  const shortName = courseShortName(course.name);

  /* DID STEP 1 PUT US HERE? A member who came through the tiles has a step to
     go BACK to, and backing out returns them to it (the phase 1 handoff record
     reopens the sheet). A member who arrived through /courses/:id/rate, a
     course page, or an edit has no step behind them, so their leading control
     is a CLOSE, not a back arrow that would go somewhere they never were. */
  const cameFromStepOne = useComposerFlowStore((st) => st.handoff != null);
  const handoffReturnPath = useComposerFlowStore((st) => st.handoff?.returnPath ?? null);
  const openPostStudio = usePostStudioStore((st) => st.openPostStudio);
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
    /* The dial DISPLAYS 9.0 from the moment step 3 opens, so "there is a score"
       is no longer evidence the member put anything in. The touched flag is. */
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
  const overallTouchedAtSubmitRef = useRef<boolean | null>(null);
  const handleSubmit = useCallback(async () => {
    const overallTouched = overallTouchedAtSubmitRef.current ?? composer.overallTouched;
    overallTouchedAtSubmitRef.current = null;
    try {
      const mediaExpected = media.pendingMediaCount();

      if (mediaExpected === 0) {
        // ---- NO NEW FILES: today's path, unchanged, and still instant. ----
        const { ratingId } = await submit.submit({
          courseId: course.id,
          state: composer.state,
        });
        submittedRef.current = true;
        notifyComposerCompleted();
        composer.clearDraft();

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
        media.startBackgroundPublish(pendingId, { queryClient: qc });

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
  }, [submit, media, composer, course.id, course.name, qc, isEditMode, mode]);

  const handlePrimary = useCallback(() => {
    if (step === FIRST_STEP) {
      // review_step_completed
      analyticsEvents.track('review_step_completed', {
        course_id: course.id,
        step,
        ms_on_step: Math.round(Date.now() - stepEnteredAtRef.current),
      });
      composer.setStep(LAST_STEP);
      return;
    }
    analyticsEvents.track('review_step_completed', {
      course_id: course.id,
      step,
      ms_on_step: Math.round(Date.now() - stepEnteredAtRef.current),
    });
    // Captured BEFORE the confirm press flips it, for review_submitted.
    overallTouchedAtSubmitRef.current = composer.overallTouched;
    if (!composer.overallTouched) {
      // Pressing a button that names the score IS setting the score.
      // setOverall writes the same value and marks it touched, so the
      // draft, the analytics and the submitted row all agree.
      composer.setOverall(composer.state.overall ?? 9);
    }
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
  // The dial no longer blocks the button: an untouched dial is confirmed by
  // the press itself ("Post at 9.0"). The four categories are still required.
  // composer.ratingGate is left untouched for anything else that reads it.
  const gateMet = step === FIRST_STEP ? composer.wordsGate : composer.catsSet === 4;
  const remaining = 4 - composer.catsSet;
  const confirmScore = (composer.state.overall ?? 9).toFixed(1);

  /* LABELS, IN ORDER: categories outstanding are counted; an untouched dial
     names the score the press will commit; only then the plain submit. */
  let buttonLabel: string;
  if (submit.submitting) {
    buttonLabel = isEditMode ? t('review.wizard.saving') : t('review.wizard.posting');
  } else if (step === FIRST_STEP) {
    buttonLabel = t('review.wizard.continue');
  } else if (remaining > 0) {
    buttonLabel = t('review.wizard.step3.catsGate', { count: remaining });
  } else if (!composer.overallTouched) {
    buttonLabel = isEditMode
      ? t('review.wizard.step3.confirmSave', { score: confirmScore })
      : t('review.wizard.step3.confirmPost', { score: confirmScore });
  } else {
    buttonLabel = isEditMode ? t('review.wizard.save') : t('review.wizard.step3.submit');
  }

  /* THE FOOTER SUMMARY names what is actually there, and is omitted - never a
     placeholder - when there is nothing to name. */
  const hasWords = composer.state.reviewText.trim().length > 0;
  const hasMedia = media.count > 0;

  let footerSummary: string | null = null;
  if (step === FIRST_STEP) {
    const parts: string[] = [];
    if (hasMedia) {
      parts.push(
        media.count === 1
          ? t('review.wizard.step2.summaryPhoto', { count: 1 })
          : t('review.wizard.step2.summaryPhotos', { count: media.count }),
      );
    }
    if (hasWords) parts.push(t('review.wizard.step2.summaryWords'));
    if (parts.length > 0) {
      footerSummary = t('review.wizard.step2.summary', {
        what: parts.join(t('review.wizard.step2.summaryJoin')),
      });
    }
  } else if (composer.state.overall != null) {
    footerSummary =
      t('review.wizard.step3.summary', {
        course: shortName,
        score: composer.state.overall.toFixed(1),
      }) + (composer.state.shareToFeed ? t('review.wizard.step3.summaryShare') : '');
  }

  /* THE THRESHOLD LINE. Shown only while this course is still short of
     t100_subscore_min_ratings, naming where the member's rating lands and what
     it unlocks. Never a placeholder: no count, no line. */
  const existingRatings = ratingCountQ.data;
  const thresholdLine =
    existingRatings != null && existingRatings < subscoreMinRatings
      ? t('review.wizard.step3.threshold', { ordinal: ordinal(existingRatings + 1) })
      : null;

  /* THE TWO SKIP LINKS.
     STEP 2: shown only when the member has attached nothing and typed nothing —
     passing with nothing is deliberate, so the link names what they get.
     STEP 3: "post without rating it" changes PATH rather than skipping a field,
     so it is never offered in EDIT MODE — a member editing a review they have
     already published is not choosing between a review and a post. */
  const step3Skip = step === LAST_STEP && !isEditMode;
  const skipLabel = step3Skip
    ? t('review.wizard.step3.skipToPost')
    : step === FIRST_STEP && !hasMedia && !hasWords
      ? t('review.wizard.step2.skip')
      : null;

  /* CARRYING THE WORK ACROSS (§6). The local Files go over INTACT — the same
     File objects the pipeline is holding, not copies and not re-encodes — so the
     post composer's own pipeline receives exactly what the member picked. Items
     WITHOUT a `file` are server media, which exist only in edit mode, and this
     link is not offered there.
     The review draft for this course is cleared: a member who chose not to write
     a review must not be offered a restore of one later. */
  const handleSkipToPost = useCallback(() => {
    const files = media.items.map((it) => it.file).filter((f): f is File => !!f);
    // Analytics callsite: review_skipped_to_post
    analyticsEvents.track('review_skipped_to_post', {
      media_count: files.length,
      text_len: composer.state.reviewText.trim().length,
    });
    composer.clearDraft();
    openPostStudio({
      media: files,
      caption: composer.state.reviewText,
      entry: 'review_skip',
      // The page step 1 was opened from, so closing the post composer lands
      // where the flow began rather than back on the rate route.
      returnPath: handoffReturnPath ?? '/',
    });
  }, [media.items, composer, openPostStudio, handoffReturnPath]);

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
  useEffect(() => {
    const header = headerRef.current;
    const spacer = spacerRef.current;
    if (!header || !spacer) return;
    const read = () => {
      const overlap = header.getBoundingClientRect().bottom - spacer.getBoundingClientRect().top;
      setSpacerH(Math.max(0, Math.round(overlap)) + RV2_HEADER_GAP);
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
  }, []);


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
        ref={headerRef}

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
            aria-label={leadingIsClose ? t('review.wizard.closeA11y') : t('review.wizard.backA11y')}
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
            {leadingIsClose ? '\u00D7' : '\u2039'}
          </button>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: 15,
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
            <div style={{ fontSize: 12, color: RV2.secondary }}>{region}</div>
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
                color: RV2.danger,
              }}
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
      </header>
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
              : `calc(${RV2_HEADER_H_CSS} + ${RV2_HEADER_GAP}px)`,
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
      <ComposerStepHeader step={step} total={REVIEW_TOTAL_STEPS} left="none" />

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
              {t('review.wizard.step2.heading')}
            </h1>
            <p style={{ fontSize: 14, color: RV2.secondary, lineHeight: 1.5, margin: 0 }}>
              {t('review.wizard.step2.lede', { course: shortName })}
            </p>
          </section>

          <section style={{ padding: '0 16px 16px' }}>
            <Eyebrow>{t('review.wizard.step2.photosEyebrow')}</Eyebrow>
            {/* R1 §1.3c — onRetry was never passed, so a failed tile's Retry
                was a button that did nothing. Wired: with no reviewId the item
                returns to pending and the pending set re-uploads. */}
            <MediaTray
              items={media.items}
              onPick={media.addFiles}
              onRemove={media.removeItem}
              onRetry={(id) => { void media.retryItem(id); }}
              pickerError={media.pickerError}
              onClearError={media.clearPickerError}
            />
          </section>

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
                  /* READ floor. 10.5 -> 11. */
                  fontSize: 11,
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
                background: RV2.cardBg,
                // The flash keyframe cannot read a JS token, so the resting
                // colour is published to CSS as a custom property (§2.3).
                ['--rv2-flash-rest' as string]: RV2.cardBg,
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
                  100% { background-color: var(--rv2-flash-rest); box-shadow: 0 0 0 0 rgba(247,147,30,0); }
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
                  /* YOUR WORDS is PINNED here, not inherited. 14 -> 15 so the
                     review composer sits at the floor alongside the comment
                     composer (15, inherited) and the post caption (16/17). */
                  fontSize: 15,
                  lineHeight: '1.55',
                  minHeight: 72,
                  maxHeight: 260,
                  padding: '0',
                  color: RV2.ink,
                  caretColor: RV2.ink,
                  /* The only consumer that was not passing one — the shared
                     component's default is the canonical dark tier anyway, but
                     three composers should not disagree about whether they
                     state it (MICRO_BRIEF_MENTIONS_COMPOSER_BROKEN §4). */
                  placeholderColor: 'rgba(255,255,255,0.38)',
                }}
              />
            </div>
          </section>
        </>
      )}

      {/* ================= STEP 3 of 3 - THE RATING =================
          The dial and the breakdown are ONE screen now, with the live feedback
          between them and the share row at the foot. */}
      {step === LAST_STEP && (
        <>
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
              {t('review.wizard.step3.heading')}
            </h1>
            <p style={{ fontSize: 14, color: RV2.secondary, lineHeight: 1.5, margin: '0 0 16px' }}>
              {t('review.wizard.step3.lede', { course: shortName })}
            </p>
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
                muted={!composer.overallTouched}
                caption={composer.overallTouched
                  ? t('review.wizard.step3.caption')
                  : t('review.wizard.step3.captionUntouched', { score: (composer.state.overall ?? 9).toFixed(1) })}
                ariaLabel={t('review.wizard.step0.a11y')}
              />

              {/* LIVE FEEDBACK — both conditional, neither invented. A hairline
                  separates it from the dial; nothing renders at all when neither
                  condition is met. */}
              {(calibration || thresholdLine) && (
                <div
                  style={{
                    marginTop: 16,
                    paddingTop: 14,
                    borderTop: `1px solid ${RV2.hairline}`,
                    display: 'grid',
                    gap: 6,
                  }}
                >
                  {calibration && (
                    <div style={{ fontSize: 13, lineHeight: 1.45, color: RV2.success }}>
                      {t('review.wizard.step0.calibration', {
                        ordinal: ordinal(calibration.ordinal),
                        count: calibration.total,
                      })}
                    </div>
                  )}
                  {thresholdLine && (
                    <div style={{ fontSize: 13, lineHeight: 1.45, color: RV2.success }}>
                      {thresholdLine}
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>

          <section style={{ padding: '0 16px 16px' }}>
            <Eyebrow>{t('review.wizard.step3.breakdownLabel')}</Eyebrow>
            <p
              style={{
                fontSize: 13,
                color: RV2.secondary,
                lineHeight: 1.55,
                margin: '0 0 16px',
              }}
            >
              {t('review.wizard.step3.breakdownBody')}
            </p>
            <CategoryGrid
              values={composer.state.scores}
              onChange={composer.setCategory}
              cats={cats}
            />
          </section>

          {/* SHARE — ONE ROW, not a card, and the sub-line says what will
              actually appear: a review when there are words or photographs, a
              bare rating when there are neither. Default ON: 38% of all posts on
              the platform come from this toggle. It is no longer a surprise
              because the footer names it and the button says SUBMIT REVIEW. */}
          <section style={{ padding: '0 16px 8px' }}>
            <div style={{ borderTop: `1px solid ${RV2.hairline}` }}>
              <ShareToggle
                value={composer.state.shareToFeed}
                onChange={composer.setShareToFeed}
                bare
                title={t('review.wizard.step3.shareTitle')}
                sub={
                  hasWords || hasMedia
                    ? t('review.wizard.step3.shareSubReview')
                    : t('review.wizard.step3.shareSubRatingOnly')
                }
              />
            </div>
          </section>
        </>
      )}

      <div style={{ flex: 1, minHeight: 16 }} />

      <SubmitBar
        label={buttonLabel}
        enabled={gateMet && !submit.submitting}
        onPress={handlePrimary}
        summary={footerSummary}
        skipLabel={skipLabel}
        onSkip={!skipLabel ? undefined : step3Skip ? handleSkipToPost : handlePrimary}
      />

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
