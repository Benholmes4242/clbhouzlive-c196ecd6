import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createInstance } from 'i18next';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { readFileSync } from 'node:fs';
import common from '../../public/locales/en/courses.json';

const f = vi.hoisted(() => ({ board: vi.fn(), tiles: vi.fn(), user: { id: 'me', is_anonymous: false } as { id: string; is_anonymous: boolean } | null, courses: vi.fn(), enrichment: vi.fn(), progress: vi.fn() }));
vi.mock('@/hooks/top100/useTop100Race', () => ({ useTop100Race: f.board, useCareerBoard: f.board, TOP100_METRIC: { 'gb-i': 'top_100_gbni_distinct', global: 'top_100_worldwide_distinct', europe: 'top_100_europe_distinct', usa: 'top_100_usa_distinct' } }));
vi.mock('@/hooks/gam/useTop100ListProgress', () => ({ useTop100ListProgress: f.tiles }));
vi.mock('@/hooks/useSupabaseSession', () => ({ useSupabaseSession: () => ({ user: f.user }) }));
vi.mock('@/hooks/useGolfCoursesInfinite', () => ({ useGolfCoursesInfinite: f.courses }));
vi.mock('@/hooks/top100/useTop100Enrichment', () => ({ useTop100Enrichment: f.enrichment }));
vi.mock('@/hooks/useTop100ProgressForUser', () => ({ useTop100ProgressForUser: f.progress }));
vi.mock('@/hooks/top100/useTop100GolferBaseline', () => ({ useTop100GolferBaseline: () => new Map() }));
vi.mock('@/components/top100/sheets/Top100ListProgressSheet', () => ({ Top100ListProgressSheet: ({ ownerUserId, listSlug }: { ownerUserId: string; listSlug: string }) => <output data-testid="member-sheet">{ownerUserId}:{listSlug}</output> }));
vi.mock('@/components/explore-tab-new/courseled/ExploreSheetShell', () => ({ ExploreSheetShell: ({ children, above }: { children: React.ReactNode; above: React.ReactNode }) => <div data-testid="see-all">{above}{children}</div> }));
vi.mock('@/components/explore-tab-new/courseled/CourseImageFallback', () => ({ CourseImageFallback: () => null }));
vi.mock('@/components/courses/BrowseCourseCard', () => ({ default: () => null }));
vi.mock('@/components/courses/browse/PageLoadGate', () => ({ PageLoadGate: ({ children }: { children: React.ReactNode }) => <>{children}</>, usePageRevealed: () => true, useSectionReady: () => {}, settled: (q: { isFetched?: boolean; isError?: boolean; status?: string }) => q.isFetched === true || q.isError === true || q.status === 'success' || q.status === 'error' }));

import { HundredRail, HundredYou } from '@/components/courses/top100/HundredRaceParts';
import { Top100RaceSection } from '@/components/courses/top100/Top100RaceSection';
import { YourCoursesDropdown, cellStyle, cellState } from '@/components/courses/top100/YourHundredSection';
import Top100CoursesHubPanel from '@/components/courses/Top100CoursesHubPanel';
import { hundredSlab, raceShare, leaderCaptionLeft } from '@/hooks/top100/hundredRaceRules';
import type { CareerRow } from '@/hooks/top100/useTop100Race';
import type { Top100CourseProgress } from '@/hooks/gam/useTop100ListProgress';
import type { Top100Enrichment } from '@/hooks/top100/useTop100Enrichment';

