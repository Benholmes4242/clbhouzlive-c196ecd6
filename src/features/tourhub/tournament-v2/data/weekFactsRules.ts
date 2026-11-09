/**
 * COMPLETED STATE — pure cell builders over get_tournament_week_facts.
 *
 * Every figure is computed server-side by public.get_tournament_week_facts
 * (one call, read through useTournamentWeekFacts). These builders only format
 * the payload into the signed-off cells; they never recompute a figure from
 * scorecards. THE TOP THREE is the one exception: it reads the leaderboard
 * rows the page already holds.
 *
 * Signed-off two-line cells: value + one capital label (PAR 3s keeps its s).
 * toPar alone carries score colour; counts/strokes/positions stay neutral.
 */
import type { BoardEntry } from '../../leaderboard/BoardTable';
import { copy, ordinal, roundScores, score, words } from './tournamentRules';

export interface WeekFactsPathEntry { round: number; position: number; tied: boolean; to_par: number; back: number | null; lead_by: number | null }
export interface WeekFactsHoleType { par: number; to_par: number; rank: number; tied: boolean; field: number }
export interface WeekFacts {
  champion_player_id: string | null;
  champion_surname: string | null;
  rounds: number;
  par: number | null;
  path: WeekFactsPathEntry[];
  playoff: boolean;
  margin: number | null;
  hole_types: WeekFactsHoleType[] | null;
  low_round: { to_par: number; strokes: number; players: number; surname: string | null } | null;
  most_birdies: { count: number; players: number; surname: string | null } | null;
  field_avg: number | null;
  field_size: number | null;
  cut: { line: number; made: number } | null;
  hardest: { hole: number; par: number; avg_to_par: number } | null;
  easiest: { hole: number; par: number; avg_to_par: number } | null;
}

export interface FactCell { key: string; pos?: string; value: string; under: boolean; toPar?: number; label: string; longLabel?: boolean }

const under = (n: number | null | undefined) => n != null && n < 0;
const posText = (position: number, tied: boolean) => `${tied ? 'T' : ''}${position}`;

/** HOW IT WAS WON: one AFTER R<n> cell per path entry before the last, then FINAL. */
export function pathCells(f: WeekFacts): FactCell[] {
  const path = [...(f.path ?? [])].sort((a, b) => a.round - b.round);
  return path.map((p, i) => {
    if (i === path.length - 1) {
      return { key: 'final', value: score(p.to_par), toPar: p.to_par, under: under(p.to_par), label: copy('wkFinal') };
    }
    const sub = p.back != null && p.back > 0 ? copy('wkBack', { n: p.back })
      : p.lead_by != null ? copy('wkLedBy', { n: p.lead_by })
      : p.tied ? copy('wkLevel') : '';
    return { key: `r${p.round}`, pos: posText(p.position, p.tied), value: score(p.to_par), toPar: p.to_par, under: under(p.to_par), label: `R${p.round}${sub ? ` · ${sub.toUpperCase()}` : ''}` };
  });
}

/** HOLE TYPE: null when the champion's scorecards are incomplete (the row hides). */
export function holeTypeCells(f: WeekFacts): FactCell[] | null {
  if (!f.hole_types || f.hole_types.length === 0) return null;
  return [...f.hole_types].sort((a, b) => a.par - b.par).map((h) => ({
    key: `par${h.par}`, value: score(h.to_par), toPar: h.to_par, under: under(h.to_par),
    label: `${copy(h.par === 3 ? 'wkPar3' : h.par === 4 ? 'wkPar4' : 'wkPar5')} · ${h.rank === 1 && !h.tied ? 'BEST' : posText(h.rank, h.tied)}`,
  }));
}

export function holeTypeHeading(f: WeekFacts): string {
  return copy('wkHoleType', { name: (f.champion_surname ?? '').toUpperCase() });
}

const signedAvg = (v: number) => `${v > 0 ? '+' : v < 0 ? '−' : ''}${Math.abs(v).toFixed(2)}`;
const shared = (surname: string | null, players: number) => surname ?? copy('wkPlayers', { n: players });

/** THE WEEK: LOW ROUND · MOST BIRDIES · FIELD AVG · CUT|FIELD · HARDEST · EASIEST (null cells drop). */
export function weekCells(f: WeekFacts): FactCell[] {
  const out: FactCell[] = [];
  if (f.low_round) out.push({ key: 'low', value: String(f.low_round.strokes), under: false, label: `LOW · ${shared(f.low_round.surname, f.low_round.players).toUpperCase()}`, longLabel: f.low_round.surname != null });
  if (f.most_birdies) out.push({ key: 'birdies', value: String(f.most_birdies.count), under: false, label: `BIRDIES · ${shared(f.most_birdies.surname, f.most_birdies.players).toUpperCase()}`, longLabel: f.most_birdies.surname != null });
  if (f.field_avg != null) out.push({ key: 'avg', value: f.field_avg.toFixed(1), under: false, label: f.par != null ? `AVG · ${copy('wkPar', { n: f.par }).toUpperCase()}` : 'AVG' });
  if (f.cut) out.push({ key: 'cut', value: score(f.cut.line), toPar: f.cut.line, under: under(f.cut.line), label: `${copy('wkCut')} · ${copy('wkMadeIt', { n: f.cut.made }).toUpperCase()}` });
  else if (f.field_size != null) out.push({ key: 'field', value: String(f.field_size), under: false, label: `${copy('wkField')} · ${copy('wkNoCut').toUpperCase()}` });
  if (f.hardest) out.push({ key: 'hardest', pos: ordinal(f.hardest.hole), value: signedAvg(f.hardest.avg_to_par), toPar: f.hardest.avg_to_par, under: under(f.hardest.avg_to_par), label: copy('wkHardest') });
  if (f.easiest) out.push({ key: 'easiest', pos: ordinal(f.easiest.hole), value: signedAvg(f.easiest.avg_to_par), toPar: f.easiest.avg_to_par, under: under(f.easiest.avg_to_par), label: copy('wkEasiest') });
  return out;
}

export interface TopRow { id: string; pos: string; winner: boolean; name: string; last: number | null; total: number | null }

/** THE TOP THREE: ties at position 3 or better, at most five rows; repeated ties leave the position blank. */
export function topThreeRows(rows: BoardEntry[], championPlayerId: string | null, lastRound: number): TopRow[] {
  const eligible = rows
    .filter((r) => r.position != null && r.position <= 3 && !['MC', 'CUT', 'WD', 'DQ'].includes((r.status ?? '').toUpperCase()))
    .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
    .slice(0, 5);
  return eligible.map((r, i) => {
    const prev = eligible[i - 1];
    const repeated = prev != null && prev.position === r.position;
    const winner = championPlayerId != null && (r.player?.id === championPlayerId || r.player?.sr_id === championPlayerId);
    return {
      id: r.id, winner, name: r.player?.full_name ?? '',
      pos: repeated ? '' : `${r.position_tied ? 'T' : ''}${r.position}`,
      last: roundScores(r)[lastRound - 1] ?? null, total: r.score ?? null,
    };
  });
}

/** Champion score label: PLAYOFF when the top two finish tied, else BY <words>. */
export function championScoreLabel(margin: number | null | undefined, playoff: boolean): string | undefined {
  if (playoff || margin === 0) return copy('playoff');
  return margin != null && margin > 0 ? copy('by', { words: words(margin).toUpperCase() }) : undefined;
}
