import { describe, expect, it, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import React from 'react';
import {
  buildReadout,
  chooseCirclePeople,
  costliestThree,
  displayCourseName,
  startingHandicap,
} from '@/components/profile/handicap/whs/connect/EmptyStateScreen';
import { EmptyStateScreen } from '@/components/profile/handicap/whs/connect/EmptyStateScreen';

vi.mock('@/hooks/useSupabaseSession', () => ({
  useSupabaseSession: () => ({ user: undefined, loading: true }),
}));

vi.mock('@/features/home-club/useHomeClubStatus', () => ({
  useHomeClubStatus: vi.fn(() => ({ clubId: null, isFetched: false, isLoading: false })),
}));

const introSpy = vi.fn();
vi.mock('@/components/profile/handicap/whs/connect/useConnectIntroCourse', () => ({
  useConnectIntroCourse: (...args: unknown[]) => introSpy(...args),
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: { from: vi.fn(), rpc: vi.fn(), auth: { onAuthStateChange: vi.fn(), getSession: vi.fn() } },
  SUPABASE_URL: 'https://example.test',
}));

vi.mock('@/utils/analyticsEvents', () => ({ analyticsEvents: { track: vi.fn() } }));
vi.mock('@/features/home-club/homeClubPickerStore', () => ({ openHomeClubPicker: vi.fn() }));

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
});

describe('connect intro settled gate', () => {
  it('does not request the fallback course while the session is unresolved', () => {
    introSpy.mockReturnValue({ isPending: true, data: null });
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(<QueryClientProvider client={qc}><EmptyStateScreen onPickCountry={() => {}} /></QueryClientProvider>);
    expect(introSpy).toHaveBeenCalledWith(null, false);
    expect(screen.queryByText('Parkstone')).toBeNull();
  });
});
