/** Upcoming history reads only the resolved prior edition, using the completed
 * state's canonical facts and board hooks. Passing no id disables both reads;
 * failed reads never reuse stale chart data. Legacy finisher readers are unchanged. */
import { useTournamentWeekFacts } from '../../tournament-v2/data/useTournamentWeekFacts';
import { useTourLeaderboard } from '../../hooks/useTourHubData';

export function usePriorEditionHistory(priorTournamentId: string | null | undefined, enabled: boolean) {
  const id = enabled ? priorTournamentId ?? null : null;
  const factsQuery = useTournamentWeekFacts(id, enabled);
  const boardQuery = useTourLeaderboard(id ?? '');
  return { factsQuery, boardQuery,
    facts: !id || factsQuery.isError ? null : factsQuery.data ?? null,
    rows: !id || boardQuery.isError ? [] : boardQuery.data ?? [] };
}