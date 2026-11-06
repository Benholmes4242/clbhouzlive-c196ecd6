import React from 'react';
import { beforeEach, afterEach, describe, it, expect, vi } from 'vitest';
import { render, waitFor, cleanup } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { createInstance } from 'i18next';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import en from '../../public/locales/en/tourhub.json';
import { blindTop10, aboutOneIn, winnerOddsText, multipleOf } from '@/features/tourhub/components/overview-v3/HybridHeroBands/pickOdds';

const h = vi.hoisted(() => ({ rpc: vi.fn(), guest: true }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { rpc: h.rpc } }));
vi.mock('@/hooks/useSupabaseSession', () => ({ useSupabaseSession: () => ({ user: h.guest ? null : { id: 'me', is_anonymous: false } }) }));
vi.mock('@/features/guest/guestGateStore', () => ({ getGuestUser: () => (h.guest ? { id: 'guest' } : null) }));
import { OurRecordSheet } from '@/features/tourhub/components/overview-v3/HybridHeroBands/OurRecordSheet';

describe('PK3 blind-pick maths', () => {
  it('blind top 10 N99 k3 is about 27.6', () => expect(blindTop10(99, 3)!).toBeCloseTo(27.6, 1));
  it('blind top 10 N10 k3 is 100', () => expect(blindTop10(10, 3)).toBe(100));
  it('about 1 in n: 27.6 gives 4', () => expect(aboutOneIn(27.6)).toBe(4));
  it('winner odds 3.9 gives 25/1 and 2.7 gives 36/1', () => { expect(winnerOddsText(3.9)).toBe('25/1'); expect(winnerOddsText(2.7)).toBe('36/1'); });
  it('multiple 30 vs 3.9 is 8', () => expect(multipleOf(3, 30, 3.9)).toBe(8));
  it('multiple 90 vs 27.6 is 3', () => expect(multipleOf(9, 90, 27.6)).toBe(3));
  it('multiple 25 vs 20 is hidden', () => expect(multipleOf(1, 25, 20)).toBeNull());
  it('count 0 is hidden', () => expect(multipleOf(0, 0, 3.9)).toBeNull());
});

const language = createInstance();
void language.use(initReactI18next).init({ lng: 'en', resources: { en: { tourhub: en } }, initAsync: false, interpolation: { escapeValue: false } });
let client: QueryClient;
const wrapper = ({ children }: { children: React.ReactNode }) => <MemoryRouter><QueryClientProvider client={client}><I18nextProvider i18n={language}>{children}</I18nextProvider></QueryClientProvider></MemoryRouter>;
const pick = (id: string) => ({ player_id: id, player_name: id, position: 20, status: 'active', score: 0 });
const events = Array.from({ length: 10 }, (_, i) => ({ tournament_id: `t${i}`, name: `Event ${i}`, end_date: `2026-0${(i % 9) + 1}-10`, field_size: 99, picks: [pick('a'), pick('b'), pick('c')] }));
const record = { tours: ['pga'], picks: 30, event_count: 10, won: 3, top10: 13, avg_percentile: 70, best: { events: 10, wins: 3, top10: 9, avg_percentile: 80 }, random_win_pct: 3.9, avg_field_size: 99, first_event_date: null, events };

beforeEach(() => {
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  h.rpc.mockReset().mockImplementation(async (name: string) => ({ data: name === 'get_our_pick_record' ? record : name === 'get_my_pick_odds' ? { events: 6, wins: 1, random_win_pct: 1 } : [], error: null }));
});
afterEach(() => { cleanup(); client.clear(); });

describe('PK3 Our Record block', () => {
  it('renders headline, our counts and blind odds with no percentages and no viewer rows for a guest', async () => {
    render(<OurRecordSheet open onClose={() => {}} tour="pga" year={2026} />, { wrapper });
    await waitFor(() => expect(document.querySelector('.pick-record-chance')).not.toBeNull());
    const block = document.querySelector('.pick-record-chance')!;
    expect(block.querySelector('.pick-chance-sentence')?.textContent).toBe('Our picks find a top 10 3× as often as blind picks, and the winner 8× as often.');
    expect(block.querySelector('[data-chance-group="top10"] [data-chance-row="ours"]')?.textContent).toBe('OUR PICKS9 of 10events');
    expect(block.querySelector('[data-chance-group="winner"] [data-chance-row="ours"]')?.textContent).toBe('OUR PICKS3 of 10events');
    expect(block.querySelector('[data-chance-group="top10"] [data-chance-row="random"]')?.textContent).toBe('3 AT RANDOMabout 1 in 4');
    expect(block.querySelector('[data-chance-group="winner"] [data-chance-row="random"]')?.textContent).toBe('3 AT RANDOM25/1');
    expect(block.textContent).not.toContain('%');
    expect(block.querySelector('[data-chance-row="you"]')).toBeNull();
    const groups = Array.from(block.querySelectorAll('[data-chance-group]')).map(g => g.getAttribute('data-chance-group'));
    expect(groups).toEqual(['top10', 'winner']);
  });
});
