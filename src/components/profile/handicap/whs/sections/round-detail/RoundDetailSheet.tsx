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
import type { WhsScoreHole } from '@/lib/whs/types';

function strokesOf(h: WhsScoreHole): number | null {
  return h.adjusted_gross ?? h.actual_gross ?? null;
}

function fmtDateEyebrow(iso: string | null | undefined): string {
  if (!iso) return '';
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  const d = m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : new Date(iso);
  if (isNaN(d.getTime())) return '';
  const dow = d.toLocaleDateString('en-GB', { weekday: 'short' }).toUpperCase();
  const day = d.getDate();
  const mon = d.toLocaleDateString('en-GB', { month: 'short' }).toUpperCase();
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
  const userQuery = useRoundDetail(scoreId, open);
  const userData = userQuery.data;
  const isRoundLoading = userQuery.isLoading;

  const profileQuery = useUserProfile(profileUserId ?? undefined);
  const profile = profileQuery.data;

  const courseIdQuery = useWhsCourseId(
    userData?.course?.name ?? null,
    (userData?.course as any)?.country_code ?? null,
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
  const emptyVariant: 'syncing' | 'nohbh' =
    userData?.hole_by_hole_fetched ? 'nohbh' : 'syncing';

  const eyebrowText = fmtDateEyebrow(userData?.play_date);
  const courseName = userData?.course?.name ?? '';
  const courseLocation = (userData?.course as any)?.country_name ?? null;
  const coursePar = totalPar > 0 ? totalPar : null;
  const courseSlope = (userData as any)?.slope_rating ?? null;


  const displayName = profile?.display_name ?? profile?.username ?? '';
  const playerHcp = profile?.show_handicap === false
    ? null
    : profile?.eg_handicap_index ?? null;

  const onViewProfile = profileUserId
    ? () => { onClose(); navigate(`/handicap/${profileUserId}`); }
    : undefined;
  const onViewCourse = courseIdQuery.data
    ? () => { onClose(); navigate(`/courses/${courseIdQuery.data}`); }
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
      emptyVariant={emptyVariant}
      emptyGross={grossVal}
      emptyToPar={toParVal}
    />
  );
};


export default RoundDetailSheet;
