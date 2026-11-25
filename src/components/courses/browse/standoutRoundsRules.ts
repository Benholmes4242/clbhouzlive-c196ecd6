import { ordinal } from '@/lib/text/numbers';
import { fillTemplate, playedOffLabel } from '@/components/courses/course-detail/about/latelyRules';
import type { CoursesStandoutRound, StandoutFeatKind } from './useCoursesStandoutRounds';

/**
 * Standout rounds copy (COURSES_PAGE_STANDOUT_ROUNDS §2). Pure; i18n namespace
 * 'courses', keys under browse.standout.*. Callers pass their `t`; without one
 * the English defaults are used. Copy is person-neutral: never "your"/"their".
 * Lines use <b>…</b> markup for boldParts.
 */
export type StandoutT = (key: string, options: Record<string, unknown> & { defaultValue: string }) => unknown;

const defaultT: StandoutT = (_key, options) => options.defaultValue;

function tr(t: StandoutT, key: string, def: string, values: Record<string, string | number> = {}): string {
  const out = t(`browse.standout.${key}`, { ...values, defaultValue: def });
  return fillTemplate(typeof out === 'string' ? out : def, values);
}

type Row = Pick<CoursesStandoutRound,
  'feat_kind' | 'feat_holes' | 'feat_par' | 'feat_yards' | 'holes_in_one' | 'albatrosses' | 'eagles'
  | 'birdies' | 'longest_birdie_run' | 'stableford_points' | 'course_handicap' | 'gross_score' | 'course_par'>;

const LADDER: StandoutFeatKind[] = ['ace', 'albatross', 'under_par', 'eagle', 'points', 'birdies'];

function earns(row: Row, kind: StandoutFeatKind): boolean {
  switch (kind) {
    case 'ace': return row.holes_in_one >= 1;
    case 'albatross': return row.albatrosses >= 1;
    case 'under_par': return row.gross_score != null && row.course_par != null && row.gross_score < row.course_par;
    case 'eagle': return row.eagles >= 1;
    case 'points': return row.stableford_points != null && row.stableford_points >= 40;
    case 'birdies': return row.birdies >= 5;
    default: return false;
  }
}

/** "the 6th" / "the 4th and 13th" / "the 2nd, 4th and 13th". */
export function holeList(holes: readonly number[], t: StandoutT = defaultT): string {
  const ords = holes.map(ordinal);
  if (ords.length <= 1) return tr(t, 'holesOne', 'the {{a}}', { a: ords[0] ?? '' });
  return tr(t, 'holesMany', 'the {{list}} and {{last}}', { list: ords.slice(0, -1).join(', '), last: ords[ords.length - 1] });
}

export function standoutStamp(row: Row, t: StandoutT = defaultT): string {
  let s: string;
  switch (row.feat_kind) {
    case 'ace': s = row.holes_in_one >= 2 ? tr(t, 'stamp.aceMany', '{{n}} HOLES IN ONE', { n: row.holes_in_one }) : tr(t, 'stamp.ace', 'HOLE IN ONE'); break;
    case 'albatross': s = row.albatrosses >= 2 ? tr(t, 'stamp.albatrossMany', '{{n}} ALBATROSSES', { n: row.albatrosses }) : tr(t, 'stamp.albatross', 'ALBATROSS'); break;
    case 'under_par': s = tr(t, 'stamp.underPar', 'UNDER PAR'); break;
    case 'eagle': s = row.eagles >= 2 ? tr(t, 'stamp.eagleMany', '{{n}} EAGLES', { n: row.eagles }) : tr(t, 'stamp.eagle', 'EAGLE'); break;
    case 'points': s = tr(t, 'stamp.points', '{{n}} POINTS', { n: row.stableford_points ?? '' }); break;
    case 'birdies': s = tr(t, 'stamp.birdies', '{{n}} BIRDIES', { n: row.birdies }); break;
    default: s = '';
  }
  return s.toUpperCase();
}

function onHoles(row: Row, t: StandoutT, many: boolean): string {
  const holes = row.feat_holes ?? [];
  if (holes.length === 0) return '';
  return (many ? ', ' : ' ') + tr(t, 'on', 'on {{holes}}', { holes: holeList(holes, t) });
}

