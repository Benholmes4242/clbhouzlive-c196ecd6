/** Brief 34: profile ten as the shared countdown rail, glass score pill, canonical headings, lower-case chart name. */
import React from 'react';
import { readFileSync } from 'node:fs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { TenBlockData } from '@/components/topTen/topTenModel';
const h = vi.hoisted(() => ({ block: null as TenBlockData | null, signedIn: true }));
vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));
vi.mock('@/features/comments-v2/CommentsSheetV2', () => ({ CommentsSheetV2: (p: { isOpen: boolean }) => p.isOpen ? <div role="dialog" /> : null }));
vi.mock('@/components/topTen/useTenBlocks', async original => ({ ...await original<typeof import('@/components/topTen/useTenBlocks')>(), useTenBlock: () => ({ data: h.block, isLoading: false, isError: false }) }));
vi.mock('@/hooks/useSupabaseSession', () => ({ useSupabaseSession: () => ({ user: h.signedIn ? { id: 'viewer' } : null, loading: false }) }));
vi.mock('@/components/profile/hero/topTenShare/TopTenShareSheet', () => ({ TopTenShareSheet: () => null }));
vi.mock('@/components/profile/clubs/useClubsCourses', () => ({ useClubsCourses: () => ({ data: {} }) }));
vi.mock('@/features/explore-magazine/useClubGolfers', () => ({ useClubGolfers: () => ({ data: [] }) }));
vi.mock('@/components/profile/rounds/useProfileRounds', () => ({ useProfileRounds: () => ({ data: [] }), isFullEighteen: () => true }));
vi.mock('@/components/profile/hooks/useProfileClubs', () => ({ useProfileClubs: () => ({ homeClub: null }) }));
import { ProfileTopTenRail } from '@/components/profile/hero/ProfileTopTenRail';
import { TenRail } from '@/components/topTen/TenRail';
import ClubsCard from '@/components/profile/clubs/ClubsCard';
import { SECTION_EYEBROW, SECTION_TITLE } from '@/lib/tokens/type';

const makeBlock = (own: boolean, positions = [1, 2, 3, 5]): TenBlockData => ({
  owner: { user_id: 'owner', display_name: 'Thomas Muchmore', first_name: 'Thomas', username: 'thomas', avatar_url: null, is_pro: false, pronoun: 'his' },
  count: positions.length, is_owner: own, played_count: own ? null : 2, shared_line: own ? null : 'Both have Course 1 top three', on_chart_count: 3,
  courses: positions.map(position => ({ position, course_id: `c${position}`, name: `Course ${position}`, region: 'Kent', sub_country: 'England', country: 'GB', thumbnail_image: null, is_pinned: false, member_score: position === 2 ? null : 9.7, golfers_score: 9.1, golfers_count: 12, viewer_score: null, chart_rank: position === 3 ? 18 : null, in_tens: 4, comment_count: 1 })),
});
const mount = (node: React.ReactNode) => render(<QueryClientProvider client={new QueryClient()}><MemoryRouter>{node}</MemoryRouter></QueryClientProvider>);
const sheets: HTMLStyleElement[] = [];
beforeEach(() => {
  h.signedIn = true; Element.prototype.scrollTo = vi.fn();
  for (const file of ['src/styles/top-ten.css', 'src/styles/clbhouz-ten.css']) { const s = document.createElement('style'); s.textContent = readFileSync(file, 'utf8'); document.head.appendChild(s); sheets.push(s); }
});
afterEach(() => { cleanup(); sheets.splice(0).forEach(s => s.remove()); });

