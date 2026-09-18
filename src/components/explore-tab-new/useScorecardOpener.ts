import { useCallback, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useMemberTapResolver } from '@/components/friend-sheet/useMemberTapResolver';
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
 */
export function useScorecardOpener() {
  const { resolve } = useMemberTapResolver();
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
      // Discover rows are almost never the viewer's own. The resolver keeps
      // self on their own page and sends everyone else to compare/nudge/invite
      // rather than to a stranger's handicap page.
      if (userId) void resolve({ targetUserId: userId });
    },
    [resolve],
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
