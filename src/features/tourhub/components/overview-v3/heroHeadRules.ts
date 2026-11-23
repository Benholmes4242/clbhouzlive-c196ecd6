/**
 * Brief 16 — hero band head titles. Pure: one exported function per section,
 * each fed only data its section already loads. Grammar shared by all:
 *  - names are surnames (callers pass surnameOf output);
 *  - counts 2–9 are words (titleCountWords), 10+ numerals, and 1 is the
 *    locale's singular string (_one keys, or heroHead.one mid-sentence);
 *  - round numbers in titles are words ("round three"); holes, positions,
 *    scores, points and times stay numerals.
 * Every key lives under overview.heroHead in all six locales.
 */
import { titleCountWords } from './overviewTokens';

export type T = (key: string, opts?: Record<string, unknown>) => string;
const k = (key: string) => `overview.heroHead.${key}`;
const lower = (s: string) => s.toLocaleLowerCase();
/** Mid-sentence count word: "one", "three", "14". */
export function midWord(n: number, t: T): string {
  return n === 1 ? t(k('one')) : lower(titleCountWords(n, t));
}
const pair = (t: T, a: string, b: string) => t(k('pair'), { a, b });
const OUT = new Set(['MC', 'CUT', 'WD', 'DQ', 'DNS', 'MDF']);

/* a) Biggest movers */
export function moversTitle(t: T, cards: { name: string; delta: number }[]): string {
  const sorted = cards.filter(c => c.delta !== 0).sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));
  const [top, next] = sorted;
  if (!top) return '';
  const n = Math.abs(top.delta);
  const dir = top.delta > 0 ? 'up' : 'down';
  const name = next && Math.abs(next.delta) === n && Math.sign(next.delta) === Math.sign(top.delta) ? pair(t, top.name, next.name) : top.name;
  return t(k(`movers.${dir}`), { count: n, name, words: midWord(n, t) });
}

/* b) Leaderboard */
export interface BoardLine { name: string; score: number | null | undefined; status?: string | null }
export function leaderboardTitle(t: T, rows: BoardLine[]): string {
  const active = rows.filter(r => r.score != null && Number.isFinite(r.score) && !OUT.has((r.status ?? '').toUpperCase())) as { name: string; score: number }[];
  if (!active.length) return '';
  const lead = Math.min(...active.map(r => r.score));
  const leaders = active.filter(r => r.score === lead);
  if (leaders.length === 2) return t(k('board.shareTwo'), { a: leaders[0].name, b: leaders[1].name });
  if (leaders.length >= 3) return t(k('board.shareMany'), { count: leaders.length, words: titleCountWords(leaders.length, t) });
  const close = active.filter(r => r.score !== lead && r.score - lead <= 3);
  if (close.length === 0) return t(k('board.nobody'), { leader: leaders[0].name });
  if (close.length === 1) return t(k('board.within_one'), { count: 1, name: close[0].name });
  return t(k('board.within_other'), { count: close.length, words: titleCountWords(close.length, t) });
}

/* c) Leaders' group */
export type LeadersHeadState = 'onCourse' | 'suspended' | 'before' | 'delayed' | 'finished';
export function leadersGroupTitle(t: T, input: { names: string[]; leaderName: string; state: LeadersHeadState; thru: number | null; tee: { day: string | null; time: string } | null }): string {
  const group = input.names.length >= 3;
  const name = input.names.length === 2 ? pair(t, input.names[0], input.names[1]) : group ? t(k('leaders.group'), { name: input.leaderName }) : (input.names[0] ?? input.leaderName);
  switch (input.state) {
    case 'onCourse': return t(k('leaders.through'), { name, thru: input.thru ?? '' });
    case 'suspended': return t(k('leaders.stopped'), { name, thru: input.thru ?? '' });
    case 'delayed': return t(k('leaders.delayed'), { name });
    // Brief 16 continuation: a singular subject (one name, or "{surname}'s group") takes the singular verb.
    case 'finished': return input.names.length === 2 ? t(k('leaders.finished'), { name }) : t(k('leaders.groupFinished'), { name });
    default: {
      if (!input.tee) return name;
      const one = input.names.length !== 2 ? 'One' : '';
      return input.tee.day ? t(k(`leaders.teeOffDay${one}`), { name, day: input.tee.day, time: input.tee.time }) : t(k(`leaders.teeOff${one}`), { name, time: input.tee.time });
    }
  }
}

