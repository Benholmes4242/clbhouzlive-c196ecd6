/** Photo and live sections share this round owner. The full tee read retains
 * the hero's enabled rule and useTeeTimesAll key/options; its observers dedupe
 * in React Query. LeadersGroup and Also this week keep independent rules.
 * Tournament status/round status precede meta; failed tees never imply delay. */
import type { HeroState } from './HybridHero.utils';
import type { BoardEntry } from '../../leaderboard/BoardTable';
import { useTournamentMeta } from '../../leaderboard/useTournamentMeta';
import { useTeeTimesAll } from '../../tournament-v2/data/useTeeTimesAll';
import { earliestTeeTime } from '../../overview/boardStarted';
import { useRoundDelayClock } from '../../overview/roundDelay';
import { overviewRoundState, type LiveStageInput } from './liveStateRules';

export interface OverviewRoundTournament { id: string; status?: string | null; currentRoundStatus?: string | null }
export function useOverviewRoundState(tournament: OverviewRoundTournament | null, state: HeroState | Pick<LiveStageInput, 'kind' | 'round' | 'totalRounds'> | null, entries: BoardEntry[], now?: Date) {
  const clock = useRoundDelayClock(now);
  const on = !!tournament && (state?.kind === 'live' || state?.kind === 'suspended');
  const metaQuery = useTournamentMeta(on ? tournament?.id : null);
  const meta = metaQuery.isError ? null : metaQuery.data ?? null;
  const input = on && state && (state.kind === 'live' || state.kind === 'suspended') ? {
    kind: state.kind, round: state.round, totalRounds: state.totalRounds, entries,
    status: tournament?.status ?? meta?.status, currentRoundStatus: tournament?.currentRoundStatus,
    metaCurrentRoundStatus: meta?.current_round_status, cutRound: meta?.cut_round, now: clock,
  } : null;
  const base = input ? overviewRoundState(input) : null;
  const teeQuery = useTeeTimesAll(tournament?.id, base?.teeRound ?? 1, { enabled: base?.wantTees ?? false });
  const firstTee = teeQuery.isError ? null : earliestTeeTime(teeQuery.data);
  return { on, meta, metaQuery, teeQuery, result: input ? overviewRoundState({ ...input, firstTee }) : null };
}