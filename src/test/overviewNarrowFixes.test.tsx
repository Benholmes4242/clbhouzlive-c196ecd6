import React from 'react';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { createInstance } from 'i18next';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import en from '@/locales/en/tourhub.json';
import { LiveFacts } from '@/features/tourhub/components/overview-v3/LiveOverviewSections';
import { RecapStandings } from '@/features/tourhub/components/overview-v3/SeasonRecapSections';
import type { SeasonRecapData } from '@/features/tourhub/components/overview-v3/useSeasonRecap';

const i18n = createInstance();
await i18n.use(initReactI18next).init({ lng: 'en', fallbackLng: 'en', resources: { en: { tourhub: en } }, interpolation: { escapeValue: false }, initAsync: false });
const mount = (node: React.ReactNode) => render(<MemoryRouter><I18nextProvider i18n={i18n}>{node}</I18nextProvider></MemoryRouter>);
const css = readFileSync('src/styles/hybrid-hero.css', 'utf8');
const champions: SeasonRecapData = {
  events: 28, winners: 14, maxWins: 6, mostWinsSurname: null, tiedLeaders: 2,
  standings: [
    { position: 1, name: 'Stewart Cink', points: 4999830, playerId: null },
    { position: 2, name: 'Steven Alker', points: 4357828, playerId: null },
    { position: 3, name: 'Jerry Kelly', points: 2789778, playerId: null },
  ],
  standingsSource: { table: 'tour_season_rankings', date: '2026-11-16' },
  cardLine: null, cardEarners: [],
};

describe('Tour overview narrow-screen fixes', () => {
  it('places the hidden short-label base rule before the 340px override', () => {
    const source = readFileSync('src/features/tourhub/components/overview-v3/HybridHeroBands/liveStates.css', 'utf8');
    const base = source.indexOf('.live-facts .live-fact-short{display:none}');
    expect(base).toBeGreaterThan(-1);
    expect(base).toBeLessThan(source.indexOf('@media (max-width:340px)'));
  });

  it('keeps both label spans inside the rendered scoring-average cell', () => {
    const { container } = mount(<LiveFacts cells={[{ key: 'scoringAvg', value: '70.25', toPar: null }]} />);
    const cell = container.querySelector('[data-live-fact="scoringAvg"]');
    expect(cell?.querySelectorAll('.live-fact-full')).toHaveLength(1);
    expect(cell?.querySelectorAll('.live-fact-short')).toHaveLength(1);
    expect(cell?.querySelector('b')?.textContent).toBe('70.25');
  });

  it('shares one intrinsic points grid between the heading cells and three standings rows', () => {
    const { container } = mount(<RecapStandings tour="champ" data={champions} />);
    const table = container.querySelector('[data-recap-table]');
    expect(table?.firstElementChild).toHaveClass('recap-head-row');
    expect(table?.querySelectorAll('.recap-head-row > *')).toHaveLength(3);
    expect(table?.querySelectorAll('[data-recap-row]')).toHaveLength(3);
    const tableRule = css.match(/\.recap-table\{([^}]+)\}/)?.[1] ?? '';
    expect(tableRule).toContain('grid-template-columns:30px minmax(0,1fr) auto auto');
    expect(tableRule).toContain('column-gap:12px');
    expect(css).toContain('.recap-head-row{display:contents}');
    expect(css).not.toContain('.recap-head-row>.upcoming-kicker');
    expect(table?.querySelector('.recap-head-row h2, .recap-head-row h3')).toBeNull();
    expect((table?.querySelector('.recap-head-row > span') as HTMLElement | null)?.style.gridColumn).toBe('1 / 3');
    expect(css).toContain('@media(max-width:340px){.recap-table{grid-template-columns:26px minmax(0,1fr) auto auto;column-gap:8px}.recap-behind{font-size:13px}}');
  });

  it('renders every Champions PTS and BEHIND figure in full without numeric ellipsis', () => {
    const { container } = mount(<RecapStandings tour="champ" data={champions} />);
    expect([...container.querySelectorAll('.recap-pts')].map(cell => cell.textContent)).toEqual(['4,999,830', '4,357,828', '2,789,778']);
    expect([...container.querySelectorAll('[data-recap-behind]')].map(cell => cell.textContent)).toEqual(['—', '642,002', '2,210,052']);
    const pointsRule = css.match(/\.recap-pts\{([^}]+)\}/)?.[1] ?? '';
    const behindRule = css.match(/\.recap-behind\{([^}]+)\}/)?.[1] ?? '';
    expect(pointsRule).toContain('font-size:15px');
    expect(behindRule).toContain('white-space:nowrap');
    for (const rule of [pointsRule, behindRule]) {
      expect(rule).not.toContain('text-overflow:ellipsis');
      expect(rule).not.toContain('overflow:hidden');
    }
    expect(css.match(/\.recap-name\{([^}]+)\}/)?.[1]).toContain('text-overflow:ellipsis');
  });
});