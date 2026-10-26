/* BRIEF_TOUR_PLAYOFF_AND_SHORTENED_EVENTS — sync rules, pulse, hero chip,
   shortened copy, situation_note window and the tournament page block. */
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import i18next from 'i18next';
import { I18nextProvider } from 'react-i18next';
import enTourhub from '../../public/locales/en/tourhub.json';
import { readFileSync } from 'node:fs';

import {
  LIVE_POLL_STATUSES, STALE_AUTO_CLOSE_STATUSES, statusToWrite, soleWinnerSrId,
} from '../../supabase/functions/tournament-live-sync/liveStatus';
import { pulseStateFor } from '@/features/tourhub/components/overview-v3/useTournamentPulse';
import { PhotoBand } from '@/features/tourhub/components/overview-v3/HybridHeroBands/PhotoBand';
import { shortenedTo, situationSegments, visibleSituationNote } from '@/features/tourhub/overview/situationCopy';
import { SituationBand } from '@/features/tourhub/components/overview-v3/HybridHeroBands/SituationBand';
import type { HeroState } from '@/features/tourhub/components/overview-v3/HybridHero.utils';

const lang = i18next.createInstance();
void lang.init({ lng: 'en', resources: { en: { tourhub: enTourhub } }, initAsync: false, interpolation: { escapeValue: false } });
const t = lang.getFixedT('en', 'tourhub');

const PLAYOFF: HeroState = { kind: 'results', variant: 'awaiting-playoff', finishDate: '2026-10-25', meta: 'PLAYOFF' };
const STANDARD: HeroState = { kind: 'results', variant: 'standard', finishDate: '2026-10-25', meta: '' };
const LIVE: HeroState = { kind: 'live', round: 3, totalRounds: 4 };
const SUSPENDED: HeroState = { kind: 'suspended', round: 3, totalRounds: 4, reason: null };
const rows = (played: number) => [0, 1].map(() => ({ round_1: -5, round_2: played >= 2 ? -6 : null, round_3: played >= 3 ? -5 : null, round_4: played >= 4 ? -2 : null }));
const text = (segments: { text: string }[]) => segments.map((s) => s.text).join('');

describe('tournament-live-sync rules', () => {
  it('the live poll includes playoff and suspended statuses', () => {
    for (const s of ['inprogress', 'playoff', 'inplayoff', 'in_playoff', 'suspended', 'delayed', 'weather', 'holdup']) expect(LIVE_POLL_STATUSES).toContain(s);
    const src = readFileSync('supabase/functions/tournament-live-sync/index.ts', 'utf8');
    expect(src).toContain(".in('status', LIVE_POLL_STATUSES)");
  });
  it('the date auto-close skips playoff and suspended events', () => {
    expect(STALE_AUTO_CLOSE_STATUSES).toEqual(['inprogress']);
    const src = readFileSync('supabase/functions/tournament-live-sync/index.ts', 'utf8');
    expect(src.match(/\.in\('status', STALE_AUTO_CLOSE_STATUSES\)/g)).toHaveLength(2);
    expect(src).not.toMatch(/\.eq\('status', 'inprogress'\)/);
  });
  it("a feed 'playoff' status is written through and never replaced by inprogress", () => {
    expect(statusToWrite('playoff', 'inprogress')).toBe('playoff');
    expect(statusToWrite('Suspended', 'inprogress')).toBe('suspended');
    expect(statusToWrite('playoff', 'playoff')).toBeNull();
    expect(statusToWrite('inprogress', 'inprogress')).toBeNull();
    expect(statusToWrite('inprogress', 'playoff')).toBe('inprogress'); // feed itself says play resumed
  });
  it('a closing payload with two rows at position 1 leaves winner_id null; with one it sets it', () => {
    expect(soleWinnerSrId([{ position: 1, strokes: 194, sr_id: 'power' }, { position: 1, strokes: 194, sr_id: 'smotherman' }, { position: 3, strokes: 196, sr_id: 'x' }])).toBeNull();
    expect(soleWinnerSrId([{ position: 1, strokes: 193, sr_id: 'power' }, { position: 2, strokes: 194, sr_id: 'smotherman' }])).toBe('power');
    expect(soleWinnerSrId([{ position: 1, strokes: 0, sr_id: 'ghost' }])).toBeNull();
  });
});

