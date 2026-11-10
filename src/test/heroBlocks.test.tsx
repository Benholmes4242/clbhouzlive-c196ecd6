/** HERO BLOCKS build: one upcoming block on both pages, centred fact bands,
 *  recap without its board header, and the shared outline trophy glyph. */
import { describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/react';
import { readFileSync } from 'node:fs';

vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));

import { upcomingFactCells, UpcomingFacts } from '@/features/tourhub/components/overview-v3/UpcomingOverviewSections';
import { heroStartDayForm, startWeekday } from '@/features/tourhub/tournament-v2/data/tournamentRules';
import { LastYearRow } from '@/features/tourhub/components/overview-v3/HybridHeroBands/LastYearRow';

const first = '2026-11-05T15:10:00Z';
const zone = 'America/Phoenix';

describe('upcomingFactCells ordering and cap', () => {
  it('fills in FIRST TEE, FIELD, PURSE, PAR, YARDS order and caps at four', () => {
    expect(upcomingFactCells(first, zone, 132, 3500000, 70, 6853, true).map((c) => c.key))
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
    expect(upcomingFactCells(first, zone, 132, 3500000, null, 6853, true).map((c) => c.key))
      .toEqual(['firstTee', 'field', 'purse', 'yards']);
  });
});

describe('FIRST TEE follows the kicker (one zone, time only)', () => {
  const meta = (start: string, z: string | null) => ({ start_date: start, course_timezone: z, timezone: null }) as never;
  it('omits FIRST TEE when the kicker is in date form', () => {
    const form = heroStartDayForm(meta('2026-11-19', zone), new Date('2026-11-09T12:00:00Z'));
    expect(form.weekday).toBe(false);
    expect(upcomingFactCells(first, zone, 132, 3500000, 70, 6853, form.weekday).map((c) => c.key))
      .toEqual(['field', 'purse', 'par', 'yards']);
  });
  it('kicker day and first-tee time agree in the event zone (Korea)', () => {
    const tee = '2026-11-11T22:00:00Z'; // 07:00 KST Thursday 12 Nov
    const form = heroStartDayForm(meta('2026-11-12', 'Asia/Seoul'), new Date('2026-11-09T12:00:00Z'));
    expect(form).toEqual({ text: 'THURSDAY', weekday: true });
    expect(startWeekday('2026-11-12', 'Asia/Seoul')).toBe('Thursday');
    expect(upcomingFactCells(tee, 'Asia/Seoul', 132, null, null, null, form.weekday)[0]).toEqual({ key: 'firstTee', value: '07:00' });
  });
  it('the FIRST TEE value never contains a weekday', () => {
    const days = /mon|tue|wed|thu|fri|sat|sun/i;
    for (const z of ['America/Phoenix', 'Asia/Seoul', 'Europe/London', 'Australia/Sydney', null]) {
      for (let h = 0; h < 24; h += 5) {
        const cell = upcomingFactCells(`2026-11-12T${String(h).padStart(2, '0')}:45:00Z`, z, 0, null, null, null, true)[0];
        expect(cell?.key).toBe('firstTee');
        expect(cell?.value).toMatch(/^\d{2}:\d{2}$/);
        expect(cell?.value).not.toMatch(days);
      }
    }
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

describe('upcoming completed rhythm', () => {
  it('shared THE EVENT band uses board TOT figures for both page callers', () => {
    const { container } = render(<UpcomingFacts first={first} zone={zone} field={132} purse={3000000} par={71} yards={6860} startDayNamed />);
    expect(container.querySelector('[data-overview-event] h2')).not.toBeNull();
    for (const value of container.querySelectorAll('[data-upcoming-fact] b')) expect(value).toHaveStyle({ fontSize: '15px', fontWeight: '700' });
  });
  it('all upcoming seams reference the shared completed tokens', () => {
    const css = readFileSync('src/styles/hybrid-hero.css', 'utf8');
    expect(css).toContain('.upcoming-event-facts{margin-top:var(--hero-content-gap)}');
    expect(css).toContain('.upcoming-history{padding-top:var(--hero-section-gap)}');
    expect(css).toContain('padding-top:calc(var(--hero-section-gap) - 2px)');
    expect(css).toContain('[data-overview-last-year]+.tv-section[data-tv-section="course"]{padding-top:var(--hero-section-gap)}');
  });
});

describe('recap board header removal', () => {
  it('RecapStandings renders no kicker or Full list link', () => {
    const src = readFileSync('src/features/tourhub/components/overview-v3/SeasonRecapSections.tsx', 'utf8');
    const stand = src.slice(src.indexOf('export function RecapStandings'), src.indexOf('export function RecapCardList'));
    expect(stand).not.toContain('data-recap-full-list');
    expect(stand).toContain('overview.recap.pointsHeading');
    expect(stand).not.toMatch(/className="recap-head"/);
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

describe('HERO BLOCKS fix: tournament upcoming PhotoBand', () => {
  it('passes nameRef as titleRef and no onOpen, so the band is inert', async () => {
    const fs = await import('node:fs');
    const src = fs.readFileSync('src/features/tourhub/tournament-v2/sections/TournamentV3Sections.tsx', 'utf8');
    const call = src.slice(src.indexOf('<PhotoBand '), src.indexOf('/><UpcomingFacts'));
    expect(call).toContain('titleRef={nameRef}');
    expect(call).not.toContain('onOpen');
    const band = fs.readFileSync('src/features/tourhub/components/overview-v3/HybridHeroBands/PhotoBand.tsx', 'utf8');
    expect(band).toContain("role={onOpen ? 'button' : undefined}");
    expect(band).toContain("cursor: onOpen ? 'pointer' : undefined");
    expect(band).toMatch(/ref=\{titleRef\}[\s\S]*?\{title\}\s*<\/h1>/);
  });
});
