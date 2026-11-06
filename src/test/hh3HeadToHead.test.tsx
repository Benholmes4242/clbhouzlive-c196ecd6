// HH3: Head to head sheet DETAIL, the profile entry row and their pure rules.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type React from 'react';

const h = vi.hoisted(() => ({
  shared: null as unknown,
  season: null as unknown,
  recent: [] as unknown[],
  ids: {} as Record<string, { userId: string; name: string; avatarUrl: string | null }>,
}));

vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));
vi.mock('@/utils/analyticsEvents', () => ({ analyticsEvents: { track: vi.fn() } }));
vi.mock('@/lib/whs/hooks', () => ({
  useSharedRounds: () => ({ data: h.shared }),
  useSharedRoundCounts: () => ({ data: {} }),
  useWhsConnection: () => ({ data: { id: 'conn' } }),
}));
vi.mock('@/components/profile/handicap/whs/sections/compare/useCompareIdentities', () => ({
  useCompareIdentities: () => ({ data: h.ids, isFetched: true }),
}));
vi.mock('@/components/profile/handicap/whs/sections/compare/useCompareStats', () => ({
  useCompareStats: () => ({ data: h.season }),
}));
vi.mock('@/components/profile/handicap/whs/sections/compare/useCompareRecent', () => ({
  useCompareRecent: () => h.recent,
}));
vi.mock('@/features/search-v2/hooks/useEntityPickerSearch', () => ({
  useEntityPickerSearch: () => ({ people: [] }),
}));

import { CompareSheet } from '@/components/profile/handicap/whs/sections/compare/CompareSheet';
import { HeadToHeadEntryRow } from '@/components/profile/handicap/whs/sections/compare/HeadToHeadEntryRow';
import { HeroHandicapDisplay } from '@/components/profile/hero/HeroHandicapDisplay';
import { compareBus } from '@/components/profile/handicap/whs/sections/compare/events';
import { entryLine, averages, groupByCourse, recordLeadLine, resolveGroupCourseId, HH_INK, HH_DIM } from '@/components/profile/handicap/whs/sections/compare/headToHeadRules';
import type { SharedRoundResult } from '@/lib/whs/api';

const player = (o: Record<string, unknown> = {}) => ({
  birdies: 0, eagles: 0, albatrosses: 0, aces: 0, sub80_rounds: 0, sub_par_rounds: 0, top100_played: 0, rounds_played: 0,
  lowest_gross: null, best_stableford: null, lowest_net: null, handicap_index: null, delta90: null, last5_avg_vs_par: null, is_hot: false, ...o,
});

function round(course: string, date: string, ug: number, rg: number, us = 30, rs = 30): SharedRoundResult {
  return {
    play_date: date, course_id: course, course_name: `${course} Golf Club`, user_gross: ug, rival_gross: rg,
    user_stableford: us, rival_stableford: rs,
    gross_outcome: ug < rg ? 'W' : ug > rg ? 'L' : 'T', stableford_outcome: us > rs ? 'W' : us < rs ? 'L' : 'T',
  };
}

const busy = Array.from({ length: 7 }, (_, i) => round('A', `2026-10-${String(20 - i).padStart(2, '0')}`, 78, 80 + i));
const results = [...busy, round('B', '2026-11-02', 80, 75), round('B', '2026-09-01', 80, 80), round('C', '2026-08-01', 70, 72), round('C', '2026-07-01', 70, 72), round('C', '2026-06-01', 70, 72)];

function sharedWith(rows: SharedRoundResult[], gross = { wins: 82, losses: 12, ties: 10 }, st = { wins: 32, losses: 61, ties: 11 }) {
  return { shared_rounds_count: rows.length, shared_rounds_last_90d: 0, gross_record: gross, stableford_record: st, shared_round_results: rows };
}

