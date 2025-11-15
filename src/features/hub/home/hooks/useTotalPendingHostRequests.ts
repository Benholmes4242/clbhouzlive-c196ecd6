import { useMemo } from 'react';
import { usePendingRequestCount } from '@/features/nearby/hooks/usePendingRequestCount';

type HostGame = {
  id: string;
  host_user_id: string;
};

export function useTotalPendingHostRequests(
  games: HostGame[] | undefined,
  currentUserId: string | undefined
) {
  // If no user or games, bail early
  if (!currentUserId || !games || games.length === 0) {
    return 0;
  }

  // Filter games the current user is hosting
  const hostingGames = games.filter(g => g.host_user_id === currentUserId);

  // Call the count hook per game
  const counts = hostingGames.map(g => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const { data: count } = usePendingRequestCount(g.id);
    return count ?? 0;
  });

  // Sum them
  return useMemo(
    () => counts.reduce((sum, c) => sum + c, 0),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [JSON.stringify(counts)]
  );
}
