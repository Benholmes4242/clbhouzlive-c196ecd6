import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createInstance } from 'i18next';
import { I18nextProvider } from 'react-i18next';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { readFileSync } from 'node:fs';
import courses from '../../public/locales/en/courses.json';

/* ---------------------------------------------------------------- mocks */

const f = vi.hoisted(() => ({
  circle: { data: [] as unknown[], isFetched: true, isError: false },
  everyone: { data: [] as unknown[], isFetched: true, isError: false },
  feats: { data: [] as unknown[], isFetched: true, isError: false },
  shapes: null as unknown,
  track: vi.fn(),
  warn: vi.fn(),
}));

vi.mock('@/components/explore-tab-new/courseled/hooks/useStandoutRounds', () => ({
  useStandoutRounds: (_u: unknown, filters: { scope: string }) => (filters.scope === 'circle' ? f.circle : f.everyone),
}));
vi.mock('@/features/explore-magazine/useFeatsWindow', () => ({ useFeatsWindow: () => f.feats }));
vi.mock('@/components/explore-tab-new/courseled/hooks/useRoundHoleShapes', () => ({ useRoundHoleShapes: () => f.shapes }));
vi.mock('@/components/ui/SquircleAvatar', () => ({ SquircleAvatar: () => null }));
vi.mock('@/utils/analyticsEvents', () => ({ analyticsEvents: { track: f.track } }));

/* WatchFeed's own reads, so the feed renders with no network. */
vi.mock('@/features/explore-magazine/watch/useWatchVideos', () => ({
  useWatchVideos: () => ({ data: { pages: [[]] }, isFetched: true, isError: false, hasNextPage: false, isFetchingNextPage: false, refetch: vi.fn(), fetchNextPage: vi.fn() }),
}));
vi.mock('@/features/explore-magazine/watch/useWatchClips', () => ({
  useWatchClips: () => ({ data: { pages: [[]] }, isFetched: true, isError: false, hasNextPage: false, isFetchingNextPage: false, refetch: vi.fn(), fetchNextPage: vi.fn() }),
}));
vi.mock('@/features/explore-magazine/watch/useWatchSignals', () => ({ useWatchProgress: () => ({ data: new Map() }) }));
/* WS1 — the Creators row and the lead read their own RPCs; keep them off the
   network here (no rows, so neither block renders). */
vi.mock('@/features/explore-magazine/watch/useFeaturedCreators', () => ({
  useFeaturedCreators: () => ({ data: [], isFetched: true, isError: false }),
}));
vi.mock('@/features/explore-magazine/watch/useWatchLead', () => ({
  useWatchLead: () => ({ data: null, isFetched: true, isError: false }),
}));
/* WS2 — the course and region shelves read their own RPCs; empty here. */
vi.mock('@/features/explore-magazine/watch/useWatchMiddle', () => ({
  useCourseVideos: () => ({ data: [], isLoading: false, isError: false }),
  useWatchRegions: () => ({ data: [], isLoading: false, isError: false }),
  useRegionCourses: () => ({ data: [], isLoading: false, isError: false }),
  useGridVideos: () => ({ data: undefined, isLoading: false, isError: false, hasNextPage: false, fetchNextPage: () => {} }),
}));
vi.mock('@/components/explore-tab-new/courseled/hooks/useMomentsOfTheWeek', () => ({
  useMomentsOfTheWeek: () => ({ data: [], isFetched: true, isError: false, refetch: vi.fn() }),
}));
vi.mock('@/hooks/gam/useUserAnalyticsCourses', () => ({ useUserAnalyticsCourses: () => ({ data: [] }) }));
vi.mock('@/context/ActiveActorContext', () => ({ useActiveActor: () => ({ activeActor: null }) }));
vi.mock('@/components/clubhouse/hooks/useClubhouseLikes', () => ({
  useClubhouseLikes: () => ({ handleLike: vi.fn(), getActiveLikeState: () => ({ isLiked: false, count: 0 }) }),
}));