describe('Brief 34 profile rail', () => {
  it('a ten at 1,2,3,5 renders four cards ranked 1,2,3,5, four ticks and the hint', () => {
    h.block = makeBlock(true);
    const { container } = mount(<ProfileTopTenRail userId="owner" isOwnProfile onManage={() => {}} />);
    expect([...container.querySelectorAll('.clb-ten-card .clb-ten-rank')].map(e => e.textContent)).toEqual(['1', '2', '3', '5']);
    expect(container.querySelectorAll('.clb-ten-tick')).toHaveLength(4);
    expect(screen.getByText('Swipe for 2 to 4')).toBeInTheDocument();
  });
  it('own profile: Golfers and Tens, Share, no pills and nothing "of yours"', () => {
    h.block = makeBlock(true);
    const { container } = mount(<ProfileTopTenRail userId="owner" isOwnProfile onManage={() => {}} />);
    const labels = [...container.querySelectorAll('.clb-ten-card')][0].querySelectorAll('.clb-ten-stat small');
    expect([...labels].map(e => e.textContent)).toEqual(['Golfers', 'Tens']);
    expect(screen.getByRole('button', { name: 'Share your ten ›' })).toBeInTheDocument();
    expect(container.querySelector('.ten-pills')).toBeNull();
    expect(container.textContent).not.toContain('of yours');
  });
  it('visitor: Golfers and You, no Share, played and shared pills', () => {
    h.block = makeBlock(false);
    const { container } = mount(<ProfileTopTenRail userId="owner" isOwnProfile={false} ownerName="Thomas" />);
    const labels = container.querySelector('.clb-ten-card')!.querySelectorAll('.clb-ten-stat small');
    expect([...labels].map(e => e.textContent)).toEqual(['Golfers', 'You']);
    expect(container.querySelector('.clb-ten-card [data-missing]')).toHaveTextContent('–');
    expect(screen.queryByText('Share your ten ›')).toBeNull();
    expect(screen.getByText("You've played 2 of 4")).toBeInTheDocument();
    expect(screen.getByText('Both have Course 1 top three')).toBeInTheDocument();
  });
  it('signed-out visitors see Golfers and Tens', () => {
    h.block = makeBlock(false); h.signedIn = false;
    const { container } = mount(<ProfileTopTenRail userId="owner" isOwnProfile={false} />);
    expect([...container.querySelector('.clb-ten-card')!.querySelectorAll('.clb-ten-stat small')].map(e => e.textContent)).toEqual(['Golfers', 'Tens']);
  });
  it('story slot reads the chart rank in lower case and is empty without one', () => {
    h.block = makeBlock(true);
    const { container } = mount(<ProfileTopTenRail userId="owner" isOwnProfile />);
    const cards = container.querySelectorAll('.clb-ten-card');
    expect(cards[2].querySelector('.clb-ten-story')).toHaveTextContent('#18 on the clbhouz ten');
    expect(cards[0].querySelector('.clb-ten-story')).toBeNull();
  });
  it('tapping card 3 marks it, dims the others, opens the band after the ticks, and closes on a second tap', async () => {
    h.block = makeBlock(true);
    const { container } = mount(<ProfileTopTenRail userId="owner" isOwnProfile />);
    const card = () => screen.getByRole('button', { name: '#3 Course 3, 9.7' });
    fireEvent.click(card());
    expect(card()).toHaveAttribute('data-selected', 'true');
    const others = [...container.querySelectorAll('.clb-ten-card')].filter(e => e !== card());
    for (const other of others) { expect(other).toHaveAttribute('data-dimmed', 'true'); expect(getComputedStyle(other).opacity).toBe('0.38'); }
    const band = container.querySelector('[data-ten-rail-band]');
    expect(band?.previousElementSibling).toHaveClass('clb-ten-ticks');
    fireEvent.click(card());
    await waitFor(() => expect(container.querySelector('[data-ten-rail-band]')).toBeNull());
  });
  it('deep link opens the course band and its comment', () => {
    h.block = makeBlock(true);
    const { container } = mount(<ProfileTopTenRail userId="owner" isOwnProfile initialCourseId="c5" initialCommentId="x" />);
    expect(container.querySelector('[data-ten-rail-band] .ten-band-name')).toHaveTextContent('Course 5');
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });
});