beforeEach(() => {
  h.ids = {
    me: { userId: 'me', name: 'Ben Smith', avatarUrl: 'https://img/me.jpg' },
    them: { userId: 'them', name: 'Thomas Holmes', avatarUrl: 'https://img/them.jpg' },
  };
  h.season = {
    rivalName: 'Thomas Holmes',
    me: player({ birdies: 214, eagles: 4, sub80_rounds: 96, lowest_gross: 70, best_stableford: 42, avg_gross: 78.3, avg_points: 32.4, top100_played: 9, handicap_index: 1.9, course_bests: { A: { gross: 70, points: 41 } } }),
    them: player({ birdies: 163, eagles: 4, sub80_rounds: 31, lowest_gross: 73, best_stableford: 44, avg_gross: 84.6, avg_points: 34.1, top100_played: 6, handicap_index: 5.6, course_bests: { A: { gross: 73, points: 42 } } }),
  };
  h.shared = sharedWith(results);
});
afterEach(cleanup);

const openSheet = () => render(<CompareSheet open onClose={() => {}} viewerUserId="me" initialTargetUserId="them" from="profile" />);
const vsRow = (key: string) => document.querySelector(`[data-hh-vs="${key}"]`) as HTMLElement;
const fig = (row: HTMLElement, side: 'me' | 'them') => row.querySelector(`[data-hh-fig="${side}"]`) as HTMLElement;

describe('HH3 entry line', () => {
  it('n>0 with the viewer lower', () => expect(entryLine(104, 1.9, 5.6)).toBe("104 rounds together \u00B7 You're 3.7 lower"));
  it('n>0 with the viewer higher', () => expect(entryLine(3, 8.2, 5.6)).toBe("3 rounds together \u00B7 You're 2.6 higher"));
  it('n>0 with equal indexes reads level', () => expect(entryLine(2, 5.6, 5.6)).toBe("2 rounds together \u00B7 You're level"));
  it('n=0 reads never played with the gap apart', () => expect(entryLine(0, 1.9, 5.6)).toBe('Never played together \u00B7 3.7 apart'));
});

