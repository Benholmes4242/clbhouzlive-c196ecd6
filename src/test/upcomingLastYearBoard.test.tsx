import React from 'react';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { createInstance } from 'i18next';
import { I18nextProvider } from 'react-i18next';
import tourhubEn from '../../public/locales/en/tourhub.json';

const fixture = vi.hoisted(() => ({ rows: [
  { rank: '1', name: 'Winner', country: 'USA', score: '−20', year: '2025' },
  { rank: '2', name: 'Fredrik Jacobson', country: 'Sweden', score: '−19', year: '2025' },
] }));
vi.mock('@/features/tourhub/context/TourSelectionContext', () => ({ useTourSelection: () => ({ viewingTournamentId: null, viewingTourSlug: 'pga' }) }));
vi.mock('@/features/tourhub/hooks/useAIPredictions', () => ({ useAIPredictions: () => ({ data: { topContenders: [] } }) }));
vi.mock('@/features/tourhub/hooks/useTournamentTeeTimes', () => ({ useTournamentTeeTimes: () => ({ data: [] }) }));
vi.mock('@/features/tourhub/hooks/useTournamentLastYearTop4', () => ({ useTournamentLastYearTop4: () => ({ data: fixture.rows }) }));
vi.mock('@/features/tourhub/tournament-v2/data/usePickTeeTimes', () => ({ usePickTeeTimes: () => ({ data: new Map() }) }));
vi.mock('@/features/tourhub/components/overview-v3/HybridHeroBands/PicksSheet', () => ({ PicksSheet: () => null }));
vi.mock('@/features/tourhub/components/overview-v3/HybridHeroBands/YourPickSheet', () => ({ YourPickSheet: () => null }));
vi.mock('@/features/tourhub/components/overview-v3/HybridHeroBands/LeadersGroup', () => ({ LeadersGroup: () => null }));

import { HeroBoardSection } from '@/features/tourhub/components/overview-v3/HybridHeroBands/HeroBoardBand';
import { LastYearRow } from '@/features/tourhub/components/overview-v3/HybridHeroBands/LastYearRow';
import { GOLD_DARK } from '@/features/tourhub/components/overview-v3/HybridHero.constants';
import { TOPAR_UNDER_DARK } from '@/features/tourhub/_shared/tokens';

const i18n = createInstance();
beforeAll(async () => { await i18n.init({ lng: 'en', resources: { en: { tourhub: tourhubEn } }, interpolation: { escapeValue: false } }); });
afterEach(() => { cleanup(); fixture.rows[1].year = '2025'; });
const mount = () => render(<I18nextProvider i18n={i18n}><QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><MemoryRouter><HeroBoardSection tournamentId="e" entries={[]} currentRound={null} phase="upcoming" /></MemoryRouter></QueryClientProvider></I18nextProvider>);

describe('upcoming LAST YEAR condensed board', () => {
  it('puts the shared year in the condensed header, not the rows', () => {
    const view = mount();
    const block = view.container.querySelector<HTMLElement>('[data-overview-last-year]');
    const header = block?.querySelector<HTMLElement>('[data-overview-board-header]');
    expect(header?.textContent).toBe('Last year · 2025');
    expect(header?.style.textTransform).toBe('uppercase');
    expect(block?.style.paddingTop).toBe('12px');
    expect(block?.style.paddingBottom).toBe('');
    expect(header?.style.minHeight).toBe('24px');
    expect(header?.style.padding).toBe('2px 20px');
    expect(header?.style.fontSize).toBe('10px');
    expect(block?.children[1].children).toHaveLength(3);
    expect(block?.children[2].textContent).not.toContain('2025');
  });
  it('omits the heading year when the displayed rows have different years', () => {
    fixture.rows[1].year = '2024';
    const view = mount();
    const header = view.container.querySelector<HTMLElement>('[data-overview-last-year] [data-overview-board-header]');
    expect(header?.textContent).toBe('Last year');
    expect(header?.style.textTransform).toBe('uppercase');
  });
  it('uses the live row tracks and 22px ringless avatar for a non-winner without a flag', () => {
    const view = render(<LastYearRow rank="2" name="Fredrik Jacobson" score="−19" />);
    const row = view.container.firstElementChild as HTMLElement;
    expect(row.style.gridTemplateColumns).toBe('24px minmax(0,1fr) 40px');
    expect(row.style.gap).toBe('4px');
    expect(row.style.padding).toBe('5px 20px');
    expect(row.style.minHeight).toBe('33px');
    const player = row.children[1] as HTMLElement;
    const avatar = player.firstElementChild?.firstElementChild as HTMLElement;
    expect(avatar.style.width).toBe('22px');
    expect(avatar.style.border).toBe('');
    expect(player.children).toHaveLength(2);
    const name = player.lastElementChild as HTMLElement;
    expect(name.style.fontSize).toBe('13px');
    expect(name.style.fontWeight).toBe('600');
    expect(name.style.textOverflow).toBe('ellipsis');
    expect(name.style.minWidth).toBe('0');
    expect(row.children).toHaveLength(3);
    expect(row.querySelector('[class*="fi-"]')).toBeNull();
  });
  it('keeps the winner the same size with a 14px trophy in the position cell and gold score/band', () => {
    const view = render(<LastYearRow rank="1" name="Winner" score="−20" isWinner />);
    const row = view.container.firstElementChild as HTMLElement;
    expect(row.style.padding).toBe('5px 20px');
    expect(row.style.minHeight).toBe('33px');
    expect(row.firstElementChild?.tagName).toBe('svg');
    expect(row.firstElementChild?.getAttribute('width')).toBe('14');
    expect(row.firstElementChild?.getAttribute('height')).toBe('14');
    expect(row.firstElementChild?.getAttribute('fill')).toBe(GOLD_DARK);
    expect((row.lastElementChild as HTMLElement).style.color).toBe('rgb(212, 160, 23)');
    expect(row.style.background).toBe('rgba(251, 188, 46, 0.1)');
    expect((row.lastElementChild as HTMLElement).style.fontSize).toBe('15px');
    expect(row.children).toHaveLength(3);
  });
  it.each(['E', '+2', '−2'])('preserves the non-winner score colour for %s', score => {
    const view = render(<LastYearRow rank="2" name="Player" score={score} />);
    const row = view.container.firstElementChild as HTMLElement;
    const expected = document.createElement('span');
    expected.style.color = score === '−2' ? TOPAR_UNDER_DARK : '#FFFFFF';
    expect((row.lastElementChild as HTMLElement).style.color).toBe(expected.style.color);
    expect((row.lastElementChild as HTMLElement).style.textAlign).toBe('center');
  });
});