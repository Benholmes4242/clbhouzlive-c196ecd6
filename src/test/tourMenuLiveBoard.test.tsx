import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, renderHook, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { TourGlance } from '@/features/chrome-v2/TourGlance';
import { useTourPickerRows } from '@/features/tourhub/hooks/useTourPickerRows';

vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));
const h = vi.hoisted(() => ({ slug: 'all', viewed: 'p1' as string | null, major: false, live: true, score: -9 as number | null, count: 1, name: 'Ben Griffin' as string | null, allTours: false }));
const slide = (id: string, tourSlug: string, type: string) => ({ type, tournament: { id, tourSlug, name: 'A very long event name that should truncate', startDate: '2026-11-05', currentRound: 2 } });
vi.mock('@/features/tourhub/hooks/useHeroCarouselData', () => ({ useHeroCarouselData: () => ({ data: [slide('p1','pga','live'), slide('p2','pga','upcoming'), slide('l1','lpga','completed'), ...(h.allTours ? ['euro','pgad','champ','liv'].map(s => slide(s,s,'upcoming')) : [])] }) }));
vi.mock('@/hooks/useTournamentsCache', () => ({ useTournamentsCache: () => ({ data: { upcoming: [], live: [], completed: [] } }) }));
vi.mock('@/features/tourhub/hooks/useActiveMensMajor', () => ({ useActiveMensMajor: () => h.major ? { id: 'major', name: 'Major', status: 'live', startDate: '2026-11-05' } : null }));
vi.mock('@/features/tourhub/context/TourSelectionContext', () => ({ useTourSelection: () => ({ appliedTourSlug: h.slug, selectedTourSlug: h.slug, viewingTourSlug: 'pga', viewingTournamentId: h.viewed, isSlugAcceptable: () => true, selectTour: vi.fn() }) }));
vi.mock('@/features/tourhub/hooks/useLiveTournaments', () => ({ useLiveTournaments: () => ({ isFetched: true, data: h.live ? [{ id: 'p1', tourSlug: 'pga', currentRound: 3, leaderName: h.name, leaderToPar: h.score, leaderCount: h.count }] : [] }) }));

beforeEach(() => { cleanup(); Object.assign(h, { slug: 'all', viewed: 'p1', major: false, live: true, score: -9, count: 1, name: 'Ben Griffin', allTours: false }); });
const mount = () => render(<MemoryRouter><TourGlance onClose={vi.fn()} anchorRef={{ current: document.createElement('div') }} activeTab="overview" onSelectTab={vi.fn()} /></MemoryRouter>);

describe('Tour menu Live board', () => {
  it.each(['all', 'pga', 'major'])('has exactly one shared selected row with a PGA event viewed and scope %s', slug => {
    h.slug = slug; h.major = slug === 'major';
    const { result } = renderHook(() => useTourPickerRows());
    expect(result.current.rows.filter(r => r.selected).map(r => r.slug)).toEqual([slug]);
  });
  it('chooses only the viewed event inside the chosen tour', () => {
    h.slug = 'pga'; h.viewed = 'p2';
    const { result } = renderHook(() => useTourPickerRows());
    expect(result.current.rows.filter(r => r.selected).map(r => r.tournamentId)).toEqual(['p2']);
  });
  it('uses the first slide without a viewed tournament', () => {
    h.slug = 'pga'; h.viewed = null;
    const { result } = renderHook(() => useTourPickerRows());
    expect(result.current.rows.filter(r => r.selected).map(r => r.tournamentId)).toEqual(['p1']);
  });
  it('has five single-row section columns and a live-tour count', () => {
    mount();
    expect(screen.getByTestId('tour-glance-sections').style.gridTemplateColumns).toBe('repeat(5, 1fr)');
    expect(screen.getByTestId('tour-glance-sections').querySelector('[data-tab="live"]')).toBeInTheDocument();
    expect(screen.getByTestId('tour-glance-sections').querySelector('[data-active="true"]')).toHaveClass('tour-menu-section');
    expect(screen.getByTestId('tour-menu-live-count')).toBeInTheDocument();
  });
  it('has four columns and no live count at zero', () => {
    h.live = false; mount();
    expect(screen.getByTestId('tour-glance-sections').style.gridTemplateColumns).toBe('repeat(4, 1fr)');
    expect(screen.queryByTestId('tour-menu-live-count')).toBeNull();
  });
  it.each([-9,0,3])('shows the surname and signed score with under-par color marker only for %s', score => {
    h.score = score; mount();
    const lead = screen.getByTestId('tour-menu-leader');
    expect(lead.textContent).toBe(`Griffin ${score < 0 ? '−9' : score === 0 ? 'E' : '+3'}`);
    expect(lead.querySelector('[data-under-par]')).toHaveAttribute('data-under-par', String(score < 0));
  });
  it('shows a tied leader count instead of the surname', () => {
    h.count = 3; mount();
    expect(screen.getByTestId('tour-menu-leader').textContent).toBe('3 tied −9');
  });
  it('omits the first line when there is no leader', () => {
    h.name = null; h.score = null; mount();
    expect(screen.queryByTestId('tour-menu-leader')).toBeNull();
    expect(document.querySelector('[data-tour-row="pga"] .tour-menu-live')).toBeInTheDocument();
  });
  it('groups none rows below the list and omits check icons', () => {
    mount();
    expect(document.querySelectorAll('[data-tour-row]')).toHaveLength(4);
    expect(document.querySelector('[data-tour-row="liv"]')).toBeNull();
    expect(screen.getByTestId('tour-menu-off')).toBeInTheDocument();
    expect(document.querySelectorAll('[data-tour-row][aria-pressed=true]')).toHaveLength(1);
    expect(document.querySelector('[data-tour-row] svg[data-icon="check"]')).toBeNull();
  });
  it('hides the off-week line when every tour has an event', () => {
    h.allTours = true; mount();
    expect(screen.queryByTestId('tour-menu-off')).toBeNull();
  });
  it('renders upcoming and completed right-column states', () => {
    mount();
    expect(document.querySelectorAll('.tour-menu-status')).toHaveLength(2);
    expect(document.querySelector('[data-tour-row="lpga"] .tour-menu-status b')).toBeInTheDocument();
  });
});