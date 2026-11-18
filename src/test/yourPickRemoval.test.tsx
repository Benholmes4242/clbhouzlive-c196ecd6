import React from 'react';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { createInstance } from 'i18next';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import en from '@/locales/en/tourhub.json';
import type { TournamentMeta } from '@/features/tourhub/leaderboard/useTournamentMeta';
vi.mock('@/features/tourhub/hooks/usePickInsights', () => ({ useOurPickRecord: () => ({ data: null, isFetched: true }) }));
vi.mock('@/features/tourhub/components/PlayerAvatar', () => ({ PlayerAvatar: () => <span data-avatar /> }));
vi.mock('@/features/tourhub/tournament-v2/sections/CourseSection', () => ({ HolesSheet: () => null }));
import { PicksBlock } from '@/features/tourhub/components/overview-v3/HybridHeroBands/PicksBlock';
import { TeeV3Section } from '@/features/tourhub/tournament-v2/sections/TournamentV3Sections';
const language = createInstance();
void language.use(initReactI18next).init({ lng: 'en', resources: { en: { tourhub: en } }, initAsync: false });
const mount = (node: React.ReactNode) => render(<MemoryRouter><I18nextProvider i18n={language}>{node}</I18nextProvider></MemoryRouter>);
afterEach(cleanup);
describe('Your pick removal', () => {
  it('upcoming overview retains Our tournament picks without member-pick bands', () => {
    const { container } = mount(<PicksBlock picks={[]} tourCode="pga" tournamentId="event" seasonYear={2026} currentRound={null} pickResults={[]} phase="upcoming" onOpenRecord={() => {}} onOpenPick={() => {}} boardByPlayer={new Map()} teeByPlayer={null} startedPlayers={new Set()} championPlayerId={null} championPlayerIds={[]} intro={null} />);
    expect(container.querySelector('[data-overview-picks-heading]')).not.toBeNull();
    expect(container.querySelector('[data-overview-picks-heading]')).toHaveTextContent(en.overview.hero.ourPicks);
    expect(container.querySelector('[data-pick-question], [data-members-picks-strip]')).toBeNull();
  });
  it('tee tags prioritise Our pick then following then defending without viewer treatment', () => {
    const groups = [{ teeTime: '2026-11-19T08:00Z', startingHole: 1, players: [{ id: 'a', name: 'Player A' }, { id: 'b', name: 'Player B' }, { id: 'c', name: 'Player C' }] }];
    const { container } = mount(<TeeV3Section groups={groups} phase="upcoming" round={1} rounds={[1]} onRound={() => {}} onAll={() => {}} meta={{ start_date: '2026-11-19', tour_code: 'pga' } as TournamentMeta} picks={new Set(['a'])} follows={new Set(['a', 'b'])} field={[]} defender="c" rows={[]} />);
    const tags = [...container.querySelectorAll('.tv-tee-player .tv-tag')].map(tag => tag.textContent);
    expect(tags).toEqual([en.tournament.v3.ourPick, en.tournament.v3.following, en.tournament.v3.defending]);
    expect(container.querySelector('.tv-tag-you, .tv-your-face')).toBeNull();
    expect(tags).not.toContain(en.tournament.v3.yourPick);
  });
  it('no production import reaches a retired member-pick module', () => {
    const files = (dir: string): string[] => readdirSync(dir, { withFileTypes: true }).flatMap(entry => entry.name === 'test' ? [] : entry.isDirectory() ? files(join(dir, entry.name)) : /\.[cm]?[jt]sx?$/.test(entry.name) ? [join(dir, entry.name)] : []);
    const forbidden = /(?:import|export)[\s\S]*?from\s*['"][^'"]*\/(?:YourPickCard|YourPickSheet|PickMemberBands|TournamentPicksBoard|useTournamentCircleRank)['"]|import\s*\(['"][^'"]*\/(?:YourPickCard|YourPickSheet|PickMemberBands|TournamentPicksBoard|useTournamentCircleRank)['"]\)/;
    expect(files('src').filter(file => !/\.(test|spec)\./.test(file) && forbidden.test(readFileSync(file, 'utf8')))).toEqual([]);
  });
});