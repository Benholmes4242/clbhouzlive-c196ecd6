/**
 * FIX — Who to follow rail: button alignment (§1) and follow-removal (§2).
 *
 * §1: every card is a fixed-height flex column with the Follow button pinned
 * to the bottom, so golfer and business cards align whatever the reason or
 * figures content above.
 * §2: a follow turns the button to Following at once; after three seconds the
 * card collapses out with the dismiss animation and cannot return this
 * session; an unfollow inside the window cancels the removal; reduced motion
 * removes without the animation.
 *
 * The i18n mock returns defaultValue, so assertions target structure and the
 * English default strings, never translated words.
 */
import React from 'react';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));

const h = vi.hoisted(() => ({
  people: [] as unknown[],
  biz: [] as unknown[],
  toggle: vi.fn(() => Promise.resolve({ next: true })),
  reducedMotion: false,
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: { from: vi.fn(() => ({ insert: vi.fn(() => Promise.resolve({ error: null })) })) },
}));
vi.mock('@/hooks/useSupabaseSession', () => ({ useSupabaseSession: () => ({ user: { id: 'viewer' } }) }));
vi.mock('@/context/ActiveActorContext', () => ({ useActiveActor: () => ({ activeActor: null }) }));
vi.mock('@/hooks/useToggleFollow', () => ({ useToggleFollow: () => ({ mutateAsync: h.toggle, isPending: false }) }));
vi.mock('@/features/find-people/usePeopleSuggestions', () => ({
  usePeopleSuggestions: () => ({ data: h.people, isLoading: false, isError: false }),
  useBusinessSuggestions: () => ({ data: h.biz, isLoading: false, isError: false }),
}));
vi.mock('@/components/ui/SquircleAvatar', () => ({ SquircleAvatar: () => null }));
vi.mock('@/components/ui/VerifiedBadge', () => ({ VerifiedBadge: () => null }));
vi.mock('@/utils/analyticsEvents', () => ({ analyticsEvents: { track: vi.fn() } }));

import { WhoToFollowRail, resetWhoToFollowRailSessionForTests } from '@/features/find-people/WhoToFollowRail';
import type { BusinessSuggestion, PersonSuggestion } from '@/features/find-people/findPeopleRules';

function person(over: Partial<PersonSuggestion>): PersonSuggestion {
  return {
    user_id: 'u1', display_name: 'Niall Devins', username: 'niall', profile_photo_url: null,
    reason_type: 'club', reason_club_name: 'Sundridge Park', reason_course_name: null,
    reason_date: null, mutual_count: null, recent_rounds: null, rounds_total: 63,
    handicap_index: 4.1, is_verified: false, ...over,
  };
}
function biz(over: Partial<BusinessSuggestion>): BusinessSuggestion {
  return {
    business_id: 'b1', name: 'Sundridge Park GC', slug: 'sundridge-park', logo_url: null,
    category: 'Golf Club', city: 'Bromley', is_verified: true, followers: 1240,
    reason_type: 'your_club', distance_miles: null, ...over,
  };
}

/* your_club business first, then golfers — five cards in slot 1. */
const PEOPLE = [
  person({ user_id: 'u-a', display_name: 'Golfer Ann' }),
  person({ user_id: 'u-b', display_name: 'Golfer Bob', handicap_index: null, rounds_total: 0 }),
  person({ user_id: 'u-c', display_name: 'Golfer Cat', reason_type: 'popular', reason_club_name: null }),
  person({ user_id: 'u-d', display_name: 'Golfer Dan' }),
];
const BIZ = [biz({})];

function renderRail() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <WhoToFollowRail slot={1} />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

function cardOf(name: string): HTMLElement {
  return screen.getByText(name).closest('[role="button"]') as HTMLElement;
}
function followButtonOf(name: string): HTMLButtonElement {
  const buttons = Array.from(cardOf(name).querySelectorAll('button'));
  const pill = buttons.find((b) => b.textContent === 'Follow' || b.textContent === 'Following');
  if (!pill) throw new Error(`no follow button on ${name}`);
  return pill as HTMLButtonElement;
}