describe('Brief 34 glass score pill', () => {
  it('rail shows 9.7 in the pill and none for a null score', () => {
    h.block = makeBlock(true);
    const { container } = mount(<ProfileTopTenRail userId="owner" isOwnProfile />);
    const cards = container.querySelectorAll('.clb-ten-card');
    expect(cards[0].querySelector('.ten-score-pill')).toHaveTextContent('9.7');
    expect(cards[1].querySelector('.ten-score-pill')).toBeNull();
  });
  it('the feed rail pill carries the glass background', () => {
    const { container } = mount(<TenRail block={makeBlock(false)} signedIn hintText="Swipe" />);
    const pill = container.querySelector('[data-ten-rail-rank="1"] [data-ten-corner-score]') as HTMLElement;
    expect(pill).toHaveClass('ten-score-pill');
    expect(getComputedStyle(pill).backgroundColor).toBe('rgba(10, 10, 12, 0.5)');
  });
});

describe('Brief 34 canonical profile headings', () => {
  const style = (el: Element | null) => (el as HTMLElement).style;
  it('Top 10 uses SECTION_EYEBROW and SECTION_TITLE, own and visitor titles', () => {
    h.block = makeBlock(true);
    const own = mount(<ProfileTopTenRail userId="owner" isOwnProfile onManage={() => {}} />);
    expect(style(own.container.querySelector('.ten-profile-kicker')).fontSize).toBe(`${SECTION_EYEBROW.fontSize}px`);
    expect(style(own.container.querySelector('.ten-manage')).letterSpacing).toBe(SECTION_EYEBROW.letterSpacing);
    const title = own.container.querySelector('h2')!;
    expect(title).toHaveTextContent('Your top ten courses'); expect(style(title).fontSize).toBe(`${SECTION_TITLE.fontSize}px`);
    own.unmount(); h.block = makeBlock(false);
    const other = mount(<ProfileTopTenRail userId="owner" isOwnProfile={false} />);
    expect(other.container.querySelector('h2')).toHaveTextContent("Thomas's top ten courses");
    expect(other.container.querySelector('.ten-manage')).toBeNull();
  });
  it('Home club uses SECTION_EYEBROW and SECTION_TITLE, own and visitor titles', () => {
    const own = mount(<ClubsCard homeClub={null} secondaryClubs={[]} isOwner onEditClick={() => {}} />);
    const title = own.container.querySelector('[data-clubs-title]')!;
    expect(style(title).fontSize).toBe(`${SECTION_TITLE.fontSize}px`);
    expect(style(title.previousElementSibling!.firstElementChild).fontSize).toBe(`${SECTION_EYEBROW.fontSize}px`);
    own.unmount();
    const other = mount(<ClubsCard homeClub={{ id: 'h', name: 'Sundridge Park' }} secondaryClubs={[]} isOwner={false} ownerFirstName="Thomas" />);
    expect(style(other.container.querySelector('[data-clubs-title]')).letterSpacing).toBe(SECTION_TITLE.letterSpacing);
  });
});

describe('Brief 34 lower-case chart name', () => {
  it('no surface renders "clbhouz Ten"', () => {
    h.block = makeBlock(true);
    const views = [
      mount(<ProfileTopTenRail userId="owner" isOwnProfile initialCourseId="c3" />),
      mount(<TenRail block={makeBlock(false)} signedIn hintText="Swipe" openBandOnCourseId="c3" />),
    ];
    for (const view of views) expect(view.container.textContent).not.toContain('clbhouz Ten');
    for (const file of ['src/components/topTen/TenRail.tsx', 'src/components/topTen/TenBand.tsx', 'src/components/courses/course-detail/CourseTopTenStandingCard.tsx', 'src/components/courses/browse/ClbhouzTenSection.tsx', 'src/components/courses/browse/ClbhouzTenSheet.tsx', 'src/components/profile/hero/ProfileTopTenRail.tsx'])
      expect(readFileSync(file, 'utf8')).not.toContain('clbhouz Ten');
  });
});
