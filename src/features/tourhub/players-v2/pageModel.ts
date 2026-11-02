/** The one bundle of joined data both Players views render from. Built in PlayersTab. */
import type { LivePlayerMap } from './data/useLivePlayerIds';
import type { ScorecardStat } from './data/useScorecardStats';
import type { TourRace } from './data/useTourRace';
import type { PlayersTourId } from './data/usePlayersRanking';
import type { PlayerView } from './playersModel';
import type { ClockEvent, FormEntry, Lens, Stake } from './playersRules';

export interface PageData {
  tour: PlayersTourId;
  isPga: boolean;
  title: string;
  players: PlayerView[];
  race: TourRace | null;
  stakes: Stake[];
  events: ClockEvent[];
  scorecard: Map<string, ScorecardStat> | undefined;
  form: FormEntry<PlayerView>[];
  live: LivePlayerMap;
  updatedAt: string | null;
  /** Resolved standings season (build 3 hole averages). */
  season?: number | null;
}

export type ViewAllFrom = 'button' | 'race' | 'form' | 'stats' | 'search' | 'pill';
export type CardName = 'line' | 'race' | 'your_players' | 'in_form' | 'stat_leaders';

export interface PageActions {
  openAll: (opts: { from: ViewAllFrom; lens?: Lens; stat?: string; search?: boolean }) => void;
  goPlayer: (p: PlayerView, card?: CardName) => void;
}
