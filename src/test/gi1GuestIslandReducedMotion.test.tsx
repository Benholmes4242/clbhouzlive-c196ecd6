import React from 'react';
import { afterEach, afterAll, describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, cleanup, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.hoisted(() => {
  vi.stubGlobal('matchMedia', vi.fn((query: string) => ({ matches: query === '(prefers-reduced-motion: reduce)', media: query, addEventListener: vi.fn(), removeEventListener: vi.fn(), addListener: vi.fn(), removeListener: vi.fn(), dispatchEvent: vi.fn() })));
});
vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));
vi.mock('@/hooks/useSupabaseSession', () => ({ useSupabaseSession: () => ({ user: null, loading: false }) }));
vi.mock('@/context/ActiveActorContext', () => ({ useActiveActor: () => ({ activeActor: null, isLoading: false }) }));
vi.mock('@/hooks/useActorUnreadCounts', () => ({ useActorUnreadCounts: () => ({ countFor: () => 0 }) }));
vi.mock('@/hooks/useUserProfile', () => ({ useUserProfile: () => ({ data: undefined, isFetched: false, isError: false }) }));
vi.mock('@/lib/whs/useHandicapChipState', () => ({ useHandicapChipState: () => ({ connected: false, settled: true, connection: null, trend: null, anyError: false }) }));
vi.mock('@/lib/whs/hooks', () => ({ useHandicapHistory: () => ({ data: [] }) }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { from: vi.fn() } }));
vi.mock('@/components/ui/SquircleAvatar', () => ({ SquircleAvatar: () => null }));
vi.mock('@/features/search-v2/SearchOverlayV2', () => ({ SearchOverlayV2: () => null }));
vi.mock('@/components/header/PostingAsMenu', () => ({ PostingAsMenu: () => null }));
vi.mock('@/features/guest/useIsGuest', () => ({ useIsGuest: () => true }));

import { ChromeIsland } from '@/features/chrome-v2/ChromeIsland';
import { registerNavScroller, resetToExpanded } from '@/hooks/useScrollDirection';

afterEach(() => { cleanup(); resetToExpanded(); });
afterAll(() => vi.unstubAllGlobals());
describe('GI1 reduced motion', () => {
  it('guest glass and Log in fold have no transitions at rest or folded', async () => {
    resetToExpanded();
    const el = document.createElement('div'); document.body.appendChild(el);
    const off = registerNavScroller(el);
    try {
      const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
      render(<QueryClientProvider client={client}><MemoryRouter><ChromeIsland /></MemoryRouter></QueryClientProvider>);
      const guest = document.querySelector<HTMLElement>('[data-guest-island]');
      const login = screen.getByRole('button', { name: 'Log in' });
      expect(guest?.style.transition).toBe('none'); expect(login.style.transition).toBe('none');
      el.scrollTop = 150;
      await act(async () => { fireEvent.scroll(el); await new Promise(r => requestAnimationFrame(() => r(null))); });
      expect(login).toBeDisabled(); expect(login).toHaveAttribute('aria-hidden', 'true');
      expect(guest?.style.transition).toBe('none'); expect(login.style.transition).toBe('none');
    } finally { off(); el.remove(); }
  });
});