function primary(row: Row, t: StandoutT): string {
  switch (row.feat_kind) {
    case 'ace': {
      if (row.holes_in_one >= 2) return tr(t, 'line.aceMany', '<b>{{n}} holes in one</b>', { n: row.holes_in_one }) + onHoles(row, t, true);
      const on = onHoles(row, t, false);
      const yards = on && row.feat_yards != null ? tr(t, 'line.yards', ', {{n}} yards', { n: row.feat_yards }) : '';
      return tr(t, 'line.ace', '<b>Hole in one</b>') + on + yards;
    }
    case 'albatross': {
      if (row.albatrosses >= 2) return tr(t, 'line.albatrossMany', '<b>{{n}} albatrosses</b>', { n: row.albatrosses }) + onHoles(row, t, true);
      const on = onHoles(row, t, false);
      const par = on && row.feat_par != null ? tr(t, 'line.aPar', ', a par {{n}}', { n: row.feat_par }) : '';
      return tr(t, 'line.albatross', '<b>Albatross</b>') + on + par;
    }
    case 'under_par': {
      const under = (row.course_par ?? 0) - (row.gross_score ?? 0);
      const list = underParFeats(row, t);
      return tr(t, 'line.underPar', '<b>{{n}} under par</b>', { n: under })
        + (list ? tr(t, 'line.with', ', with {{list}}', { list }) : '');
    }
    case 'eagle':
      if (row.eagles >= 2) return tr(t, 'line.eagleMany', '<b>{{n}} eagles</b>', { n: row.eagles }) + onHoles(row, t, true);
      return tr(t, 'line.eagle', '<b>Eagle</b>') + onHoles(row, t, false);
    case 'points': {
      const off = playedOffLabel(row.course_handicap);
      return tr(t, 'line.points', '<b>{{n}} points</b>', { n: row.stableford_points ?? '' })
        + (off != null ? tr(t, 'line.playingOff', ', playing off {{h}}', { h: off }) : '');
    }
    case 'birdies':
      return tr(t, 'line.birdies', '<b>{{n}} birdies</b>', { n: row.birdies })
        + (row.longest_birdie_run >= 3 ? tr(t, 'line.inARow', ', {{n}} in a row', { n: row.longest_birdie_run }) : '');
    default:
      return '';
  }
}

/** Brief 21 D: "A and B" / "A, B and C". */
export function joinFacts(parts: readonly string[], t: StandoutT = defaultT): string {
  if (parts.length <= 1) return parts[0] ?? '';
  return tr(t, 'and', '{{list}} and {{last}}', { list: parts.slice(0, -1).join(', '), last: parts[parts.length - 1] });
}

/** An under-par round's feats, biggest first, zero counts left out. */
function underParFeats(row: Row, t: StandoutT): string {
  const parts: string[] = [];
  if (row.holes_in_one > 0) parts.push(shortFact(row, 'ace', t));
  if (row.albatrosses > 0) parts.push(shortFact(row, 'albatross', t));
  if (row.eagles > 0) parts.push(shortFact(row, 'eagle', t));
  if (row.birdies > 0) parts.push(row.birdies === 1 ? tr(t, 'short.birdie', 'a birdie') : shortFact(row, 'birdies', t));
  return joinFacts(parts, t);
}

function shortFact(row: Row, kind: StandoutFeatKind, t: StandoutT): string {
  switch (kind) {
    case 'ace': return row.holes_in_one >= 2 ? tr(t, 'short.aceMany', '{{n}} holes in one', { n: row.holes_in_one }) : tr(t, 'short.ace', 'a hole in one');
    case 'albatross': return row.albatrosses >= 2 ? tr(t, 'short.albatrossMany', '{{n}} albatrosses', { n: row.albatrosses }) : tr(t, 'short.albatross', 'an albatross');
    case 'under_par': return tr(t, 'short.underPar', '{{n}} under par', { n: (row.course_par ?? 0) - (row.gross_score ?? 0) });
    case 'eagle': return row.eagles >= 2 ? tr(t, 'short.eagleMany', '{{n}} eagles', { n: row.eagles }) : tr(t, 'short.eagle', 'an eagle');
    case 'points': return tr(t, 'short.points', '{{n}} points', { n: row.stableford_points ?? '' });
    case 'birdies': return tr(t, 'short.birdies', '{{n}} birdies', { n: row.birdies });
    default: return '';
  }
}

/** The next feat down the ladder the round also earns, or the points fallback. */
export function standoutSecondary(row: Row, t: StandoutT = defaultT): string {
  const from = LADDER.indexOf(row.feat_kind);
  for (const kind of LADDER.slice(from + 1)) {
    if (row.feat_kind === 'under_par' && kind === 'birdies') continue;
    if (earns(row, kind)) return shortFact(row, kind, t);
  }
  if ((row.feat_kind === 'ace' || row.feat_kind === 'albatross' || row.feat_kind === 'eagle') && row.stableford_points != null) {
    return shortFact(row, 'points', t);
  }
  return '';
}

export function standoutLine(row: Row, t: StandoutT = defaultT): string {
  const head = primary(row, t);
  const next = standoutSecondary(row, t);
  if (row.feat_kind === 'under_par') return head;
  return next ? head + tr(t, 'line.with', ', with {{list}}', { list: next }) : head;
}

/** [region, sub_country] joined, the PhotoFigureCard order. */
export function standoutPlace(row: Pick<CoursesStandoutRound, 'course_region' | 'course_sub_country'>): string {
  return [row.course_region, row.course_sub_country].filter(Boolean).join(', ');
}
