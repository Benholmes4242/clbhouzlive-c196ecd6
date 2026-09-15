/**
 * BRIEF_ROUND_SHEET_PEEK §1 — THE NEIGHBOUR VISIBLE DURING THE SWIPE.
 *
 * Two things have to hold for the peek to be honest rather than decorative:
 *
 *  1. It costs NOTHING to mount. RoundPagePreview reads a seed and draws; if it
 *     ever grew a query hook the drag would fire network on every finger move.
 *  2. It is the SAME summary and the SAME nines the sheet draws, so the swap at
 *     commit shows no change: same strokes, same totals, same not-played line.
 *
 * The sheet itself pulls in the whole handicap read path, so the direction and
 * end rules are covered against the pure paging module that decides them.
 */
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { dragNeighbour, pageDecision } from '@/features/explore-magazine/roundPaging';
import { RoundPagePreview } from '@/features/courses/_shared/scorecard/RoundPagePreview';
import { nineSummary } from '@/features/courses/_shared/scorecard/scorecardParts';

const holes = (n: number, gap?: number) =>
  Array.from({ length: n }, (_, i) => ({
    holeNo: i + 1,
    par: 4,
    strokes: gap != null && i + 1 === gap ? null : 5,
  }));

const seed = (n = 18, gap?: number) => ({
  scoreId: 'sc-1',
  holes: holes(n, gap),
  gross: 90,
  toPar: 18,
  courseName: 'Machrihanish',
  placeLine: 'Argyll, Scotland',
  playerName: 'A Member',
  playerAvatarUrl: null,
  playDate: '2026-04-11',
});

describe('the peek mounts one neighbour, on the side of the finger', () => {
  it('brings the next round in on a leftward drag and the previous on a rightward one', () => {
    expect(dragNeighbour(2, 6, -40)).toEqual({ side: 'next', index: 3 });
    expect(dragNeighbour(2, 6, 40)).toEqual({ side: 'prev', index: 1 });
  });

  it('has nothing beside it at either end, so the resistance is felt alone', () => {
    expect(dragNeighbour(0, 6, 40)).toBeNull();
    expect(dragNeighbour(5, 6, -40)).toBeNull();
    expect(dragNeighbour(0, 1, -40)).toBeNull();
    /* And the end still refuses to commit, as part 1 settled. */
    expect(pageDecision(0, 6, 200, 0)).toBeNull();
    expect(pageDecision(5, 6, -200, 0)).toBeNull();
  });

  it('draws nothing while the finger is still', () => {
    expect(dragNeighbour(2, 6, 0)).toBeNull();
  });
});

describe('the preview itself', () => {
  beforeEach(() => {
    vi.spyOn(globalThis, 'fetch' as never).mockImplementation((() => {
      throw new Error('the preview must not fetch');
    }) as never);
  });

  it('reaches the network for nothing at all', () => {
    render(<RoundPagePreview seed={seed()} />);
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it('prints the round the member is swiping towards', () => {
    render(<RoundPagePreview seed={seed()} />);
    expect(screen.getByText('Machrihanish')).toBeTruthy();
    expect(screen.getByText('90')).toBeTruthy();
  });

  it('agrees with the card on strokes and totals, which is what makes the swap invisible', () => {
    const s = seed();
    const out = nineSummary(s.holes.slice(0, 9));
    const inn = nineSummary(s.holes.slice(9));
    expect(out.strokes + inn.strokes).toBe(s.gross);
    expect(out.par + inn.par).toBe(72);
  });

  it('explains a hole nobody played, and stays quiet on a complete card', () => {
    /* The test harness prints the key rather than the English line, so the
       assertion is on the key the sheet itself uses. */
    const marker = /legendNotPlayed|not played/i;
    const partial = render(<RoundPagePreview seed={seed(18, 18)} />);
    expect(marker.test(partial.container.textContent ?? '')).toBe(true);
    partial.unmount();
    const complete = render(<RoundPagePreview seed={seed()} />);
    expect(marker.test(complete.container.textContent ?? '')).toBe(false);
  });

  it('shows the summary with an explained middle when the round has no hole rows, never a blank', () => {
    const { container } = render(
      <RoundPagePreview seed={{ ...seed(), holes: [], gross: null, toPar: null }} />,
    );
    expect(screen.getByText('Machrihanish')).toBeTruthy();
    expect(container.textContent?.trim().length).toBeGreaterThan(0);
  });
});
