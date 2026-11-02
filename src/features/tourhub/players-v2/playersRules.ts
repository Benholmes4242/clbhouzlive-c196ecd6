/**
 * players-v2/playersRules — every pure rule on the merged Players page
 * (Players build 1 of 3). Views only render what these functions return.
 *
 * Owns: name normalisation, number words and ordinals, the hero headline and
 * sub line, the situation sentence, line gaps and the "pts clear / short"
 * second line, form ranking (MC/WD/DQ = 70th, three-start minimum), stat
 * definitions, qualification, tie ranks, bar widths and stat sentences, plus
 * the legacy Leaders redirect. No React, no reads.
 */

// ── Names ──────────────────────────────────────────────────────────────────

const ROMAN_SUFFIX = /^(II|III|IV|V|VI|JR\.?|SR\.?)$/i;

function capitaliseWord(word: string): string {
  if (!word) return word;
  // Initials like "J.J." or "K.H." stay as they are.
  if (/^([A-Za-z]\.)+$/.test(word)) return word.toUpperCase();
  if (/^(II|III|IV|VI)$/i.test(word)) return word.toUpperCase();
  const isAllCaps = word === word.toUpperCase() && /[A-Z]/.test(word);
  const letters = word.replace(/[^A-Za-z]/g, '');
  if (!isAllCaps || letters.length <= 2) return word;
  // Keep hyphen and apostrophe parts capitalised.
  return word
    .split(/([-'’])/)
    .map((part) => {
      if (part === '-' || part === "'" || part === '’' || !part) return part;
      const lower = part.toLowerCase();
      if (/^mc[a-z]/.test(lower)) return `Mc${lower.charAt(2).toUpperCase()}${lower.slice(3)}`;
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join('');
}

/** Fixes feed capitals: "Eugenio CHACARRA" → "Eugenio Chacarra", "MCILROY" → "McIlroy". */
export function displayPlayerName(raw: string | null | undefined): string {
  const s = (raw ?? '').trim().replace(/\s+/g, ' ');
  if (!s) return '';
  return s
    .split(' ')
    .map((w) => (ROMAN_SUFFIX.test(w) && /^(II|III|IV|VI)$/i.test(w) ? w.toUpperCase() : capitaliseWord(w)))
    .join(' ');
}

export function surname(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length <= 1) return name.trim();
  let i = parts.length - 1;
  if (/^(II|III|IV|JR\.?|SR\.?)$/i.test(parts[i]) && i > 0) i -= 1;
  const particles = new Set(['van', 'von', 'de', 'der', 'den', 'du', 'da', 'di', 'la', 'le', 'del', 'dos']);
  let start = i;
  while (start > 0 && particles.has(parts[start - 1].toLowerCase())) start -= 1;
  return parts.slice(start, i + 1).join(' ');
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter((p) => /[A-Za-zÀ-ÿ]/.test(p) && !/^(II|III|IV)$/.test(p));
  if (!parts.length) return '';
  const first = parts[0].replace(/[^A-Za-zÀ-ÿ]/g, '').charAt(0);
  const last = parts.length > 1 ? parts[parts.length - 1].replace(/[^A-Za-zÀ-ÿ]/g, '').charAt(0) : '';
  return (first + last).toUpperCase();
}

// ── Numbers ────────────────────────────────────────────────────────────────

const WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve'];

export function numberWord(n: number, capital = false): string {
  const w = Number.isInteger(n) && n >= 0 && n < WORDS.length ? WORDS[n] : String(n);
  return capital ? w.charAt(0).toUpperCase() + w.slice(1) : w;
}

export function ordinal(n: number): string {
  const v = Math.round(n);
  const mod100 = v % 100;
  if (mod100 >= 11 && mod100 <= 13) return `${v}th`;
  switch (v % 10) {
    case 1: return `${v}st`;
    case 2: return `${v}nd`;
    case 3: return `${v}rd`;
    default: return `${v}th`;
  }
}

export function fmtInt(n: number): string {
  return Math.round(n).toLocaleString('en-GB');
}

const plural = (n: number, one: string, many: string) => (n === 1 ? one : many);

/** A sentence made of plain and bold runs. */
export type Rich = Array<{ text: string; bold?: boolean }>;

// ── Standings basics ───────────────────────────────────────────────────────

export interface StandingRow {
  key: string;
  playerId: string;
  rank: number;
  name: string;
  points: number | null;
  wins: number | null;
  top10s: number | null;
  events: number | null;
}

export interface Stake {
  after_position: number;
  explainer: string | null;
  featured: boolean;
  foot: string | null;
  kicker: string | null;
  line_label: string;
  pill_label: string | null;
  side: string | null;
  sort: number;
}

/** Points of the player at `after_position` minus the next player's. */
export function lineGap(rows: StandingRow[], afterPosition: number): number | null {
  const at = rows[afterPosition - 1];
  const next = rows[afterPosition];
  if (!at || !next || at.points == null || next.points == null) return null;
  return Math.max(0, Math.round(at.points - next.points));
}

export function featuredStakes(stakes: Stake[]): Stake[] {
  return stakes.filter((s) => s.featured).sort((a, b) => a.sort - b.sort).slice(0, 2);
}

/** "The 100 line" → "the 100 line"; "Next 10" → "the Next 10". */
export function pillPhrase(stake: Stake): string {
  const label = (stake.pill_label ?? stake.line_label ?? '').trim();
  if (/^the\s/i.test(label)) return `the ${label.slice(4)}`;
  return `the ${label}`;
}

// ── Hero ───────────────────────────────────────────────────────────────────

export type RaceStatus = 'live' | 'final' | string;

export function heroHeadline(args: { status: RaceStatus | null; leaderPts: number | null; secondPts: number | null; leaderName: string }): string {
  const s = surname(args.leaderName);
  if (args.status === 'final') return `${s} finished on top`;
  const { leaderPts, secondPts } = args;
  if (leaderPts != null && secondPts != null && secondPts > 0) {
    const ratio = leaderPts / secondPts;
    if (ratio >= 1.3) return `${s} has run away with it`;
    if (ratio >= 1.1) return `${s} is out in front`;
  }
  return "It's tight at the top";
}

export function heroSub(args: { wins: number | null; top10s: number | null; events: number | null; gap: number | null; secondName: string | null }): string {
  const { wins, top10s, events, gap, secondName } = args;
  const w = wins != null && wins > 0 ? wins : null;
  const t = top10s != null && top10s > 0 ? top10s : null;
  const ev = events != null && events > 0 ? events : null;
  const winsText = w != null ? `${w} ${plural(w, 'win', 'wins')}` : null;
  const topText = t != null ? `${t} ${plural(t, 'top-10', 'top-10s')}` : null;
  let first = '';
  const lead = [winsText, topText].filter(Boolean).join(' and ');
  if (lead) first = ev != null ? `${lead} from ${ev} starts.` : `${lead} this season.`;
  const second = gap != null && gap > 0 && secondName ? `${fmtInt(gap)} ${plural(gap, 'point', 'points')} clear of ${secondName}.` : '';
  return [first, second].filter(Boolean).join(' ');
}

// ── Situation sentence ─────────────────────────────────────────────────────

export interface ClockEvent {
  id: string;
  name: string;
  startDate: string;
  finished: boolean;
}

export function situationSentence(args: {
  status: RaceStatus | null;
  hasPhase: boolean;
  events: ClockEvent[];
  lines: Array<{ stake: Stake; gap: number | null }>;
}): Rich | null {
  const { status, lines } = args;
  if (status === 'final') {
    const ex = lines[0]?.stake.explainer;
    return [{ text: `The season is over.${ex ? ` ${ex}` : ''}` }];
  }
  if (status !== 'live' || !args.hasPhase || !lines.length) return null;
  const left = args.events.filter((e) => !e.finished);
  const last = args.events[args.events.length - 1];
  if (!last) return null;
  const out: Rich = [
    { text: `${numberWord(left.length, true)} ${plural(left.length, 'event', 'events')} left before the standings close after the ${last.name.replace(/^the\s+/i, '')}, and the fight is at the edges: ` },
  ];
  const [l1, l2] = lines;
  const g1 = l1.gap ?? 0;
  out.push({ text: String(fmtInt(g1)), bold: true });
  out.push({ text: ` ${plural(g1, 'point', 'points')} across ${pillPhrase(l1.stake)}` });
  if (l2) {
    out.push({ text: ', ' });
    out.push({ text: String(fmtInt(l2.gap ?? 0)), bold: true });
    out.push({ text: ` across ${pillPhrase(l2.stake)}` });
  }
  out.push({ text: '.' });
  return out;
}

/** "{explainer} {gap} point(s) between {Nth} and {N+1th}." */
export function lineCardLine(stake: Stake, gap: number | null): Rich {
  const out: Rich = [];
  if (stake.explainer) out.push({ text: `${stake.explainer} ` });
  if (gap != null) {
    out.push({ text: fmtInt(gap), bold: true });
    out.push({ text: ` ${plural(gap, 'point', 'points')} between ${ordinal(stake.after_position)} and ${ordinal(stake.after_position + 1)}.` });
  }
  return out;
}

export function raceCardLine(rows: StandingRow[]): Rich | null {
  const a = rows[1]?.points;
  const b = rows[4]?.points;
  if (a == null || b == null) return null;
  const gap = Math.round(a - b);
  return [{ text: 'Only ' }, { text: fmtInt(gap), bold: true }, { text: ` ${plural(gap, 'point covers', 'points cover')} 2nd to 5th.` }];
}

/** Gap line for a player within three places of a line: inside (L−3, L], outside (L, L+3]. */
export function gapLineFor(
  rank: number,
  points: number | null,
  rows: StandingRow[],
  stakes: Stake[],
): { kind: 'clear' | 'short'; pts: number; other: string } | null {
  if (points == null) return null;
  const sorted = [...stakes].sort((a, b) => a.after_position - b.after_position);
  for (const s of sorted) {
    const L = s.after_position;
    if (rank > L - 3 && rank <= L) {
      const below = rows[L]?.points;
      if (below == null) continue;
      return { kind: 'clear', pts: Math.max(0, Math.round(points - below)), other: ordinal(L + 1) };
    }
    if (rank > L && rank <= L + 3) {
      const at = rows[L - 1]?.points;
      if (at == null) continue;
      return { kind: 'short', pts: Math.max(0, Math.round(at - points)), other: ordinal(L) };
    }
  }
  return null;
}

/** "World {n} · {w} wins · {t} top-10s", dropping unknown/zero parts; nothing → "{ev} starts". */
export function careerLine(args: { world: number | null; wins: number | null; top10s: number | null; events: number | null }): string {
  const parts: string[] = [];
  if (args.world != null) parts.push(`World ${args.world}`);
  if (args.wins) parts.push(`${args.wins} ${plural(args.wins, 'win', 'wins')}`);
  if (args.top10s) parts.push(`${args.top10s} ${plural(args.top10s, 'top-10', 'top-10s')}`);
  if (parts.length) return parts.join(' · ');
  return args.events ? `${args.events} starts` : '';
}

export function barPct(points: number | null, leader: number | null): number {
  if (points == null || leader == null || leader <= 0) return 1.5;
  return Math.max(1.5, Math.min(100, (points / leader) * 100));
}

export function movementView(moved: number | null | undefined): { text: string; tone: 'up' | 'down' | 'none' } {
  if (moved == null || moved === 0) return { text: '–', tone: 'none' };
  return moved > 0 ? { text: `▲${moved}`, tone: 'up' } : { text: `▼${Math.abs(moved)}`, tone: 'down' };
}

// ── Form ───────────────────────────────────────────────────────────────────

export interface Start {
  label: string;
  position: number | null;
  missed: boolean;
  date: string | null;
  eventName: string | null;
}

const MISSED = /^(MC|CUT|WD|DQ|MDF|DNS|W\/D)$/i;
export const MISSED_FINISH = 70;

/** Parses one element of get_tour_field_form.starts defensively. */
export function parseStart(raw: unknown): Start | null {
  if (raw == null) return null;
  if (typeof raw === 'string' || typeof raw === 'number') {
    const label = String(raw).trim();
    const missed = MISSED.test(label);
    const n = Number(label.replace(/^T/i, ''));
    return { label, position: missed || !Number.isFinite(n) ? null : n, missed, date: null, eventName: null };
  }
  if (typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  const str = (...keys: string[]) => {
    for (const k of keys) if (typeof o[k] === 'string' && (o[k] as string).trim()) return (o[k] as string).trim();
    return null;
  };
  const num = (...keys: string[]) => {
    for (const k of keys) {
      const v = Number(o[k]);
      if (o[k] != null && o[k] !== '' && Number.isFinite(v) && v > 0) return v;
    }
    return null;
  };
  const status = str('status', 'result');
  const labelRaw = str('label', 'pos', 'position_label', 'finish', 'display');
  const position = num('position', 'pos_num', 'finish_position', 'rank');
  const tied = o.tied === true || o.position_tied === true;
  const missed = (labelRaw != null && MISSED.test(labelRaw)) || (status != null && MISSED.test(status));
  const label = labelRaw ?? (missed ? (status ?? 'MC').toUpperCase() : position != null ? `${tied ? 'T' : ''}${position}` : '');
  if (!label) return null;
  const fromLabel = Number(label.replace(/^T/i, ''));
  return {
    label,
    position: missed ? null : position ?? (Number.isFinite(fromLabel) && fromLabel > 0 ? fromLabel : null),
    missed,
    date: str('date', 'end_date', 'start_date'),
    eventName: str('event', 'event_name', 'tournament', 'tournament_name', 'name'),
  };
}

export function parseStarts(raw: unknown): Start[] {
  const arr = Array.isArray(raw) ? raw : [];
  return arr.map(parseStart).filter((s): s is Start => s != null).slice(-5);
}

export function finishValue(s: Start): number {
  return s.missed || s.position == null ? MISSED_FINISH : s.position;
}

export function averageFinish(starts: Start[]): number | null {
  const last = starts.slice(-5);
  if (last.length < 3) return null;
  return last.reduce((sum, s) => sum + finishValue(s), 0) / last.length;
}

export type TileTone = 'win' | 't10' | 't25' | 'other' | 'mc';
export function tileTone(s: Start): TileTone {
  if (s.missed || s.position == null) return 'mc';
  if (s.position === 1) return 'win';
  if (s.position <= 10) return 't10';
  if (s.position <= 25) return 't25';
  return 'other';
}

export interface FormEntry<R> {
  row: R;
  avg: number;
  starts: Start[];
  formRank: number;
}

/** Average over last five (MC/WD/DQ = 70th), minimum three starts, ties by standings rank. */
export function rankByForm<R extends { rank: number }>(rows: R[], startsOf: (r: R) => Start[]): FormEntry<R>[] {
  return rows
    .map((row) => ({ row, starts: startsOf(row).slice(-5), avg: averageFinish(startsOf(row)) }))
    .filter((e): e is { row: R; starts: Start[]; avg: number } => e.avg != null)
    .sort((a, b) => a.avg - b.avg || a.row.rank - b.row.rank)
    .map((e, i) => ({ ...e, formRank: i + 1 }));
}

function daysSince(iso: string, now: Date): number {
  const d = new Date(iso.length === 10 ? `${iso}T12:00:00Z` : iso);
  return (now.getTime() - d.getTime()) / 86_400_000;
}

export function formSentence<R extends { name: string }>(entries: FormEntry<R>[], now = new Date()): string | null {
  const lead = entries[0];
  if (!lead) return null;
  const wins = lead.starts.filter((s) => s.position === 1 && !s.missed).length;
  let out = wins > 0
    ? `${surname(lead.row.name)} has ${numberWord(wins)} ${plural(wins, 'win', 'wins')} from the last five starts.`
    : `${surname(lead.row.name)} has averaged ${ordinal(lead.avg)} over the last five starts.`;
  const recent = entries.find((e) => {
    const last = e.starts[e.starts.length - 1];
    return last?.date != null && daysSince(last.date, now) <= 21;
  });
  if (recent && recent !== lead) {
    out += ` Of the players still teeing it up, ${recent.row.name} is in the best form, averaging ${ordinal(recent.avg)}.`;
  }
  return out;
}

export function fmtShortDate(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso.length === 10 ? `${iso}T12:00:00Z` : iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' });
}

export function fmtWeekdayDate(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso.length === 10 ? `${iso}T12:00:00Z` : iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' }).replace(',', '');
}

// ── Stats ──────────────────────────────────────────────────────────────────

export type StatKind = 'rate' | 'count' | 'rank';
export type GapFamily = 'scoring' | 'sg' | 'distance' | 'pct' | 'earnings' | 'par' | 'dropped' | 'plain';

export interface StatDef {
  key: string;
  label: string;
  unit: string;
  dir: 'asc' | 'desc';
  kind: StatKind;
  gap: GapFamily;
  format: (v: number) => string;
}

const f2 = (v: number) => v.toFixed(2);
const f3 = (v: number) => v.toFixed(3);
const sg = (v: number) => `${v >= 0 ? '+' : '−'}${Math.abs(v).toFixed(2)}`;
const yds = (v: number) => v.toFixed(1);
const pct = (v: number) => `${v.toFixed(1)}%`;
const int = (v: number) => fmtInt(v);
export function fmtMoney(v: number): string {
  const a = Math.abs(v);
  if (a >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}m`;
  if (a >= 1_000) return `$${Math.round(v / 1_000)}k`;
  return `$${Math.round(v)}`;
}
export function fmtToPar(v: number): string {
  if (Math.abs(v) < 0.005) return '0.00';
  return `${v > 0 ? '+' : '−'}${Math.abs(v).toFixed(2)}`;
}

const def = (key: string, label: string, unit: string, dir: 'asc' | 'desc', kind: StatKind, gap: GapFamily, format: (v: number) => string): StatDef =>
  ({ key, label, unit, dir, kind, gap, format });

export const STAT_DEFS: Record<string, StatDef> = {
  scoring_avg: def('scoring_avg', 'Scoring', 'AVG', 'asc', 'rate', 'scoring', f2),
  strokes_gained_total: def('strokes_gained_total', 'SG total', 'SG', 'desc', 'rate', 'sg', sg),
  strokes_gained_tee_green: def('strokes_gained_tee_green', 'SG tee to green', 'SG', 'desc', 'rate', 'sg', sg),
  strokes_gained_putting: def('strokes_gained_putting', 'SG putting', 'SG', 'desc', 'rate', 'sg', sg),
  drive_avg: def('drive_avg', 'Driving distance', 'YDS', 'desc', 'rate', 'distance', yds),
  drive_acc: def('drive_acc', 'Fairways hit', '%', 'desc', 'rate', 'pct', pct),
  gir_pct: def('gir_pct', 'Greens hit', '%', 'desc', 'rate', 'pct', pct),
  scrambling: def('scrambling', 'Scrambling', '%', 'desc', 'rate', 'pct', pct),
  sand_saves_pct: def('sand_saves_pct', 'Sand saves', '%', 'desc', 'rate', 'pct', pct),
  putt_avg: def('putt_avg', 'Putting average', 'AVG', 'asc', 'rate', 'plain', f3),
  birdies_per_round: def('birdies_per_round', 'Birdies per round', 'AVG', 'desc', 'rate', 'plain', f2),
  wins: def('wins', 'Wins', 'WINS', 'desc', 'count', 'plain', int),
  top_10: def('top_10', 'Top-10s', 'TOP 10S', 'desc', 'count', 'plain', int),
  top_25: def('top_25', 'Top-25s', 'TOP 25S', 'desc', 'count', 'plain', int),
  cuts_made: def('cuts_made', 'Cuts made', 'CUTS', 'desc', 'count', 'plain', int),
  earnings: def('earnings', 'Earnings', 'USD', 'desc', 'count', 'earnings', fmtMoney),
  world_rank: def('world_rank', 'World ranking', 'RANK', 'asc', 'rank', 'plain', int),
  bogey_rate: def('bogey_rate', 'Dropped shots', '%', 'asc', 'rate', 'dropped', pct),
  par3: def('par3', 'Par 3s', 'AVG', 'asc', 'rate', 'par', fmtToPar),
  par4: def('par4', 'Par 4s', 'AVG', 'asc', 'rate', 'par', fmtToPar),
  par5: def('par5', 'Par 5s', 'AVG', 'asc', 'rate', 'par', fmtToPar),
};

export const PGA_STAT_ORDER = [
  'scoring_avg', 'strokes_gained_total', 'strokes_gained_tee_green', 'strokes_gained_putting', 'drive_avg', 'drive_acc',
  'gir_pct', 'scrambling', 'sand_saves_pct', 'putt_avg', 'birdies_per_round', 'wins', 'top_10', 'top_25', 'cuts_made',
  'earnings', 'world_rank',
];
export const OTHER_STAT_ORDER = ['scoring_avg', 'birdies_per_round', 'bogey_rate', 'par3', 'par4', 'par5', 'wins', 'world_rank'];
export const PGA_TILE_KEYS = ['scoring_avg', 'strokes_gained_tee_green', 'strokes_gained_putting', 'drive_avg', 'gir_pct', 'earnings'];
export const OTHER_TILE_KEYS = ['scoring_avg', 'birdies_per_round', 'bogey_rate', 'par3', 'par4', 'par5'];

export const RATE_MIN_STARTS = 15;
export const RATE_MIN_ROUNDS = 30;

export interface StatSample {
  value: number | null;
  /** PGA events played (rate qualification on PGA). */
  starts: number | null;
  /** Full rounds from scorecards (rate qualification on other tours). */
  rounds: number | null;
}

/** Rate stats: 15+ starts (PGA) or 30+ full rounds; counts exclude zero; world rank needs a rank. */
export function qualifies(d: StatDef, s: StatSample, isPga: boolean): boolean {
  if (s.value == null || !Number.isFinite(s.value)) return false;
  if (d.kind === 'count') return s.value > 0;
  if (d.kind === 'rank') return s.value > 0;
  return isPga ? (s.starts ?? 0) >= RATE_MIN_STARTS : (s.rounds ?? 0) >= RATE_MIN_ROUNDS;
}

export interface StatEntry<R> {
  row: R;
  value: number;
  display: string;
  rank: number;
  rankLabel: string;
  bar: number;
}

/** Sorted, competition-ranked ("T1" on equal displayed values) with bar widths. */
export function rankStat<R>(d: StatDef, items: Array<{ row: R; value: number }>): StatEntry<R>[] {
  const sorted = [...items].sort((a, b) => (d.dir === 'asc' ? a.value - b.value : b.value - a.value));
  const best = sorted[0]?.value ?? 0;
  const worst = d.kind === 'count' ? 0 : sorted[sorted.length - 1]?.value ?? 0;
  const span = Math.abs(best - worst);
  const out: StatEntry<R>[] = [];
  let prev: string | null = null;
  let prevRank = 0;
  sorted.forEach((it, i) => {
    const display = d.format(it.value);
    const rank = prev !== null && display === prev ? prevRank : i + 1;
    prev = display;
    prevRank = rank;
    const bar = span > 0 ? 4 + 96 * (Math.abs(it.value - worst) / span) : 100;
    out.push({ row: it.row, value: it.value, display, rank, rankLabel: '', bar });
  });
  const counts = new Map<number, number>();
  out.forEach((e) => counts.set(e.rank, (counts.get(e.rank) ?? 0) + 1));
  out.forEach((e) => { e.rankLabel = (counts.get(e.rank) ?? 0) > 1 ? `T${e.rank}` : String(e.rank); });
  return out;
}

function gapPhrase(d: StatDef, gap: number): string {
  switch (d.gap) {
    case 'scoring': return `${gap.toFixed(2)} a round better than`;
    case 'sg': return `${gap.toFixed(2)} clear of`;
    case 'distance': return `${gap.toFixed(1)} yards longer than`;
    case 'pct': return `${gap.toFixed(1)} points ahead of`;
    case 'earnings': return `${fmtMoney(gap)} ahead of`;
    case 'par': return `${gap.toFixed(2)} a hole better than`;
    case 'dropped': return `${gap.toFixed(1)} points fewer than`;
    default: return `${d.kind === 'count' ? fmtInt(gap) : gap.toFixed(2)} clear of`;
  }
}

/** Lower-cases the stat name but keeps acronyms: "Scoring" → "scoring", "SG putting" stays. */
function lowerStat(label: string): string {
  return /^[A-Z]{2}/.test(label) ? label : label.charAt(0).toLowerCase() + label.slice(1);
}

function joinNames(names: string[]): string {
  if (names.length <= 1) return names.join('');
  return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
}

export function statSentence<R extends { name: string }>(d: StatDef, entries: StatEntry<R>[]): string | null {
  const lead = entries[0];
  if (!lead) return null;
  if (d.kind === 'rank') return `${surname(lead.row.name)} is the highest-ranked player here, at No. ${lead.display}.`;
  const shared = entries.filter((e) => e.rank === 1);
  if (d.kind === 'count' && shared.length > 1) {
    return `${shared.length} players share the lead on ${lead.display} ${lowerStat(d.label)}: ${joinNames(shared.map((e) => e.row.name))}.`;
  }
  const second = entries.find((e) => e.rank > 1);
  if (!second) return `${surname(lead.row.name)} leads ${lowerStat(d.label)} at ${lead.display}.`;
  const gap = Math.abs(lead.value - second.value);
  return `${surname(lead.row.name)} leads ${lowerStat(d.label)} at ${lead.display}, ${gapPhrase(d, gap)} ${second.row.name}.`;
}

export function statCaption(d: StatDef, n: number, isPga: boolean): string {
  if (d.kind === 'count') return `${n} players with at least one.`;
  if (d.kind === 'rank') return `${n} players with a world ranking.`;
  return isPga
    ? `${n} players with at least ${RATE_MIN_STARTS} starts this season. Fewer than that and one big week skews the number.`
    : `${n} players with at least ${RATE_MIN_ROUNDS} full rounds this season. Fewer than that and one big week skews the number.`;
}

/** bogey_rate may arrive as a fraction; shown as a percentage. */
export function asPercent(v: number | null | undefined): number | null {
  if (v == null || !Number.isFinite(v)) return null;
  return v <= 1 ? v * 100 : v;
}

// ── Routing ────────────────────────────────────────────────────────────────

export type Lens = 'standings' | 'form' | 'stats';
export const LENSES: Lens[] = ['standings', 'form', 'stats'];
export function parseLens(v: string | null): Lens {
  return v === 'form' || v === 'stats' ? v : 'standings';
}

/** ?tab=leaderboards (and the older player-stats alias) → the full field's Stats lens. */
export function legacyTabRedirect(params: URLSearchParams): URLSearchParams | null {
  const tab = params.get('tab');
  if (tab !== 'leaderboards' && tab !== 'player-stats') return null;
  const next = new URLSearchParams();
  next.set('tab', 'players');
  const tour = params.get('tour');
  if (tour) next.set('tour', tour);
  next.set('view', 'all');
  next.set('lens', 'stats');
  return next;
}

/** /tourhub/season-stats?tour=X → the full field's Stats lens for that tour. */
export function seasonStatsRedirect(search: string): string {
  const tour = new URLSearchParams(search).get('tour');
  return `/tourhub?tab=players${tour ? `&tour=${encodeURIComponent(tour)}` : ''}&view=all&lens=stats`;
}

export function footerCaption(n: number, title: string, updated: string | null, now = new Date()): string {
  let when = '';
  if (updated) {
    const d = new Date(updated);
    if (!Number.isNaN(d.getTime())) {
      const sameDay = d.toDateString() === now.toDateString();
      when = sameDay
        ? ` · updated ${d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })} today`
        : ` · updated on ${d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`;
    }
  }
  return `${n} players with ${title} points${when}`;
}
