import React from 'react';
import { readFileSync } from 'node:fs';
import { beforeEach, afterEach, describe, it, expect, vi } from 'vitest';
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
vi.mock('@/components/topTen/useTenBlocks', () => ({ useTenBlock: () => ({ isLoading:false, isError:false, data:{ owner:{user_id:'u1',first_name:'Thomas',display_name:'Thomas',username:'thomas',avatar_url:null,is_pro:false,pronoun:'his'},count:h.courses.length,is_owner:false,played_count:null,shared_line:null,on_chart_count:0,courses:h.courses.map(c=>({...c,member_score:c.rating,golfers_score:null,viewer_score:null,chart_rank:null,in_tens:0,comment_count:0})) } }) }));
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
let tenSheet: HTMLStyleElement;
beforeEach(() => { tenSheet=document.createElement('style');tenSheet.textContent=readFileSync('src/styles/top-ten.css','utf8');document.head.appendChild(tenSheet); });
afterEach(() => tenSheet.remove());

const renderRail = (props: { isOwnProfile: boolean; ownerName?: string | null }) =>
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <MemoryRouter>
        <ProfileTopTenRail userId="u1" isOwnProfile={props.isOwnProfile} ownerName={props.ownerName} />
      </MemoryRouter>
    </QueryClientProvider>,
  );

const labelCount = (text: string) => screen.queryAllByText(text).length;

/** Brief 31 supersedes all seven retired-layout cases below; report quotes old/new assertions. */
describe('Brief 31 signed-off block replaces pills and rows', () => {
  it('Brief 34: the ten is one countdown rail of cards in position order', () => {
    const {container}=renderRail({isOwnProfile:false,ownerName:'Thomas'});
    const rail=container.querySelector('.clb-ten-rail');if(!rail)throw new Error('Missing rail');
    expect([...rail.querySelectorAll('[data-ten-rail-rank]')].map(c=>c.getAttribute('data-ten-rail-rank'))).toEqual(['1','2','3','4','5']);
  });
  it('Brief 34: number one is the first rail card, the same card as the rest', () => {
    const {container}=renderRail({isOwnProfile:false,ownerName:'Thomas'});
    const one=container.querySelector('[data-ten-rail-rank="1"]');if(!one)throw new Error('Missing number one');
    expect(one.parentElement?.firstElementChild).toBe(one);expect(one.classList.contains('clb-ten-card')).toBe(true);
  });
  it('Brief 45: member ratings are the first labelled figure, with no corner pill', () => {
    const {container}=renderRail({isOwnProfile:false,ownerName:null});
    const card=container.querySelector('[data-ten-rail-rank="2"]');if(!card)throw new Error('Missing card');
    expect(card.querySelector('.clb-ten-stat b')).toHaveTextContent('9.0');
    expect(card.querySelector('.ten-score-pill')).toBeNull();
  });
  it('Brief 34: a null member rating leaves its corner empty without a dash', () => {
    const old=h.courses[1].rating;h.courses[1].rating=null as unknown as number;
    try { const {container}=renderRail({isOwnProfile:false,ownerName:'golfingwithellie'});
      const card=container.querySelector('[data-ten-rail-rank="2"]');if(!card)throw new Error('Missing card');
      expect(card.querySelector('[data-ten-corner-score]')).toBeNull();expect(card.querySelector('.clb-ten-rank')?.textContent).toBe('2');expect(card.querySelector('.clb-ten-bottom')?.previousElementSibling?.textContent).not.toContain('–');
    } finally { h.courses[1].rating=old; }
  });
  it('Brief 34: owner rail cards carry no badges and the owner gets Share your ten', () => {
    const {container}=renderRail({isOwnProfile:true,ownerName:'Thomas'});
    expect(container.querySelectorAll('[data-ten-rail-rank]')).toHaveLength(5);
    expect(container.querySelector('.clb-ten-card .pro-label')).toBeNull();expect(container.querySelector('.clb-ten-card [data-badge]')).toBeNull();
    expect(screen.getByRole('button',{name:'Share your ten ›'})).toBeInTheDocument();
  });
  it('Brief 34: every card names its course once', () => {
    const {container}=renderRail({isOwnProfile:true});
    expect([...container.querySelectorAll('.clb-ten-name')].map(n=>n.textContent)).toEqual(h.courses.map(c=>c.name));
  });
});