describe('tournament page pulse', () => {
  const now = new Date(2026, 9, 26, 12);
  it("'playoff' with end_date yesterday is live", () => {
    expect(pulseStateFor({ status: 'playoff', start_date: '2026-10-22', end_date: '2026-10-25' }, now)).toBe('live');
    expect(pulseStateFor({ status: 'suspended', start_date: '2026-10-22', end_date: '2026-10-25' }, now)).toBe('live');
  });
  it("'playoff' with end_date 4 days ago is completed", () => {
    expect(pulseStateFor({ status: 'playoff', start_date: '2026-10-19', end_date: '2026-10-22' }, now)).toBe('completed');
  });
  it("'closed' is completed and 'inprogress' keeps the window rule", () => {
    expect(pulseStateFor({ status: 'closed', start_date: '2026-10-22', end_date: '2026-10-26' }, now)).toBe('completed');
    expect(pulseStateFor({ status: 'inprogress', start_date: '2026-10-22', end_date: '2026-10-25' }, now)).toBe('completed');
    expect(pulseStateFor({ status: 'inprogress', start_date: '2026-10-23', end_date: '2026-10-26' }, now)).toBe('live');
  });
});

describe('hero chip', () => {
  const mount = (state: HeroState) => render(
    <I18nextProvider i18n={lang}>
      <PhotoBand title="Butterfield Bermuda Championship" venueName={null} datesString={null} venueImageUrl={null} state={state} tourLabel={null} leader={null} countdown={[]} startDay={null} onOpen={() => {}} />
    </I18nextProvider>,
  );
  it('reads PLAYOFF for awaiting-playoff, never RESULTS, with no live dot', () => {
    const { container } = mount(PLAYOFF);
    const band = container.querySelector('[data-overview-photo-band]') as HTMLElement;
    expect(band.textContent).toContain('PLAYOFF');
    expect(band.textContent).not.toContain('RESULTS');
    expect(band.querySelector('span[style*="border-radius: 999px"][style*="width: 7px"]')).toBeNull();
  });
  it('a standard result still reads RESULTS', () => {
    const { container } = mount(STANDARD);
    expect(container.textContent).toContain('RESULTS');
  });
});

describe('shortened events', () => {
  const headline = [{ text: 'A playoff decides it.', figure: false }];
  it('3 of 4 rounds gives the round-4 sentence with 54 holes, then the standing sentence', () => {
    expect(shortenedTo(rows(3), 4)).toBe(3);
    const segs = situationSegments({ state: PLAYOFF, entries: rows(3), scheduledRounds: 4, headline, t });
    expect(text(segs)).toBe('Round 4 was cancelled, so the event finished after 54 holes. A playoff decides it.');
    expect(segs.filter((s) => s.figure).map((s) => s.text)).toEqual(['4', '54']);
  });
  it('2 of 4 gives the cut-to-36 sentence', () => {
    expect(text(situationSegments({ state: STANDARD, entries: rows(2), scheduledRounds: 4, headline: [], t }))).toBe('The event was cut to 36 holes.');
  });
  it('3 of 3 gives nothing (a 54-hole event is not shortened)', () => {
    expect(shortenedTo(rows(3), 3)).toBeNull();
    expect(situationSegments({ state: STANDARD, entries: rows(3), scheduledRounds: 3, headline, t })).toEqual(headline);
  });
  it('live and suspended states give nothing', () => {
    expect(situationSegments({ state: LIVE, entries: rows(3), scheduledRounds: 4, headline, t })).toEqual(headline);
    expect(situationSegments({ state: SUSPENDED, entries: rows(3), scheduledRounds: 4, headline, t })).toEqual(headline);
  });
});

