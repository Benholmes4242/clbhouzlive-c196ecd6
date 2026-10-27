import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { ClubWhatGolfersSay, reviewMetaDate } from '@/components/business/ClubWhatGolfersSay';
import type { BusinessReviewStats } from '@/hooks/useBusinessReviewStats';
import type { ClubLatestReview } from '@/hooks/useClubLatestReview';

vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));
const mocks = vi.hoisted(() => ({ stats: vi.fn(), latest: vi.fn() }));
vi.mock('@/hooks/useBusinessReviewStats', () => ({ useBusinessReviewStats: (...args: unknown[]) => mocks.stats(...args) }));
vi.mock('@/hooks/useClubLatestReview', () => ({ useClubLatestReview: (...args: unknown[]) => mocks.latest(...args) }));
vi.mock('@/components/ui/SquircleAvatar', () => {
  const MockSquircleAvatar = (props: { userId?: string; src?: string | null; hairlineRing?: boolean }) => (
    <div data-testid="squircle-avatar" data-user-id={props.userId} data-src={props.src ?? ''} data-hairline-ring={props.hairlineRing ? 'true' : 'false'} />
  );
  return { SquircleAvatar: MockSquircleAvatar, default: MockSquircleAvatar };
});

const east = { id: 'east', name: 'Sundridge Park Golf Club (East Course)', country: 'England', region: 'Kent' };
const west = { ...east, id: 'west', name: 'Sundridge Park Golf Club (West Course)' };

const stats = (over: Partial<BusinessReviewStats> = {}): BusinessReviewStats => ({
  totalReviews: 5,
  avgRating: 8.2,
  distribution: [],
  subRatings: { design: 8.1, condition: 8.6, facilities: 8.4, clubhouse: 8.9 },
  recentReviews: 0,
  reviewTrend: 0,
  courses: [
    { id: 'east', name: east.name, avgRating: 8.3, reviewCount: 3, recentCount: 0 },
    { id: 'west', name: west.name, avgRating: 8.0, reviewCount: 2, recentCount: 0 },
  ],
  ...over,
});

const review = (over: Partial<ClubLatestReview> = {}): ClubLatestReview => ({
  id: 'r1',
  course_id: 'east',
  user_id: 'u1',
  rating: 8.5,
  review: 'Great course, great people, just all round a lovely place to be a member.',
  review_date: '2026-10-26',
  user_profiles: { id: 'u1', username: 'ben', display_name: 'Benjamin Holmes', profile_photo_url: null },
  ...over,
});

function LocationProbe() {
  const l = useLocation();
  return <div data-testid="loc">{l.pathname}</div>;
}

const mount = (over: Partial<React.ComponentProps<typeof ClubWhatGolfersSay>> = {}) =>
  render(
    <MemoryRouter>
      <ClubWhatGolfersSay isClub businessId="b1" businessName="Sundridge Park Golf Club" courses={[east, west]} viewerId="viewer" {...over} />
      <LocationProbe />
    </MemoryRouter>,
  );

beforeEach(() => {
  mocks.stats.mockReset(); mocks.latest.mockReset();
  mocks.stats.mockReturnValue({ data: stats(), isLoading: false });
  mocks.latest.mockReturnValue({ data: review(), isLoading: false });
});
afterEach(cleanup);

const card = () => screen.getByTestId('loc').parentElement!.querySelector('[data-club-what-say]')! as HTMLElement;

describe('CB106 count, rating and sub-scores', () => {
  it('shows the review count and its singular', () => {
    mount();
    expect(screen.getByText('5 reviews')).toBeTruthy();
    cleanup();
    mocks.stats.mockReturnValue({ data: stats({ totalReviews: 1 }), isLoading: false });
    mount();
    expect(screen.getByText('1 review')).toBeTruthy();
  });
  it('shows the average to one decimal with "out of 10"', () => {
    mount();
    expect(screen.getByText('8.2')).toBeTruthy();
    expect(screen.getByText('out of 10')).toBeTruthy();
  });
  it('renders sub-score rows in order with white fills at score×10%', () => {
    mount();
    const rows = screen.getAllByText(/^(Design|Condition|Facilities|Clubhouse)$/);
    expect(rows.map((r) => r.textContent)).toEqual(['Design', 'Condition', 'Facilities', 'Clubhouse']);
    const design = card().querySelector('[data-club-say-sub="design"]') as HTMLElement;
    const fill = design.querySelector('[data-club-say-fill]') as HTMLElement;
    expect(fill.style.width).toBe('81%');
    expect(fill.style.background).toBe('rgba(248, 250, 252, 0.78)');
    expect(within(design).getByText('8.1')).toBeTruthy();
  });
  it('drops null sub-score rows', () => {
    mocks.stats.mockReturnValue({ data: stats({ subRatings: { design: 8.1, condition: null, facilities: null, clubhouse: 8.9 } }), isLoading: false });
    mount();
    expect(screen.getByText('Design')).toBeTruthy();
    expect(screen.getByText('Clubhouse')).toBeTruthy();
    expect(screen.queryByText('Condition')).toBeNull();
    expect(screen.queryByText('Facilities')).toBeNull();
  });
});