describe('HH3 entry row', () => {
  it('shows both photos, the wording and emits compare for this member on tap', () => {
    const spy = vi.spyOn(compareBus, 'emit');
    render(<HeadToHeadEntryRow viewerUserId="me" memberUserId="them" memberFirstName="Thomas" viewerIndex={1.9} memberIndex={5.6} />);
    const row = document.querySelector('[data-hh-entry]') as HTMLElement;
    expect(row.tagName).toBe('BUTTON');
    expect(row.querySelectorAll('img')).toHaveLength(2);
    expect(row.querySelector('[data-hh-entry-line]')!.textContent).toBe(entryLine(12, 1.9, 5.6));
    fireEvent.click(row);
    expect(spy).toHaveBeenCalledWith({ targetUserId: 'them', from: 'profile' });
    spy.mockRestore();
  });

  it('sits under the index chart and above Form · last five', () => {
    const t = ((_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '') as unknown as React.ComponentProps<typeof HeroHandicapDisplay>['t'];
    const { container } = render(<HeroHandicapDisplay
      t={t} shownIndex={5.6} deltaLines={[]} slot={null} verdict={null} series={[5, 5.6]} chartColor="currentColor" chartFillTop={0.28}
      axisWindow="90 days" windowDays={90} bars={[{ id: 's1', value: 2 }] as React.ComponentProps<typeof HeroHandicapDisplay>['bars']}
      byId={new Map()} countingKnown={false} countingN={0} loweredN={0} tilesWord="one" isSelf={false}
      onStatTap={() => {}} tap={() => () => {}} afterChart={<div data-testid="entry" />}
    />);
    const all = Array.from(container.querySelectorAll('svg, [data-testid="entry"], button'));
    const chartAt = all.findIndex((n) => n.tagName.toLowerCase() === 'svg');
    const entryAt = all.findIndex((n) => n.getAttribute('data-testid') === 'entry');
    expect(chartAt).toBeGreaterThanOrEqual(0);
    expect(entryAt).toBeGreaterThan(chartAt);
    expect(entryAt).toBeLessThan(all.length - 1); // the form tile button follows it
  });
});

describe('HH3 sheet', () => {
  it('heads show real photos for both sides and the index gap', () => {
    openSheet();
    expect((document.querySelector('[data-hh-head="me"] img') as HTMLImageElement).src).toBe('https://img/me.jpg');
    expect((document.querySelector('[data-hh-head="them"] img') as HTMLImageElement).src).toBe('https://img/them.jpg');
    expect(document.querySelector('[data-hh-gap]')!.textContent).toBe('3.7');
  });

  it('section order is You v, then Together, then Course by course', () => {
    openSheet();
    const order = Array.from(document.querySelectorAll('[data-hh-section]')).map((n) => n.getAttribute('data-hh-section'));
    expect(order).toEqual(['vs', 'together', 'courses']);
    expect(document.querySelectorAll('[data-hh-vs]')).toHaveLength(8);
  });

  it('high-better, low-better and tied rows paint leader and dim correctly', () => {
    openSheet();
    expect(fig(vsRow('birdies'), 'me').style.color).toBe('rgb(248, 250, 252)');
    expect(fig(vsRow('birdies'), 'them').style.fontWeight).toBe('500');
    expect(vsRow('avgGross').dataset.leader).toBe('me');
    expect(fig(vsRow('avgGross'), 'them').style.color).toBe('rgba(248, 250, 252, 0.45)');
    expect(fig(vsRow('bestStableford'), 'them').style.fontWeight).toBe('700');
    expect(fig(vsRow('bestStableford'), 'me').style.fontWeight).toBe('500');
    expect(vsRow('eagles').dataset.leader).toBe('tie');
    expect(fig(vsRow('eagles'), 'me').style.fontWeight).toBe('700');
    expect(fig(vsRow('eagles'), 'them').style.fontWeight).toBe('700');
    expect(HH_INK).toBe('#F8FAFC');
    expect(HH_DIM).toBe('rgba(248,250,252,0.45)');
  });

  it('a missing figure shows a dash and no bar', () => {
    (h.season as { them: Record<string, unknown> }).them.avg_points = null;
    openSheet();
    expect(fig(vsRow('avgPoints'), 'them').textContent).toBe('\u2013');
    expect(vsRow('avgPoints').querySelector('[data-hh-bar]')).toBeNull();
  });

  it('averages use 18-hole rounds only', () => {
    expect(averages([
      { gross_score: 80, stableford_points: 30, holes_played: 18 },
      { gross_score: 41, stableford_points: 18, holes_played: 9 },
      { gross_score: 85, stableford_points: 33, holes_played: null },
    ])).toEqual({ avgGross: 82.5, avgPoints: 31.5 });
  });

  it('scoreboards read 82–12 You lead and 32–61 {First} leads', () => {
    openSheet();
    const g = document.querySelector('[data-hh-board="gross"]') as HTMLElement;
    const s = document.querySelector('[data-hh-board="stableford"]') as HTMLElement;
    expect(g.querySelector('[data-hh-score="me"]')!.textContent).toBe('82');
    expect(g.querySelector('[data-hh-score="them"]')!.textContent).toBe('12');
    expect(g.querySelector('[data-hh-lead]')!.textContent).toBe('You lead');
    expect((g.querySelector('[data-hh-score="them"]') as HTMLElement).style.color).toBe('rgba(248, 250, 252, 0.45)');
    expect(s.querySelector('[data-hh-score="me"]')!.textContent).toBe('32');
    expect(s.querySelector('[data-hh-score="them"]')!.textContent).toBe('61');
    expect(s.querySelector('[data-hh-lead]')!.textContent).toBe('Thomas leads');
    expect(recordLeadLine({ wins: 3, ties: 1, losses: 3 }, 'Thomas')).toBe('All square');
  });

  it('courses group by count, busiest first and open; the toggle opens and closes', () => {
    expect(groupByCourse(results).map((g) => g.courseId)).toEqual(['A', 'C', 'B']);
    openSheet();
    const cards = Array.from(document.querySelectorAll('[data-hh-course]')) as HTMLElement[];
    expect(cards.map((c) => c.dataset.hhCourse)).toEqual(['A', 'C', 'B']);
    expect(cards.map((c) => c.dataset.open)).toEqual(['true', 'false', 'false']);
    const toggle = within(cards[1]).getAllByRole('button')[0];
    fireEvent.click(toggle);
    expect(cards[1].dataset.open).toBe('true');
    fireEvent.click(toggle);
    expect(cards[1].dataset.open).toBe('false');
  });

  it('shows five rounds then "All {n} rounds here" expands the rest in place', () => {
    openSheet();
    const busiest = document.querySelector('[data-hh-course="A"]') as HTMLElement;
    expect(busiest.querySelectorAll('[data-hh-round]')).toHaveLength(5);
    const more = busiest.querySelector('[data-hh-all]') as HTMLElement;
    expect(more.textContent).toContain('All 7 rounds here');
    fireEvent.click(more);
    expect(busiest.querySelectorAll('[data-hh-round]')).toHaveLength(7);
    expect(busiest.querySelector('[data-hh-all]')).toBeNull();
  });

  it('never played together shows the one line and still shows You v', () => {
    h.shared = sharedWith([], { wins: 0, losses: 0, ties: 0 }, { wins: 0, losses: 0, ties: 0 });
    openSheet();
    expect(document.querySelector('[data-hh-never]')!.textContent).toBe("You and Thomas haven't played the same course on the same day yet.");
    expect(document.querySelector('[data-hh-section="vs"]')).not.toBeNull();
    expect(document.querySelector('[data-hh-section="together"]')).toBeNull();
    expect(document.querySelector('[data-hh-board]')).toBeNull();
  });

  it('header reads HEAD TO HEAD and You and {First}', () => {
    openSheet();
    const head = document.querySelector('[data-hh-header]') as HTMLElement;
    expect(head.textContent).toContain('HEAD TO HEAD');
    expect(head.textContent).toContain('You and Thomas');
  });

  it('LIST state is unchanged: search field, no Head to head parts', () => {
    render(<CompareSheet open onClose={() => {}} viewerUserId="me" from="circle" />);
    expect(document.querySelector('input')).not.toBeNull();
    expect(document.querySelector('[data-hh-header]')).toBeNull();
    expect(document.querySelector('[data-hh-detail]')).toBeNull();
  });

  it('H2H_BEST_1: best-here tiles resolve the whs-keyed group to each side\u2019s golf course id', () => {
    h.shared = sharedWith([round('W', '2026-11-01', 80, 82)]);
    h.season = {
      rivalName: 'Thomas Holmes',
      me: player({
        course_bests: { G: { gross: 74, points: 38 } },
        gam_rows: [{ play_date: '2026-11-01', gross_score: 80, course_id: 'G' }],
      }),
      them: player({
        course_bests: { H: { gross: 71, points: 40 } },
        gam_rows: [{ play_date: '2026-11-01', gross_score: 82, course_id: 'H' }],
      }),
    };
    openSheet();
    const card = document.querySelector('[data-hh-course="W"]') as HTMLElement;
    const tiles = Array.from(card.querySelectorAll('[data-hh-course-body] b')).map((b) => b.textContent);
    expect(tiles).toEqual(['74 \u00B7 38 pts', '71 \u00B7 40 pts']);
  });

  it('H2H_BEST_1: a side with no matching gam rows keeps the dash on that side only', () => {
    h.shared = sharedWith([round('W', '2026-11-01', 80, 82)]);
    h.season = {
      rivalName: 'Thomas Holmes',
      me: player({
        course_bests: { G: { gross: 74, points: 38 } },
        gam_rows: [{ play_date: '2026-11-01', gross_score: 80, course_id: 'G' }],
      }),
      them: player({ course_bests: { H: { gross: 71, points: 40 } }, gam_rows: [] }),
    };
    openSheet();
    const card = document.querySelector('[data-hh-course="W"]') as HTMLElement;
    const tiles = Array.from(card.querySelectorAll('[data-hh-course-body] b')).map((b) => b.textContent);
    expect(tiles).toEqual(['74 \u00B7 38 pts', '\u2013 \u00B7 \u2013 pts']);
  });

  it('no amber in any HH3 component (source)', () => {
    const dir = 'src/components/profile/handicap/whs/sections/compare';
    for (const f of ['HeadToHeadDetail.tsx', 'HeadToHeadEntryRow.tsx', 'headToHeadRules.ts', 'CompareSheet.tsx']) {
      const src = readFileSync(resolve(process.cwd(), dir, f), 'utf8');
      expect(src).not.toMatch(/#F7931E/i);
      expect(src).not.toMatch(/\b(CHART|A)\.AMBER\b/);
    }
  });
});
