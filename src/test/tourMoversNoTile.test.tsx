import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));

import { RoundMovementBand } from '@/features/tourhub/components/overview-v3/HybridHeroBands/HeroBoardBand';
import { EMPTY_OVERVIEW_SHAPE, TourOverviewShell } from '@/features/tourhub/components/overview-v3/overviewShells';
import { EVEN_ROW_GRID } from '@/features/tourhub/components/overview-v3/overviewTokens';

afterEach(cleanup);
const mount = (node: React.ReactNode) => render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><MemoryRouter>{node}</MemoryRouter></QueryClientProvider>);
const card = (k: string) => ({ key: k, name: `Player ${k}`, candidates: [], delta: 2, toPar: -2, gross: 70 });
const band = (n: number) => { const v = mount(<RoundMovementBand round={2} cards={['a', 'b', 'c'].slice(0, n).map(card)} />); const m = v.container.querySelector<HTMLElement>('[data-overview-movement]')!; return { m, row: m.children[1] as HTMLElement, cards: [...m.querySelectorAll<HTMLElement>('[data-overview-movement-card]')] }; };

describe('Biggest movers without tiles', () => {
  it('(a) has no border-top in the band or its shell', () => {
    expect(band(3).m.style.borderTop).toBe('');
    const { container } = render(<TourOverviewShell shape={{ ...EMPTY_OVERVIEW_SHAPE, movers: true }} />);
    const shell = container.querySelector<HTMLElement>('[data-tour-shell="movers"]')!;
    expect(shell.style.borderTop).toBe(''); expect(shell.style.padding).toBe('12px 20px 10px');
  });
  it('(b) spaces three movers evenly across the full width', () => {
    const { row, cards } = band(3);
    expect(row.style.display).toBe('grid');
    expect(row.style.gridTemplateColumns).toBe(EVEN_ROW_GRID);
    expect(row.style.margin).toBe('8px -20px 0px');
    expect(cards.map(c => c.style.gridColumn)).toEqual(['2', '4', '6']);
  });
  it('(c) centres two movers in a two-column grid', () => {
    const { row, cards } = band(2);
    expect(row.style.display).toBe('grid'); expect(row.style.columnGap).toBe('32px');
    expect(cards[0].style.justifySelf).toBe('end'); expect(cards[1].style.justifySelf).toBe('start');
  });
  it('(d) centres one mover', () => { const { row } = band(1); expect(row.style.display).toBe('flex'); expect(row.style.justifyContent).toBe('center'); });
  it('(e) cards have no tile', () => {
    const c = band(3).cards[0];
    expect(c.style.border).toBe(''); expect(c.style.background).toBe(''); expect(c.style.borderRadius).toBe(''); expect(c.style.flex).toBe('0 1 auto');
  });
  it('(f) picks and mover shells both lose the tile', () => {
    const { container } = render(<TourOverviewShell shape={{ ...EMPTY_OVERVIEW_SHAPE, movers: true, picks: { recordLines: 1, sentenceLines: 1 } } as never} />);
    for (const sel of ['[data-tour-shell="picks"]', '[data-tour-shell="movers"]']) {
      const card = container.querySelector<HTMLElement>(`${sel} [data-shell-small-card]`)!;
      expect(card.style.border).toBe(''); expect(card.style.borderRadius).toBe(''); expect(card.style.padding).toBe('0px');
    }
  });
  it('(g) the three-mover row and the movers shell row both use the even-row grid', () => {
    expect(band(3).row.style.gridTemplateColumns).toBe(EVEN_ROW_GRID);
    const { container } = render(<TourOverviewShell shape={{ ...EMPTY_OVERVIEW_SHAPE, movers: true }} />);
    const row = container.querySelector<HTMLElement>('[data-tour-shell="movers"] [data-shell-small-card]')!.parentElement as HTMLElement;
    expect(row.style.gridTemplateColumns).toBe(EVEN_ROW_GRID);
    expect(row.style.margin).toBe('8px -20px 0px');
    expect([...row.querySelectorAll<HTMLElement>('[data-shell-small-card]')].map(c => c.style.gridColumn)).toEqual(['2', '4', '6']);
  });
  it('(h) the picks shell has no separator line', () => {
    const { container } = render(<TourOverviewShell shape={{ ...EMPTY_OVERVIEW_SHAPE, picks: { recordLines: 1, sentenceLines: 1 } } as never} />);
    const picks = container.querySelector<HTMLElement>('[data-tour-shell="picks"]')!;
    expect(picks.querySelector('[data-overview-picks-hairline]')).toBeNull();
    expect([...picks.children].every(c => (c as HTMLElement).style.borderTop === '')).toBe(true);
  });
});
