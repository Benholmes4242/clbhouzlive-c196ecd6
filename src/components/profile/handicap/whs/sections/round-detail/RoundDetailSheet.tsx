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
  const openPostStudioForRound = usePostStudioStore((st) => st.openPostStudioForRound);
  const userQuery = useRoundDetail(scoreId, open);
  const userData = userQuery.data;
  const isRoundLoading = userQuery.isLoading;

  const profileQuery = useUserProfile(profileUserId ?? undefined);
  const profile = profileQuery.data;
  const { data: whsConn } = useWhsConnection(profileUserId ?? undefined);

  const courseIdQuery = useWhsCourseId(
    userData?.course?.name ?? null,
    (userData?.course as { country_code?: string | null } | null | undefined)?.country_code ?? null,
    open,
  );

  const sortedHoles = useMemo(() => {
    if (!userData?.holes) return [] as WhsScoreHole[];
    return [...userData.holes].sort((a, b) => a.hole_no - b.hole_no);
  }, [userData]);

  const cardHoles = useMemo(
    () => sortedHoles.map((h) => ({
      holeNo: h.hole_no,
      par: h.par ?? null,
      strokes: strokesOf(h),
    })),
    [sortedHoles],
  );

  const totalPar = sortedHoles.reduce((a, h) => a + (h.par ?? 0), 0);

  const grossVal = userData
    ? (userData.adjusted_gross ?? userData.actual_gross ?? null)
    : null;
  const toParVal = (grossVal != null && totalPar > 0) ? grossVal - totalPar : null;
  const emptyVariant: 'syncing' | 'nohbh' | 'unavailable' =
    !isRoundLoading && userData == null
      ? 'unavailable'
      : userData?.hole_by_hole_fetched
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

  const onViewProfile = profileUserId
    ? () => { onClose(); navigate(`/handicap/${profileUserId}`); }
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
        openPostStudioForRound({
          course: { id: shareCourseId, name: courseName, country: courseLocation },
          whsScoreId: scoreId,
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
      loading={isRoundLoading}
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