/* d) Course, live */
export function liveCourseTitle(t: T, total: number, played: boolean): { title: string; level: boolean } {
  const verb = played ? 'played' : 'playing';
  if (Math.round(total * 100) === 0) return { title: t(k(`course.${verb}Level`)), level: true };
  return { title: t(k(`course.${verb}`), { value: Math.abs(total).toFixed(2), dir: t(k(`course.${total < 0 ? 'under' : 'over'}`)) }), level: false };
}

/* n) Course, upcoming (and live before the tee / without averages) */
export function courseLeadTitle(t: T, par: number, yards: number): string {
  return t(k('course.lead'), { par, yards: yards.toLocaleString('en-GB') });
}
export function par5Sentence(t: T, count: number): string {
  if (count === 0) return t(k('course.par5s_zero'));
  return t(k('course.par5s'), { count, words: titleCountWords(count, t) });
}

/* e) Our picks, live — the intro, title-shaped */
export type PicksIntro = { kind: 'leads'; name: string } | { kind: 'level'; name: string; pos: string } | { kind: 'behind'; name: string; pos: string; gap: number };
export function livePicksTitle(t: T, intro: PicksIntro): string {
  if (intro.kind === 'leads') return t(k('picks.leads'), { name: intro.name });
  if (intro.kind === 'level') return t(k('picks.level'), { name: intro.name, pos: intro.pos });
  return t(k('picks.behind'), { count: intro.gap, name: intro.name, pos: intro.pos, words: midWord(intro.gap, t) });
}
export type PicksEyebrowState = 'inPlay' | 'final' | 'suspended' | 'delayed' | 'plain';
export function livePicksEyebrow(t: T, state: PicksEyebrowState, round: number): { text: string; live: boolean } {
  switch (state) {
    case 'inPlay': return { text: t(k('picks.eyebrowRound'), { round }), live: true };
    case 'final': return { text: t(k('picks.eyebrowFinalRound')), live: true };
    case 'suspended': return { text: t(k('picks.eyebrowSuspended')), live: false };
    case 'delayed': return { text: t(k('picks.eyebrowDelayed')), live: false };
    default: return { text: t(k('picks.eyebrow')), live: false };
  }
}
export function picksEyebrowState(stage: string, roundState?: { delayedRound?: number | null; afterRound?: number | null; notStarted?: boolean } | null): PicksEyebrowState {
  if (roundState?.delayedRound != null) return 'delayed';
  if (stage === 'suspended') return 'suspended';
  if (roundState?.afterRound != null || roundState?.notStarted || stage === 'between' || stage === 'beforeTee') return 'plain';
  return stage === 'final' ? 'final' : 'inPlay';
}

/* o) Our picks, upcoming */
export function upcomingPicksTitle(t: T, count: number, first: { name: string; weekday: string; time: string } | null): string {
  if (first) return t(k('picks.offFirst'), first);
  return t(k('picks.toCome'), { count, words: titleCountWords(count, t) });
}

/* k) Our picks, finished */
export function finishedPicksTitle(bold: string): string {
  return bold.trim().replace(/\.$/, '');
}

/* f) Tee times */
export function teeTimesTitle(t: T, groups: { startingHole: number | null | undefined }[]): string {
  const n = groups.length;
  if (!n) return '';
  const tenth = groups.filter(g => g.startingHole === 10).length;
  const key = tenth === 0 ? 'first' : tenth === n ? 'tenth' : 'both';
  return t(k(`tees.${key}`), { count: n, words: titleCountWords(n, t) });
}

/* g) How it was won (also m, chart variant) */
export function wonTitle(t: T, lines: { name: string; champion: boolean; values: number[] }[], rounds: number): string {
  const champ = lines.find(l => l.champion);
  if (!champ || rounds < 2) return '';
  let led: { name: string; round: number } | null = null;
  let close: { name: string; round: number; gap: number } | null = null;
  for (const line of lines) {
    if (line.champion) continue;
    for (let r = 1; r <= rounds - 1; r++) {
      const a = line.values[r - 1], c = champ.values[r - 1];
      if (a == null || c == null) continue;
      const gap = a - c;
      if (gap < 0) { if (!led || r > led.round) led = { name: line.name, round: r }; continue; }
      if (!close || gap < close.gap || (gap === close.gap && r > close.round)) close = { name: line.name, round: r, gap };
    }
  }
  if (led) return t(k('won.led'), { name: led.name, round: midWord(led.round, t) });
  if (!close) return '';
  if (close.gap === 0) return t(k('won.level'), { name: close.name, round: midWord(close.round, t) });
  if (close.gap <= 3) return t(k('won.within'), { name: close.name, gap: midWord(close.gap, t), round: midWord(close.round, t) });
  return t(k('won.nobody'), { gap: midWord(close.gap, t) });
}

