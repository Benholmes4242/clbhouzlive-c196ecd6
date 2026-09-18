/**
 * RoundDetailSheet — handicap round drill-in.
 *
 * Thin wrapper around the canonical CardScorecardSheet ("The Card").
 * The dedicated route opts into page presentation; all other callers use the
 * floating glass overlay. `variant` remains ignored for compatibility.
 */

import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { CardScorecardSheet } from '@/features/courses/_shared/scorecard/CardScorecardSheet';
import type { HonoursFeat } from '@/features/courses/_shared/scorecard/honoursTreatment';
import { useRoundDetail, useWhsCourseId } from '@/lib/whs/hooks';
import { useRoundCourseContext } from '@/lib/whs/useRoundCourseContext';
import { useCourseHoleField } from '@/hooks/gam/useCourseHoleField';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useWhsConnection } from '@/lib/whs/hooks';
import { resolveDisplayHandicap } from '@/lib/handicap/resolveHandicap';
import type { WhsScoreHole } from '@/lib/whs/types';
import { fmtDateEyebrow } from './roundDateEyebrow';
import { usePostStudioStore } from '@/stores/usePostStudioStore';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { analyticsEvents } from '@/utils/analyticsEvents';
import { useContentReactions } from '@/components/explore-tab-new/courseled/hooks/useContentReactions';
import { useRoundPostComments } from '@/components/explore-tab-new/courseled/hooks/useRoundPostComments';
import { CommentsSheetV2 } from '@/features/comments-v2/CommentsSheetV2';
import { supabase } from '@/integrations/supabase/client';
import { coursePlaceLine } from '@/features/explore-magazine/placeLine';
import { useCardOpenGate, useCoalescedBlocks } from '@/hooks/useCardOpenGate';
import { useFeedCommentPreview } from '@/hooks/feed/useFeedCommentPreview';

function strokesOf(h: WhsScoreHole): number | null {
  return h.adjusted_gross ?? h.actual_gross ?? null;
}

/* The date line moved to ./roundDateEyebrow so the swipe preview prints it
   through the same function. Behaviour unchanged. */

/**
 * BRIEF_ROUND_SHEET §1.3 — THE SEED.
 *
 * The feed has already read every hole of this round (useRoundHoleShapes), so
 * the sheet has no reason to show a skeleton where the card goes. A seed is the
 * feed's own copy of the round, and its strokes MUST be built with the sheet's
 * rule (adjusted_gross ?? actual_gross) so the figure cannot change under the
 * member when the fetch lands. Only the "at this course" section, which the
 * feed genuinely does not have, keeps its skeleton.
 */
export interface RoundDetailSeed {
  scoreId: string;
  holes: { holeNo: number; par: number | null; strokes: number | null }[];
  gross: number | null;
  toPar: number | null;
  courseName: string;
  placeLine?: string | null;
  playerName?: string | null;
  playerAvatarUrl?: string | null;
  playDate?: string | null;
}

/** A seed draws the card only when it is a WHOLE round: nine or eighteen holes,
 *  every one of them scored. Anything less falls back to today's skeleton. */
export function seedIsWhole(seed: RoundDetailSeed | null | undefined): boolean {
  if (!seed) return false;
  const n = seed.holes.length;
  if (n !== 9 && n !== 18) return false;
  return seed.holes.every((h) => h.strokes != null && h.strokes > 0 && h.par != null);
}

interface Props {
  open: boolean;
  onClose: () => void;
  scoreId?: string | null;
  handicapDelta?: number | null;
  connectionId?: string | null;
  profileUserId?: string | null;
  /** IGNORED — sheet is always light. Kept for back-compat. */
  variant?: 'dark' | 'light';
  /** Dedicated route host; overlays remain the default. */
  presentation?: 'overlay' | 'page';
  /** §1.3 — the feed's own copy of this round, so the card is instant. */
  seed?: RoundDetailSeed | null;
  onHorizontalDrag?: {
    onStart: () => void;
    onMove: (dx: number) => void;
    onEnd: (dx: number, velocity: number) => void;
  } | null;
  onStatsSeen?: () => void;
  /** §2.2 — the host's page offset while swiping between rounds. */
  pageShift?: { dx: number; opacity?: number; animating: boolean } | null;
  /** BRIEF_ROUND_SHEET_PEEK §1 — the neighbour drawn beside this page. */
  pagePreview?: { node: React.ReactNode; side: 'next' | 'prev' } | null;
  /** §3 — the hidden-but-focusable pager, the arrow keys and the announcement. */
  paging?: React.ComponentProps<typeof CardScorecardSheet>['paging'];
  /**
   * Open with the comments already up. A comment notification on a round has to
   * land on the comment, exactly as a comment on a normal post does
   * (?openComments=1 on /round/:whsScoreId). Absent keeps today's behaviour.
   */
  initialCommentsOpen?: boolean;
}

