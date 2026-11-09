/* BUILD Tour sheets, island and Schedule across seasons §1/§2 — the Full
   board sheet paints SHEET_SURFACE end to end with a white kicker and the
   hero's inline expand; every tour tee time uses the 24-hour formatter. */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { formatTimeHm24 } from '@/i18n/format';

const read = (p: string) => readFileSync(p, 'utf8');

describe('FullBoardSheet surface (§1a/§1b)', () => {
  const sheet = read('src/features/tourhub/tournament-v2/sections/FullBoardSheet.tsx');
  const css = read('src/features/tourhub/leaderboard/leaderboard.css');

  it('paints the whole sheet SHEET_SURFACE, never the near-black board canvas', () => {
    expect(sheet).toContain('SHEET_SURFACE');
    expect(sheet).toContain("['--tour-board-canvas' as string]: SHEET_SURFACE");
    expect(sheet).toContain("['--tour-board-head' as string]: 'rgba(22,22,26,.94)'");
    expect(sheet).toContain("['--hero-round-surface' as string]: SHEET_SURFACE");
    expect(sheet).toContain('background: SHEET_SURFACE');
    expect(sheet).not.toContain("background:'var(--tour-board-canvas)'");
  });

  it('the LEADERBOARD kicker is white (board ink) in this sheet only', () => {
    expect(css).toContain('.full-board-sheet .tour-board-kicker { color:var(--tour-board-ink); }');
    expect(sheet).toContain('className="full-board-sheet"');
    // The default kicker stays amber for the tournament and Leaderboards pages.
    expect(css).toContain('.tour-board-kicker { display:flex; justify-content:space-between; align-items:baseline; gap:8px; padding:20px 18px 6px; font-size:10.5px; font-weight:800; letter-spacing:.16em; color:var(--tour-board-amber); }');
  });
});

describe('FullBoardSheet inline expand (§1c)', () => {
  const sheet = read('src/features/tourhub/tournament-v2/sections/FullBoardSheet.tsx');
  const table = read('src/features/tourhub/leaderboard/BoardTable.tsx');
  const live = read('src/features/tourhub/leaderboard/LiveBoard.tsx');

  it('reuses HeroRoundPanel and the hero round rules — no rebuild', () => {
    expect(sheet).toContain("import { HeroRoundPanel } from './HeroRoundPanel';");
    expect(sheet).toContain("import { heroDefaultRound, heroStartedRounds } from './heroRoundRules';");
  });

  it('one row open at a time; tapping the open row closes it', () => {
    expect(sheet).toContain('if (expanded?.playerId === pid) { setExpanded(null); return; }');
  });

  it('a row with no started round still goes straight to the ScorecardSheet', () => {
    expect(sheet).toContain('if (defaultRound == null) { openScorecard(e); return; }');
  });

  it('BoardTable renders the expanded panel directly after the matching row', () => {
    expect(table).toContain('renderExpanded?: (entry: BoardEntry) => React.ReactNode;');
    expect(table).toContain('if (renderExpanded && expandedId && e.player?.id === expandedId)');
    expect(table).toContain('data-board-expanded-panel');
  });

  it('LiveBoard forwards the expand props untouched', () => {
    expect(live).toContain('expandedId?:string | null; renderExpanded?:(entry:BoardEntry)=>ReactNode;');
    expect(live).toContain('expandedId, renderExpanded');
  });
});

describe('24-hour tee times (§2)', () => {
  it('formatTimeHm24 renders HH:MM on the 24-hour clock', () => {
    expect(formatTimeHm24(new Date(2026, 10, 9, 15, 30))).toBe('15:30');
    expect(formatTimeHm24(new Date(2026, 10, 9, 8, 5))).toBe('08:05');
  });

  it.each([
    'src/features/tourhub/tournament-v2/sections/TeeTimesFirstGroups.tsx',
    'src/features/tourhub/tournament-v2/sections/TeeTimesRail.tsx',
    'src/features/tourhub/overview/sections/OnTheCourse.tsx',
    'src/features/tourhub/overview/magazineCopy.ts',
    'src/features/tourhub/hooks/useTournamentTeeTimes.ts',
    'src/features/tourhub/components/overview-v3/HybridHeroBands/LeadersGroup.tsx',
  ])('%s uses formatTimeHm24, never the 12-hour formatTimeHm', (path) => {
    const src = read(path);
    expect(src).toContain('formatTimeHm24');
    expect(src).not.toMatch(/formatTimeHm\(/);
  });
});
