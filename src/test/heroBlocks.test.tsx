/** HERO BLOCKS build: one upcoming block on both pages, centred fact bands,
 *  recap without its board header, and the shared outline trophy glyph. */
import { describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/react';
import { readFileSync } from 'node:fs';

vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));

import { upcomingFactCells } from '@/features/tourhub/components/overview-v3/UpcomingOverviewSections';
import { LastYearRow } from '@/features/tourhub/components/overview-v3/HybridHeroBands/LastYearRow';

const first = '2026-11-05T15:10:00Z';
const zone = 'America/Phoenix';

describe('upcomingFactCells ordering and cap', () => {
  it('fills in FIRST TEE, FIELD, PURSE, PAR, YARDS order and caps at four', () => {
    expect(upcomingFactCells(first, zone, 132, 3500000, 70, 6853).map((c) => c.key))
      .toEqual(['firstTee', 'field', 'purse', 'par']);
    expect(upcomingFactCells(null, zone, 132, 3500000, 70, 6853).map((c) => c.key))
      .toEqual(['field', 'purse', 'par', 'yards']);
  });
  it('before the draw gives PURSE · PAR · YARDS, as in the signed-off mock', () => {
    expect(upcomingFactCells(null, zone, 0, 3000000, 71, 6853))
      .toEqual([{ key: 'purse', value: '$3M' }, { key: 'par', value: '71' }, { key: 'yards', value: '6,853' }]);
  });
  it('yards falls back out when absent and never truncates the first four', () => {
    expect(upcomingFactCells(null, zone, 132, null, 71, null).map((c) => c.key)).toEqual(['field', 'par']);
    expect(upcomingFactCells(first, zone, 132, 3500000, null, 6853).map((c) => c.key))
      .toEqual(['firstTee', 'field', 'purse', 'yards']);
  });
});

describe('one upcoming block on both pages', () => {
  const sections = readFileSync('src/features/tourhub/tournament-v2/sections/TournamentV3Sections.tsx', 'utf8');
  const page = readFileSync('src/features/tourhub/tournament-v2/TournamentPage.tsx', 'utf8');
  it('the tournament hero upcoming branch uses the overview builders', () => {
    expect(sections).toContain('<PhotoBand');
    expect(sections).toContain('upcomingSentence(last,upcomingField,firstTee,zone)');
    expect(sections).toContain('getOverviewCountdown(meta.start_date)');
    expect(sections).toContain('formatOverviewDateRange(meta.start_date,meta.end_date)');
    expect(sections).toContain('<UpcomingFacts');
  });
  it('the tournament page feeds the hero round-1 tees and the draw field count', () => {
    expect(page).toContain('useTeeTimesAll(tournamentId,1,');
    expect(page).toContain('firstTee={earliestTeeTime(heroTeeGroups)}');
    expect(page).toContain('drawnField={heroTeeGroups.length?');
  });
  it('the tournament page upcoming phase uses the overview LAST YEAR block', () => {
    expect(page).toContain('<UpcomingLastYear rows={lastYear??[]}/>');
    expect(page).not.toContain('<LastYearSection');
  });
});

describe('recap board header removal', () => {
  it('RecapStandings renders no kicker or Full list link', () => {
    const src = readFileSync('src/features/tourhub/components/overview-v3/SeasonRecapSections.tsx', 'utf8');
    const stand = src.slice(src.indexOf('export function RecapStandings'), src.indexOf('export function RecapCardList'));
    expect(stand).not.toContain('data-recap-full-list');
    expect(stand).not.toContain('boardKicker');
    expect(stand).not.toContain('recap-head');
  });
});

describe('one winner trophy glyph', () => {
  it('upcoming LAST YEAR uses the 13px outline recap trophy', () => {
    const view = render(<LastYearRow rank="1" name="Winner" score="−20" isWinner />);
    const trophy = view.container.querySelector('svg.recap-trophy');
    expect(trophy).not.toBeNull();
    expect(trophy?.getAttribute('width')).toBe('13');
    expect(trophy?.getAttribute('fill')).toBe('none');
  });
  it('the recap and the completed state use the same lucide Trophy treatment', () => {
    const recap = readFileSync('src/features/tourhub/components/overview-v3/SeasonRecapSections.tsx', 'utf8');
    expect(recap).toContain('<Trophy data-recap-trophy size={13} className="recap-trophy"');
    const row = readFileSync('src/features/tourhub/components/overview-v3/HybridHeroBands/LastYearRow.tsx', 'utf8');
    expect(row).toContain('<Trophy size={13} className="recap-trophy"');
    const band = readFileSync('src/features/tourhub/components/overview-v3/HybridHeroBands/HeroBoardBand.tsx', 'utf8');
    expect(band).toContain("import { Trophy } from 'lucide-react'");
  });
});