const i18n = createInstance();
void i18n.init({ lng: 'en', initAsync: false, interpolation: { escapeValue: false }, resources: { en: { courses: common } } });
function mount(node: React.ReactNode) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const wrapper = ({ children }: { children: React.ReactNode }) => <MemoryRouter><QueryClientProvider client={client}><I18nextProvider i18n={i18n}>{children}</I18nextProvider></QueryClientProvider></MemoryRouter>;
  return render(node, { wrapper });
}
const row = (id: string, value: number, pos: number, tie = false): CareerRow => ({ user_id: id, value, pos, is_tie: tie, is_viewer: id === 'me', display_name: id, photo_url: null, home_club: null, field_avg: null, last_course_name: `Course ${id}`, total_members: 31 });
const tile = (i: number, played = false): Top100CourseProgress => ({ course_id: `c${i}`, course_name: `Course ${i}`, rank: i + 1, thumbnail_image: null, country: null, region: null, is_viewer_played: played, is_owner_played: played, global_rank: null, owner_rating: null, owner_rating_id: null });
const dropdownProps = { listSlug: 'global', viewerPlayed: 5, total: 6, courseIds: ['a','b','c','d','e','f'], enrichment: new Map<string, Top100Enrichment>([
  ['a', { yourActivity: true, ratedByYou: true } as Top100Enrichment], ['b', { yourActivity: true, ratedByYou: false } as Top100Enrichment], ['c', { roundsTracked: 1 } as Top100Enrichment],
]), subjects: new Map([['a', { name: 'Course a', imageUrl: null, memberships: [] }]]), onOpenCourse: vi.fn() };
beforeEach(() => {
  vi.clearAllMocks(); sessionStorage.clear(); f.user = { id: 'me', is_anonymous: false };
  f.board.mockReturnValue({ data: [row('leader',34,1),row('second',28,2),row('me',23,3),row('fourth',20,4)], isPending: false, isError: false, isPlaceholderData: false, refetch: vi.fn() });
  f.tiles.mockReturnValue({ data: [tile(0,true),tile(1)], isPending: false });
  f.courses.mockReturnValue({ data: { pages: [[]] }, isLoading: false, isError: false, isPlaceholderData: false });
  f.enrichment.mockReturnValue({ data: new Map(), isLoading: false });
  f.progress.mockReturnValue({ data: { lists: [{ listSlug: 'global', played: 0, total: 80 }] }, isLoading: false, isFetchedAfterMount: true });
});
afterEach(cleanup);
function race() { return mount(<Top100RaceSection viewerId="me" list="gb-i" total={80} onOpenCourse={vi.fn()} />); }
function element(selector: string) { const node = document.querySelector<HTMLElement>(selector); if (!node) throw new Error(`Missing ${selector}`); return node; }

