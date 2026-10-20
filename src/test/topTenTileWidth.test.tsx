import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const h = vi.hoisted(() => {
  const courses = [
    { id: 't1', course_id: 'c1', position: 1, name: 'Royal County Down', sub_country: 'Northern Ireland', region: null, country: 'United Kingdom', thumbnail_image: null, rating: 9.2 },
    { id: 't2', course_id: 'c2', position: 2, name: 'Muirfield', sub_country: 'Scotland', region: null, country: 'United Kingdom', thumbnail_image: null, rating: 9.0 },
    { id: 't3', course_id: 'c3', position: 3, name: 'Sunningdale', sub_country: 'England', region: null, country: 'United Kingdom', thumbnail_image: null, rating: 8.8 },
  ];
  const ranks = [
    { slug: 'global', label: 'Global', rank: 10, sortOrder: 5 },
    { slug: 'gb-i', label: 'GB&I', rank: 5, sortOrder: 1 },
  ];
  return { courses, ranks, rankMap: new Map([['c1', ranks]]) };
});

vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));
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

import { ProfileTopTenRail, RegionRankLine } from '@/components/profile/hero/ProfileTopTenRail';

const renderRail = () =>
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <MemoryRouter>
        <ProfileTopTenRail userId="u1" isOwnProfile={false} />
      </MemoryRouter>
    </QueryClientProvider>,
  );

describe('BRIEF_TOP_TEN_TILE_WIDTH', () => {
  it('tiles 2 and 3 sit in an equal minmax grid that text cannot widen', () => {
    renderRail();
    const tile2 = screen.getByText('Muirfield').closest('button')!;
    const tile3 = screen.getByText('Sunningdale').closest('button')!;
    const grid = tile2.parentElement!;
    expect(grid.style.gridTemplateColumns).toBe('repeat(2, minmax(0, 1fr))');
    expect(grid).toContainElement(tile3);
    expect(tile2.style.minWidth).toBe('0');
    expect(tile3.style.minWidth).toBe('0');
  });

  it('RegionRankLine renders two spans: the region truncates, the ranks never shrink', () => {
    const { container } = render(<RegionRankLine course={{ sub_country: 'Northern Ireland' }} rank={h.ranks} />);
    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper.children).toHaveLength(2);
    const [region, ranks] = [...wrapper.children] as HTMLElement[];
    expect(region.textContent).toBe('Northern Ireland');
    expect(region.style.textOverflow).toBe('ellipsis');
    expect(region.style.minWidth).toBe('0');
    expect(ranks.textContent).toBe(' · Global #10 · GB&I #5');
    expect(ranks.style.flexShrink).toBe('0');
  });

  it('with no rank renders only the region, with no stray separator', () => {
    const { container } = render(<RegionRankLine course={{ sub_country: 'Scotland' }} rank={null} />);
    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper.children).toHaveLength(1);
    expect(wrapper.textContent).toBe('Scotland');
  });

  it('with no region renders only the ranks, with no stray separator', () => {
    const { container } = render(<RegionRankLine course={{}} rank={h.ranks} />);
    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper.children).toHaveLength(1);
    expect(wrapper.textContent).toBe('Global #10 · GB&I #5');
  });

  it('with neither region nor rank renders nothing', () => {
    const { container } = render(<RegionRankLine course={{}} rank={null} />);
    expect(container.firstElementChild).toBeNull();
  });
});
