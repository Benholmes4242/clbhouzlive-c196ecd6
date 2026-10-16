import { beforeEach, describe, expect, it, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { readFileSync } from 'node:fs';
import {
  buildReadout,
  chooseCirclePeople,
  costliestThree,
  displayCourseName,
  nextFooterHidden,
  startingHandicap,
} from '@/components/profile/handicap/whs/connect/EmptyStateScreen';
import { EmptyStateScreen } from '@/components/profile/handicap/whs/connect/EmptyStateScreen';
import { analyticsEvents } from '@/utils/analyticsEvents';

const state = vi.hoisted(() => ({
  session: { user: undefined as { id: string } | undefined, loading: true },
  home: { clubId: null as string | null, isFetched: false, isLoading: false },
  intro: { isPending: true, data: null as any },
  profile: { eg_handicap_index: null as number | null, manual_handicap_index: 13 as number | null },
  band: null as any,
  circle: { circle: 1, connected: 1, people: [{ user_id: 'p1', name: 'Alice', avatar_url: null, club: 'Parkstone', index: 14 }] },
}));

vi.mock('@/hooks/useSupabaseSession', () => ({
  useSupabaseSession: () => state.session,
}));

vi.mock('@/features/home-club/useHomeClubStatus', () => ({
  useHomeClubStatus: vi.fn(() => state.home),
}));

const introSpy = vi.fn();
vi.mock('@/components/profile/handicap/whs/connect/useConnectIntroCourse', () => ({
  useConnectIntroCourse: (...args: unknown[]) => introSpy(...args),
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          maybeSingle: vi.fn(async () => ({ data: state.profile, error: null })),
        })),
      })),
    })),
    rpc: vi.fn(async (name: string) => {
      if (name === 'get_connect_intro_band') return { data: state.band, error: null };
      if (name === 'get_connect_circle_preview') return { data: state.circle, error: null };
      return { data: null, error: null };
    }),
    auth: { onAuthStateChange: vi.fn(), getSession: vi.fn() },
  },
  SUPABASE_URL: 'https://example.test',
}));

vi.mock('@/utils/analyticsEvents', () => ({ analyticsEvents: { track: vi.fn() } }));
vi.mock('@/features/home-club/homeClubPickerStore', () => ({ openHomeClubPicker: vi.fn() }));

function holes() {
  return Array.from({ length: 18 }, (_, i) => ({ hole_no: i + 1, par: 4, stroke_index: i + 1, avg_to_par: i < 3 ? 1.5 - i * 0.1 : 0.2 }));
}

function loadedBand(hcp = 12) {
  const block = { rounds: 9, golfers: 3, median_gross: 85, par: 71, holes: holes() };
  return { available: true, hcp, band: { ...block, lo: 10, hi: 14 }, all: block };
}

function renderIntro(layout: 'page' | 'embedded' = 'page') {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={qc}><EmptyStateScreen layout={layout} onPickCountry={() => {}} onDecline={() => {}} /></QueryClientProvider>);
}

beforeEach(() => {
  vi.clearAllMocks();
  state.session = { user: undefined, loading: true };
  state.home = { clubId: null, isFetched: false, isLoading: false };
  state.intro = { isPending: true, data: null };
  state.profile = { eg_handicap_index: null, manual_handicap_index: 13 };
  state.band = loadedBand(12);
  state.circle = { circle: 1, connected: 1, people: [{ user_id: 'p1', name: 'Alice', avatar_url: null, club: 'Parkstone', index: 14 }] };
  introSpy.mockImplementation(() => state.intro);
});