describe('T100 slab and progress', () => {
  it.each([
    ['behind', [row('leader',34,1),row('me',23,3)], "You've played 23 of the GB&I Hundred, 3rd of 31 members and 11 behind leader."],
    ['leading', [row('me',34,1),row('second',23,2)], "You've played 34 of the GB&I Hundred, 1st of 31 members and 11 clear of second."],
    ['no gap', [row('me',34,1)], "You've played 34 of the GB&I Hundred, 1st of 31 members."],
    ['tie', [row('leader',34,1),row('me',2,14,true)], "You've played 2 of the GB&I Hundred, joint 14th of 31 members."],
    ['absent', [row('leader',34,1)], "You haven't played one of the GB&I Hundred yet."],
  ] as const)('%s uses signed-off copy and bold figures without an em dash', (_kind, rows, text) => {
    mount(<HundredYou slab={hundredSlab([...rows], 'me')} list="GB&I" listLength={80} leaderValue={34} />);
    const sentence = element('[data-hundred-slab] p');
    expect(sentence.textContent).toBe(text);
    expect(sentence.textContent).not.toContain('—');
    if (_kind !== 'absent') expect(sentence.querySelectorAll('b').length).toBeGreaterThanOrEqual(3);
  });
  it('uses the actual list length and caps fill and mark', () => {
    mount(<HundredYou slab={hundredSlab([row('leader',40,1),row('me',20,2)],'me')} list="Global" listLength={80} leaderValue={40} />);
    expect(element('[data-hundred-fill]').style.width).toBe('25%');
    expect(element('[data-leader-mark]').style.left).toBe('50%');
    expect(raceShare(90,80)).toBe(1); expect(raceShare(20,0)).toBe(0);
  });
  it('absent viewer still has track and captions with zero fill', () => {
    mount(<HundredYou slab={{ kind: 'absent', n: 0 }} list="Global" listLength={80} leaderValue={40} />);
    expect(element('[data-hundred-fill]').style.width).toBe('0%');
    expect(element('[data-leader-caption]')).toBeInTheDocument();
  });
  it('zero leader has no mark or caption', () => {
    mount(<HundredYou slab={{ kind: 'absent', n: 0 }} list="Global" listLength={80} leaderValue={0} />);
    expect(document.querySelector('[data-leader-mark]')).toBeNull(); expect(document.querySelector('[data-leader-caption]')).toBeNull();
  });
  it('clamps the caption 8px clear of both end labels', () => {
    expect(leaderCaptionLeft(0,300,100,10,20)).toBe(18);
    expect(leaderCaptionLeft(1,300,100,10,20)).toBe(172);
    expect(leaderCaptionLeft(.5,300,100,10,20)).toBe(100);
  });
});
describe('T100 rail and member doors', () => {
  it('uses 116 by 80 tiles and opens the clicked course', () => {
    const open = vi.fn(); mount(<HundredRail tiles={[tile(0,true)]} onOpenCourse={open} />);
    const button = screen.getByRole('button', { name: 'Course 0' });
    expect(button.style.width).toBe('116px'); expect(button.style.height).toBe('80px');
    expect(element('[data-hundred-played]')).toHaveClass('t100-played');
    fireEvent.click(button); expect(open).toHaveBeenCalledWith('c0');
  });
  it('opens scrolled to the first unplayed course using the unchanged algorithm', () => {
    const original = Object.getOwnPropertyDescriptor(HTMLElement.prototype,'clientWidth');
    Object.defineProperty(HTMLElement.prototype,'clientWidth',{ configurable:true,get:()=>390 });
    try { mount(<HundredRail tiles={Array.from({length:8},(_,i)=>tile(i,i<5))} onOpenCourse={vi.fn()} />); expect(element('[data-hundred-rail]').scrollLeft).toBe(480); }
    finally { if(original) Object.defineProperty(HTMLElement.prototype,'clientWidth',original); else delete (HTMLElement.prototype as unknown as Record<string,unknown>).clientWidth; }
  });
  it('shows top three without the fourth unless it is the pinned viewer', () => {
    race(); expect(document.querySelectorAll('[data-race-row]')).toHaveLength(3); expect(document.querySelector('[data-race-row="fourth"]')).toBeNull();
  });
  it('pins a tied viewer below third with a break and T position', () => {
    f.board.mockReturnValue({ data:[row('a',34,1),row('b',28,2),row('c',23,3),row('me',2,14,true)],isPending:false,isError:false });
    race(); expect(document.querySelectorAll('[data-race-row]')).toHaveLength(4); expect(screen.getByText('T14')).toBeInTheDocument(); expect(screen.getByText('···')).toBeInTheDocument();
  });
  it('viewer ground and row bars use the actual denominator, bare course names', () => {
    race(); const mine=element('[data-race-row="me"]'); expect(mine).toHaveAttribute('data-viewer'); expect(mine.querySelector<HTMLElement>('[data-row-progress]')?.style.width).toBe('28.749999999999996%');
    expect(mine.textContent).toContain('Course me'); expect(mine.textContent).not.toContain('Latest:');
  });
  it.each([1,2,3])('hides See all for %i rows', n => {
    f.board.mockReturnValue({data:Array.from({length:n},(_,i)=>row(String(i),10,i+1)),isPending:false,isError:false});race();expect(screen.queryByRole('button',{name:'See all members'})).toBeNull();
  });
  it('row tap opens the existing member list-progress sheet', () => {
    race();fireEvent.click(element('[data-race-row="second"]'));expect(screen.getByTestId('member-sheet')).toHaveTextContent('second:gb-i');
  });
  it('See all opens the existing shell with its own list chips', () => {
    race();fireEvent.click(screen.getByRole('button',{name:'See all members'}));expect(screen.getByTestId('see-all')).toBeInTheDocument();expect(screen.getByRole('tab',{name:'Global'})).toBeInTheDocument();
  });
});
describe('T100 folded Your courses', () => {
  it('hidden below five', () => {mount(<YourCoursesDropdown {...dropdownProps} viewerPlayed={4} />);expect(screen.queryByRole('button',{name:/Your courses/})).toBeNull();});
  it('closed initially, counts actual reviewed cells, opens grid/legend/peek', () => {
    mount(<YourCoursesDropdown {...dropdownProps} />);const toggle=screen.getByRole('button',{name:/Your courses/});expect(toggle).toHaveAttribute('aria-expanded','false');expect(screen.getByText('5 played · 1 reviewed')).toBeInTheDocument();expect(screen.queryByTestId('hundred-legend')).toBeNull();
    fireEvent.click(toggle);expect(toggle).toHaveAttribute('aria-expanded','true');expect(screen.getByTestId('hundred-legend')).toBeInTheDocument();fireEvent.click(screen.getByRole('button',{name:'#1 Course a'}));expect(screen.getByText('You played')).toBeInTheDocument();
  });
  it('closes on list change', () => {const view=mount(<YourCoursesDropdown {...dropdownProps} />);fireEvent.click(screen.getByRole('button',{name:/Your courses/}));view.rerender(<YourCoursesDropdown {...dropdownProps} listSlug="gb-i" />);expect(screen.getByRole('button',{name:/Your courses/})).toHaveAttribute('aria-expanded','false');});
  it('mini preview uses reviewed/played/member/nobody cell states', () => {mount(<YourCoursesDropdown {...dropdownProps} />);expect(Array.from(document.querySelectorAll('.t100-mini i')).map(n=>n.getAttribute('data-state'))).toEqual(['reviewed','played','member','nobody','nobody','nobody']);});
  it('reviewed and played cells use ink not amber, member and nobody unchanged', () => {expect(cellStyle('reviewed').background).toBe('#F8FAFC');expect(cellStyle('played').boxShadow).toContain('#F8FAFC');expect(cellStyle('member').background).toBe('var(--t100-member)');expect(cellStyle('nobody').background).toBe('var(--t100-nobody)');expect(cellState(undefined)).toBe('nobody');});
});
describe('T100 visibility and Rounds removal', () => {
  /* Top 100 leaderboard Option B: guests and signed-out visitors now read the PUBLIC board (p_viewer null); the retired rule was "no board read at all". The race and its reservation stay unmounted. */
  it.each(['signed-out','guest'])('%s has no race or reservation', kind=>{f.user=kind==='guest'?{id:'guest',is_anonymous:true}:null;mount(<Top100CoursesHubPanel />);expect(document.querySelector('[data-top100-race]')).toBeNull();expect(document.querySelector('[data-race-shell]')).toBeNull();expect(f.board).toHaveBeenCalledWith(undefined,'top_100_worldwide_distinct',100);});
  it('no board rows hides race',()=>{f.board.mockReturnValue({data:[],isPending:false,isError:false});race();expect(screen.queryByText('The race')).toBeNull();expect(document.querySelector('[data-hundred-rail]')).toBeNull();});
  it('failed read shows a retry instead of stale rows',()=>{const retry=vi.fn();f.board.mockReturnValue({data:[row('a',5,1)],isPending:false,isError:true,refetch:retry});race();fireEvent.click(screen.getByRole('button',{name:'Retry'}));expect(retry).toHaveBeenCalledOnce();expect(document.querySelector('[data-race-row]')).toBeNull();});
  it('loading reserves slab rail and three rows, no pinned row or dropdown',()=>{f.board.mockReturnValue({isPending:true});race();expect(element('[data-race-shell]')).toBeInTheDocument();expect(document.querySelectorAll('.t100-shell-row')).toHaveLength(3);expect(document.querySelector('[data-your-courses]')).toBeNull();});
  it('Rounds removes section seven and its sheets but retains preceding sections',()=>{const source=readFileSync('src/features/explore-magazine/ScoresLeaderboardsPage.tsx','utf8');expect(source).not.toMatch(/top100SeeAllSheet|top100Sheet|HundredRail|HundredYou|hundredPlaceholderHeight|useCareerBoard/);for(const name of ['StandoutRounds','CompetitionBoards','LeaderboardsSection','RareAirRail','climbPlaced.slice'])expect(source).toContain(name);});
});
describe('T100.2 native buttons and short names', () => {
  const expectNativeButton = (node: HTMLElement) => {
    expect(node.tagName).toBe('BUTTON');
    for (const cls of ['h-11', 'px-5', 'py-2.5', 'text-muted-foreground', 'font-medium']) expect(node.className).not.toContain(cls);
  };
  it('race rows, rail tiles, See all and the dropdown header are native buttons without the shared Button classes', () => {
    race();
    document.querySelectorAll<HTMLElement>('[data-race-row]').forEach(expectNativeButton);
    document.querySelectorAll<HTMLElement>('.t100-tile').forEach(expectNativeButton);
    expectNativeButton(screen.getByRole('button', { name: 'See all members' }));
    cleanup();
    mount(<YourCoursesDropdown {...dropdownProps} />);
    expectNativeButton(screen.getByRole('button', { name: /Your courses/ }));
  });
  it('row course line and tile name use shortCourseName; the tile aria-label keeps the full name', () => {
    const full = 'Royal County Down Golf Club (Championship)';
    f.board.mockReturnValue({ data: [{ ...row('leader', 34, 1), last_course_name: full }], isPending: false, isError: false, isPlaceholderData: false });
    f.tiles.mockReturnValue({ data: [{ ...tile(0, true), course_name: full }], isPending: false });
    race();
    expect(element('[data-race-row="leader"] .t100-row-course').textContent).toBe('Royal County Down · Championship');
    const tileButton = screen.getByRole('button', { name: full });
    expect(tileButton.querySelector('.t100-photo-name')?.textContent).toBe('Royal County Down · Championship');
  });
  it('See all sheet rows render the same markup as the page rows', () => {
    race();
    const pageRow = element('[data-race-row="leader"]').outerHTML;
    fireEvent.click(screen.getByRole('button', { name: 'See all members' }));
    const sheet = screen.getByTestId('see-all');
    expect(sheet.querySelectorAll('[data-race-row]')).toHaveLength(4);
    expect(sheet.querySelector('[data-race-row="leader"]')?.outerHTML).toBe(pageRow);
  });
});