/* h) Hole type */
export function holeTypeTitle(t: T, types: { par: number; to_par: number; rank: number; tied: boolean }[] | null | undefined): string {
  if (!types?.length) return '';
  const best = [...types].sort((a, b) => a.rank - b.rank || a.to_par - b.to_par || b.par - a.par)[0];
  const par = best.par;
  if (best.rank === 1) return t(k(best.tied ? 'holeType.jointBest' : 'holeType.best'), { par });
  const rank = best.rank <= 9 ? t(k(`ordinals.${best.rank}`)) : ordinalNum(best.rank);
  return best.tied ? t(k('holeType.jointRank'), { rank: best.rank <= 9 ? lower(rank) : rank, par }) : t(k('holeType.rank'), { rank, par });
}
function ordinalNum(n: number): string {
  const s = n % 100 >= 11 && n % 100 <= 13 ? 'th' : ({ 1: 'st', 2: 'nd', 3: 'rd' } as Record<number, string>)[n % 10] ?? 'th';
  return `${n}${s}`;
}

/* i) The top three (also m, list variant) */
export function runnerUpTitle(t: T, rows: { name: string; total: number; champion: boolean }[], playoff: boolean): string {
  const champ = rows.find(r => r.champion);
  const others = rows.filter(r => !r.champion);
  if (!champ || !others.length) return '';
  if (playoff) {
    const lost = others.filter(r => r.total === champ.total);
    if (lost.length === 1) return t(k('top.lostOne'), { name: lost[0].name });
    if (lost.length === 2) return t(k('top.lostTwo'), { a: lost[0].name, b: lost[1].name });
    if (lost.length > 2) return t(k('top.lostMany'), { count: lost.length, words: titleCountWords(lost.length, t) });
  }
  const best = Math.min(...others.map(r => r.total));
  const second = others.filter(r => r.total === best);
  if (second.length === 1) {
    const gap = best - champ.total;
    return t(k('top.second'), { count: gap, name: second[0].name, words: midWord(gap, t) });
  }
  if (second.length === 2) return t(k('top.tieTwo'), { a: second[0].name, b: second[1].name });
  return t(k('top.tieMany'), { count: second.length, words: titleCountWords(second.length, t) });
}
/** "−12" / "-12" / "+3" / "E" → number; null when unreadable. */
export function numericScore(s: string | null | undefined): number | null {
  const v = (s ?? '').trim().replace('\u2212', '-');
  if (!v) return null;
  if (/^e(ven)?$/i.test(v)) return 0;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

/* j) The week */
export function weekTitle(t: T, cut: { line: number; made: number } | null | undefined, fieldSize: number | null | undefined, fmt: (n: number) => string): string {
  if (cut) return t(k('week.cut'), { count: cut.made, words: titleCountWords(cut.made, t), score: fmt(cut.line) });
  if (fieldSize) return t(k('week.noCut'), { count: fieldSize, words: titleCountWords(fieldSize, t) });
  return t(k('week.none'));
}

/* l) Your players */
export function yourPlayersTitle(t: T, count: number): string {
  return t(k('yourPlayers'), { count, words: titleCountWords(count, t) });
}

/* p) The season */
export function seasonTitle(t: T, winners: number, events: number): string {
  return t(k('season.winners'), { count: winners, words: titleCountWords(winners, t), events: t(k('season.events'), { count: events, words: midWord(events, t) }) });
}

/* q) The points list */
export function pointsTitle(t: T, rows: { name: string; points: number | null }[], fmt: (n: number) => string): string {
  const [first, second] = rows;
  if (!first) return '';
  if (!second || first.points == null || second.points == null) return t(k('points.topped'), { name: first.name });
  const gap = first.points - second.points;
  if (gap === 0) return t(k('points.level'), { a: first.name, b: second.name });
  return t(k('points.clear'), { count: Math.round(gap), name: first.name, points: fmt(gap) });
}

/* r) The card line */
export function cardsTitle(t: T, n: number, youngest: { name: string; age: number } | null): string {
  if (youngest) return t(k('cards.youngest'), { name: youngest.name, age: youngest.age, n: midWord(n, t) });
  return t(k('cards.decided'), { count: n, words: titleCountWords(n, t) });
}

/* s) Our picks, season */
export function seasonPicksTitle(t: T, won: number, top10: number): string {
  if (won >= 2) return t(k('record.won'), { words: midWord(won, t) });
  if (won === 1) return t(k('record.wonOne'));
  if (top10 > 0) return t(k('record.top10'), { top10: midWord(top10, t) });
  return t(k('record.none'));
}