/* RoundsPage / AmateurPage dependencies. */
vi.mock('@/features/explore-magazine/ScoresLeaderboardsPage', () => ({
  ScoresLeaderboardsPage: (p: { userId?: string; sessionKnown?: boolean }) => (
    <div data-testid="scores-page" data-user={p.userId ?? ''} data-session={String(p.sessionKnown)} />
  ),
}));
vi.mock('@/features/amateur/useAmateurBoardState', () => ({ useAmateurBoardState: () => ({ board: 'recent' }) }));
vi.mock('@/hooks/useSupabaseSession', () => ({ useSupabaseSession: () => ({ user: { id: 'me' }, loading: false }) }));
vi.mock('@/components/explore-tab-new/useScorecardOpener', () => ({
  useScorecardOpener: () => ({ target: null, openByScore: vi.fn(), openProfile: vi.fn(), close: vi.fn() }),
}));
vi.mock('@/components/profile/handicap/whs/sections/round-detail/RoundDetailSheet', () => ({ RoundDetailSheet: () => null }));
vi.mock('@/components/common/ScrollToTopGlass', () => ({ default: () => null }));
vi.mock('@/features/explore-magazine/UnknownConnectionFallback', () => ({ UnknownConnectionFallback: () => null }));
vi.mock('@/features/explore-magazine/ExploreMagazine', () => ({ ExploreMagazine: () => <div data-testid="explore-magazine" /> }));
vi.mock('@/features/guest/useGuestSurfaceGate', () => ({ useGuestScrollGate: () => {} }));
vi.mock('@/hooks/useDiscoverLastSeen', () => ({ useDiscoverLastSeen: () => ({ markSeen: vi.fn() }), useMarkDiscoverSeenOnExit: () => {} }));

import { RoundsThisWeekShelf } from '@/features/explore-magazine/watch/RoundsThisWeekShelf';
import { WatchFeed } from '@/features/explore-magazine/watch/WatchFeed';
import RoundsPage from '@/pages/RoundsPage';
import AmateurPage from '@/pages/AmateurPage';
import {
  SHELF_FEAT_CAP,
  buildShelfCards,
  eligibleFeats,
  roundToPar,
  stripColor,
  toParLabel,
} from '@/features/explore-magazine/watch/roundsShelfRules';
import { EXPLORE_VIEWS, readExploreView } from '@/features/explore-magazine/exploreViewMemory';
import type { StandoutRound } from '@/components/explore-tab-new/courseled/hooks/useStandoutRounds';
import type { FeatKind, FeatYearRow } from '@/features/explore-magazine/useFeatsWindow';

/* ------------------------------------------------------------- fixtures */

const i18n = createInstance();
void i18n.init({ lng: 'en', initAsync: false, interpolation: { escapeValue: false }, resources: { en: { courses } } });

function mount(node: React.ReactNode, initial = '/') {
  return render(
    <MemoryRouter initialEntries={[initial]}>
      <I18nextProvider i18n={i18n}>
        <Routes>
          <Route path="*" element={node} />
          <Route path="/rounds" element={<div data-testid="rounds-route" />} />
        </Routes>
      </I18nextProvider>
    </MemoryRouter>,
  );
}

const daysAgo = (n: number) => new Date(Date.now() - n * 86_400_000).toISOString();

const round = (id: string, over: Partial<StandoutRound> = {}): StandoutRound => ({
  pos: 1,
  user_id: `u-${id}`,
  display_name: `Player ${id}`,
  profile_photo_url: null,
  whs_score_id: `s-${id}`,
  play_date: '2026-10-31',
  course_id: null,
  course_name: 'Royal County Down Golf Club (Championship)',
  gross_score: 81,
  course_par: 71,
  net_score: 70,
  course_handicap: null,
  is_competition: false,
  prior_n: 5,
  avg_topar: 3,
  best_topar: -1,
  last_better: null,
  delta: -2,
  ...over,
});

const feat = (kind: FeatKind, over: Partial<FeatYearRow> = {}): FeatYearRow => ({
  feat_kind: kind,
  events: 24,
  rounds_with: 20,
  members: 10,
  denominator: 13368,
  denominator_unit: 'holes',
  total_rounds: 743,
  total_holes: 13368,
  total_members: 50,
  rounds_estimated: 0,
  viewer_events: 0,
  viewer_rounds_with: 0,
  latest_user_id: 'u1',
  latest_display_name: 'mikem84',
  latest_photo_url: null,
  latest_score_id: `fs-${kind}`,
  latest_course_id: null,
  latest_course_name: 'Trevose Golf Club (Championship)',
  latest_play_date: daysAgo(2),
  ...over,
});

const eighteenHoles = Array.from({ length: 18 }, (_, i) => ({
  holeNo: i + 1,
  par: 4,
  strokes: i === 0 ? 3 : i === 1 ? 6 : i === 2 ? 2 : i === 3 ? 5 : 4,
  sheetStrokes: 4,
}));

