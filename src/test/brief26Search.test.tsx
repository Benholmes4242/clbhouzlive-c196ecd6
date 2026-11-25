/**
 * Brief 26 — Search: Clubs, Businesses, Pros & coaches.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';

vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { rpc: vi.fn() } }));
vi.mock('@/features/pro-verification/ProLabel', () => ({
  ProMemberName: ({ children }: { children: ReactNode }) => <>{children}</>,
}));
vi.mock('@/features/search-v2/components/SearchEmptyState', () => ({ SearchEmptyState: () => null }));
vi.mock('@/features/search-v2/components/RequestCourseCTAV2', () => ({ RequestCourseCTAV2: () => null }));
vi.mock('@/features/search-v2/hooks/useRecentSearchesV2', () => ({
  useRecentSearchesV2: () => ({ items: [], save: () => {}, clear: () => {} }),
}));
vi.mock('@/lib/routeChrome', () => ({ claimOverlayChrome: () => {}, releaseOverlayChrome: () => {} }));
vi.mock('@/lib/bodyScrollLock', () => ({ lockBodyScroll: () => {}, unlockBodyScroll: () => {} }));

const h = vi.hoisted(() => ({ data: null as unknown, calls: [] as { scope: string }[] }));
vi.mock('@/features/search-v2/hooks/useGlobalSearchV2', async (orig) => {
  const real = await orig<typeof import('@/features/search-v2/hooks/useGlobalSearchV2')>();
  return {
    ...real,
    useGlobalSearchV2: (opts: { scope: string }) => {
      h.calls.push({ scope: opts.scope });
      return { data: real.normalize(h.data), isLoading: false, error: null, debouncedQuery: 'park', refetch: () => {} };
    },
  };
});

import { normalize } from '@/features/search-v2/hooks/useGlobalSearchV2';
import { SCOPE_ORDER } from '@/features/search-v2/components/ScopeChips';
import { SearchOverlayV2 } from '@/features/search-v2/SearchOverlayV2';
import { categoryCityLine, proSubline, type ProHit } from '@/features/search-v2/lib/searchNavigation';
import { mergeDirectory } from '@/features/search-v2/hooks/useEntityPickerSearch';
import { directoryBusinesses, directoryPeople } from '@/features/search-v2/lib/directoryMerge';

const L = { tourPro: 'T', teachingPro: 'P' };
const tourPro: ProHit = { kind: 'pro', id: 'u1', name: 'Tom Parkhurst', handle: 'tomp', pro_kind: 'tour_pro', pro_tour: 'Alps Tour' };
const teachPro: ProHit = { kind: 'pro', id: 'u2', name: 'Sam Parker', handle: 'samp', pro_kind: 'teaching_pro', pro_club: 'Sundridge Park' };
const academy: ProHit = { kind: 'business', id: 'b1', name: 'Parkside Golf Academy', handle: 'parkside', category: 'Golf Academy', city: 'Bromley' };

const FULL = {
  people: [{ id: 'p1', display_name: 'Jamie Parkes', username: 'jparkes' }],
  pros: [teachPro, tourPro, academy],
  clubs: [{ id: 'c1', name: 'Sundridge Park Golf Club', city: 'Bromley', slug: 'sundridge' }],
  businesses: [{ id: 'z1', name: 'Park Lane Golf Studio', slug: 'parklane', category: 'Club Fitter', city: 'London' }],
  courses: [{ id: 'k1', name: 'Sundridge Park East' }],
  players: [{ id: 'pl1', full_name: 'Parker Pro' }],
  videos: [],
  posts: [{ id: 'po1', excerpt: 'Park post' }],
};

function Loc() { const l = useLocation(); return <div data-testid="loc">{l.pathname}</div>; }
function renderOverlay() {
  const r = render(
    <MemoryRouter initialEntries={['/']}>
      <Routes><Route path="*" element={<><SearchOverlayV2 isOpen onClose={() => {}} /><Loc /></>} /></Routes>
    </MemoryRouter>,
  );
  fireEvent.change(document.querySelector('input')!, { target: { value: 'park' } });
  return r;
}
const rowButton = (name: string) => Array.from(document.body.querySelectorAll('button')).find((b) => b.querySelector('p.text-\\[15px\\]')?.textContent === name)!;
const rowNames = () => Array.from(document.body.querySelectorAll('button p.text-\\[15px\\]')).map((p) => p.textContent);

beforeEach(() => { h.data = FULL; h.calls = []; });

describe('Brief 26 chips and All order', () => {
  it('chip order is All, People, Pros & coaches, Clubs, Businesses, Courses, Players, Videos, Posts', () => {
    expect(SCOPE_ORDER).toEqual(['all', 'people', 'pros', 'clubs', 'businesses', 'courses', 'players', 'videos', 'posts']);
  });
  it('All renders People, Pros & coaches, Clubs, Businesses, Courses, Players, Posts in order', () => {
    renderOverlay();
    expect(rowNames().slice(0, 8)).toEqual([
      'Jamie Parkes', 'Sam Parker', 'Tom Parkhurst', 'Parkside Golf Academy',
      'Sundridge Park Golf Club', 'Park Lane Golf Studio', 'Sundridge Park East', 'Parker Pro',
    ]);
    const order = rowNames();
    expect(order.indexOf('Jamie Parkes')).toBeLessThan(order.indexOf('Sam Parker'));
    expect(order.indexOf('Parkside Golf Academy')).toBeLessThan(order.indexOf('Sundridge Park Golf Club'));
    expect(order.indexOf('Sundridge Park Golf Club')).toBeLessThan(order.indexOf('Park Lane Golf Studio'));
    expect(order.indexOf('Park Lane Golf Studio')).toBeLessThan(order.indexOf('Sundridge Park East'));
  });
  it('an old response (no pros/businesses keys) renders no new sections and no error', () => {
    const { pros: _p, businesses: _b, ...old } = FULL;
    expect(normalize(old).pros).toEqual([]);
    expect(normalize(old).businesses).toEqual([]);
    h.data = old;
    renderOverlay();
    expect(document.querySelector('[data-search-section="pros"]')).toBeNull();
    expect(document.querySelector('[data-search-section="businesses"]')).toBeNull();
    expect(rowNames()).toContain('Sundridge Park Golf Club');
  });
});

describe('Brief 26 sub-lines', () => {
  it('tour pro: "Tour pro · {tour}", tour dropped when empty', () => {
    expect(proSubline(tourPro, L)).toBe('T · Alps Tour');
    expect(proSubline({ ...tourPro, pro_tour: '' }, L)).toBe('T');
    expect(proSubline({ ...tourPro, pro_tour: null }, L)).toBe('T');
  });
  it('teaching pro (any other kind): "Teaching pro · {club}", club dropped when empty', () => {
    expect(proSubline(teachPro, L)).toBe('P · Sundridge Park');
    expect(proSubline({ ...teachPro, pro_club: null }, L)).toBe('P');
    expect(proSubline({ ...teachPro, pro_kind: null }, L)).toBe('P · Sundridge Park');
  });
  it('business sub-line: both, either alone, or none', () => {
    expect(categoryCityLine('Club Fitter', 'London')).toBe('Club Fitter · London');
    expect(categoryCityLine(null, 'London')).toBe('London');
    expect(categoryCityLine('Club Fitter', '')).toBe('Club Fitter');
    expect(categoryCityLine(null, null)).toBeNull();
  });
});

describe('Brief 26 taps and empty states', () => {
  it('a pro opens the person', () => {
    renderOverlay();
    fireEvent.click(rowButton('Tom Parkhurst'));
    expect(screen.getByTestId('loc').textContent).toBe('/profile/tomp');
  });
  it('a coaching business opens the business profile', () => {
    renderOverlay();
    fireEvent.click(rowButton('Parkside Golf Academy'));
    expect(screen.getByTestId('loc').textContent).toBe('/business/parkside');
  });
  it.each(['Pros & coaches', 'Businesses'])('%s scope with no results shows one empty state and no rows', (chip) => {
    h.data = { ...FULL, pros: [], businesses: [] };
    renderOverlay();
    fireEvent.click(within(document.body.querySelector('[aria-label="Search scope"]') as HTMLElement).getByText(chip));
    expect(rowNames()).toEqual([]);
    expect(document.body.querySelectorAll('p.text-\\[14px\\]').length).toBe(1);
  });
});

describe('Brief 26 picker and FindPeople merges', () => {
  it('picker: people then pros; clubs, coaching businesses, then businesses', () => {
    const m = mergeDirectory(normalize(FULL));
    expect(m.people.map((p) => p.id)).toEqual(['p1', 'u2', 'u1']);
    expect(m.businesses.map((b) => b.id)).toEqual(['c1', 'b1', 'z1']);
  });
  it('CompareSheet (includePros false) gets no pros', () => {
    const m = mergeDirectory(normalize(FULL), false);
    expect(m.people.map((p) => p.id)).toEqual(['p1']);
    expect(m.businesses.map((b) => b.id)).toEqual(['c1', 'z1']);
  });
  it('FindPeople includes pros and all three business groups', () => {
    const d = normalize(FULL);
    expect(directoryPeople(d).map((p) => p.id)).toEqual(['p1', 'u2', 'u1']);
    expect(directoryBusinesses(d).map((b) => b.id)).toEqual(['c1', 'b1', 'z1']);
    expect(directoryBusinesses(d)[1].slug).toBe('parkside');
  });
});
