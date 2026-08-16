/**
 * BRIEF_ECHO_CADDIE §4 — THE ANSWER PANELS.
 *
 * ONE IDEA PER PANEL, AND EACH PANEL IS A DIFFERENT IDEA. This module is the
 * load-bearing part of the design, so read the honest position first:
 *
 * WHAT ECHO ACTUALLY RETURNS. `echo-intelligence-v2` streams ONE BLOCK OF PROSE
 * (weighted synthesis of several engines, plus a STRENGTH line the client
 * strips). There is no structured, per-idea response contract, and the brief
 * says the model does not change. So the panels come from two places:
 *
 *   1. DERIVED PANELS — real, separate ideas computed from the member's own
 *      data (`gam_user_courses` + `get_my_hole_performance`): the worst hole,
 *      where the strokes actually go, and the late fade. Each carries ONE hero
 *      figure, ONE chart or figure group, ONE line of advice and its BASIS.
 *      These are genuinely different ideas, not chapters.
 *
 *   2. ECHO'S OWN WORDS — the prose split on paragraph boundaries, one panel per
 *      paragraph, capped. A paragraph is the closest thing to "one idea" the
 *      model gives us. Where a paragraph contains a figure we lift it to hero
 *      scale; where it does not, the lead sentence is the hero at word scale.
 *
 * §4.2 IF ECHO ONLY HAS ONE IDEA IT RENDERS ONE PANEL AND NO DOTS. Nothing here
 * pads to three. Do not add a filler panel.
 */

import type { UserAnalyticsCourse } from '@/hooks/gam/useUserAnalyticsCourses';
import type { MyHolePerformanceRow } from '@/hooks/gam/useMyHolePerformance';
import type { HoleDatum } from '../components/HolesBar';

export interface CaddiePanel {
  id: string;
  eyebrow: string;
  /** The one hero figure. Numeric hero when `heroFigure`, words otherwise. */
  hero: string;
  heroFigure: boolean;
  /** Amber ONLY when the hero is the member's own figure (§7). */
  heroIsMine: boolean;
  /** ONE chart, or ONE figure group. Never both. */
  chart?: { holes: HoleDatum[]; highlight: number | null };
  figures?: Array<{ label: string; value: string; mine?: boolean }>;
  /** §4.5 the advice line says what to DO about the figure. */
  advice: string;
  /** §4.4 every panel carries its basis. */
  basis: string;
}

const MAX_PANELS = 5;

function signed(v: number, digits = 1): string {
  const f = Math.pow(10, digits);
  const r = Math.round(v * f) / f;
  if (r > 0) return `+${r.toFixed(digits)}`;
  if (r < 0) return `\u2212${Math.abs(r).toFixed(digits)}`;
  return 'E';
}

function basisFor(rounds: number, courseName: string | null): string {
  const r = `Your ${rounds} round${rounds === 1 ? '' : 's'}`;
  return courseName ? `${r} at ${courseName}` : `${r}`;
}

/**
 * DERIVED IDEAS. Each one is only produced when the data behind it exists —
 * there is no placeholder panel and no fabricated figure.
 */