describe('situation_note', () => {
  const note = 'Round 4 was cancelled for high winds.';
  it('shows inside the window and is ignored 4 days after end_date', () => {
    expect(visibleSituationNote(note, STANDARD, '2026-10-25', new Date('2026-10-28T12:00:00Z'))).toBe(note);
    expect(visibleSituationNote(note, STANDARD, '2026-10-25', new Date('2026-10-29T12:00:00Z'))).toBeNull();
    expect(visibleSituationNote(note, PLAYOFF, '2026-10-01', new Date('2026-10-29T12:00:00Z'))).toBe(note);
    expect(visibleSituationNote('  ', LIVE, '2026-10-25')).toBeNull();
  });
  it('renders as a second paragraph inside SituationBand', () => {
    const { container } = render(<I18nextProvider i18n={lang}><SituationBand segments={[{ text: 'Sentence.' }]} note={note} /></I18nextProvider>);
    const p = container.querySelector('[data-overview-situation] [data-overview-situation-note]') as HTMLElement;
    expect(p.textContent).toBe(note);
    expect(p.style.marginTop).toBe('6px');
    expect(p.style.fontSize).toBe('12.5px');
    expect(p.style.lineHeight).toBe('1.5');
    expect(p.style.whiteSpace).toBe('');
  });
});

/* ── Tournament page ─────────────────────────────────────────── */
const page = vi.hoisted(() => ({
  meta: null as unknown,
  rows: [] as unknown[],
  pulse: 'live' as 'live' | 'completed' | 'upcoming',
}));
vi.mock('@/features/tourhub/components/TourHubShell', () => ({ TourHubShell: ({ children }: { children: React.ReactNode }) => <>{children}</> }));
vi.mock('@/features/tourhub/components/TourPageShell', () => ({ TourPageShell: ({ children }: { children: React.ReactNode }) => <>{children}</> }));
vi.mock('@/features/tourhub/leaderboard/useTournamentMeta', () => ({ useTournamentMeta: () => ({ data: page.meta, isLoading: false, isError: false, refetch: () => {} }) }));
vi.mock('@/features/tourhub/hooks/useTourHubData', () => ({ useTourLeaderboard: () => ({ data: page.rows }) }));
vi.mock('@/features/tourhub/hooks/useBatchCourseImages', () => ({ useBatchCourseImages: () => ({ data: new Map() }) }));
vi.mock('@/features/tourhub/components/overview-v3/useTournamentPulse', async (orig) => ({ ...(await orig<object>()), useTournamentPulse: () => ({ state: page.pulse, isLive: page.pulse === 'live' }) }));
vi.mock('@/features/tourhub/hooks/useLeaderboardRealtime', () => ({ useLeaderboardRealtime: () => {} }));
vi.mock('@/features/tourhub/hooks/useTournamentStatusRealtime', () => ({ useTournamentStatusRealtime: () => {} }));
vi.mock('@/features/tourhub/hooks/useLiveTournaments', () => ({ useLiveTournaments: () => ({ data: [] }) }));
vi.mock('@/features/tourhub/tournament-v2/data/useTournamentHoleAnalysis', () => ({ useTournamentHoleAnalysis: () => ({ data: null }) }));
vi.mock('@/features/tourhub/tournament-v2/data/useDrawnRounds', () => ({ useDrawnRounds: () => ({ data: [] }) }));
vi.mock('@/features/tourhub/tournament-v2/data/useTeeTimesAll', () => ({ useTeeTimesAll: () => ({ data: [] }) }));
vi.mock('@/features/tourhub/tournament-v2/data/useTournamentStory', () => ({ useTournamentStory: () => ({ data: null }) }));
const stub = (name: string) => ({ [name]: () => null });
vi.mock('@/features/tourhub/tournament-v2/sections/HeroSection', () => stub('HeroSection'));
vi.mock('@/features/tourhub/tournament-v2/sections/ContestSection', () => stub('ContestSection'));
vi.mock('@/features/tourhub/tournament-v2/sections/MoveSection', () => stub('MoveSection'));
vi.mock('@/features/tourhub/tournament-v2/sections/MiniBoard', () => stub('MiniBoard'));
vi.mock('@/features/tourhub/_shared/OnTheCourse', () => stub('OnTheCourse'));
vi.mock('@/features/tourhub/tournament-v2/sections/AllTeeTimesSheet', () => stub('AllTeeTimesSheet'));
vi.mock('@/features/tourhub/tournament-v2/sections/TeeTimesRail', () => stub('TeeTimesRail'));
vi.mock('@/features/tourhub/tournament-v2/sections/CourseSection', () => stub('CourseSection'));
vi.mock('@/features/tourhub/tournament-v2/sections/MomentsSection', () => stub('MomentsSection'));
vi.mock('@/features/tourhub/tournament-v2/sections/EventInfoSection', () => stub('EventInfoSection'));
vi.mock('@/features/tourhub/tournament-v2/sections/StorySection', () => stub('StorySection'));
vi.mock('@/features/tourhub/tournament-v2/sections/FullBoardSheet', () => stub('FullBoardSheet'));

