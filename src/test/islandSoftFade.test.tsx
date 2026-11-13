import React from 'react';
import { readFileSync } from 'node:fs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));
vi.mock('@/hooks/useSupabaseSession', () => ({ useSupabaseSession: () => ({ user: null, loading: false }) }));
vi.mock('@/context/ActiveActorContext', () => ({ useActiveActor: () => ({ activeActor: null, isLoading: false }) }));
vi.mock('@/hooks/useActorUnreadCounts', () => ({ useActorUnreadCounts: () => ({ countFor: () => 0 }) }));
vi.mock('@/hooks/useUserProfile', () => ({ useUserProfile: () => ({ data: undefined, isFetched: false, isError: false }) }));
vi.mock('@/lib/whs/hooks', () => ({ useHandicapHistory: () => ({ data: [] }) }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { from: vi.fn() } }));
vi.mock('@/components/ui/SquircleAvatar', () => ({ SquircleAvatar: () => null }));
vi.mock('@/features/search-v2/SearchOverlayV2', () => ({ SearchOverlayV2: () => null }));
vi.mock('@/components/header/PostingAsMenu', () => ({ PostingAsMenu: () => null }));
vi.mock('@/features/guest/useIsGuest', () => ({ useIsGuest: () => true }));

import { ChromeIsland } from '@/features/chrome-v2/ChromeIsland';
import { resolveChrome } from '@/features/chrome-v2/registry';
import { registerNavScroller, resetToExpanded } from '@/hooks/useScrollDirection';

const fullBleed = [
  '/', '/clubhouse', '/amateur', '/courses', '/courses/course-id',
  '/tourhub', '/tourhub/tournament/event-id', '/tourhub/player/player-id',
  '/profile', '/profile/ben', '/profile/ben/courses', '/profile/ben/rounds',
  '/business/club-id', '/handicap', '/handicap/history',
  '/handicap/rivalry/member-id', '/handicap/member-id/rivalry/other-id',
  '/rounds', '/watch/courses', '/watch/top100', '/watch/region/region-id',
  '/find-people', '/notificationmessages',
];
const padded = [
  '/round/round-id', '/profile/ben/followers', '/profile/ben/following',
  '/business/club-id/followers', '/business/club-id/following',
  '/discover?main=videos&section=long-form', '/unmatched-page',
];
let scroller: HTMLDivElement;
let unregister: () => void;
beforeEach(() => {
  resetToExpanded();
  scroller = document.createElement('div');
  document.body.appendChild(scroller);
  unregister = registerNavScroller(scroller);
});
afterEach(() => { cleanup(); unregister(); scroller.remove(); resetToExpanded(); });

function mount(path: string) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const view = render(<QueryClientProvider client={client}><MemoryRouter initialEntries={[path]}><ChromeIsland /></MemoryRouter></QueryClientProvider>);
  const fade = view.container.querySelector<HTMLElement>('[data-chrome="island-scrim-soft"]');
  if (!fade) throw new Error(`Missing soft fade on ${path}`);
  return fade;
}
async function scrollDown() {
  scroller.scrollTop = 150;
  await act(async () => {
    fireEvent.scroll(scroller);
    await new Promise(resolve => requestAnimationFrame(() => resolve(null)));
  });
}

describe('Option E soft fade', () => {
  it.each(fullBleed)('is hidden at rest on full-bleed %s', path => {
    const url = new URL(path, 'http://localhost');
    expect(resolveChrome(url.pathname, url.searchParams)).toMatchObject({ chrome: 'island', bleed: true });
    expect(mount(path).style.opacity).toBe('0');
  });
  it.each(padded)('stays visible at rest on padded %s', path => {
    const url = new URL(path, 'http://localhost');
    expect(resolveChrome(url.pathname, url.searchParams)).toMatchObject({ chrome: 'island', bleed: false });
    const fade = mount(path);
    expect(fade.style.opacity).toBe('1');
    expect(fade.style.transition).toBe('');
  });
  it.each(['/tourhub', '/courses/course-id'])('follows condensation and glass timing on %s', async path => {
    const fade = mount(path);
    expect(fade.style.opacity).toBe('0');
    expect(fade.style.transition).toBe('var(--island-glass-transition)');
    // The shared token names background; only the animated property changes.
    expect(fade.style.transitionProperty).toBe('opacity');
    await scrollDown();
    expect(fade.style.opacity).toBe('1');
    act(() => resetToExpanded());
    expect(fade.style.opacity).toBe('0');
  });
  it('preserves the signed-off gradient and height', () => {
    const css = readFileSync('src/index.css', 'utf8');
    const rule = css.match(/\[data-chrome="island-scrim-soft"\]\s*\{([^}]+)\}/)?.[1];
    expect(rule).toContain('height: calc(var(--sat, 0px) + 96px);');
    expect(rule).toContain('background: linear-gradient(180deg, rgba(10,10,12,0.92) 0px, rgba(10,10,12,0.80) var(--sat, 0px), rgba(10,10,12,0.35) calc(var(--sat, 0px) + 48px), rgba(10,10,12,0) calc(var(--sat, 0px) + 96px));');
  });
});