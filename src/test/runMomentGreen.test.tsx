import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';

import type { CircleRoundRow } from '@/hooks/gam/useCircleLatestRounds';
import type { HoleShape } from '@/components/explore-tab-new/courseled/hooks/useRoundHoleShapes';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (_key: string, fallback?: string) => fallback ?? _key,
    i18n: { language: 'en', resolvedLanguage: 'en' },
  }),
}));

const rows: CircleRoundRow[] = [];

vi.mock('@/components/explore-tab-new/courseled/hooks/useGolfThisWeek', async () => {
  const actual = await vi.importActual<
    typeof import('@/components/explore-tab-new/courseled/hooks/useGolfThisWeek')
  >('@/components/explore-tab-new/courseled/hooks/useGolfThisWeek');
  return {
    ...actual,
    useGolfThisWeek: () => ({ data: rows, isPending: false }),
    usePlayedCourseIds: () => ({ ids: [] as string[] }),
    useWeekScopeCourses: () => ({ ready: true, courseIds: null }),
    useWeekCounts: () => ({ rounds: rows.length, courses: 1 }),
  };
});
vi.mock('@/components/explore-tab-new/courseled/hooks/useCourseCardMeta', () => ({
  useCourseCardMeta: () => ({ data: new Map() }),
}));
vi.mock('@/components/explore-tab-new/courseled/hooks/useRoundHoleShapes', () => ({
  useRoundHoleShapes: () => {
    const map = new Map<string, HoleShape>();
    if (rows.length > 0) {
      const holes = Array.from({ length: 9 }, (_, i) => ({
        holeNo: i + 1,
        par: 4,
        strokes: 4,
      }));
      map.set(rows[0].score_id, {
        series: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        beads: [],
        played: 9,
        birdies: 0,
        holes,
      });
    }
    return map;
  },
}));
vi.mock('@/components/explore-tab-new/courseled/hooks/useFollowingIdSet', () => ({
  useFollowingIdSet: () => ({ data: new Set<string>() }),
}));
vi.mock('@/components/explore-tab-new/courseled/hooks/useWeekRegionCounts', () => ({
  useWeekRegionCounts: () => ({
    matches: () => true,
    groups: [],
    list: [],
    total: rows.length,
  }),
}));
vi.mock('@/hooks/useToggleFollow', () => ({ useToggleFollow: () => ({ mutate: () => {} }) }));
vi.mock('@/context/ActiveActorContext', () => ({ useActiveActor: () => ({ actor: null }) }));
vi.mock('@tanstack/react-query', () => ({ useQueryClient: () => ({ setQueriesData: () => {} }) }));

// eslint-disable-next-line import/first
import { GolfThisWeek } from '@/components/explore-tab-new/courseled/GolfThisWeek';

describe('BRIEF_RUN_GREEN_FIGURE', () => {
  it('renders the run figure and noun in green', () => {
    rows.length = 0;
    rows.push({
      round_id: 'run-1',
      score_id: 'run-1',
      user_id: 'u1',
      display_name: 'Runner',
      profile_photo_url: null,
      is_self: false,
      play_date: '2026-08-20',
      course_id: 'c1',
      course_name: 'Test Links',
      course_par: 72,
      gross: 72,
      stableford_points: null,
      birdies: 0,
      delta_index: null,
    } as unknown as CircleRoundRow);

    const { container } = render(<GolfThisWeek userId="me" onCardPress={() => {}} onSeeAll={() => {}} />);
    const buttons = [...container.querySelectorAll('[role="button"]')] as HTMLElement[];
    const runCard = buttons.find((b) => /Test Links|9\s*PARS\s*IN\s*A\s*ROW/i.test(b.textContent ?? ''));
    expect(runCard).toBeTruthy();
    const text = runCard?.textContent ?? '';
    expect(text).toMatch(/9\s*PARS\s*IN\s*A\s*ROW/i);

    const spans = [...(runCard?.querySelectorAll('span') ?? [])] as HTMLElement[];
    const runSpans = spans.filter((s) => {
      const txt = s.textContent?.trim() ?? '';
      const fs = s.style.fontSize;
      return (txt === '9' && fs === '46px') || /^PARS\s*IN\s*A\s*ROW$/i.test(txt);
    });
    expect(runSpans.length).toBe(2);
    const greens = runSpans.filter((s) => {
      const c = s.style.color;
      return c === 'rgb(74, 222, 128)' || c === '#4ADE80';
    });
    expect(greens.length).toBe(runSpans.length);
  });
});