export const RoundDetailSheet: React.FC<Props> = ({
  open, onClose, scoreId, handicapDelta, profileUserId, presentation = 'overlay',
  seed = null, onHorizontalDrag = null, onStatsSeen,
  pageShift = null, pagePreview = null, paging = null,
  initialCommentsOpen = false,
}) => {
  const navigate = useNavigate();
  const { t } = useTranslation('courses');
  const { user } = useSupabaseSession();
  const openPostStudioForCourse = usePostStudioStore((st) => st.openPostStudioForCourse);
  const userQuery = useRoundDetail(scoreId, open);
  const userData = userQuery.data;
  // SETTLED IS NOT "NOT LOADING". useRoundDetail is id-gated, so a disabled
  // query reports isLoading:false BEFORE it has ever run. Only `isFetched`
  // tells us the database has actually answered. With no scoreId at all the
  // query can never run — that is genuinely unreadable, so treat it as settled.
  const roundSettled = !scoreId ? true : userQuery.isFetched;
  const isRoundLoading = !roundSettled;


  const profileQuery = useUserProfile(profileUserId ?? undefined);
  const profile = profileQuery.data;
  const { data: whsConn } = useWhsConnection(profileUserId ?? undefined);

  const courseIdQuery = useWhsCourseId(
    userData?.course?.name ?? null,
    (userData?.course as { country_code?: string | null } | null | undefined)?.country_code ?? null,
    open,
  );

  // Member enrichment — the member's own history at this course, and the
  // per-hole field average that powers the trajectory comparison and scrub.
  const contextQuery = useRoundCourseContext(scoreId, open);
  const ctx = contextQuery.data ?? null;
  const analysisCourseId = ctx?.course_id ?? courseIdQuery.data ?? undefined;
  const canonicalCourseQuery = useQuery({
    queryKey: ['scorecard-canonical-course', analysisCourseId],
    enabled: open && !!analysisCourseId,
    staleTime: 24 * 60 * 60 * 1000,
    queryFn: async () => {
      if (!analysisCourseId) return null;
      const { data, error } = await supabase
        .from('golf_courses')
        .select('id, name, region, sub_country, country')
        .eq('id', analysisCourseId)
        .maybeSingle();
      if (error) return null;
      return data as {
        id: string;
        name: string;
        region: string | null;
        sub_country: string | null;
        country: string | null;
      } | null;
    },
    retry: false,
  });
  /**
   * §D3 — THE FIELD EXCLUDES THE ROUND'S OWNER, NOT THE VIEWER.
   *
   * The subject of this card is `profileUserId`, the member whose round it is,
   * so that is the id passed as `p_exclude_user_id`. Passing the signed-in
   * viewer instead would compare David against a field containing David and
   * missing Ben — the same fault in reverse, and it would look plausible.
   *
   * get_course_hole_field replaces get_course_hole_analysis here: the analysis
   * function includes every player, so the old field average included the
   * member it was being compared with. The scorecard FIELD row has been removed,
   * but this read remains live for the independent beat-the-field trajectory
   * comparison and its five-player gate. available:false ('unauthenticated' or
   * 'no_whs_mapping') means NO FIELD; an empty field is a structured object with
   * course_players 0, so the count is what is branched on, never null.
   */
  const analysisQuery = useCourseHoleField(
    open ? analysisCourseId : undefined,
    profileUserId ?? undefined,
  );
  const fieldPlayers = analysisQuery.data?.available
    ? (analysisQuery.data.course_players ?? 0)
    : null;
  const fieldByHole = useMemo(() => {
    const m = new Map<number, number>();
    const a = analysisQuery.data;
    if (!a?.available) return m;
    for (const h of a.holes ?? []) {
      if (h.avg_gross != null) m.set(h.hole_no, Number(h.avg_gross));
    }
    return m;
  }, [analysisQuery.data]);

  const sortedHoles = useMemo(() => {
    if (!userData?.holes) return [] as WhsScoreHole[];
    return [...userData.holes].sort((a, b) => a.hole_no - b.hole_no);
  }, [userData]);

  const cardHoles = useMemo(
    () => sortedHoles.map((h) => ({
      holeNo: h.hole_no,
      par: h.par ?? null,
      strokes: strokesOf(h),
      fieldAvg: fieldByHole.get(h.hole_no) ?? null,
    })),
    [sortedHoles, fieldByHole],
  );

  /**
   * §1.3 — THE SEED DRAWS THE CARD WHILE THE QUERY IS UNSETTLED.
   * It is used ONLY when the round has not answered yet AND the seed is a whole
   * round for THIS score. Once the fetch lands the fetched holes take over — and
   * because both sides use `adjusted_gross ?? actual_gross`, nothing visibly
   * changes. In DEV a per-hole disagreement is logged with the score id.
   */
  const seedUsable = seedIsWhole(seed) && seed?.scoreId === scoreId;
  const usingSeed = !roundSettled && seedUsable;
  const seedCardHoles = useMemo(
    () => (seedUsable && seed
      ? seed.holes
          .slice()
          .sort((a, b) => a.holeNo - b.holeNo)
          .map((h) => ({ holeNo: h.holeNo, par: h.par, strokes: h.strokes, fieldAvg: null }))
      : []),
    [seedUsable, seed],
  );
  useEffect(() => {
    if (!import.meta.env.DEV) return;
    if (!seedUsable || !seed || !roundSettled || cardHoles.length === 0) return;
    const fetched = new Map(cardHoles.map((h) => [h.holeNo, h.strokes]));
    for (const h of seed.holes) {
      if (!fetched.has(h.holeNo)) continue;
      if (fetched.get(h.holeNo) !== h.strokes) {
        console.warn('[RoundDetailSheet] seed/fetched stroke mismatch', {
          score_id: scoreId, hole_no: h.holeNo, seed: h.strokes, fetched: fetched.get(h.holeNo),
        });
      }
    }
  }, [seedUsable, seed, roundSettled, cardHoles, scoreId]);

  const shownHoles = usingSeed ? seedCardHoles : cardHoles;

  /* THE FEAT IS READ FROM THE CARD, NOT PASSED IN (BRIEF_DISCOVER_FILTER_LED_BOARD
     S5.6). The holes already say whether this round holds an ace or an
     albatross, so every one of the sheet's callers gets the honours band without
     plumbing a prop through eight surfaces. Albatross outranks the ace. */
  const feat = useMemo<HonoursFeat | null>(() => {
    let ace = false;
    for (const h of shownHoles) {
      if (h.strokes == null) continue;
      if (h.par != null && h.strokes - h.par <= -3) return 'albatross';
      if (h.strokes === 1) ace = true;
    }
    return ace ? 'ace' : null;
  }, [shownHoles]);


  const totalPar = sortedHoles.reduce((a, h) => a + (h.par ?? 0), 0);

  const grossVal = userData
    ? (userData.adjusted_gross ?? userData.actual_gross ?? null)
    : null;
  const toParVal = (grossVal != null && totalPar > 0) ? grossVal - totalPar : null;
  // 'unavailable' stays reachable — but only once the query HAS run and
  // returned nothing (deleted score, or RLS-blocked for this viewer).
  const emptyVariant: 'syncing' | 'nohbh' | 'unavailable' =
    !roundSettled
      ? 'syncing'
      : userData == null
        ? 'unavailable'
        : userData.hole_by_hole_fetched
          ? 'nohbh'
          : 'syncing';


  const eyebrowText = fmtDateEyebrow(userData?.play_date ?? (usingSeed ? seed?.playDate : null));
  const canonicalCourse = canonicalCourseQuery.data ?? null;
  const courseName = canonicalCourse?.name ?? userData?.course?.name ?? (usingSeed ? seed?.courseName ?? '' : '');
  const courseLocation = canonicalCourse
    ? coursePlaceLine({
        region: canonicalCourse.region,
        subCountry: canonicalCourse.sub_country,
        country: canonicalCourse.country,
      })
    : (userData?.course as { country_name?: string | null } | null | undefined)?.country_name
      ?? (usingSeed ? seed?.placeLine ?? null : null);
  const coursePar = totalPar > 0 ? totalPar : null;
  const courseSlope = (userData as { slope_rating?: number | null } | null | undefined)?.slope_rating ?? null;



  const displayName = profile?.display_name ?? profile?.username ?? (usingSeed ? seed?.playerName ?? '' : '');
  const playerHcp = profile?.show_handicap === false
    ? null
    : resolveDisplayHandicap({
        egHandicapIndex: (profile as { eg_handicap_index?: number | null } | null | undefined)?.eg_handicap_index ?? null,
        manualHandicapIndex: (profile as { manual_handicap_index?: number | null } | null | undefined)?.manual_handicap_index ?? null,
        hasWhsConnection: !!whsConn,
      }).value;

  // "View profile" means the member's CLUBHOUSE profile page - never the
  // handicap page, and never the signed-out handicap login. Identity
  // resolution (compare / nudge / invite) is a different action.
  const profileUsername = profile?.username ?? null;
  const onViewProfile = profileUsername
    ? () => { onClose(); navigate(`/profile/${profileUsername}`); }
    : undefined;

  const onViewCourse = courseIdQuery.data
    ? () => { onClose(); navigate(`/courses/${courseIdQuery.data}`); }
    : undefined;

  // C3 — "Share this round". Offered only on the viewer's OWN round, and only
  // once the course has resolved (a post needs the course tag to carry the
  // round). Opens the composer pre-filled with both.
  const shareCourseId = courseIdQuery.data ?? null;
  const isOwnRound = !!user?.id && !!profileUserId && user.id === profileUserId;
  const onShareRound = (isOwnRound && shareCourseId && scoreId && courseName)
    ? () => {
        analyticsEvents.track('round_share_opened', {
          whs_score_id: scoreId,
          course_id: shareCourseId,
        });
        onClose();
        openPostStudioForCourse({
          course: { id: shareCourseId, name: courseName, country: courseLocation },
        });
      }
    : undefined;

  /**
   * ENGAGEMENT (BRIEF_ROUND_COMMENTS_EVERYWHERE §S2.2). The like is the SAME
   * content_reactions row Discover writes — the hook patches every cache window
   * holding this score id, so the heart agrees the moment either surface moves.
   * The comment target is the round's post, resolved through the one-to-one
   * whs_score_id mapping; with no post there is no comment control.
   */
  const scoreIdList = useMemo(() => (scoreId ? [scoreId] : []), [scoreId]);
  const roundPosts = useRoundPostComments(scoreIdList);
  const postInfo = roundPosts.infoFor(scoreId);
  const previewPostIds = useMemo(
    () => (postInfo?.postId && postInfo.commentCount > 0 ? [postInfo.postId] : []),
    [postInfo?.postId, postInfo?.commentCount],
  );
  const commentPreviews = useFeedCommentPreview(previewPostIds, 'round-scorecard');
  const reactions = useContentReactions(
    useMemo(
      () => (scoreId ? [{ type: 'round' as const, id: scoreId }] : []),
      [scoreId],
    ),
    { postIdFor: () => postInfo?.postId ?? null },
  );
  /**
   * G2.2 — THE SUBJECT GATE. The hole rows ARE the scorecard, so the card does
   * not open without them and no cap can drop them. With a whole seed from the
   * feed the subject is ready in the same tick, so this never waits there; it
   * only waits where there is no seed, which is where waiting is correct.
   *
   * G2.3 — everything else is SUPPORTING. It is never excluded, only late: the
   * 900ms cap decides whether the card waits for it before opening, and
   * useCoalescedBlocks applies whatever arrives afterwards in ONE settle.
   */
  const supporting = useMemo(
    () => ({
      context: !scoreId || contextQuery.isFetched,
      reactions: reactions.isSettled,
      comments: roundPosts.isSettled,
      /**
       * G4.1(b) — A READINESS KEY MUST BE HONEST. The preview read is disabled
       * when the post has no comments, so that id never enters settledIds; a
       * key that can never become true holds the cap open on every open. A
       * query that is not asked is trivially SETTLED.
       */
      commentPreview: !postInfo?.postId
        || postInfo.commentCount === 0
        || commentPreviews.isSettled(postInfo.postId),
      field: !analysisCourseId || analysisQuery.isFetched,
    }),
    [scoreId, contextQuery.isFetched, reactions.isSettled, roundPosts.isSettled, postInfo?.postId, postInfo?.commentCount, commentPreviews, analysisCourseId, analysisQuery.isFetched],
  );
  const overlayGate = useCardOpenGate('scorecard', open && presentation === 'overlay', {
    subject: shownHoles.length > 0 || roundSettled,
    supporting,
  });
  const cardOpen = presentation === 'page' ? open : open && overlayGate.visible;
  const coalesced = useCoalescedBlocks(supporting, overlayGate.visible);
  const include = presentation === 'page'
    ? { context: true, reactions: true, comments: true, commentPreview: true, field: true }
    : coalesced;
  /**
   * G4.1(a) — NOTHING IS DROPPED. `include` drives settleKey only, so the
   * height animation knows when a coalesced arrival happened; every block
   * renders from live data the moment it is in hand.
   */
  const [commentsOpen, setCommentsOpen] = useState(initialCommentsOpen);
  useEffect(() => {
    if (open) setCommentsOpen(initialCommentsOpen);
  }, [open, initialCommentsOpen, scoreId]);

  const engagement = scoreId
    ? {
        likeHidden: !reactions.viewerId || reactions.unavailable,
        likeCount: reactions.stateFor('round', scoreId).count,
        likeMine: reactions.stateFor('round', scoreId).mine,
        onToggleLike: () => reactions.toggle('round', scoreId),
        likeLabel: t('discover.reactions.action', 'Like this round'),
        postId: postInfo?.postId ?? null,
        commentPreview: postInfo?.postId
          ? commentPreviews.map.get(postInfo.postId) ?? null
          : null,
        comment: postInfo
          ? {
              count: postInfo.commentCount,
              label: t('discover.comments.action', 'Comment on this round'),
              onOpen: () => setCommentsOpen(true),
            }
          : null,
      }
    : null;
  const settleKey = Object.keys(include)
    .sort()
    .map((key) => `${key}:${(include as Record<string, boolean>)[key] ? 1 : 0}`)
    .join(',');

  return (
    <>
    <CardScorecardSheet
      open={cardOpen}
      onClose={onClose}
      eyebrowText={eyebrowText}
      courseName={courseName}
      courseLocation={courseLocation}
      coursePar={coursePar}
      courseSlope={courseSlope}
      holes={shownHoles}
      holesSettled={shownHoles.length > 0 || roundSettled}
      settleKey={settleKey}
      feat={feat}
      nineHole={!!userData?.is_nine_hole}
      /* §1.3 — A SEEDED CARD NEVER SHOWS THE SKELETON. Without a seed the
         behaviour is exactly today's. */
      loading={false}
      surface="member"
      courseContext={ctx ? {
        yourAvgToPar: ctx.your_avg_to_par,
        avgToParOthers: ctx.avg_to_par_others,
        roundsHere: ctx.rounds_here,
        rankHere: ctx.rank_here,
        /* §C — the index this round was played off, straight from the provider's
           score record. No new query: userQuery already carries it. Null stays
           null; the sheet omits the figure rather than showing today's index. */
        indexAtTime: userData?.handicap_index_at_time ?? null,
      } : null}
      playerName={displayName}
      playerAvatarUrl={profile?.profile_photo_url ?? (usingSeed ? seed?.playerAvatarUrl ?? null : null)}
      playerHcp={playerHcp}
      playerHcpDelta={handicapDelta ?? null}
      playerUserId={profileUserId ?? null}
      subjectIsViewer={isOwnRound}
      fieldPlayers={fieldPlayers}
      onViewProfile={onViewProfile}
      onViewCourse={onViewCourse}
      onShareRound={onShareRound}
      emptyVariant={emptyVariant}
      emptyGross={grossVal}
      emptyToPar={toParVal}
      presentation={presentation}
      engagement={engagement}
      onHorizontalDrag={onHorizontalDrag}
      onStatsSeen={onStatsSeen}
      pageShift={pageShift}
      pagePreview={pagePreview}
      paging={paging}
    />
    {commentsOpen && postInfo && (
      <CommentsSheetV2
        isOpen
        onClose={() => setCommentsOpen(false)}
        targetType="post"
        targetId={postInfo.postId}
      />
    )}
    </>
  );
};


export default RoundDetailSheet;