beforeEach(() => {
  vi.clearAllMocks();
  sessionStorage.clear();
  f.circle = { data: [round('a'), round('b'), round('c'), round('d')], isFetched: true, isError: false };
  f.everyone = { data: [round('w'), round('x')], isFetched: true, isError: false };
  f.feats = { data: [feat('eagle')], isFetched: true, isError: false };
  f.shapes = new Map([['s-a', { coursePar: 71, series: [], beads: [], played: 18, birdies: 2, holes: eighteenHoles }]]);
  vi.spyOn(console, 'warn').mockImplementation(f.warn);
});
afterEach(cleanup);

const shelf = (props: Partial<Parameters<typeof RoundsThisWeekShelf>[0]> = {}) =>
  mount(<RoundsThisWeekShelf userId="me" {...props} />);

/* ---------------------------------------------------------------- rules */

describe('RS shelf rules', () => {
  it('keeps only feats from the last 14 days with a score id, in rarity order, capped at two', () => {
    const rows = [
      feat('clean_card'),
      feat('ace', { latest_play_date: daysAgo(20) }),
      feat('albatross', { latest_score_id: null }),
      feat('eagle'),
    ];
    const out = eligibleFeats(rows);
    expect(out.map((r) => r.feat_kind)).toEqual(['eagle', 'clean_card']);
    expect(out.length).toBe(SHELF_FEAT_CAP);
    expect(eligibleFeats([feat('ace'), feat('albatross'), feat('eagle')]).map((r) => r.feat_kind)).toEqual(['ace', 'albatross']);
  });

  it('orders cards round, round, feat, round, round, feat and closes up missing slots', () => {
    const rounds = [round('1'), round('2'), round('3'), round('4')];
    const feats = [feat('ace'), feat('eagle')];
    expect(buildShelfCards(rounds, feats).map((c) => c.kind)).toEqual(['round', 'round', 'feat', 'round', 'round', 'feat']);
    expect(buildShelfCards(rounds.slice(0, 3), feats.slice(0, 1)).map((c) => c.kind)).toEqual(['round', 'round', 'feat', 'round']);
    expect(buildShelfCards(rounds, []).map((c) => c.kind)).toEqual(['round', 'round', 'round', 'round']);
    expect(buildShelfCards([], feats).map((c) => c.kind)).toEqual(['feat', 'feat']);
  });

  it('computes net to par and its label', () => {
    expect(roundToPar(round('a'))).toBe(-1);
    expect(roundToPar(round('a', { course_par: null }))).toBeNull();
    expect(toParLabel(-1)).toBe('−1');
    expect(toParLabel(0)).toBe('E');
    expect(toParLabel(2)).toBe('+2');
    expect(toParLabel(null)).toBeNull();
  });

  it('maps hole scores to the scorecard strip palette', () => {
    expect(stripColor(2, 4)).toBe('#E8C766');
    expect(stripColor(3, 4)).toBe('#E24B3F');
    expect(stripColor(4, 4)).toBe('rgba(255,255,255,0.14)');
    expect(stripColor(5, 4)).toBe('#A6C2F0');
    expect(stripColor(6, 4)).toBe('#7AA6EC');
    expect(stripColor(null, 4)).toBe('rgba(255,255,255,0.14)');
  });
});

/* ---------------------------------------------------------------- shelf */

