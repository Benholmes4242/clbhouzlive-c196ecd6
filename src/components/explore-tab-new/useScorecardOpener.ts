import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export interface ScorecardTarget {
  scoreId: string;
  connectionId: string | null;
  profileUserId: string | null;
}

/**
 * Shared opener for Discover rails. Score-backed rows (feats + friends)
 * open the full RoundDetailSheet with identity. Aggregate rows
 * (leaderboards with no score_id) navigate to the holder's profile.
 */
export function useScorecardOpener() {
  const navigate = useNavigate();
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
      if (userId) navigate(`/handicap/${userId}`);
    },
    [navigate],
  );

  const close = useCallback(() => setTarget(null), []);

  return { target, openByScore, openProfile, close };
}

export type ScorecardOpener = ReturnType<typeof useScorecardOpener>;
