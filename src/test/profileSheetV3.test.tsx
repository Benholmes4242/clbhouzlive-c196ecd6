import React from 'react';
import { describe, it, expect, beforeAll } from 'vitest';
import { render } from '@testing-library/react';
import FormCard from '@/features/profile-sheet-v2/components/FormCard';
import CoursesCard from '@/features/profile-sheet-v2/components/CoursesCard';
import { HcpTrendChart } from '@/components/profile/handicap/whs/charts/HcpTrendChart';
import { A } from '@/features/courses/components/holes/analytical/tokens';
import { identityLine, formBars, courseFigures, lowestRound } from '@/features/profile-sheet-v2/sheetState';

beforeAll(() => {
  (globalThis as any).ResizeObserver = class { observe() {} disconnect() {} };
});

const row = (id: string, play_date: string, diff: number, at: number, nine = false) => ({
  id, play_date, handicap_differential: diff, handicap_index_at_time: at, is_nine_hole: nine,
});

describe('V3 A.2 identity line', () => {
  it('drops the index when there is a club', () => {
    expect(identityLine({ isBusiness: false, club: 'Knebworth', index: 1.6 })).toBe('Knebworth');
  });
  it('keeps the index when there is no club', () => {
    expect(identityLine({ isBusiness: false, club: null, index: 1.6 })).toBe('Playing off 1.6');
  });
});

describe('V3 D form colour follows the effect', () => {
  // Display order is irrelevant; the chain is by play_date.
  const scores = [
    row('c', '2026-10-11', 2.4, 1.6), // +0.8, most recent → current 1.4 → lowered
    row('a', '2026-09-20', 0.5, 1.5), // −1.0, next played off 1.7 → raised
    row('b', '2026-10-01', 1.9, 1.7), // +0.2, next played off 1.6 → lowered
  ];
  const bars = formBars(scores, 1.4);
  it('most recent movement is current index minus index played off', () => {
    expect(bars[2]).toMatchObject({ id: 'c', value: 0.8, movement: -0.2 });
  });
  it('a POSITIVE bar is green when it lowered the index; a NEGATIVE bar is grey when it did not', () => {
    const { container } = render(<FormCard bars={bars} onNavigate={() => {}} />);
    const els = container.querySelectorAll('[data-form-bar]');
    expect(els[0].getAttribute('data-below')).toBe('true');
    expect(els[0].getAttribute('data-lowered')).toBe('false');
    expect(els[2].getAttribute('data-below')).toBe('false');
    expect(els[2].getAttribute('data-lowered')).toBe('true');
  });
  it('the head renders no summary text', () => {
    const { container } = render(<FormCard bars={bars} onNavigate={() => {}} />);
    const text = container.textContent ?? '';
    expect(text).not.toMatch(/better|worse|level|vs index/i);
    expect(text).toContain('Green rounds lowered your index.');
  });
});

describe('V3 E lowest round', () => {
  it('ignores nine-hole rounds and null grosses', () => {
    expect(lowestRound([
      { adjusted_gross: 38, is_nine_hole: true, course: { name: 'Nine' } },
      { adjusted_gross: null, is_nine_hole: false, course: { name: 'Null' } },
      { adjusted_gross: 74, is_nine_hole: false, course: { name: 'Knebworth' } },
      { adjusted_gross: 79, is_nine_hole: false, course: { name: 'Other' } },
    ])).toEqual({ gross: 74, name: 'Knebworth' });
  });
  it('shows an em dash when nothing qualifies', () => {
    const f = courseFigures([{ course_name: 'K', rounds_count: 1, last_played: null, avg_to_par: 1 }],
      [{ adjusted_gross: 38, is_nine_hole: true }]);
    const { container } = render(<CoursesCard figures={f} onOpen={() => {}} />);
    expect(container.textContent).toContain('Lowest round');
    expect(container.textContent).toContain('\u2014');
  });
});

describe('V3 C HcpTrendChart simplified prop', () => {
  const pts = [{ t: '2026-08-01', v: 2.2 }, { t: '2026-08-20', v: 2.6 }, { t: '2026-09-10', v: 1.2 }, { t: '2026-10-01', v: 1.6 }] as any;
  it('renders exactly three marks, one stroke colour, no labels', () => {
    const { container } = render(<HcpTrendChart points={pts} width={300} height={96} simplified />);
    expect(container.querySelectorAll('circle')).toHaveLength(3);
    expect(container.querySelectorAll('text')).toHaveLength(0);
    expect(container.querySelectorAll('linearGradient')).toHaveLength(1);
    const strokes = [...container.querySelectorAll('path')].map((p) => p.getAttribute('stroke')).filter(Boolean);
    expect(strokes).toEqual([A.IMPROVED]);
  });
  it('is unchanged without the prop (zones and labels)', () => {
    const { container } = render(<HcpTrendChart points={pts} width={300} height={96} />);
    expect(container.querySelectorAll('linearGradient')).toHaveLength(2);
    expect(container.querySelectorAll('text').length).toBe(2);
  });
});
