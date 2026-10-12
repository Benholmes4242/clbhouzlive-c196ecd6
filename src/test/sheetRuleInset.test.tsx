/**
 * BRIEF_MERGED_CARD_RULE — the 1px rule between the trend and "Last five
 * rounds" inside the merged "How you're playing" card must be INSET, never
 * full-bleed.
 *
 * A rule that reaches the card's own border on both sides is the visual
 * grammar the feed uses BETWEEN two posts: it reads as structure and tells the
 * eye "two cards" — in the one card whose whole purpose is that the index and
 * its last five rounds are a single subject at two resolutions.
 *
 * jsdom lays nothing out, so the guard is the margin itself: the divider
 * element must carry no negative horizontal margin. A future change that
 * re-bleeds it fails here rather than shipping.
 */
import React from 'react';
import { describe, it, expect, beforeAll } from 'vitest';
import { render } from '@testing-library/react';
import { TrendCard } from '@/features/profile-sheet-v2/components/HcpStrip';
import { A } from '@/features/courses/components/holes/analytical/tokens';
import { formBars } from '@/features/profile-sheet-v2/sheetState';

beforeAll(() => {
  (globalThis as any).ResizeObserver = class { observe() {} disconnect() {} };
});

const row = (id: string, play_date: string, diff: number, at: number) => ({
  id, play_date, handicap_differential: diff, handicap_index_at_time: at, is_nine_hole: false,
});

const BARS = formBars([
  row('a', '2026-09-20', 0.5, 1.5),
  row('b', '2026-10-01', 1.9, 1.7),
  row('c', '2026-10-11', 2.4, 1.6),
], 1.4);

const POINTS = [
  { t: '2026-08-01', v: 2.2 },
  { t: '2026-09-01', v: 1.9 },
  { t: '2026-10-01', v: 1.4 },
];

function renderRule() {
  const { container } = render(
    <TrendCard
      points={POINTS}
      windowDays={90}
      onWindow={() => {}}
      fallbackIndex={1.4}
      onNavigate={() => {}}
      bars={BARS}
    />,
  );
  const rule = container.querySelector('[data-form-rule]') as HTMLElement | null;
  expect(rule).not.toBeNull();
  return rule as HTMLElement;
}

describe('BRIEF_MERGED_CARD_RULE — the merged card rule is inset', () => {
  it('carries no negative horizontal margin, in longhand or shorthand', () => {
    const rule = renderRule();
    // jsdom expands the `margin` shorthand into longhands; check both so the
    // guard holds whichever form a future edit writes it in.
    expect(parseFloat(rule.style.marginLeft || '0')).toBeGreaterThanOrEqual(0);
    expect(parseFloat(rule.style.marginRight || '0')).toBeGreaterThanOrEqual(0);
    expect(rule.style.margin).not.toMatch(/-\d/);
  });

  it('keeps the same 1px hairline, same colour, same vertical spacing', () => {
    const rule = renderRule();
    expect(rule.style.height).toBe('1px');
    expect(rule.style.background).toBe(A.TRACK);
    expect(parseFloat(rule.style.marginTop)).toBe(12);
    expect(parseFloat(rule.style.marginBottom)).toBe(11);
  });

  it('still divides the trend from the last five rounds inside the one card', () => {
    const { container } = render(
      <TrendCard
        points={POINTS}
        windowDays={90}
        onWindow={() => {}}
        fallbackIndex={1.4}
        onNavigate={() => {}}
        bars={BARS}
      />,
    );
    const card = container.querySelector('[data-card="handicap"]');
    const rule = card?.querySelector('[data-form-rule]');
    const form = card?.querySelector('[data-form-section]');
    expect(rule).not.toBeNull();
    // The rule and the rounds live in the SAME card — no second card appears.
    expect(container.querySelectorAll('[data-card="handicap"]')).toHaveLength(1);
    expect(form).not.toBeNull();
  });
});
