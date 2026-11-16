import React from 'react';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';

/* ---------------------------------------------------------------- mocks */

const f = vi.hoisted(() => ({
  recentRows: [] as Array<Record<string, unknown>>,
  snapshot: null as unknown,
  rpcCalls: [] as Array<Record<string, unknown>>,
}));

vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => (typeof o === 'string' ? o : o?.defaultValue ?? ''), i18n: { language: 'en' } }) }));
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    rpc: (name: string, args: Record<string, unknown>) => {
      f.rpcCalls.push({ name, ...args });
      if (name === 'get_friend_hybrid_snapshot') return Promise.resolve({ data: f.snapshot, error: null });
      return Promise.resolve({ data: [], error: null });
    },
  },
}));
vi.mock('@/hooks/useSupabaseSession', () => ({ useSupabaseSession: () => ({ user: { id: 'me' }, loading: false }) }));
vi.mock('@/hooks/messaging/useStartConversation', () => ({ useStartConversation: () => ({ start: vi.fn() }) }));
vi.mock('@/components/explore-tab-new/courseled/hooks/useRoundHoleShapes', () => ({ useRoundHoleShapes: () => new Map() }));
vi.mock('@/components/ui/SquircleAvatar', () => ({ SquircleAvatar: () => null }));
vi.mock('@/utils/analyticsEvents', () => ({ analyticsEvents: { track: vi.fn() } }));
import { useScorecardOpener } from '@/components/explore-tab-new/useScorecardOpener';
import { useMemberTapResolver } from '@/components/friend-sheet/useMemberTapResolver';
import { RoundCard } from '@/features/explore-magazine/watch/RoundCard';

/* ------------------------------------------------------------- fixtures */

const round = (id: string) => ({
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
  total_count: 1,
});

/* ------------------------------------------------------------- harness */

function LocationView() {
  const loc = useLocation();
  return <div data-testid="loc" data-path={loc.pathname} data-search={loc.search} />;
}

const loc = () => {
  const el = screen.getByTestId('loc');
  return { path: el.getAttribute('data-path'), search: el.getAttribute('data-search') ?? '' };
};

/** The REAL opener, wired the way ExploreMagazine/RoundsPage wire it, on the shared round card. */
function CardHarness() {
  const opener = useScorecardOpener();
  return (
    <>
      <LocationView />
      <RoundCard
        round={f.recentRows[0] as unknown as Parameters<typeof RoundCard>[0]['round']}
        shapes={new Map()}
        locale="en"
        onOpenRound={(scoreId, owner) => opener.openByScore(scoreId, null, owner)}
        onOpenMember={(id) => opener.openProfile(id)}
      />
      {opener.target ? <div data-testid="scorecard-open" data-score={opener.target.scoreId} /> : null}
    </>
  );
}

function OpenProfileHarness({ id }: { id: string }) {
  const opener = useScorecardOpener();
  return (
    <>
      <LocationView />
      <button type="button" onClick={() => opener.openProfile(id)}>open</button>
    </>
  );
}

function ResolverHarness() {
  const { resolve } = useMemberTapResolver();
  return (
    <>
      <LocationView />
      <button type="button" onClick={() => void resolve({ targetUserId: 'u-2' })}>resolve</button>
    </>
  );
}

function mount(node: React.ReactNode) {
  return render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <MemoryRouter initialEntries={['/explore']}>
        <Routes>
          <Route path="*" element={node} />
          <Route path="/profile/:id" element={<LocationView />} />
          <Route path="/profile" element={<LocationView />} />
          <Route path="/handicap" element={<LocationView />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  f.recentRows = [round('a')];
  f.snapshot = null;
  f.rpcCalls = [];
});

afterEach(cleanup);

/* ---------------------------------------------------------------- tests */

describe('member taps outside the handicap area open the profile', () => {
  it("openProfile('u-2') navigates to /profile/u-2", () => {
    mount(<OpenProfileHarness id="u-2" />);
    fireEvent.click(screen.getByRole('button', { name: 'open' }));
    expect(loc().path).toBe('/profile/u-2');
  });

  it('openProfile(own id) navigates to the own profile, not /handicap', () => {
    mount(<OpenProfileHarness id="me" />);
    fireEvent.click(screen.getByRole('button', { name: 'open' }));
    expect(loc().path).toBe('/profile/me');
  });

  it('Round card: the name/avatar opens the owner profile and not the scorecard', async () => {
    mount(<CardHarness />);
    const who = await screen.findByRole('button', { name: 'Player a' });
    fireEvent.click(who);
    expect(loc().path).toBe('/profile/u-a');
    expect(screen.queryByTestId('scorecard-open')).toBeNull();
  });

  it('the tile body still opens the scorecard', async () => {
    mount(<CardHarness />);
    await screen.findByRole('button', { name: 'Player a' });
    fireEvent.click(document.querySelector('[data-rounds-shelf-card="round"]') as HTMLElement);
    expect(screen.getByTestId('scorecard-open').getAttribute('data-score')).toBe('s-a');
    expect(loc().path).toBe('/explore');
  });

  it('useMemberTapResolver still sends another member to the handicap compare route', async () => {
    f.snapshot = {
      profile: { display_name: 'Player Two', username: 'playertwo' },
      handicap: { is_synced: true, shared_rounds: 0 },
    };
    mount(<ResolverHarness />);
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'resolve' }));
    });
    expect(loc().path).toBe('/profile');
    expect(loc().search).toContain('tab=handicap');
    expect(loc().search).toContain('compare=u-2');
  });
});
