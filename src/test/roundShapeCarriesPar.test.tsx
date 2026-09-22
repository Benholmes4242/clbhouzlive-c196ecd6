/**
 * BRIEF_ROUND_SHAPE_CARRIES_PAR — THE PREVIEW READS THE STORED PAR.
 *
 * The swipe preview seeds from useRoundHoleShapes, whose rows are already
 * filtered to played holes — so nothing there could ever prove a card complete
 * and the preview showed NO round par on any round, including the 3,340
 * complete eighteens. The shape now carries gam_round_stats.course_par beside
 * it: already NULL on an incomplete card, so the preview and the settled sheet
 * agree by construction rather than by coincidence.
 */
import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';

import { RoundPagePreview } from '@/features/courses/_shared/scorecard/RoundPagePreview';

/** The harness prints i18n KEYS, so the suffix is asserted on the key. */
const PAR_SUFFIX = 'scorecard.parN';

const rows = (n: number, playedTo = n) =>
  Array.from({ length: n }, (_, i) => ({
    holeNo: i + 1,
    par: 4,
    strokes: i + 1 <= playedTo ? 5 : null,
    /* The seed built from the shapes hook carries only played rows. */
    played: i + 1 <= playedTo,
  }));

const seed = (
  holes: ReturnType<typeof rows>,
  par: number | null,
  totalHoles: number | null = null,
) => ({
  scoreId: 'sc-1',
  holes,
  par,
  totalHoles,
  gross: 84,
  toPar: par != null ? 84 - par : null,
  courseName: 'Machrihanish',
  placeLine: 'Argyll, Scotland',
  playerName: 'A Member',
  playerAvatarUrl: null,
  playDate: '2026-04-11',
});

describe('the swipe preview par', () => {
  it('prints the stored par on a complete eighteen — the settled sheet shows the same 72', () => {
    const { container } = render(<RoundPagePreview seed={seed(rows(18), 72)} />);
    expect(container.textContent).toContain(PAR_SUFFIX);
  });

  it('prints NO par on a ten-of-eighteen card, because the stored par is NULL', () => {
    const { container } = render(
      <RoundPagePreview seed={seed(rows(10), null, null)} />,
    );
    expect(container.textContent).not.toContain(PAR_SUFFIX);
  });

  it('falls back to the one client rule when only a declared length is seeded', () => {
    const { container } = render(
      <RoundPagePreview seed={seed(rows(18), null, 18)} />,
    );
    expect(container.textContent).toContain(PAR_SUFFIX);
  });

  it('still prints no par when neither a stored par nor a length is seeded', () => {
    const { container } = render(
      <RoundPagePreview seed={seed(rows(18), null, null)} />,
    );
    expect(container.textContent).not.toContain(PAR_SUFFIX);
  });
});
