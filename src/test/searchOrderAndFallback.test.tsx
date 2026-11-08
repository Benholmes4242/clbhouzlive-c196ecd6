import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { readFileSync } from 'node:fs';
import { A } from '@/features/courses/components/holes/analytical/tokens';

// FIX3: search All scope order and the IN ACTION rail fallback avatars.

describe('FIX3 search All scope section order', () => {
  it('renders People, Clubs, Courses, Players, Videos, Posts', () => {
    const src = readFileSync('src/features/search-v2/SearchOverlayV2.tsx', 'utf8');
    const allScope = src.slice(src.indexOf("scope === 'all'"));
    const order = ['People', 'Clubs', 'Courses', 'Players', 'Videos', 'Posts'].map((label) =>
      allScope.indexOf(`label="${label}"`),
    );
    expect(order.every((i) => i >= 0)).toBe(true);
    const sorted = [...order].sort((a, b) => a - b);
    expect(order).toEqual(sorted);
  });
});

const avatarCalls: { color?: { bg: string; fg: string }; ringColor?: string | null }[] = [];
vi.mock('@/features/tourhub/_shared/PlayerInitialAvatar', () => ({
  PlayerInitialAvatar: (props: { color?: { bg: string; fg: string }; ringColor?: string | null }) => {
    avatarCalls.push(props);
    return null;
  },
}));
vi.mock('@/features/search-v2/hooks/useSearchEmptyStateV2', () => ({
  useSearchEmptyStateV2: () => ({
    data: {
      event: { name: 'The Open', is_live: true, tour_slug: 'pga' },
      players: [
        { full_name: 'Mason Essam', abbr_name: 'M Essam', headshot_override: null, country_code: 'BE', country: 'Belgium' },
      ],
      suggested_people: [],
      popular_courses: [],
    },
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  }),
}));
vi.mock('@/hooks/gam/useUserAnalyticsCourses', () => ({
  useUserAnalyticsCourses: () => ({ data: [] }),
}));
vi.mock('@/hooks/useSupabaseSession', () => ({ useSupabaseSession: () => ({ user: { id: 'u1' } }) }));
vi.mock('@/features/profile-sheet-v2/components/YourCourseAnalyticsSheet', () => ({ default: () => null }));

import { SearchEmptyState } from '@/features/search-v2/components/SearchEmptyState';

describe('FIX3 IN ACTION rail fallback avatars', () => {
  afterEach(cleanup);

  it('uses the ResultTile plate, border and initials colour like the Players rows', () => {
    avatarCalls.length = 0;
    render(
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        <MemoryRouter>
          <SearchEmptyState onSelect={() => {}} />
        </MemoryRouter>
      </QueryClientProvider>,
    );
    expect(avatarCalls.length).toBeGreaterThan(0);
    for (const call of avatarCalls) {
      expect(call.color).toEqual({ bg: A.TRACK, fg: A.MUTE });
      expect(call.ringColor ?? undefined).toBeUndefined();
    }
    // The Players rows' fallback is ResultTile with the same tokens.
    const tile = readFileSync('src/features/search-v2/components/ResultTile.tsx', 'utf8');
    expect(tile).toContain('background: white ? \'#FFFFFF\' : A.TRACK');
    expect(tile).toContain('border: `1px solid ${A.BORDER}`');
    expect(tile).toContain('color: A.MUTE');
    const playerRow = readFileSync('src/features/search-v2/components/PlayerRow.tsx', 'utf8');
    expect(playerRow).toContain('ResultTile');
    expect(playerRow).toContain('TILE_INITIALS');
  });
});
