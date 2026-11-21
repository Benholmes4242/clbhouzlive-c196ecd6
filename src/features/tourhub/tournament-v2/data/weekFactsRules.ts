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
import { copy, cumulative, ordinal, roundScores, score, words } from './tournamentRules';

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

export interface FactCell { key: string; pos?: string; value: string; under: boolean; toPar?: number; label: string; detail?: string; longLabel?: boolean }

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
const shared = (surname: string | null, players: number) => players > 1 ? copy('wkPlayers', { n: players }) : surname ?? copy('wkPlayers', { n: players });

/** THE WEEK: only four supplied figures, with sentence-case detail beneath. */
export function weekCells(f: WeekFacts): FactCell[] {
  const out: FactCell[] = [];
  if (f.low_round) out.push({ key: 'low', value: String(f.low_round.strokes), under: false, label: 'Low round', detail: shared(f.low_round.surname, f.low_round.players) });
  if (f.most_birdies) out.push({ key: 'birdies', value: String(f.most_birdies.count), under: false, label: 'Most birdies', detail: shared(f.most_birdies.surname, f.most_birdies.players) });
  if (f.hardest) out.push({ key: 'hardest', value: signedAvg(f.hardest.avg_to_par), toPar: f.hardest.avg_to_par, under: under(f.hardest.avg_to_par), label: 'Hardest', detail: `${ordinal(f.hardest.hole)} hole` });
  if (f.easiest) out.push({ key: 'easiest', value: signedAvg(f.easiest.avg_to_par), toPar: f.easiest.avg_to_par, under: under(f.easiest.avg_to_par), label: 'Easiest', detail: `${ordinal(f.easiest.hole)} hole` });
  return out;
}

/** Finished chart uses the champion plus the next two by final position,
 * stable on ties. Select first, then drop incomplete players (no replacement).
 * Geometry stays here so both callers use the same 126px full-width, date-independent plot. */
export function wonChart(f: WeekFacts, rows: BoardEntry[], width: number) {
  if (f.rounds < 2 || !f.path.length || !f.champion_player_id) return null;
  const eligible = rows.filter(r => r.player && r.position != null && !['MC', 'CUT', 'WD', 'DQ'].includes((r.status ?? '').toUpperCase()));
  const champion = eligible.find(r => r.player?.id === f.champion_player_id || r.player?.sr_id === f.champion_player_id);
  if (!champion) return null;
  const next = eligible.filter(r => r !== champion).sort((a, b) => (a.position ?? Infinity) - (b.position ?? Infinity)).slice(0, 2);
  const players = [champion, ...next].flatMap(row => {
    const values = Array.from({ length: f.rounds }, (_, i) => cumulative(row, i + 1));
    if (values.some(v => v == null || !Number.isFinite(v))) return [];
    return [{ id: row.id, name: row.player?.full_name ?? '', champion: row === champion, values: values as number[] }];
  });
  if (!players.some(p => p.champion)) return null;
  const values = players.flatMap(p => p.values);
  const min = Math.min(...values) - 1, max = Math.max(0, ...values);
  const x = (i: number) => 10 + i * (width - 20) / (f.rounds - 1);
  const y = (v: number) => 18 + (v - min) / (max - min) * 88;
  const lines = players.map(p => ({ ...p, points: p.values.map((value, i) => ({ x: x(i), y: y(value), value, position: p.champion ? f.path.find(entry => entry.round === i + 1) : undefined })) }));
  return { lines, rounds: Array.from({ length: f.rounds }, (_, i) => ({ x: x(i), label: `R${i + 1}` })) };
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
