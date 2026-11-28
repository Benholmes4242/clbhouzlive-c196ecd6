import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));

import { RoundMovementBand } from '@/features/tourhub/components/overview-v3/HybridHeroBands/HeroBoardBand';
import { EMPTY_OVERVIEW_SHAPE, TourOverviewShell } from '@/features/tourhub/components/overview-v3/overviewShells';

afterEach(cleanup);
const mount = (node: React.ReactNode) => render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><MemoryRouter>{node}</MemoryRouter></QueryClientProvider>);
const card = (k: string) => ({ key: k, name: `Player ${k}`, candidates: [], delta: 2, toPar: -2, gross: 70 });
const band = (n: number) => { const v = mount(<RoundMovementBand round={2} cards={['a', 'b', 'c'].slice(0, n).map(card)} />); const m = v.container.querySelector<HTMLElement>('[data-overview-movement]'); if (!m) throw new Error('Missing movement band'); return { m, row: m.children[1] as HTMLElement, cards: [...m.querySelectorAll<HTMLElement>('[data-overview-movement-card]')] }; };

describe('Biggest movers without tiles', () => {
  it('(a) has no border-top in the band or its shell', () => {
    expect(band(3).m.style.borderTop).toBe('');
    const { container } = render(<TourOverviewShell shape={{ ...EMPTY_OVERVIEW_SHAPE, movers: true }} />);
    const shell = container.querySelector<HTMLElement>('[data-tour-shell="movers"]');
    expect(shell?.style.borderTop).toBe('');
    expect(shell?.querySelectorAll('[data-shell-mover-card]')).toHaveLength(3);
  });
  it('(b) Brief 44: three movers sit in three equal left-aligned columns', () => {
    const { row, cards } = band(3);
    expect(row.style.display).toBe('grid');
    expect(row.style.gridTemplateColumns).toBe('repeat(3, minmax(0,1fr))');
    expect(row.style.marginTop).toBe('8px');
    expect(cards.map(c => c.style.alignItems)).toEqual(['flex-start', 'flex-start', 'flex-start']);
  });
  it('(c) centres two movers in a two-column grid', () => {
    const { row, cards } = band(2);
    expect(row.style.display).toBe('grid'); expect(row.style.columnGap).toBe('32px');
    expect(cards[0].style.justifySelf).toBe('end'); expect(cards[1].style.justifySelf).toBe('start');
  });
  it('(d) centres one mover', () => { const { row } = band(1); expect(row.style.display).toBe('flex'); expect(row.style.justifyContent).toBe('center'); });
  it('(e) cards have no tile', () => {
    const c = band(3).cards[0];
    expect(c.style.border).toBe(''); expect(c.style.background).toBe(''); expect(c.style.borderRadius).toBe(''); expect(c.querySelector('img')).toBeNull();
  });
  it('(f) hybrid picks and mover shells use three tiles each', () => {
    const { container } = render(<TourOverviewShell shape={{ ...EMPTY_OVERVIEW_SHAPE, movers: true, picks: { recordLines: 1, sentenceLines: 1 } } as never} />);
    expect(container.querySelectorAll('[data-tour-shell="picks"] .ov48-tile')).toHaveLength(3);
    expect(container.querySelectorAll('[data-tour-shell="movers"] .ov48-mover')).toHaveLength(3);
  });
  it('(g) Brief 44: the three-mover row and the movers shell row both use three equal columns', () => {
    expect(band(3).row.style.gridTemplateColumns).toBe('repeat(3, minmax(0,1fr))');
    const { container } = render(<TourOverviewShell shape={{ ...EMPTY_OVERVIEW_SHAPE, movers: true }} />);
    const row = container.querySelector<HTMLElement>('[data-tour-shell="movers"] .ov48-movers');
    expect(row?.querySelectorAll('[data-shell-mover-card]')).toHaveLength(3);
    expect(row?.querySelector('[style*="border-radius: 34%"]')).toBeNull();
  });
  it('(h) the picks shell has no separator line', () => {
    const { container } = render(<TourOverviewShell shape={{ ...EMPTY_OVERVIEW_SHAPE, picks: { recordLines: 1, sentenceLines: 1 } } as never} />);
    const picks = container.querySelector<HTMLElement>('[data-tour-shell="picks"]'); if (!picks) throw new Error('Missing picks shell');
    expect(picks.querySelector('[data-overview-picks-hairline]')).toBeNull();
    expect([...picks.children].every(c => (c as HTMLElement).style.borderTop === '')).toBe(true);
  });
});