export function derivedPanels(
  row: UserAnalyticsCourse | null,
  holes: MyHolePerformanceRow[],
  courseName: string | null,
): CaddiePanel[] {
  if (!row || row.rounds_count <= 0) return [];
  const basis = basisFor(row.rounds_count, courseName);
  const out: CaddiePanel[] = [];

  const holeData: HoleDatum[] = holes
    .filter((h) => Number.isFinite(h.avg_to_par))
    .sort((a, b) => a.hole_no - b.hole_no)
    .map((h) => ({ holeNo: h.hole_no, avgToPar: Number(h.avg_to_par) }));

  // IDEA 1 — the worst hole.
  if (row.hardest_hole_no != null && row.hardest_hole_avg != null) {
    out.push({
      id: 'worst-hole',
      eyebrow: 'Your worst hole',
      hero: signed(Number(row.hardest_hole_avg)),
      heroFigure: true,
      heroIsMine: true,
      chart: holeData.length ? { holes: holeData, highlight: row.hardest_hole_no } : undefined,
      advice: `Play the ${ordinal(row.hardest_hole_no)} for a bogey and take the tee shot that keeps you in play, not the one that saves a stroke.`,
      basis,
    });
  }

  // IDEA 2 — where the strokes actually go. A different idea, not more of one.
  if (row.bogeys_plus_pct != null && row.pars_pct != null) {
    out.push({
      id: 'where-strokes-go',
      eyebrow: 'Where the strokes go',
      hero: `${Math.round(Number(row.bogeys_plus_pct))}%`,
      heroFigure: true,
      heroIsMine: true,
      figures: [
        { label: 'Bogey+', value: `${Math.round(Number(row.bogeys_plus_pct))}%`, mine: true },
        { label: 'Par', value: `${Math.round(Number(row.pars_pct))}%`, mine: true },
        { label: 'Birdie', value: `${Math.round(Number(row.birdies_pct ?? 0))}%`, mine: true },
      ],
      advice:
        Number(row.bogeys_plus_pct) >= 45
          ? 'Cut the doubles before chasing birdies — the scorecard is being decided by the holes you drop, not the ones you win.'
          : 'Hold this pattern and take the birdie chances the par fives give you.',
      basis,
    });
  }

  // IDEA 3 — the late fade. Only when both nines have hole data.
  const front = holeData.filter((h) => h.holeNo <= 9);
  const back = holeData.filter((h) => h.holeNo >= 10);
  if (front.length >= 9 && back.length >= 9) {
    const f = front.reduce((s, h) => s + h.avgToPar, 0);
    const b = back.reduce((s, h) => s + h.avgToPar, 0);
    const delta = b - f;
    if (Math.abs(delta) >= 0.5) {
      out.push({
        id: 'nines',
        eyebrow: delta > 0 ? 'The late fade' : 'The slow start',
        hero: signed(delta),
        heroFigure: true,
        heroIsMine: true,
        figures: [
          { label: 'Front', value: signed(f), mine: true },
          { label: 'Back', value: signed(b), mine: true },
        ],
        advice:
          delta > 0
            ? 'Eat at the turn and plan the back nine off the tenth tee — the strokes are going late, not early.'
            : 'Give the first three holes a warm-up club and a conservative line; the round settles after that.',
        basis,
      });
    }
  }

  return out;
}

function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return `${n}${s[(v - 20) % 10] ?? s[v] ?? s[0]}`;
}

/** Strips markdown ornament the surface no longer draws. */
function clean(s: string): string {
  return s
    .replace(/^#{1,6}\s*/g, '')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/^[-*•]\s*/gm, '')
    .replace(/`/g, '')
    .trim();
}

const FIGURE = /(?:^|\s)([+\u2212-]?\d+(?:\.\d+)?(?:%|\s?(?:strokes?|shots?|yards?|yds))?)(?=$|[\s.,;:)])/;

/**
 * ECHO'S OWN WORDS, one paragraph per panel. Paragraphs shorter than a clause
 * are folded into the previous one rather than becoming a panel of their own.
 */
export function prosePanels(text: string, basis: string): CaddiePanel[] {
  const paras = clean(text)
    .split(/\n{2,}|\n(?=[A-Z])/)
    .map((p) => p.replace(/\s+/g, ' ').trim())
    .filter((p) => p.length > 0);

  const merged: string[] = [];
  for (const p of paras) {
    if (p.length < 60 && merged.length > 0) merged[merged.length - 1] += ` ${p}`;
    else merged.push(p);
  }

  return merged.slice(0, MAX_PANELS).map((p, i) => {
    const sentences = p.match(/[^.!?]+[.!?]?/g)?.map((s) => s.trim()).filter(Boolean) ?? [p];
    const lead = sentences[0] ?? p;
    const rest = sentences.slice(1).join(' ').trim();
    const fig = lead.match(FIGURE)?.[1] ?? null;
    return {
      id: `echo-${i}`,
      eyebrow: i === 0 ? 'Echo' : 'And then',
      hero: fig ?? lead,
      heroFigure: !!fig,
      // Echo's reading of the member's data is not the member's own figure, so
      // it never takes amber (§7).
      heroIsMine: false,
      advice: fig ? lead : rest || lead,
      basis,
    };
  });
}

export function buildPanels(args: {
  answerText: string | null;
  row: UserAnalyticsCourse | null;
  holes: MyHolePerformanceRow[];
  courseName: string | null;
}): CaddiePanel[] {
  const { answerText, row, holes, courseName } = args;
  const basis = row && row.rounds_count > 0 ? basisFor(row.rounds_count, courseName) : 'Course and tour data';
  const echo = answerText ? prosePanels(answerText, basis) : [];
  const derived = derivedPanels(row, holes, courseName);
  // Echo answers first, then the figures that back the reading. Deduped by id,
  // capped — never padded.
  return [...echo, ...derived].slice(0, MAX_PANELS);
}
