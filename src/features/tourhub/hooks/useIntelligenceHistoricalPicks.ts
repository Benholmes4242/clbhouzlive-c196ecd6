/**
 * useIntelligenceHistoricalPicks
 *
 * Single source of truth for season Intelligence pick history. Powers the
 * hero card track record, the Pick Record rail, and the All Intelligence
 * Picks bottom sheet.
 *
 * Returns a chronological list of completed PGA tournaments (plus cross-tour
 * majors from EURO seasons) where Intelligence had predictions, with:
 *
 *   - All 3 picks per tournament (not just the best finisher)
 *   - Final position + score per pick (formatted: "1", "T8", "MC", "WD", "—")
 *   - Tournament date range (start + end ISO)
 *   - Client-side outcome classification (win | top5 | partial | miss)
 *   - Derived `bestPick` for the rail's single-pick rendering
 *
 * Cap: ORDER BY end_date DESC LIMIT 50 (~1 PGA season). Most recent first.
 *
 * Defensive coding: older `predictions` JSON entries may have <3 picks. We
 * iterate ranks 1..3 and skip any rank with no matching pick rather than
 * crashing.
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { isMajor } from '../utils/majorScope';
import { classifyOutcome, type IntelligenceOutcome } from '../utils/outcomeClassifier';

// Back-compat re-export so existing consumers (e.g. IntelligenceAllPicksSheet)
// can keep importing the type from this hook.
export type { IntelligenceOutcome };

export interface IntelligenceHistoricalPick {
  rank: 1 | 2 | 3;
  playerName: string;
  playerId: string;
  tourCode: string;
  actualPosition: number | null;
  actualPositionTied: boolean;
  /** Raw leaderboard status (e.g. 'CUT', 'WD', 'DQ', 'active'). Source of truth for MC display. */
  status: string | null;
  /** Pre-formatted display string: "1", "T8", "MC", "WD", "—". */
  finalPosition: string;
  /** Score to par from the leaderboard (null when missing or pre-cut). */
  scoreToPar: number | null;
}

export interface IntelligenceHistoricalTournament {
  id: string;
  name: string;
  shortName: string;
  startDate: string;
  endDate: string;
  tour: string;
  /** True for cross-tour majors (Masters, US Open, PGA Champ, The Open). */
  isMajor: boolean;
  outcome: IntelligenceOutcome;
  picks: IntelligenceHistoricalPick[];
  /** Best-finishing pick across rank 1-3. Null positions (MC/WD) treated as worst. */
  bestPick: IntelligenceHistoricalPick | null;
  /** ISO year of start_date, for display. */
  year: string;
  /** @internal Used for same-week dedup; not part of the public contract. */
  purse?: number | null;
}

/** Sun→Sat week key (yyyy-MM-dd of the Sunday) for a tournament start date. */
function weekKey(startDate: string): string {
  const d = new Date(startDate + (startDate.length === 10 ? 'T12:00:00Z' : ''));
  const sunday = new Date(d);
  sunday.setUTCDate(sunday.getUTCDate() - sunday.getUTCDay());
  return sunday.toISOString().slice(0, 10);
}

const SKIP_WORDS = new Set([
  'open', 'classic', 'invitational', 'championship', 'tournament', 'the', 'at', 'presented', 'by',
]);

function getShortName(name: string): string {
  const words = name.split(/\s+/).filter(Boolean);
  for (const w of words) {
    if (!SKIP_WORDS.has(w.toLowerCase()) && w.length > 2) return w;
  }
  return words[0] ?? name;
}

function formatFinalPosition(
  actualPosition: number | null,
  actualPositionTied: boolean,
  status: string | null,
): string {
  if (status) {
    const s = status.toLowerCase();
    if (s === 'cut') return 'MC';
    if (s === 'wd') return 'WD';
    if (s === 'dq') return 'DQ';
  }
  if (actualPosition === null) return '—';
  return `${actualPositionTied ? 'T' : ''}${actualPosition}`;
}

async function getScopedSeasonIds(): Promise<{ all: string[]; euro: string[] }> {
  const [pgaSeasons, euroSeasons] = await Promise.all([
    supabase
      .from('sr_seasons')
      .select('id')
      .ilike('tour_name', 'pga')
      .order('year', { ascending: false })
      .limit(3),
    supabase
      .from('sr_seasons')
      .select('id')
      .ilike('tour_name', 'EURO')
      .order('year', { ascending: false })
      .limit(3),
  ]);
  const pgaIds = (pgaSeasons.data ?? []).map((s: any) => s.id);
  const euroIds = (euroSeasons.data ?? []).map((s: any) => s.id);
  return { all: [...pgaIds, ...euroIds], euro: euroIds };
}

