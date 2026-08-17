/**
 * RoundDetailSheet — handicap round drill-in.
 *
 * Thin wrapper around the canonical CardScorecardSheet ("The Card").
 * Public Props unchanged (open, onClose, scoreId, handicapDelta,
 * connectionId, profileUserId, variant) so all 8 downstream consumers
 * still compile. `variant` is IGNORED (light-only sheet).
 */

import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { CardScorecardSheet } from '@/features/courses/_shared/scorecard/CardScorecardSheet';
import { useRoundDetail, useWhsCourseId } from '@/lib/whs/hooks';
import { useRoundCourseContext } from '@/lib/whs/useRoundCourseContext';
import { useCourseHoleAnalysis } from '@/hooks/gam/useCourseHoleAnalysis';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useWhsConnection } from '@/lib/whs/hooks';
import { resolveDisplayHandicap } from '@/lib/handicap/resolveHandicap';
import type { WhsScoreHole } from '@/lib/whs/types';
import { formatWeekdayShortGB, formatMonthShortGB } from '@/i18n/format';
import { usePostStudioStore } from '@/stores/usePostStudioStore';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { analyticsEvents } from '@/utils/analyticsEvents';

function strokesOf(h: WhsScoreHole): number | null {
  return h.adjusted_gross ?? h.actual_gross ?? null;
}

function fmtDateEyebrow(iso: string | null | undefined): string {
  if (!iso) return '';
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  const d = m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : new Date(iso);
  if (isNaN(d.getTime())) return '';
  const dow = formatWeekdayShortGB(d).toUpperCase();
  const day = d.getDate();
  const mon = formatMonthShortGB(d).toUpperCase();
  return `${dow}, ${day} ${mon}`;
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
}

export const RoundDetailSheet: React.FC<Props> = ({
  open, onClose, scoreId, handicapDelta, profileUserId,
}) => {
  const navigate = useNavigate();
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
  // per-hole field average that powers the course page's shape chart.
  const contextQuery = useRoundCourseContext(scoreId, open);
  const ctx = contextQuery.data ?? null;
  const analysisCourseId = ctx?.course_id ?? courseIdQuery.data ?? undefined;
  const analysisQuery = useCourseHoleAnalysis(open ? analysisCourseId : undefined);
  // get_course_hole_analysis returns available:false for a signed-out viewer —
  // that is "no field data", not an error.
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


  const eyebrowText = fmtDateEyebrow(userData?.play_date);
  const courseName = userData?.course?.name ?? '';
  const courseLocation = (userData?.course as { country_name?: string | null } | null | undefined)?.country_name ?? null;
  const coursePar = totalPar > 0 ? totalPar : null;
  const courseSlope = (userData as { slope_rating?: number | null } | null | undefined)?.slope_rating ?? null;



  const displayName = profile?.display_name ?? profile?.username ?? '';
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

  return (
    <CardScorecardSheet
      open={open}
      onClose={onClose}
      eyebrowText={eyebrowText}
      courseName={courseName}
      courseLocation={courseLocation}
      coursePar={coursePar}
      courseSlope={courseSlope}
      holes={cardHoles}
      nineHole={!!userData?.is_nine_hole}
      loading={isRoundLoading || contextQuery.isLoading || analysisQuery.isLoading}
      surface="member"
      courseContext={ctx ? {
        yourAvgToPar: ctx.your_avg_to_par,
        avgToParOthers: ctx.avg_to_par_others,
        roundsHere: ctx.rounds_here,
        rankHere: ctx.rank_here,
      } : null}
      playerName={displayName}
      playerAvatarUrl={profile?.profile_photo_url ?? null}
      playerHcp={playerHcp}
      playerHcpDelta={handicapDelta ?? null}
      playerUserId={profileUserId ?? null}
      onViewProfile={onViewProfile}
      onViewCourse={onViewCourse}
      onShareRound={onShareRound}
      emptyVariant={emptyVariant}
      emptyGross={grossVal}
      emptyToPar={toParVal}
    />
  );
};


export default RoundDetailSheet;
