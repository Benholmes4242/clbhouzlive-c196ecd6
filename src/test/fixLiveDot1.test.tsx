import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
const h = vi.hoisted(() => ({ condensed: false }));
vi.mock('@/features/chrome-v2/useIslandsCondensed', () => ({useIslandsCondensed: () => h.condensed}));
vi.mock('@/features/tourhub/hooks/useTourPickerRows', () => ({useTourPickerRows: () => ({rows: []})}));
vi.mock('@/features/tourhub/hooks/useActiveMensMajor', () => ({useActiveMensMajor: () => null}));
vi.mock('@/features/tourhub/hooks/useLiveTournaments', () => ({useLiveTournaments: () => ({data: []})}));
vi.mock('@/features/tourhub/context/TourSelectionContext', () => ({useTourSelection: () => ({})}));
import { TourIsland } from '@/features/tourhub/components/TourIsland';
import { TourLiveDot } from '@/features/tourhub/components/tourIslandIcons';
afterEach(() => {cleanup(); h.condensed = false;});
describe('FIX_LIVE_DOT_1', () => {
  it('expanded fold column protects the halo with 3px padding and -3px margin', () => {
    const {container} = render(<MemoryRouter initialEntries={['/tourhub']}><TourIsland label="All tours" caption="3 live" captionLive glyph="globe" onOpen={() => {}} /></MemoryRouter>);
    const fold = container.querySelector<HTMLElement>('[data-tour-island-fold]');
    expect(fold?.style.padding).toBe('3px');
    expect(fold?.style.margin).toBe('-3px');
  });
  it('condensed fold column has zero padding and margin so no dot leaks out', () => {
    h.condensed = true;
    const {container} = render(<MemoryRouter initialEntries={['/tourhub']}><TourIsland label="All tours" caption="3 live" captionLive glyph="globe" onOpen={() => {}} /></MemoryRouter>);
    const fold = container.querySelector<HTMLElement>('[data-tour-island-fold]');
    expect(fold?.style.padding).toBe('0px');
    expect(fold?.style.margin).toBe('0px');
    expect(fold?.style.maxWidth).toBe('0');
  });
  it('retains the shared dot’s exact 3px halo', () => {
    const {container} = render(<TourLiveDot />);
    expect((container.firstElementChild as HTMLElement).style.boxShadow).toBe('0 0 0 3px rgba(52,215,127,0.22)');
  });
});