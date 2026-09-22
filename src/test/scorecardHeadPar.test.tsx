/**
 * BRIEF_SCORECARD_HEAD_PAR — THE ROUND PAR IN THE HEAD HAS ONE SOURCE.
 *
 * The head used to sum par over the rows it happened to hold, so a card walked
 * in after ten holes printed "par 40" against a real par of 72. The round par
 * now comes from roundCoursePar and nowhere else: every hole of the DECLARED
 * length (whs_scores.total_holes) present, played and with a par, or NULL.
 *
 * CardScorecardSheet itself pulls in the whole handicap read path, so the rule
 * is exercised through the head it renders (RoundSummaryHead, shared) and
 * through RoundPagePreview, which is free to mount.
 *
 * The per-nine OUT / IN figures are NOT in question: a complete front nine has
 * a par of 36 and keeps it, whatever the round par does.
 */
import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';

import { roundCoursePar } from '@/lib/whs/api';
import { RoundPagePreview } from '@/features/courses/_shared/scorecard/RoundPagePreview';
import { NohbhMiddle, nineSummary } from '@/features/courses/_shared/scorecard/scorecardParts';
import { RoundCardHoleStrip } from '@/components/profile/handicap/whs/sections/round-card/RoundCardHoleStrip';
import { roundScore } from '@/components/feed/roundGross';
import type { PostRound, PostRoundHole } from '@/hooks/feed/usePostRounds';

const rows = (n: number, playedTo = n) =>
  Array.from({ length: n }, (_, i) => ({
    holeNo: i + 1,
    par: 4,
    strokes: i + 1 <= playedTo ? 5 : null,
    played: i + 1 <= playedTo,
  }));

const seed = (holes: ReturnType<typeof rows>, totalHoles: number | null) => ({
  scoreId: 'sc-1',
  holes,
  totalHoles,
  gross: 50,
  toPar: null,
  courseName: 'Machrihanish',
  placeLine: 'Argyll, Scotland',
  playerName: 'A Member',
  playerAvatarUrl: null,
  playDate: '2026-04-11',
});

const feedHoles = (count: number, playedTo = count): PostRoundHole[] =>
  Array.from({ length: count }, (_, index) => ({
    holeNo: index + 1,
    par: 4,
    gross: index + 1 <= playedTo ? (index === 9 ? 2 : 5) : null,
    lineGross: index + 1 <= playedTo ? (index === 9 ? 2 : 5) : null,
    adjGross: index + 1 <= playedTo ? (index === 9 ? 2 : 5) : null,
    played: index + 1 <= playedTo,
  }));

const feedRound = (
  holeShape: PostRoundHole[] | null,
  totalHoles: number | null,
  overrides: Partial<Pick<PostRound, 'grossScore' | 'coursePar'>> = {},
): Pick<PostRound, 'grossScore' | 'coursePar' | 'holeShape' | 'totalHoles'> => ({
  grossScore: overrides.grossScore ?? 72,
  coursePar: overrides.coursePar ?? 72,
  holeShape,
  totalHoles,
});

const stripRows = (source: ReturnType<typeof rows>) => source.map((hole) => ({
  hole_no: hole.holeNo,
  par: hole.par,
  actual_gross: hole.strokes,
  adjusted_gross: null,
  played: hole.played,
}));

function stripSummary(container: HTMLElement, label: 'OUT' | 'IN'): string {
  const labelNode = Array.from(container.querySelectorAll('div')).find(
    (node) => node.textContent === label,
  );
  return labelNode?.parentElement?.lastElementChild?.textContent ?? '';
}

describe('the round par the head is shown against', () => {
  it('is 72 on a complete eighteen', () => {
    expect(roundCoursePar(rows(18), 18)).toBe(72);
    expect(roundScore(feedRound(feedHoles(18), 18))).toMatchObject({
      gross: 87, toPar: 15, thru: null, source: 'holes',
    });
  });

  it('is NULL on ten holes of a declared eighteen — no par, not 40', () => {
    expect(roundCoursePar(rows(10), 18)).toBeNull();
    /* And on a card whose last eight rows exist but were never played. */
    expect(roundCoursePar(rows(18, 10), 18)).toBeNull();
    expect(roundScore(feedRound(feedHoles(18, 10), 18))).toMatchObject({
      gross: 47, toPar: 7, thru: 10, source: 'holes',
    });
  });

  it('is the real ~35 on a complete nine', () => {
    const nine = rows(9).map((h) => ({ ...h, par: h.holeNo === 9 ? 3 : 4 }));
    expect(roundCoursePar(nine, 9)).toBe(35);
    expect(roundScore(feedRound(feedHoles(9), 9))).toMatchObject({
      gross: 45, toPar: 9, thru: null, source: 'holes',
    });
  });

  it('is NULL when the declared length is not available on the path', () => {
    expect(roundCoursePar(rows(18), null)).toBeNull();
    expect(roundScore(feedRound(feedHoles(10), null))).toMatchObject({
      gross: 47, toPar: null, thru: null, source: 'holes',
    });
  });
});