import { TournamentPage } from '@/features/tourhub/tournament-v2/TournamentPage';

const bermuda = { id: 'bermuda', name: 'Butterfield Bermuda Championship', status: 'playoff', start_date: '2026-10-22', end_date: '2026-10-25', current_round: 4, event_type: 'stroke', situation_note: 'Round 4 was cancelled for high winds.' };
const field = [
  { id: 'a', position: 1, position_tied: true, score: -16, round_1: -5, round_2: -6, round_3: -5, round_4: null, player: { id: 'a', full_name: 'Seamus Power' } },
  { id: 'b', position: 1, position_tied: true, score: -16, round_1: -6, round_2: -5, round_3: -5, round_4: null, player: { id: 'b', full_name: 'Austin Smotherman' } },
  { id: 'c', position: 3, position_tied: false, score: -14, round_1: -4, round_2: -5, round_3: -5, round_4: null, player: { id: 'c', full_name: 'Other Player' } },
];
const mountPage = () => render(
  <I18nextProvider i18n={lang}><MemoryRouter initialEntries={['/tourhub/tournament/bermuda']}>
    <Routes><Route path="/tourhub/tournament/:tournamentId" element={<TournamentPage />} /></Routes>
  </MemoryRouter></I18nextProvider>,
);
afterEach(() => { cleanup(); page.meta = null; page.rows = []; page.pulse = 'live'; });

describe('tournament page situation block', () => {
  it.each(['live', 'completed'] as const)('shows the situation block for an awaiting-playoff event (pulse %s) and not "Final"', (pulse) => {
    page.meta = bermuda; page.rows = field; page.pulse = pulse;
    const { container } = mountPage();
    const block = container.querySelector('#the-act [data-tournament-situation]') as HTMLElement;
    expect(block).not.toBeNull();
    expect(block.textContent).toContain('Round 4 was cancelled, so the event finished after 54 holes.');
    expect(block.querySelector('[data-overview-situation-note]')?.textContent).toBe(bermuda.situation_note);
    expect(container.textContent).not.toContain('Final');
  });
  it('renders no block for a normal finished four-round event', () => {
    page.meta = { ...bermuda, status: 'closed', situation_note: null, end_date: '2026-09-01', start_date: '2026-08-29' };
    page.rows = field.map((r) => ({ ...r, round_4: -1 })); page.pulse = 'completed';
    const { container } = mountPage();
    expect(container.querySelector('[data-tournament-situation]')).toBeNull();
  });
});
