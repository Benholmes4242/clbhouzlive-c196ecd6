import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

/**
 * BRIEF_TOP_TEN_OWNER_NAME_LABEL — the render case for the score label.
 *
 * Mocks copied in full from topTenTileWidth.test.tsx (the existing Top 10 render
 * test). One addition there is not: this t also honours a STRING second argument,
 * because the component calls t('topTen.you', 'You') and react-i18next treats that
 * string as the default value — without it every label in the rail renders empty.
 */
const h = vi.hoisted(() => {
  const courses = [
    { id: 't1', course_id: 'c1', position: 1, name: 'Royal County Down', sub_country: 'Northern Ireland', region: null, country: 'United Kingdom', thumbnail_image: null, rating: 9.2 },
    { id: 't2', course_id: 'c2', position: 2, name: 'Muirfield', sub_country: 'Scotland', region: null, country: 'United Kingdom', thumbnail_image: null, rating: 9.0 },
    { id: 't3', course_id: 'c3', position: 3, name: 'Sunningdale', sub_country: 'England', region: null, country: 'United Kingdom', thumbnail_image: null, rating: 8.8 },
    { id: 't4', course_id: 'c4', position: 4, name: 'Carnoustie', sub_country: 'Scotland', region: null, country: 'United Kingdom', thumbnail_image: null, rating: 8.4 },
    { id: 't5', course_id: 'c5', position: 5, name: 'Royal St George\'s', sub_country: 'England', region: null, country: 'United Kingdom', thumbnail_image: null, rating: 8.1 },
  ];
  return { courses, rankMap: new Map() };
});

vi.mock('react-i18next', () => ({
  initReactI18next: { type: '3rdParty', init: () => {} },
  useTranslation: () => ({
    t: (_k: string, o?: { defaultValue?: string } | string) =>
      typeof o === 'string' ? o : o?.defaultValue ?? '',
  }),
}));
vi.mock('@/integrations/supabase/client', () => {
  const makeChain = (): any => {
    const c: any = {};
    for (const m of ['select', 'eq', 'in', 'order', 'limit', 'not', 'or', 'single']) c[m] = () => c;
    c.then = (resolve: any) => resolve({ data: [], error: null, count: 0 });
    return c;
  };
  return { supabase: { from: () => makeChain() } };
});
vi.mock('@/hooks/useUserTopTenCourses', () => ({ useUserTopTenCourses: () => ({ topTen: h.courses, isLoading: false }) }));
vi.mock('@/lib/courses/listRank', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/courses/listRank')>();
  return { ...actual, useCourseListRanks: () => ({ data: h.rankMap }) };
});
vi.mock('@/hooks/useTopTenReactions', () => ({ useTopTenReactions: () => ({ counts: {}, myReaction: null, toggleReaction: () => {} }), REACTION_CONFIG: {} }));
vi.mock('@/hooks/useBlockedUserIds', () => ({ useBlockedUserIds: () => new Set<string>() }));
vi.mock('@/components/profile/hooks/useTopTenVisibility', () => ({ useTopTenVisibility: () => ({ canView: true, visibility: 'public', isLoading: false }) }));
vi.mock('@/hooks/useSupabaseSession', () => ({ useSupabaseSession: () => ({ user: null }) }));
vi.mock('@/components/explore-tab-new/courseled/CourseImageFallback', () => ({ CourseImageFallback: ({ children, style }: any) => <div style={style}>{children}</div> }));
vi.mock('@/features/comments-v2/CommentsSheetV2', () => ({ CommentsSheetV2: () => null }));
vi.mock('html2canvas', () => ({ default: vi.fn() }));
vi.mock('@/lib/toast', () => ({ toast: { error: vi.fn() } }));
vi.mock('@/utils/analyticsEvents', () => ({ analyticsEvents: { track: vi.fn() } }));
vi.mock('@/lib/text/numbers', () => ({ numberWord: (n: number) => String(n) }));

import { ProfileTopTenRail } from '@/components/profile/hero/ProfileTopTenRail';

/**
 * Five entries: positions 1-3 are the photograph tiles carrying the glass pill,
 * positions 4-5 are rows carrying the label under the score. So the label the brief
 * changes appears exactly five times — three pills, two row labels — and nowhere else.
 */
const renderRail = (props: { isOwnProfile: boolean; ownerName?: string | null }) =>
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <MemoryRouter>
        <ProfileTopTenRail userId="u1" isOwnProfile={props.isOwnProfile} ownerName={props.ownerName} />
      </MemoryRouter>
    </QueryClientProvider>,
  );

const labelCount = (text: string) => screen.queryAllByText(text).length;

describe('BRIEF_TOP_TEN_OWNER_NAME_LABEL render', () => {
  it('both row score columns centre non-wrapping figures and labels with a 42px minimum', () => {
    renderRail({ isOwnProfile: false, ownerName: 'Thomas' });
    const row = document.querySelector('[data-top-ten-course-id="c4"]');
    expect(row).toBeInstanceOf(HTMLButtonElement);
    if (!(row instanceof HTMLButtonElement)) throw new Error('Expected the position-four row');
    const columns = Array.from(row.children).slice(-2);
    expect(columns).toHaveLength(2);
    for (const column of columns) {
      expect(column).toHaveStyle({ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '42px', flexShrink: '0' });
      expect((column as HTMLElement).style.width).toBe('');
      expect(column.children).toHaveLength(2);
      for (const child of Array.from(column.children)) {
        expect(child).toHaveStyle({ whiteSpace: 'nowrap' });
      }
    }
  });

  it('a visitor sees the owner\'s first name on every score label', () => {
    renderRail({ isOwnProfile: false, ownerName: 'Thomas' });
    expect(labelCount('Thomas')).toBe(5);
    expect(labelCount('Them')).toBe(0);
    expect(labelCount('You')).toBe(0);
  });

  it('the name sits in the pill on the photograph tiles and under the score in the rows', () => {
    renderRail({ isOwnProfile: false, ownerName: 'Thomas' });
    const tile1 = document.querySelector('[data-top-ten-course-id="c1"]')!;
    const row4 = document.querySelector('[data-top-ten-course-id="c4"]')!;
    expect(tile1.textContent).toContain('Thomas');
    expect(row4.textContent).toContain('Thomas');
    expect(row4.textContent).toContain('Golfers');
  });

  it('with no owner name the label falls back to Them', () => {
    renderRail({ isOwnProfile: false, ownerName: null });
    expect(labelCount('Them')).toBe(5);
    expect(labelCount('Thomas')).toBe(0);
  });

  it('a name longer than nine characters reaches the pill clipped', () => {
    renderRail({ isOwnProfile: false, ownerName: 'golfingwithellie' });
    expect(labelCount('golfingw\u2026')).toBe(5);
    expect(labelCount('golfingwithellie')).toBe(0);
  });

  it('your own profile still reads You', () => {
    renderRail({ isOwnProfile: true, ownerName: 'Thomas' });
    expect(labelCount('You')).toBe(5);
    expect(labelCount('Thomas')).toBe(0);
    expect(labelCount('Them')).toBe(0);
  });
});