beforeEach(() => {
  resetWhoToFollowRailSessionForTests();
  h.people = PEOPLE;
  h.biz = BIZ;
  h.reducedMotion = false;
  h.toggle.mockClear();
  vi.stubGlobal('matchMedia', (q: string) => ({
    matches: h.reducedMotion && q.includes('prefers-reduced-motion'),
    addEventListener: () => {},
    removeEventListener: () => {},
  }));
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe('FIX §1 — one vertical rhythm, button pinned to the bottom', () => {
  it('golfer and business cards share the fixed height and a bottom-pinned Follow button', () => {
    renderRail();
    for (const name of ['Sundridge Park GC', 'Golfer Ann', 'Golfer Bob', 'Golfer Cat']) {
      const card = cardOf(name);
      expect(card.style.height).toBe('252px');
      expect(card.style.display).toBe('flex');
      expect(card.style.flexDirection).toBe('column');
      expect(followButtonOf(name).style.marginTop).toBe('auto');
    }
  });

  it('a missing reason or figures leaves its fixed space empty', () => {
    renderRail();
    /* Golfer Bob: no handicap, no rounds → empty figures; popular Cat: no
       club reason content difference — both blocks keep their fixed heights. */
    const bob = cardOf('Golfer Bob');
    const blocks = Array.from(bob.querySelectorAll('div')).map((d) => (d as HTMLElement).style);
    expect(blocks.some((s) => s.height === '34px')).toBe(true);
    expect(blocks.some((s) => s.height === '16px')).toBe(true);
    const bizCard = cardOf('Sundridge Park GC');
    const bizBlocks = Array.from(bizCard.querySelectorAll('div')).map((d) => (d as HTMLElement).style);
    expect(bizBlocks.some((s) => s.height === '34px')).toBe(true);
    expect(bizBlocks.some((s) => s.height === '16px')).toBe(true);
  });
});

describe('FIX §2 — a followed card leaves after three seconds', () => {
  it('follow shows Following at once, then the card collapses out after 3s', async () => {
    vi.useFakeTimers();
    renderRail();
    const pill = followButtonOf('Golfer Ann');
    fireEvent.click(pill);
    await act(async () => {});
    expect(followButtonOf('Golfer Ann').textContent).toBe('Following');
    expect(screen.getByText('Golfer Ann')).toBeTruthy();
    await act(async () => {
      vi.advanceTimersByTime(3000 + 200);
    });
    expect(screen.queryByText('Golfer Ann')).toBeNull();
    /* The next suggestion slides along: four cards remain. */
    expect(screen.getByText('Golfer Bob')).toBeTruthy();
  });

  it('an unfollow inside the three seconds keeps the card', async () => {
    vi.useFakeTimers();
    renderRail();
    fireEvent.click(followButtonOf('Golfer Ann'));
    await act(async () => {});
    fireEvent.click(followButtonOf('Golfer Ann'));
    await act(async () => {});
    expect(followButtonOf('Golfer Ann').textContent).toBe('Follow');
    await act(async () => {
      vi.advanceTimersByTime(5000);
    });
    expect(screen.getByText('Golfer Ann')).toBeTruthy();
  });

  it('a followed card does not return this session', async () => {
    vi.useFakeTimers();
    const first = renderRail();
    fireEvent.click(followButtonOf('Golfer Ann'));
    await act(async () => {});
    await act(async () => {
      vi.advanceTimersByTime(3200);
    });
    first.unmount();
    renderRail();
    expect(screen.queryByText('Golfer Ann')).toBeNull();
    expect(screen.getByText('Golfer Bob')).toBeTruthy();
  });

  it('reduced motion removes the card after 3s without the collapse animation', async () => {
    h.reducedMotion = true;
    vi.useFakeTimers();
    renderRail();
    fireEvent.click(followButtonOf('Golfer Ann'));
    await act(async () => {});
    await act(async () => {
      vi.advanceTimersByTime(3000);
    });
    /* Gone at the 3s mark — no 200ms closing phase needed. */
    expect(screen.queryByText('Golfer Ann')).toBeNull();
  });
});
