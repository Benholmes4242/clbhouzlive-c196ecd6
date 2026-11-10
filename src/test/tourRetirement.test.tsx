import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { createInstance } from 'i18next';
import { I18nextProvider } from 'react-i18next';
import en from '../../public/locales/en/tourhub.json';
import { ACTIVE_TOUR_SLUGS, TOUR_MAP, isRetiredTour } from '@/features/tourhub/constants/tourMap';
import { OVERVIEW_TOUR_ORDER } from '@/features/tourhub/_shared/tourOrder';
import { TOUR_ROW_SLUGS } from '@/features/tourhub/hooks/useTourPickerRows';
import { TourGlance } from '@/features/chrome-v2/TourGlance';
import { TourIsland } from '@/features/tourhub/components/TourIsland';
import { startsLabel } from '@/features/tourhub/components/tourIslandRules';
import { useRetiredTourRedirect } from '@/features/tourhub/hooks/useRetiredTourRedirect';
import { activeSyncTours } from '../../supabase/functions/_shared/tourRetirement';

vi.mock('@/features/tourhub/hooks/useTournamentMeta', () => ({}));
vi.mock('@/features/tourhub/leaderboard/useTournamentMeta', () => ({ useTournamentMeta: (id?: string) => ({ data: id === 'retired-event' ? { tour_code: 'LIV' } : null }) }));
vi.mock('@/features/tourhub/hooks/useTourPickerRows', async original => ({ ...(await original<Record<string, unknown>>()), useTourPickerRows: () => ({ rows: [
  { key: 'pga', slug: 'pga', status: 'upcoming', startDate: '2027-01-17', eventName: 'Event' },
  { key: 'liv', slug: 'liv', status: 'none', eventName: null },
] }) }));
vi.mock('@/features/tourhub/hooks/useLiveTournaments', () => ({ useLiveTournaments: () => ({ data: [], isFetched: true }) }));
afterEach(cleanup);

describe('tour retirement and real English labels', () => {
  it('retains LIV metadata but omits it from active lists and overview/picker chips', () => {
    expect(TOUR_MAP.LIV.retired).toBe(true);
    expect(TOUR_MAP.LIV.label).toBe('LIV Golf');
    expect(ACTIVE_TOUR_SLUGS).toEqual(['pga', 'lpga', 'euro', 'pgad', 'champ']);
    expect(TOUR_ROW_SLUGS).not.toContain('liv');
    expect(OVERVIEW_TOUR_ORDER).not.toContain('liv');
  });
  it('menu and island rendered with real en JSON have no unresolved interpolation or LIV off-week label', async () => {
    const i18n = createInstance();
    await i18n.init({ lng: 'en', resources: { en: { tourhub: en } }, interpolation: { escapeValue: false } });
    const card = render(<I18nextProvider i18n={i18n}><MemoryRouter><TourGlance anchorRef={{ current: document.createElement('div') }} onClose={() => {}} onSelectTab={() => {}} activeTab="overview" /><TourIsland label="PGA Tour" caption={startsLabel('2027-01-17')} captionLive={false} logoSlug="pga" onOpen={() => {}} /></MemoryRouter></I18nextProvider>);
    expect(document.body.textContent).not.toContain('{{');
    expect(document.body.textContent).not.toContain('LIV');
    expect(card.container.querySelector('[data-tour-row="liv"]')).toBeNull();
    expect(screen.queryByTestId('tour-menu-off')).toBeNull();
  });
  it.each(['/tourhub?tour=liv', '/tourhub?board=livpts', '/tourhub?event=retired-event'])('redirects retired deep link %s to the all-tours overview', async url => {
    function Entry() { const location = useLocation(); useRetiredTourRedirect(new URLSearchParams(location.search), new URLSearchParams(location.search).get('event')); return <span data-testid="url">{location.pathname + location.search}</span>; }
    render(<MemoryRouter initialEntries={[url]}><Routes><Route path="/tourhub" element={<Entry />} /></Routes></MemoryRouter>);
    await waitFor(() => expect(screen.getByTestId('url').textContent).toBe('/tourhub'));
  });
  it('active function lists exclude all LIV aliases', () => {
    expect(activeSyncTours(['pga', 'liv', 'LIV Golf', 'liv-golf', 'euro'])).toEqual(['pga', 'euro']);
    expect(isRetiredTour('LIV')).toBe(true);
  });
});