describe('RS Rounds this week shelf', () => {
  it('renders the heading, circle sub-line and interleaved cards for a signed-in member', () => {
    shelf();
    expect(screen.getByText('Rounds this week')).toBeInTheDocument();
    expect(screen.getByText('Your circle, last 14 days')).toBeInTheDocument();
    const kinds = Array.from(document.querySelectorAll('[data-rounds-shelf-card]')).map((n) => n.getAttribute('data-rounds-shelf-card'));
    expect(kinds).toEqual(['round', 'round', 'feat', 'round', 'round']);
    expect(screen.getAllByText('Royal County Down · Championship · Oct 31')).toHaveLength(4);
  });

  it('falls back to everyone under two circle rows and says so', () => {
    f.circle = { data: [round('only')], isFetched: true, isError: false };
    shelf();
    expect(screen.getByText('Everyone, last 14 days')).toBeInTheDocument();
    expect(screen.getByText('Player w')).toBeInTheDocument();
  });

  it('hides the heading when there are no cards but keeps the door', () => {
    f.circle = { data: [], isFetched: true, isError: false };
    f.everyone = { data: [], isFetched: true, isError: false };
    f.feats = { data: [], isFetched: true, isError: false };
    shelf();
    expect(screen.queryByText('Rounds this week')).toBeNull();
    expect(screen.getByText('Leaderboards, feats and every round')).toBeInTheDocument();
  });

  it('hides the shelf quietly on error, keeps the door and logs', () => {
    f.circle = { data: [], isFetched: true, isError: true };
    shelf();
    expect(screen.queryByText('Rounds this week')).toBeNull();
    expect(screen.getByText('Leaderboards, feats and every round')).toBeInTheDocument();
    expect(f.warn).toHaveBeenCalled();
  });

  it('renders nothing for a signed-out visitor', () => {
    mount(<RoundsThisWeekShelf userId={undefined} />);
    expect(document.querySelector('[data-rounds-shelf]')).toBeNull();
    expect(screen.queryByText('Leaderboards, feats and every round')).toBeNull();
  });

  it('reserves the heading, two cards and the door while loading', () => {
    f.circle = { data: [], isFetched: false, isError: false };
    shelf();
    expect(document.querySelector('[data-rounds-shelf="loading"]')).toBeInTheDocument();
    expect(screen.getByText('Leaderboards, feats and every round')).toBeInTheDocument();
  });

  it('round card: net with red under-par figure, comp kicker, strip and standout sentence', () => {
    f.circle = { data: [round('a', { is_competition: true }), round('b')], isFetched: true, isError: false };
    f.feats = { data: [], isFetched: true, isError: false };
    shelf();
    const card = document.querySelector('[data-rounds-shelf-card="round"]') as HTMLElement;
    expect(card.textContent).toContain('70');
    const toPar = card.querySelector('.tabular-nums + span, b + span');
    expect(toPar?.textContent).toBe('−1');
    expect((toPar as HTMLElement).style.color).toBe('rgb(226, 75, 63)');
    expect(card.textContent).toContain('Net · gross 81 · comp'.replace(' · comp', ''));
    expect(card.textContent?.toLowerCase()).toContain('comp');
    const bars = card.querySelectorAll('i');
    expect(bars).toHaveLength(18);
    expect((bars[0] as HTMLElement).style.background).toBe('rgb(226, 75, 63)');
    expect((bars[1] as HTMLElement).style.background).toBe('rgb(122, 166, 236)');
    expect((bars[2] as HTMLElement).style.background).toBe('rgb(232, 199, 102)');
    expect((bars[3] as HTMLElement).style.background).toBe('rgb(166, 194, 240)');
    expect(card.textContent).toContain('Best ever at Royal County Down Golf Club (Championship)');
  });

  it('round card: level par reads E in mute and no strip renders without shapes', () => {
    f.circle = { data: [round('a', { net_score: 71 }), round('b')], isFetched: true, isError: false };
    f.feats = { data: [], isFetched: true, isError: false };
    f.shapes = null;
    shelf();
    const card = document.querySelector('[data-rounds-shelf-card="round"]') as HTMLElement;
    expect(card.textContent).toContain('E');
    expect(card.querySelectorAll('i')).toHaveLength(0);
  });

  it('feat card: label, rarity wording and the latest-of line, singular included', () => {
    f.circle = { data: [round('a'), round('b')], isFetched: true, isError: false };
    f.feats = { data: [feat('eagle')], isFetched: true, isError: false };
    shelf();
    const card = document.querySelector('[data-rounds-shelf-card="feat"]') as HTMLElement;
    expect(card.textContent).toContain('Eagle');
    expect(card.textContent).toContain('1 in every 557 holes');
    expect(card.textContent).toContain('The latest of 24 this year');
    cleanup();
    f.feats = { data: [feat('eagle', { events: 1 })], isFetched: true, isError: false };
    shelf();
    expect(document.querySelector('[data-rounds-shelf-card="feat"]')?.textContent).toContain('The only one this year');
  });

  it('taps open the right score id; avatar opens the member; both doors go to /rounds', () => {
    const onOpenRound = vi.fn();
    const onOpenMember = vi.fn();
    shelf({ onOpenRound, onOpenMember });
    fireEvent.click(document.querySelector('[data-rounds-shelf-card="round"]') as HTMLElement);
    expect(onOpenRound).toHaveBeenCalledWith('s-a', 'u-a');
    expect(f.track).toHaveBeenCalledWith('rounds_shelf_card_tapped', { kind: 'round' });
    fireEvent.click(document.querySelector('[data-rounds-shelf-card="feat"]') as HTMLElement);
    expect(onOpenRound).toHaveBeenCalledWith('fs-eagle', 'u1');
    expect(f.track).toHaveBeenCalledWith('rounds_shelf_card_tapped', { kind: 'feat', feat_kind: 'eagle' });
    fireEvent.click(screen.getAllByRole('button', { name: 'Player a' })[0]);
    expect(onOpenMember).toHaveBeenCalledWith('u-a');
    fireEvent.click(screen.getByText('All rounds'));
    expect(screen.getByTestId('rounds-route')).toBeInTheDocument();
    expect(f.track).toHaveBeenCalledWith('rounds_door_tapped', { from: 'header' });
    cleanup();
    shelf({ onOpenRound, onOpenMember });
    fireEvent.click(screen.getByText('Leaderboards, feats and every round'));
    expect(f.track).toHaveBeenCalledWith('rounds_door_tapped', { from: 'door' });
  });
});