/* The harness prints the i18n KEY rather than the English line, so the par
   suffix is asserted on `scorecard.parN` and the figure itself on the rule. */
const PAR_SUFFIX = 'scorecard.parN';
const THRU_SUFFIX = 'scorecard.thruN';

describe('the preview head prints the par only when the card is whole', () => {
  it('prints the par suffix on a complete eighteen and keeps OUT / IN at 36 each', () => {
    const { container } = render(<RoundPagePreview seed={seed(rows(18), 18)} />);
    const strip = render(<RoundCardHoleStrip holes={stripRows(rows(18))} />);
    expect(container.textContent).toContain(PAR_SUFFIX);
    expect(roundCoursePar(rows(18), 18)).toBe(72);
    expect(nineSummary(rows(18).slice(0, 9)).par).toBe(36);
    expect(nineSummary(rows(18).slice(9)).par).toBe(36);
    expect(stripSummary(strip.container, 'OUT')).toBe('45+9');
    expect(stripSummary(strip.container, 'IN')).toBe('45+9');
  });

  it('prints thru 10 but NO par on ten of eighteen, and the front nine still reads 36', () => {
    const partial = { ...seed(rows(18, 10), 18), toPar: 2 };
    const { container } = render(<RoundPagePreview seed={partial} />);
    expect(container.textContent).not.toContain(PAR_SUFFIX);
    expect(container.textContent).toContain(THRU_SUFFIX);
    expect(container.textContent).toContain('10');
    expect(container.textContent).toContain('+2');
    expect(nineSummary(partial.holes.slice(0, 9)).par).toBe(36);
    const strip = render(<RoundCardHoleStrip holes={stripRows(partial.holes)} />);
    expect(stripSummary(strip.container, 'OUT')).toBe('45+9');
    expect(stripSummary(strip.container, 'IN')).toBe('5');
  });

  it('prints the par on a complete nine, whose own par is 35', () => {
    const nine = rows(9).map((h) => ({ ...h, par: h.holeNo === 9 ? 3 : 4 }));
    const { container } = render(<RoundPagePreview seed={seed(nine, 9)} />);
    expect(container.textContent).toContain(PAR_SUFFIX);
    expect(container.textContent).not.toContain(THRU_SUFFIX);
    expect(roundCoursePar(nine, 9)).toBe(35);
    expect(nineSummary(nine).par).toBe(35);
    const strip = render(<RoundCardHoleStrip holes={stripRows(nine)} />);
    expect(stripSummary(strip.container, 'OUT')).toBe('45+10');
    expect(strip.container.textContent).not.toContain('IN');
  });

  it('prints no par when the seed carries no declared length', () => {
    const { container } = render(<RoundPagePreview seed={seed(rows(18), null)} />);
    expect(container.textContent).not.toContain(PAR_SUFFIX);
  });
});

describe('the gross-only stat row', () => {
  it('shows gross alone when to-par cannot exist', () => {
    const { container } = render(<NohbhMiddle gross={84} toPar={null} />);
    expect(container.textContent).toContain('84');
    expect(container.textContent).not.toContain('scorecard.toPar');
    expect(container.textContent).not.toContain('\u2014');

    const pickedUp = feedHoles(18);
    pickedUp[7] = { ...pickedUp[7], gross: null, lineGross: 5, adjGross: 5, played: true };
    expect(roundScore(feedRound(pickedUp, 18, { grossScore: 88, coursePar: 72 }))).toEqual({
      gross: 88,
      toPar: 16,
      thru: null,
      source: 'whs',
      unscoredHoles: 1,
    });
  });
});