describe('CB106 latest review', () => {
  it('renders a squircle avatar with userId and the score chip', () => {
    mount();
    const avatar = screen.getByTestId('squircle-avatar');
    expect(avatar.getAttribute('data-user-id')).toBe('u1');
    expect(avatar.getAttribute('data-hairline-ring')).toBe('true');
    const chip = card().querySelector('[data-club-say-chip]') as HTMLElement;
    expect(chip.textContent).toBe('8.5');
    expect(chip.style.color).toBe('rgb(248, 250, 252)');
  });
  it('clamps the review text to three lines', () => {
    mount();
    const text = card().querySelector('[data-club-say-text]') as HTMLElement;
    expect(text.className).toContain('club-say-clamp');
    const css = readFileSync(resolve(__dirname, '../index.css'), 'utf8');
    expect(css).toMatch(/\.club-say-clamp\s*\{[^}]*-webkit-line-clamp:\s*3/);
    expect(css).toMatch(/\.club-say-clamp\s*\{[^}]*overflow:\s*hidden/);
  });
  it('meta carries the course short name on multi-course clubs', () => {
    mount();
    expect(screen.getByText('East Course · 26 Oct')).toBeTruthy();
  });
  it('meta omits the course name on single-course clubs', () => {
    mount({ courses: [east] });
    expect(screen.getByText('26 Oct')).toBeTruthy();
    expect(screen.queryByText(/East Course ·/)).toBeNull();
  });
  it('adds the year when the review is not from the current year', () => {
    expect(reviewMetaDate('2024-05-03', new Date('2026-10-27'))).toBe('3 May 2024');
    expect(reviewMetaDate('2026-05-03', new Date('2026-10-27'))).toBe('3 May');
  });
  it('tapping the review opens that course’s reviews page', () => {
    mount();
    fireEvent.click(card().querySelector('[data-club-say-review]') as HTMLElement);
    expect(screen.getByTestId('loc').textContent).toBe('/courses/east/reviews');
  });
});

describe('CB106 foot', () => {
  it('single-course clubs show Read all beside Rate it', () => {
    mocks.stats.mockReturnValue({ data: stats({ totalReviews: 12, courses: [{ id: 'east', name: east.name, avgRating: 7.6, reviewCount: 12, recentCount: 0 }] }), isLoading: false });
    mount({ courses: [east] });
    const readAll = screen.getByText('Read all 12 reviews ›');
    fireEvent.click(readAll);
    expect(screen.getByTestId('loc').textContent).toBe('/courses/east/reviews');
    expect(screen.getByText('Rate it')).toBeTruthy();
  });
  it('multi-course clubs list per-course rows ordered by review count', () => {
    mount();
    const rows = [...card().querySelectorAll('[data-club-say-course]')] as HTMLElement[];
    expect(rows.map((r) => r.getAttribute('data-club-say-course'))).toEqual(['east', 'west']);
    expect(rows[0].textContent).toContain('East Course reviews');
    expect(rows[0].textContent).toContain('3 ›');
    expect(rows[1].textContent).toContain('2 ›');
    fireEvent.click(rows[1]);
    expect(screen.getByTestId('loc').textContent).toBe('/courses/west/reviews');
  });
  it('per-course rows skip courses without reviews', () => {
    mocks.stats.mockReturnValue({ data: stats({ courses: [
      { id: 'east', name: east.name, avgRating: 8.3, reviewCount: 3, recentCount: 0 },
      { id: 'west', name: west.name, avgRating: 0, reviewCount: 0, recentCount: 0 },
    ] }), isLoading: false });
    mount();
    const rows = [...card().querySelectorAll('[data-club-say-course]')] as HTMLElement[];
    expect(rows.map((r) => r.getAttribute('data-club-say-course'))).toEqual(['east']);
  });
});

describe('CB106 Rate it', () => {
  it('is hidden for team members', () => {
    mount({ isTeamMember: true });
    expect(screen.queryByText('Rate it')).toBeNull();
    expect(screen.queryByText('Played it?')).toBeNull();
  });
  it('is hidden for signed-out viewers', () => {
    mount({ viewerId: undefined });
    expect(screen.queryByText('Rate it')).toBeNull();
  });
  it('opens the composer directly on a single-course club', () => {
    mount({ courses: [east] });
    fireEvent.click(screen.getByText('Rate it'));
    expect(screen.getByTestId('loc').textContent).toBe('/courses/east/rate');
  });
  it('asks which course on multi-course clubs, then opens the composer', () => {
    mount();
    fireEvent.click(screen.getByText('Rate it'));
    expect(screen.getByText('Which course did you play?')).toBeTruthy();
    fireEvent.click(document.querySelector('[data-club-say-pick="west"]') as HTMLElement);
    expect(screen.getByTestId('loc').textContent).toBe('/courses/west/rate');
  });
});

describe('CB106 no reviews', () => {
  const empty = () => mocks.stats.mockReturnValue({ data: null, isLoading: false });
  it('invites signed-in non-team viewers to be first', () => {
    empty();
    mount();
    expect(screen.getByText('No one has reviewed Sundridge Park yet.')).toBeTruthy();
    expect(screen.getByText('Played it? Be the first.')).toBeTruthy();
    expect(screen.getByText('Rate it')).toBeTruthy();
  });
  it('renders no card for team members', () => {
    empty();
    mount({ isTeamMember: true });
    expect(screen.queryByText('What golfers say')).toBeNull();
  });
  it('renders no card for signed-out viewers', () => {
    empty();
    mount({ viewerId: undefined });
    expect(screen.queryByText('What golfers say')).toBeNull();
  });
  it('renders no card while stats are loading', () => {
    mocks.stats.mockReturnValue({ data: undefined, isLoading: true });
    mount();
    expect(screen.queryByText('What golfers say')).toBeNull();
  });
});

describe('CB106 all-white ratings', () => {
  it('no green or score-graded colour anywhere in the card', () => {
    mount();
    const el = card();
    const bad = /green|rgb\(2[12],\s*1[0-9]{2}|#16a34a|#22c55e|#15803d/i;
    for (const node of [el, ...el.querySelectorAll<HTMLElement>('*')]) {
      expect(node.style.color).not.toMatch(bad);
      expect(node.style.background).not.toMatch(bad);
      expect(node.style.backgroundColor).not.toMatch(bad);
    }
  });
});