/* ------------------------------------------------------- Watch placement */

describe('RS shelf placement on Watch', () => {
  /* WS1 — chips renamed: All → For you, Quick hits → Shorts. Same shelf rules. */
  it('shows on the For you chip for a signed-in member, after Quick hits, and not on other chips', () => {
    mount(<WatchFeed userId="me" onDepart={() => {}} />);
    expect(document.querySelector('[data-rounds-shelf]')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('tab', { name: 'Shorts' }));
    expect(document.querySelector('[data-rounds-shelf]')).toBeNull();
    fireEvent.click(screen.getByRole('tab', { name: 'For you' }));
    expect(document.querySelector('[data-rounds-shelf]')).toBeInTheDocument();
  });

  it('is absent for a signed-out visitor', () => {
    mount(<WatchFeed userId={undefined} onDepart={() => {}} />);
    expect(document.querySelector('[data-rounds-shelf]')).toBeNull();
  });
});

/* ------------------------------------------------------------- /rounds */

describe('RS /rounds page', () => {
  it('mounts the scores board with the viewer and fires rounds_page_viewed', () => {
    mount(<RoundsPage />);
    const page = screen.getByTestId('scores-page');
    expect(page).toHaveAttribute('data-user', 'me');
    expect(page).toHaveAttribute('data-session', 'true');
    expect(screen.getByText('Rounds')).toBeInTheDocument();
    expect(f.track).toHaveBeenCalledWith('rounds_page_viewed', {});
  });

  it('back falls back to /amateur when there is no history', () => {
    render(
      <MemoryRouter initialEntries={['/rounds']}>
        <I18nextProvider i18n={i18n}>
          <Routes>
            <Route path="/rounds" element={<RoundsPage />} />
            <Route path="/amateur" element={<div data-testid="amateur-route" />} />
          </Routes>
        </I18nextProvider>
      </MemoryRouter>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Back' }));
    expect(screen.getByTestId('amateur-route')).toBeInTheDocument();
  });

  function RoundsMarker() {
    const { search } = useLocation();
    return <div data-testid="rounds-marker" data-search={search} />;
  }

  const renderAmateur = (entry: string) =>
    render(
      <QueryClientProvider client={new QueryClient()}>
        <MemoryRouter initialEntries={[entry]}>
          <I18nextProvider i18n={i18n}>
            <Routes>
              <Route path="/amateur" element={<AmateurPage />} />
              <Route path="/rounds" element={<RoundsMarker />} />
            </Routes>
          </I18nextProvider>
        </MemoryRouter>
      </QueryClientProvider>,
    );

  it('/amateur?view=scores redirects to /rounds keeping other params', () => {
    renderAmateur('/amateur?view=scores&tab=x');
    expect(screen.getByTestId('rounds-marker')).toHaveAttribute('data-search', '?tab=x');
  });

  it('/amateur without view=scores still renders Explore', () => {
    renderAmateur('/amateur?view=watch');
    expect(screen.getByTestId('explore-magazine')).toBeInTheDocument();
  });
});

/* ------------------------------------------------- Explore switch removal */

describe('RS Explore opens on Watch', () => {
  it('EXPLORE_VIEWS cannot land on scores; a remembered scores falls to Watch', () => {
    expect(EXPLORE_VIEWS).not.toContain('scores');
    sessionStorage.setItem('amateur:view', 'scores');
    expect(readExploreView()).toBe('watch');
  });

  it('ExploreMagazine carries no Scores mount, board state or view switch', () => {
    const source = readFileSync('src/features/explore-magazine/ExploreMagazine.tsx', 'utf8');
    for (const gone of [
      'ScoresLeaderboardsPage',
      'useAmateurBoardState',
      'BoardFilterPanel',
      'changeView',
      'writeExploreView',
      'ScoresStandingSlot',
      'CircleShelf',
      'UnknownConnectionFallback',
      'boardRowPress',
      'scoresBoardActive',
    ]) {
      expect(source).not.toContain(gone);
    }
    expect(source).toContain('WatchFeed');
  });
});