export function useIntelligenceHistoricalPicks() {
  return useQuery({
    queryKey: ['intelligence-historical-picks'],
    staleTime: 30 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
    queryFn: async (): Promise<IntelligenceHistoricalTournament[]> => {
      const { all: allSeasonIds, euro: euroSeasonIds } = await getScopedSeasonIds();
      if (!allSeasonIds.length) return [];

      // Step 1: completed tournaments with predictions, most recent first, capped 50.
      // Includes PGA + EURO seasons so cross-tour majors (e.g. The Masters) are in scope.
      const { data: predRows, error: predError } = await supabase
        .from('ai_predictions')
        .select(`
          tournament_id,
          predictions,
          sr_tournaments!inner(
            id, name, status, start_date, end_date, season_id, purse
          )
        `)
        .in('sr_tournaments.status', ['closed', 'complete'])
        .in('sr_tournaments.season_id', allSeasonIds)
        .order('sr_tournaments(end_date)', { ascending: false })
        .limit(50);

      if (predError) {
        console.error('useIntelligenceHistoricalPicks predictions error:', predError);
        return [];
      }
      if (!predRows?.length) return [];

      const tournamentIds = predRows.map(r => r.tournament_id);

      // Step 2: batched leaderboard fetch keyed by tournament + sr_id/name.
      // Leaderboard can exceed PostgREST's default 1000-row cap (≈18 tournaments
      // × ~150 players ≈ 2,800 rows). Without pagination the response is silently
      // truncated, so later tournaments' picks never match and show "—". Page
      // through in 1000-row windows until exhausted.
      const leaderboardData: any[] = [];
      const PAGE = 1000;
      for (let from = 0; ; from += PAGE) {
        const { data: page, error: lbErr } = await supabase
          .from('sr_leaderboards')
          .select('tournament_id, player_id, position, position_tied, status, score, sr_players!inner(sr_id, full_name)')
          .in('tournament_id', tournamentIds)
          .range(from, from + PAGE - 1);
        if (lbErr) {
          console.error('useIntelligenceHistoricalPicks leaderboard error:', lbErr);
          break;
        }
        if (!page?.length) break;
        leaderboardData.push(...page);
        if (page.length < PAGE) break;
      }

      type LBEntry = { position: number | null; tied: boolean; status: string | null; score: number | null };
      const lbByTournament = new Map<string, { byPlayerId: Map<string, LBEntry>; bySrId: Map<string, LBEntry>; byName: Map<string, LBEntry> }>();

      for (const row of (leaderboardData ?? [])) {
        const tid = row.tournament_id;
        if (!lbByTournament.has(tid)) {
          lbByTournament.set(tid, { byPlayerId: new Map(), bySrId: new Map(), byName: new Map() });
        }
        const maps = lbByTournament.get(tid)!;
        const playerId = (row as any).player_id;
        const srId = (row.sr_players as any)?.sr_id;
        const fullName = (row.sr_players as any)?.full_name;
        const entry: LBEntry = {
          position: row.position ?? null,
          tied: row.position_tied ?? false,
          status: row.status ?? null,
          score: (row as any).score ?? null,
        };
        // predictions[].playerId === sr_players.id === sr_leaderboards.player_id (UUID).
        // UUID match is primary; sr_id + name are fallbacks for older rows.
        if (playerId) maps.byPlayerId.set(playerId, entry);
        if (srId) maps.bySrId.set(srId, entry);
        if (fullName) maps.byName.set(fullName.toLowerCase(), entry);
      }

      // Step 3: build per-tournament structures with all 3 picks.
      const tournaments: IntelligenceHistoricalTournament[] = [];

      for (const row of predRows) {
        const t = (row as any).sr_tournaments;
        if (!t?.start_date || !t?.end_date) continue;

        // For EURO season tournaments, only include majors (e.g. The Masters).
        // Cross-tour majors fold-back so card + sheet stay scope-aligned.
        if (euroSeasonIds.includes(t.season_id) && !isMajor(t.name || '')) continue;

        const rawPredictions = (row.predictions as any[]) ?? [];
        const maps = lbByTournament.get(row.tournament_id);
        if (!maps) continue;

        const picks: IntelligenceHistoricalPick[] = [];

        // Defensive iteration — skip ranks where the prediction or its data is missing.
        for (const rank of [1, 2, 3] as const) {
          const pick = rawPredictions.find(p => (p?.rank ?? p?.predictedRank) === rank);
          if (!pick) continue;
          const playerName: string = pick.playerName || pick.player_name || pick.name || '';
          const playerId: string = String(pick.playerId || pick.pgaTourId || '');
          if (!playerName) continue;

          const lb = maps.byPlayerId.get(playerId)
            ?? maps.bySrId.get(playerId)
            ?? maps.byName.get(playerName.toLowerCase());
          const actualPosition = lb?.position ?? null;
          const actualPositionTied = lb?.tied ?? false;
          const status = lb?.status ?? null;

          picks.push({
            rank,
            playerName,
            playerId,
            tourCode: 'pga',
            actualPosition,
            actualPositionTied,
            status,
            finalPosition: formatFinalPosition(actualPosition, actualPositionTied, status),
            scoreToPar: lb?.score ?? null,
          });
        }

        if (picks.length === 0) continue;

        const bestPick = picks.reduce<IntelligenceHistoricalPick | null>((best, p) => {
          if (best === null) return p;
          // Null positions (MC/WD) treated as worst.
          if (p.actualPosition === null) return best;
          if (best.actualPosition === null) return p;
          return p.actualPosition < best.actualPosition ? p : best;
        }, null);

        tournaments.push({
          id: row.tournament_id,
          name: t.name ?? '',
          shortName: getShortName(t.name ?? ''),
          startDate: t.start_date,
          endDate: t.end_date,
          tour: 'PGA',
          isMajor: isMajor(t.name ?? ''),
          outcome: classifyOutcome(picks),
          picks,
          bestPick,
          year: new Date(t.start_date).getFullYear().toString(),
        });
      }

      return tournaments;
    },
  });
}
