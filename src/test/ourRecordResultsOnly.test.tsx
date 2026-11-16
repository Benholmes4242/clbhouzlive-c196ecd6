import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { createInstance } from 'i18next';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import en from '../../public/locales/en/tourhub.json';
import { TOUR_MAP } from '@/features/tourhub/constants/tourMap';
const h = vi.hoisted(() => ({ rpc: vi.fn() }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { rpc: h.rpc } }));
vi.mock('@/hooks/useSupabaseSession', () => ({ useSupabaseSession: () => ({ user: { id: 'me', is_anonymous: false } }) }));
vi.mock('@/features/guest/guestGateStore', () => ({ getGuestUser: () => null }));
import { OurRecordSheet } from '@/features/tourhub/components/overview-v3/HybridHeroBands/OurRecordSheet';

const lang = createInstance(); void lang.use(initReactI18next).init({ lng: 'en', initAsync: false, resources: { en: { tourhub: en } }, interpolation: { escapeValue: false } });
const pick = (id: string, position: number) => ({ player_id: id, player_name: `Player ${id}`, position, status: null, score: -10, tied: false, percentile: 90 });
const record = { tours: ['pga', 'champ'], picks: 33, event_count: 11, won: 3, top10: 15, avg_percentile: 70, first_event_date: '2026-03-01', random_win_pct: 2.7, avg_field_size: 120, best: { events: 11, wins: 3, top10: 9, avg_percentile: 90 },
  events: [{ tournament_id: 'a', name: 'Older', end_date: '2026-10-01', field_size: 120, picks: [pick('a', 1), pick('b', 7), pick('c', 40)] }, { tournament_id: 'b', name: 'Newer', end_date: '2026-11-01', field_size: 120, picks: [pick('d', 3), pick('e', 20), pick('f', 50)] }] };
const board = [{ user_id: 'me', display_name: 'Me', username: 'me', profile_photo_url: null, picks: 5, wins: 1, top10: 3, avg_percentile: 80, is_viewer: true }];
let client: QueryClient;
beforeEach(() => {
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  h.rpc.mockReset().mockImplementation(async (name: string) => ({ data: name === 'get_our_pick_record' ? record : name === 'get_beat_the_model' ? board : name === 'get_my_pick_odds' ? { events: 5, wins: 1, random_win_pct: 1.4 } : [], error: null }));
});
afterEach(() => { cleanup(); client.clear(); });
const mount = () => render(<QueryClientProvider client={client}><MemoryRouter><I18nextProvider i18n={lang}><OurRecordSheet open onClose={vi.fn()} tour="pga" year={2026} /></I18nextProvider></MemoryRouter></QueryClientProvider>);

describe('BRIEF_OUR_RECORD_RESULTS_ONLY', () => {
  it('renders the header, chips, three counts and the newest-first ledger', async () => {
    mount(); await screen.findByRole('button', { name: 'PGA TOUR' });
    const sheet = document.querySelector('[data-our-record-sheet]')!;
    expect(sheet.querySelector('header.pick-panel-header h2')).not.toBeNull();
    expect(sheet.querySelectorAll('.pick-record-tours button').length).toBe(2);
    expect([...sheet.querySelectorAll('.pick-record-three b')].map(b => b.textContent)).toEqual(['11', '3', '15']);
    expect([...sheet.querySelectorAll('[data-record-event]')].map(e => e.getAttribute('data-record-event'))).toEqual(['b', 'a']);
  });
  it('no chance, circle or footnote markup renders, whatever the member or board data', async () => {
    mount(); await screen.findByRole('button', { name: 'PGA TOUR' });
    expect(document.querySelector('[data-chance-group], [data-chance-row], [data-beat-model], [data-beat-user], .pick-chance-foot')).toBeNull();
  });
  it('never calls get_beat_the_model or get_my_pick_odds when the sheet opens', async () => {
    mount(); await screen.findByRole('button', { name: 'PGA TOUR' });
    const names = h.rpc.mock.calls.map(c => c[0]);
    expect(names).toContain('get_our_pick_record');
    expect(names).not.toContain('get_beat_the_model');
    expect(names).not.toContain('get_my_pick_odds');
  });
  it('switching tour refetches get_our_pick_record with the event season', async () => {
    mount(); fireEvent.click(await screen.findByRole('button', { name: TOUR_MAP.CHAMP.short }));
    await waitFor(() => expect(h.rpc).toHaveBeenCalledWith('get_our_pick_record', { p_tour: 'champ', p_year: 2026 }));
  });
  it('scoped CSS: header and every event carry no divider', () => {
    const css = readFileSync('src/features/tourhub/components/overview-v3/HybridHeroBands/pickPanels.css', 'utf8');
    const style = document.createElement('style'); style.textContent = css; document.head.appendChild(style);
    document.body.innerHTML = '<div data-our-record-sheet><header class="pick-panel-header"></header><section class="pick-panel-sec pick-record-events"><div class="pick-panel-label"></div><div class="pick-record-event"></div><div class="pick-record-event"></div></section></div>';
    expect(getComputedStyle(document.querySelector('.pick-panel-header')!).borderBottomWidth).toMatch(/^0(px)?$/);
    for (const ev of document.querySelectorAll('.pick-record-event')) expect(getComputedStyle(ev).borderTopWidth).toMatch(/^0(px)?$/);
    style.remove(); document.body.innerHTML = '';
  });
});
