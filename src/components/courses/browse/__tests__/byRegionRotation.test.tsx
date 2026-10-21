import { beforeEach, describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { BrowseRegion } from '../../useStatBrowse';

const s = vi.hoisted(() => ({ regions: [] as BrowseRegion[], clubId: null as string | null, homeRegion: null as string | null, session: { user: { id: 'u' } as { id: string } | null, loading: false } }));
vi.mock('../../useStatBrowse', () => ({ useCourseBrowseTruth: () => ({ data: { regions: s.regions }, isLoading: false }) }));
vi.mock('../PageLoadGate', () => ({ useSectionReady: () => {} }));
vi.mock('@/hooks/useSupabaseSession', () => ({ useSupabaseSession: () => s.session }));
vi.mock('@/features/home-club/useHomeClubStatus', () => ({ useHomeClubStatus: () => ({ clubId: s.clubId, isLoading: false }) }));
vi.mock('@/features/home-club/homeClubPickerStore', () => ({ openHomeClubPicker: () => {} }));
vi.mock('@/integrations/supabase/client', () => {
  const chain: Record<string, unknown> = {};
  for (const k of ['from', 'select', 'eq', 'not']) chain[k] = () => chain;
  chain.limit = () => Promise.resolve({ data: s.homeRegion ? [{ region: s.homeRegion }] : [], error: null });
  return { supabase: chain };
});

import { ByRegionSection, REGION_LAST_KEY } from '../ByRegionSection';

const region = (i: number): BrowseRegion => ({ region: `Region ${i}`, subCountry: null, courses: 3, rounds: 100 - i, avgToPar: 5, imageUrl: null, imageCourseId: `c${i}`, imageCourseName: null });
const draw = () => render(<MemoryRouter><QueryClientProvider client={new QueryClient()}><ByRegionSection /></QueryClientProvider></MemoryRouter>);
const tree = (client: QueryClient) => <MemoryRouter><QueryClientProvider client={client}><ByRegionSection /></QueryClientProvider></MemoryRouter>;
const names = (c: HTMLElement) => Array.from(c.querySelectorAll('section button[type="button"]')).map((b) => b.textContent ?? '').filter((t) => t.includes('Region'));

beforeEach(() => { localStorage.clear(); s.regions = Array.from({ length: 11 }, (_, i) => region(i)); s.clubId = null; s.homeRegion = null; s.session = { user: { id: 'u' }, loading: false }; });

describe('ByRegionSection rotation', () => {
  it('the lead is always the home region with Your patch, never in the rotated set', async () => {
    s.clubId = 'club'; s.homeRegion = 'Region 7';
    const view = draw();
    await view.findByText('Your patch');
    const tiles = names(view.container);
    expect(tiles).toHaveLength(5);
    expect(tiles[0]).toContain('Your patch');
    expect(tiles[0]).toContain('Region 7');
    expect(tiles.slice(1).some((t) => t.includes('Region 7'))).toBe(false);
  });
  it('previously shown regions are not repeated when enough others exist', () => {
    s.regions = Array.from({ length: 10 }, (_, i) => region(i));
    const prev = ['Region 0', 'Region 1', 'Region 2', 'Region 3'];
    localStorage.setItem(REGION_LAST_KEY, JSON.stringify(prev));
    const tiles = names(draw().container);
    expect(tiles).toHaveLength(5);
    for (const p of prev) expect(tiles.some((t) => t.startsWith(`${p}3 courses`))).toBe(false);
  });
  it('with no home region, five tiles render and the last spans', () => {
    const view = draw();
    const buttons = Array.from(view.container.querySelectorAll<HTMLButtonElement>('section > div > button'));
    expect(buttons).toHaveLength(5);
    expect(buttons[4].style.gridColumn).toBe('span 2');
  });
  it('a lead arriving after the first pick re-picks to one large plus four', async () => {
    const client = new QueryClient();
    const view = render(tree(client));
    expect(names(view.container)).toHaveLength(5);
    s.clubId = 'club'; s.homeRegion = 'Region 7';
    view.rerender(tree(client));
    await view.findByText('Your patch');
    const tiles = names(view.container);
    expect(tiles).toHaveLength(5);
    expect(tiles[0]).toContain('Your patch');
    expect(tiles[0]).toContain('Region 7');
    expect(tiles.slice(1).some((t) => t.includes('Region 7'))).toBe(false);
  });
  it('waits for the session before picking', async () => {
    s.clubId = 'club'; s.homeRegion = 'Region 7';
    s.session = { user: null, loading: true };
    const client = new QueryClient();
    const view = render(tree(client));
    s.session = { user: { id: 'u' }, loading: false };
    view.rerender(tree(client));
    await view.findByText('Your patch');
    const tiles = names(view.container);
    expect(tiles).toHaveLength(5);
    expect(tiles[0]).toContain('Your patch');
  });
});
