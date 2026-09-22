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
import { render, screen } from '@testing-library/react';

import { roundCoursePar } from '@/lib/whs/api';
import { RoundPagePreview } from '@/features/courses/_shared/scorecard/RoundPagePreview';
import { nineSummary } from '@/features/courses/_shared/scorecard/scorecardParts';

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

describe('the round par the head is shown against', () => {
  it('is 72 on a complete eighteen', () => {
    expect(roundCoursePar(rows(18), 18)).toBe(72);
  });

  it('is NULL on ten holes of a declared eighteen — no par, not 40', () => {
    expect(roundCoursePar(rows(10), 18)).toBeNull();
    /* And on a card whose last eight rows exist but were never played. */
    expect(roundCoursePar(rows(18, 10), 18)).toBeNull();
  });

  it('is the real ~35 on a complete nine', () => {
    const nine = rows(9).map((h) => ({ ...h, par: h.holeNo === 9 ? 3 : 4 }));
    expect(roundCoursePar(nine, 9)).toBe(35);
  });

  it('is NULL when the declared length is not available on the path', () => {
    expect(roundCoursePar(rows(18), null)).toBeNull();
  });
});

describe('the preview head prints the par only when the card is whole', () => {
  it('shows par 72 on a complete eighteen and keeps OUT / IN at 36 each', () => {
    render(<RoundPagePreview seed={seed(rows(18), 18)} />);
    expect(screen.getByText(/par 72/i)).toBeTruthy();
    expect(nineSummary(rows(18).slice(0, 9)).par).toBe(36);
    expect(nineSummary(rows(18).slice(9)).par).toBe(36);
  });

  it('shows NO par on ten of eighteen, and the front nine still reads 36', () => {
    render(<RoundPagePreview seed={seed(rows(10), 18)} />);
    expect(screen.queryByText(/par \d+/i)).toBeNull();
    expect(nineSummary(rows(10).slice(0, 9)).par).toBe(36);
  });

  it('shows the nine-hole round its own par', () => {
    const nine = rows(9).map((h) => ({ ...h, par: h.holeNo === 9 ? 3 : 4 }));
    render(<RoundPagePreview seed={seed(nine, 9)} />);
    expect(screen.getByText(/par 35/i)).toBeTruthy();
  });

  it('shows no par when the seed carries no declared length', () => {
    render(<RoundPagePreview seed={seed(rows(18), null)} />);
    expect(screen.queryByText(/par \d+/i)).toBeNull();
  });
});
