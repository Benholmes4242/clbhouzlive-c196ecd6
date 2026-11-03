import React from 'react';
import { beforeEach, afterEach, describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, cleanup, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));
const mocks = vi.hoisted(() => ({ guest: false }));
vi.mock('@/hooks/useSupabaseSession', () => ({ useSupabaseSession: () => ({ user: { id: 'member' }, loading: false }) }));
vi.mock('@/context/ActiveActorContext', () => ({ useActiveActor: () => ({ activeActor: { id: 'member', type: 'personal', name: 'Ben', avatarUrl: '/avatar.jpg' }, isLoading: false }) }));
vi.mock('@/hooks/useActorUnreadCounts', () => ({ useActorUnreadCounts: () => ({ countFor: () => 0 }) }));
vi.mock('@/hooks/useUserProfile', () => ({ useUserProfile: () => ({ data: { hide_handicap_chip: false }, isFetched: true, isError: false }) }));
vi.mock('@/lib/whs/useHandicapChipState', () => ({ useHandicapChipState: () => ({ connected: false, settled: true, connection: null, trend: null, anyError: false }) }));
vi.mock('@/lib/whs/hooks', () => ({ useHandicapHistory: () => ({ data: [] }) }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { from: vi.fn() } }));
vi.mock('@/components/ui/SquircleAvatar', () => ({ SquircleAvatar: () => <div data-testid="avatar" /> }));
vi.mock('@/features/search-v2/SearchOverlayV2', () => ({ SearchOverlayV2: () => null }));
vi.mock('@/components/header/PostingAsMenu', () => ({ PostingAsMenu: () => null }));
vi.mock('@/features/guest/useIsGuest', () => ({ useIsGuest: () => mocks.guest }));

import { ChromeIsland } from '@/features/chrome-v2/ChromeIsland';
import { TourIsland } from '@/features/tourhub/components/TourIsland';
import { registerNavScroller, resetToExpanded } from '@/hooks/useScrollDirection';

let el: HTMLDivElement; let off: () => void;
const client = () => new QueryClient({ defaultOptions: { queries: { retry: false } } });
const mount = (path = '/') => render(<QueryClientProvider client={client()}><MemoryRouter initialEntries={[path]}><ChromeIsland /></MemoryRouter></QueryClientProvider>);
const move = async (top: number) => { el.scrollTop = top; await act(async () => { fireEvent.scroll(el); await new Promise(r => requestAnimationFrame(() => r(null))); }); };
beforeEach(() => { resetToExpanded(); mocks.guest = false; el = document.createElement('div'); document.body.appendChild(el); off = registerNavScroller(el); });
afterEach(() => { cleanup(); off(); el.remove(); resetToExpanded(); });

describe('ISLAND_SQUIRCLE_1', () => {
  it.each(['/', '/clubhouse', '/tourhub'])('both islands are 16px squircles on %s at rest and folded', async (path) => {
    mount(path);
    const left = screen.getByRole('button', { name: 'Go to home' });
    const right = document.querySelector<HTMLElement>('[data-island-right]');
    expect(left.style.borderRadius).toBe('16px');
    expect(right?.style.borderRadius).toBe('16px');
    await move(150);
    expect(left.style.borderRadius).toBe('16px');
    expect(right?.style.borderRadius).toBe('16px');
  });

  it('a non-condense island route keeps the fully round 23px radius', async () => {
    mount('/profile/ben');
    const right = document.querySelector<HTMLElement>('[data-island-right]');
    expect(right?.style.borderRadius).toBe('23px');
    await move(150);
    expect(right?.style.borderRadius).toBe('23px');
  });

  it('the guest right island keeps its round shape on a condense route', async () => {
    mocks.guest = true;
    mount('/');
    const guest = document.querySelector<HTMLElement>('[data-guest-island]');
    expect(guest?.style.borderRadius).toBe('23px');
    await move(150);
    expect(guest?.style.borderRadius).toBe('23px');
  });

  it('the folded Clubhouse left island is 30px mark + 7px padding + 1px border each side', async () => {
    mount('/clubhouse');
    const left = screen.getByRole('button', { name: 'Go to home' });
    await move(150);
    expect(left.style.padding).toBe('0px 7px');
    expect(left.style.border).toContain('1px');
    const mark = left.querySelector('img');
    expect(mark?.style.width).toBe('30px');
    expect(mark?.style.height).toBe('30px');
  });

  it('the folded Tour left island is a 32px tile (radius 11) + 6px padding each side; rest is unchanged', async () => {
    render(<QueryClientProvider client={client()}><MemoryRouter initialEntries={['/tourhub']}><TourIsland label="All tours" caption="Events this week" captionLive={false} glyph="globe" onOpen={() => {}} /></MemoryRouter></QueryClientProvider>);
    const button = screen.getByRole('button');
    const tile = button.querySelector<HTMLElement>('span[aria-hidden="true"]');
    expect(button.style.padding).toBe('0px 16px 0px 8px');
    expect(tile?.style.width).toBe('30px');
    expect(tile?.style.borderRadius).toBe('9px');
    await move(150);
    expect(button.style.padding).toBe('0px 6px');
    expect(tile?.style.width).toBe('32px');
    expect(tile?.style.height).toBe('32px');
    expect(tile?.style.borderRadius).toBe('11px');
  });
});
