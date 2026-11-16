// @vitest-environment jsdom
/** BRIEF_LAST_FIVE_COUNTING: green means the round counts towards the index. */
import React from 'react';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { createInstance } from 'i18next';
import { HeroHandicapDisplay } from '@/components/profile/hero/HeroHandicapDisplay';
import type { FormBar } from '@/features/profile-sheet-v2/sheetState';

const ids = ['a', 'b', 'c', 'd', 'e'];
const dates = ['2026-10-18', '2026-10-30', '2026-11-04', '2026-11-06', '2026-11-12'];
const bars: FormBar[] = ids.map((id, i) => ({ id, date: dates[i], value: i === 1 ? -0.6 : 0.5, movement: i === 1 ? -0.3 : 0.1 }));
const series = [{ value: 1.9, observed_at: '2026-08-18' }, { value: 1.2, observed_at: '2026-10-16' }, { value: 1.9, observed_at: '2026-11-16' }];
const byId = new Map(ids.map((id) => [id, { gross_score: 75, course_name: 'Sundridge Park Golf Club (East)' }]));
const english = createInstance(); void english.init({ lng: 'en' });
const css = readFileSync('src/components/profile/hero/profile-form.css', 'utf8');
const show = (counting: string[], over: Partial<React.ComponentProps<typeof HeroHandicapDisplay>> = {}) => render(
  <HeroHandicapDisplay t={english.getFixedT('en', 'profile')} shownIndex={1.9} deltaLines={[]} slot={null} verdict={null} series={series}
    chartColor="currentColor" chartFillTop={0.16} axisWindow="90 days" windowDays={90} bars={bars} byId={byId}
    countingKnown countingN={counting.length} countingIds={new Set(counting)} tilesWord="five" isSelf
    onStatTap={() => {}} tap={() => () => {}} {...over} />);
const sentence = (c: HTMLElement) => c.querySelector('[data-counting-sentence]')?.textContent ?? null;

describe('Last five rounds counting marks', () => {
  it('a counting round has a green tile dot and line dot; others are white; the figure is always dim', () => {
    const { container } = show(['c']);
    for (const id of ids) {
      const want = id === 'c' ? 'true' : 'false';
      expect(container.querySelector(`[data-form-round="${id}"]`)?.getAttribute('data-counts')).toBe(want);
      const dot = container.querySelector(`[data-form-round-dot="${id}"]`);
      if (dot) expect(dot.getAttribute('data-counts')).toBe(want);
    }
    expect(container.querySelector('[data-form-round-dot="c"]')).not.toBeNull();
    expect(container.querySelector('[data-lowered]')).toBeNull();
    expect(css).toMatch(/\.profile-form-round\[data-counts=true\] \.profile-form-dot \{ background:var\(--profile-form-green\); \}/);
    expect(css).toMatch(/\.profile-index-round-dot\[data-counts=true\] \{ background:var\(--profile-form-green\); \}/);
    expect(css).not.toMatch(/\.profile-form-figure \{[^}]*green|\] \.profile-form-figure/);
  });
  it.each([
    [[], 'None of these five counts towards your index.'],
    [['c'], 'One of these five counts towards your index: the green one.'],
    [['b', 'c'], 'Two of these five count towards your index: the green ones.'],
    [ids, 'All five count towards your index.'],
  ])('sentence for %j counting', (counting, text) => {
    expect(sentence(show(counting as string[]).container)).toBe(text);
  });
  it('another member reads "{first name}\'s index"', () => {
    expect(sentence(show(['c'], { isSelf: false, ownerFirstName: 'Ben' }).container)).toBe("One of these five counts towards Ben's index: the green one.");
  });
  it('unknown counting shows no sentence, no green and no lowered line', () => {
    const { container } = show(['c'], { countingKnown: false, countingN: 0 });
    expect(sentence(container)).toBeNull();
    expect(container.querySelectorAll('[data-counts="true"]')).toHaveLength(0);
    expect(container.textContent).not.toContain('lowered');
  });
});
