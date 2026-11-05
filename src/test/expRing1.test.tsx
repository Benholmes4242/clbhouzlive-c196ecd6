import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { CreatorSpotlight, __resetSpotlight } from '@/features/explore-magazine/watch/CreatorSpotlight';
import { DARK_HAIRLINE } from '@/components/ui/SquircleAvatar';

vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));
const st = vi.hoisted(() => ({ active: false, business: false }));
vi.mock('@/features/explore-magazine/watch/useWatchBottom', () => ({
  useWatchSpotlights: () => ({ data: [{ actor_id: 'creator', actor_type: st.business ? 'business' : 'personal', display_name: 'Creator', avatar_url: null, is_verified: false, following: false, videos: 0 }], isError: false }),
  useCreatorVideos: () => ({ data: [], isError: false }),
}));
vi.mock('@/features/find-people/useRecentActivity', () => ({ useRecentActivity: () => new Map(st.active ? [['creator', { post_id: 'latest' }]] : []) }));
vi.mock('@/hooks/useSupabaseSession', () => ({ useSupabaseSession: () => ({ user: { id: 'viewer' }, loading: false }) }));
vi.mock('@/context/ActiveActorContext', () => ({ useActiveActor: () => ({ activeActor: null }) }));
vi.mock('@/hooks/useToggleFollow', () => ({ useToggleFollow: () => ({ mutateAsync: vi.fn() }) }));
vi.mock('@/utils/analyticsEvents', () => ({ analyticsEvents: { track: vi.fn() } }));

beforeEach(() => { st.active = false; st.business = false; __resetSpotlight(); });
afterEach(cleanup);
const mount = () => render(<MemoryRouter initialEntries={['/amateur']}><CreatorSpotlight userId="viewer" visitKey="ring" /></MemoryRouter>);

describe('EXP_RING_1 Explore creator hairline', () => {
  it.each([false, true])('uses the Tour-matching traced hairline without a 2px avatar border active=%s', active => {
    st.active = active;
    const { container } = mount();
    const ring = container.querySelector<HTMLElement>(`[data-active-ring="${active ? 'on' : 'off'}"]`);
    expect(ring).toBeInTheDocument();
    const inner = ring?.querySelector<HTMLElement>('div.relative.overflow-hidden');
    expect(inner?.style.borderWidth).not.toBe('2px');
    expect(inner?.style.width).toBe('56px');
    const overlay = inner?.nextElementSibling as HTMLElement | null;
    expect(overlay?.style.borderWidth).toBe('1px');
    expect(overlay?.style.borderColor.replace(/\s/g, '')).toBe(DARK_HAIRLINE.replace(/\s/g, ''));
    expect(overlay?.style.borderRadius).toBe('34%');
    if (active) {
      expect(ring?.querySelector('[data-active-ring-gap]')).toContainElement(inner ?? null);
      expect(screen.getByRole('button', { name: "Open Creator's latest post" })).toContainElement(ring ?? null);
    }
  });
  it('gives the 56px business initials tile the requested 0.5px inset hairline', () => {
    st.business = true;
    const { container } = mount();
    const tile = container.querySelector<HTMLElement>('[data-spotlight-tile]');
    expect(tile?.style.boxShadow).toBe(`inset 0 0 0 0.5px ${DARK_HAIRLINE}`);
    expect(tile?.style.width).toBe('56px');
    expect(tile?.style.height).toBe('56px');
  });
});