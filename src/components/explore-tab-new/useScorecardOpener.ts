import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { prefetchRoundDetail } from '@/lib/whs/hooks';
import { prefetchRoundCourseContext } from '@/lib/whs/useRoundCourseContext';

export interface ScorecardTarget {
  scoreId: string;
  connectionId: string | null;
  profileUserId: string | null;
}

/**
 * Shared opener for Discover rails. Score-backed rows (feats + friends)
 * open the full RoundDetailSheet with identity. Aggregate rows
 * (leaderboards with no score_id) navigate to the holder's profile.
 *
 * MEMBER TAPS OUTSIDE THE HANDICAP AREA OPEN THAT GOLFER'S PROFILE. The
 * compare/nudge/invite rule belongs to useMemberTapResolver and the
 * handicap area's own callers only; it was never meant for Explore,
 * course or feed taps. Self taps open the viewer's own profile too,
 * never /handicap.
 */
export function useScorecardOpener() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [target, setTarget] = useState<ScorecardTarget | null>(null);

  const openByScore = useCallback(
    (
      scoreId: string | null | undefined,
      connectionId: string | null | undefined,
      userId: string | null | undefined,
    ) => {
      if (!scoreId) return;
      setTarget({
        scoreId,
        connectionId: connectionId ?? null,
        profileUserId: userId ?? null,
      });
    },
    [],
  );

  const openProfile = useCallback(
    (userId: string | null | undefined) => {
      // Any member id — including the viewer's own — opens that member's
      // profile. The handicap area's compare/nudge/invite rule lives in
      // useMemberTapResolver and does not apply outside that area.
      if (userId) navigate(`/profile/${userId}`);
    },
    [navigate],
  );

  const close = useCallback(() => setTarget(null), []);

  const prefetchByScore = useCallback((scoreId: string | null | undefined) => {
    if (!scoreId) return;
    void Promise.all([
      prefetchRoundDetail(queryClient, scoreId),
      prefetchRoundCourseContext(queryClient, scoreId),
    ]);
  }, [queryClient]);

  return { target, openByScore, prefetchByScore, openProfile, close };
}

export type ScorecardOpener = ReturnType<typeof useScorecardOpener>;
