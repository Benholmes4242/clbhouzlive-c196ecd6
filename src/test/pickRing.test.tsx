import React from 'react';
import { readFileSync } from 'node:fs';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { createInstance } from 'i18next';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import en from '../../src/locales/en/tourhub.json';

const mocks = vi.hoisted(() => ({ rpc: vi.fn(), user: { id: 'member', is_anonymous: false } as { id: string; is_anonymous: boolean } | null }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { rpc: mocks.rpc } }));
vi.mock('@/hooks/useSupabaseSession', () => ({ useSupabaseSession: () => ({ user: mocks.user }) }));
vi.mock('@/features/guest/guestGateStore', () => ({ getGuestUser: () => null }));
vi.mock('@/features/tourhub/tournament-v2/data/usePickTeeTimes', () => ({ usePickTeeTimes: () => ({ data: new Map(), isError: false }) }));
vi.mock('@/lib/toast', () => ({ toast: { error: vi.fn() } }));

import { SquircleAvatar, DARK_HAIRLINE } from '@/components/ui/SquircleAvatar';
import { ACTIVE_RING_GRADIENT } from '@/features/find-people/ActiveRing';
import type { PickFieldPlayer } from '@/features/tourhub/hooks/useTournamentPick';

const i18n = createInstance();
void i18n.use(initReactI18next).init({ lng: 'en', resources: { en: { tourhub: en } }, interpolation: { escapeValue: false }, initAsync: false });

const names = ['Wyndham Clark', 'Tom Kim', 'Doug Ghim', 'Steven Fisk'];
const field: PickFieldPlayer[] = names.map((name, i) => ({ player_id: `p${i}`, full_name: name, country: 'UNITED STATES', world_rank: i + 5, photo_url: null, headshot_override: null }));
const ourPicks = [{ playerId: 'p0', playerName: names[0] }, { playerId: 'p2', playerName: names[2] }];
let state: { my_player_id: string | null; locks_at: string | null; locked: boolean; followed_pickers: number; followed_top: { player_id: string; player_name: string; picks: number }[] };
let client: QueryClient;

const wrapper = ({ children }: { children: React.ReactNode }) => <QueryClientProvider client={client}><MemoryRouter><I18nextProvider i18n={i18n}>{children}</I18nextProvider></MemoryRouter></QueryClientProvider>;

beforeEach(() => {
  client = new QueryClient({ defaultOptions: { queries: { retry: false, refetchOnMount: false }, mutations: { retry: false } } });
  mocks.user = { id: 'member', is_anonymous: false };
  state = { my_player_id: 'p1', locks_at: '2026-11-05T07:40:00Z', locked: false, followed_pickers: 3, followed_top: [{ player_id: 'p0', player_name: names[0], picks: 2 }] };
  mocks.rpc.mockReset().mockImplementation(async (name: string) => {
    if (name === 'get_tournament_picks_board') return { data: [], error: null };
    if (name === 'get_pick_field') return { data: field, error: null };
    if (name === 'get_tournament_pick_state') return { data: [state], error: null };
    if (name === 'get_tournament_circle_rank') return { data: [], error: null };
    return { data: [], error: null };
  });
});
afterEach(() => { cleanup(); client.clear(); });

describe('SquircleAvatar ringGradient', () => {
  it('renders one gradient overlay and no grey hairline border', () => {
    const { container } = render(<SquircleAvatar size={36} alt="Tom Kim" userId="p1" hairlineRing ringGradient={ACTIVE_RING_GRADIENT} />);
    const overlay = container.querySelector<HTMLElement>('[data-avatar-ring-gradient]');
    expect(overlay).not.toBeNull();
    expect(overlay!.style.border).toBe('');
    // jsdom's CSS parser can drop gradient/mask values, so pin the source too.
    const source = readFileSync('src/components/ui/SquircleAvatar.tsx', 'utf8');
    expect(source).toContain('background: ringGradient');
    expect(source).toContain("maskComposite: 'exclude'");
    expect(source).toContain('padding: 1.5');
  });
  it('without ringGradient the grey hairline border is unchanged', () => {
    const { container } = render(<SquircleAvatar size={36} alt="Tom Kim" userId="p1" hairlineRing />);
    expect(container.querySelector('[data-avatar-ring-gradient]')).toBeNull();
    const overlays = Array.from(container.querySelectorAll<HTMLElement>('.absolute.inset-0.pointer-events-none'));
    expect(overlays.some(el => el.style.border.includes(DARK_HAIRLINE))).toBe(true);
  });
});