describe('connect intro try-it helpers', () => {
  it.each([
    ['Sundridge Park Golf Club (East Course)', 'Sundridge Park East'],
    ['Parkstone Golf Club', 'Parkstone'],
    ["Royal St George's Golf Club", "Royal St George's"],
    ['The Grove', 'The Grove'],
    ['AB Golf Club', 'AB Golf Club'],
  ])('formats course display name %s', (input, expected) => {
    expect(displayCourseName(input)).toBe(expected);
  });

  it.each([
    [{ manualHandicapIndex: 12.4 }, 12],
    [{ manualHandicapIndex: -1.2 }, 0],
    [{ manualHandicapIndex: 40 }, 36],
    [{ manualHandicapIndex: null }, 18],
  ])('resolves starting handicap through display resolver', (input, expected) => {
    expect(startingHandicap(input)).toBe(expected);
  });

  it('chooses costliest three by avg, then lower stroke index, then lower hole', () => {
    const holes = [
      { hole_no: 4, par: 4, stroke_index: 7, avg_to_par: 1.1 },
      { hole_no: 2, par: 4, stroke_index: 8, avg_to_par: 1.2 },
      { hole_no: 3, par: 4, stroke_index: 5, avg_to_par: 1.2 },
      { hole_no: 1, par: 4, stroke_index: 1, avg_to_par: 0.2 },
    ];
    expect(costliestThree(holes).map((h) => h.hole_no)).toEqual([3, 2, 4]);
  });

  it('builds band and all-golfer readout copy including scratch and plus ranges', () => {
    const block = {
      rounds: 9,
      golfers: 3,
      median_gross: 85,
      par: 71,
      holes: [
        { hole_no: 18, par: 5, stroke_index: 4, avg_to_par: 1.2 },
        { hole_no: 7, par: 4, stroke_index: 2, avg_to_par: 1.0 },
        { hole_no: 2, par: 3, stroke_index: 9, avg_to_par: 0.9 },
      ],
    };
    expect(buildReadout(block, { ...block, lo: -4, hi: 2 }, 0).baseline).toContain('golfers off scratch');
    expect(buildReadout(block, { ...block, lo: -4, hi: 2 }, 0).source).toContain('off +4 to 2');
    expect(buildReadout(block, null, 12).source).toBe('Not enough rounds yet from golfers off 12, so this is every golfer here: 9 rounds.');
  });

  it('switches readout wording for negative hole figures', () => {
    const block = {
      rounds: 1,
      golfers: 1,
      median_gross: 70,
      par: 71,
      holes: [
        { hole_no: 1, par: 4, stroke_index: 1, avg_to_par: -0.1 },
        { hole_no: 2, par: 4, stroke_index: 2, avg_to_par: -0.2 },
        { hole_no: 3, par: 4, stroke_index: 3, avg_to_par: -0.3 },
      ],
    };
    expect(buildReadout(block, null, 5).cost).toContain('against par.');
  });

  it('windows circle people and leaves the You row before the first higher index', () => {
    const people = [2, 6, 9, 11, 13, 18, 22, 27, 31].map((index) => ({ user_id: String(index), name: String(index), avatar_url: null, club: null, index }));
    expect(chooseCirclePeople(people.slice(0, 3), 12).map((p) => p.index)).toEqual([2, 6, 9]);
    expect(chooseCirclePeople(people, 12).map((p) => p.index)).toEqual([9, 11, 13, 18]);
  });

  it('uses hysteresis for footer visibility', () => {
    expect(nextFooterHidden(false, 0.6)).toBe(true);
    expect(nextFooterHidden(true, 0.45)).toBe(true);
    expect(nextFooterHidden(true, 0.25)).toBe(false);
  });
});

describe('connect intro settled gate', () => {
  it('does not request the fallback course while the session is unresolved', () => {
    renderIntro();
    expect(introSpy).toHaveBeenCalledWith(null, false);
    expect(screen.queryByText('Parkstone')).toBeNull();
  });
});

describe('connect intro fix 1 behaviour', () => {
  beforeEach(() => {
    state.session = { user: { id: 'u1' }, loading: false };
    state.home = { clubId: 'club1', isFetched: true, isLoading: false };
    state.intro = { isPending: false, data: { source: 'home', courseId: 'course1', courseName: 'Parkstone Golf Club', holes: holes(), totalRounds: 9 } };
    state.band = loadedBand(12);
  });

  it('keeps footer out of fixed positioning and hides it in embedded layout', async () => {
    expect(readFileSync('src/components/profile/handicap/whs/connect/EmptyStateScreen.tsx', 'utf8')).not.toContain('position: \'fixed\'');
    const { container, rerender } = renderIntro('page');
    await screen.findByText('Connect your handicap');
    expect(container.textContent).toContain('Connect your official handicap and this is built from');

    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    rerender(<QueryClientProvider client={qc}><EmptyStateScreen layout="embedded" onPickCountry={() => {}} onDecline={() => {}} /></QueryClientProvider>);
    await screen.findByText('Which holes at');
    expect(container.textContent).not.toContain('Connect your official handicap and this is built from');
  });

  it('uses band.data.hcp for readout, table header, and circle placement while the stepper shows the live value', async () => {
    renderIntro('embedded');
    await screen.findByText('If you play off');
    expect(screen.getByText('13')).toBeInTheDocument();
    expect(screen.getByText(/golfers off 12 typically shoot here/)).toBeInTheDocument();
    expect(screen.getByText('Off 12')).toBeInTheDocument();
    expect(screen.getByText('You')).toBeInTheDocument();
  });

  it('keeps the circle second sentence at one connected golfer', async () => {
    renderIntro('embedded');
    expect(await screen.findByText('1 golfer you follow has connected. Connect to take your place among them.')).toBeInTheDocument();
  });

  it('fires connect_intro_viewed once after the loaded state renders', async () => {
    renderIntro('embedded');
    await waitFor(() => expect(analyticsEvents.track).toHaveBeenCalledWith('connect_intro_viewed', { source: 'home', band: true, h0: 13 }));
    await waitFor(() => expect((analyticsEvents.track as any).mock.calls.filter((c: unknown[]) => c[0] === 'connect_intro_viewed')).toHaveLength(1));
  });
});
