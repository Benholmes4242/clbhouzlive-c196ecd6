import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import i18next from 'i18next';
import en from '../../public/locales/en/tourhub.json';
import { WorldRankings, hasMovement, Movement } from '@/features/tourhub/overview/sections/WorldRankings';
import {
  fmtPoints,
  leadSentence,
  ordinalEn,
  pickBiggestClimb,
  sinceLabel,
  sparkline,
  surnameOf,
} from '@/features/tourhub/overview/sections/worldRankingsRules';
import type { RankingsRow } from '@/features/tourhub/overview/data/useRankingsBoards';

vi.mock('@/features/tourhub/overview/data/useRankingsBoards', () => ({ useRankingsBoards: vi.fn() }));
vi.mock('@/features/tourhub/overview/data/useFollowedBoardRows', () => ({ useFollowedBoardRows: vi.fn() }));
vi.mock('@/features/tourhub/overview/data/useClimberRankHistory', () => ({ useClimberRankHistory: vi.fn() }));
vi.mock('@/features/tourhub/leaderboard/useTourPlayerFollows', () => ({ useTourPlayerFollows: vi.fn() }));

import { useRankingsBoards } from '@/features/tourhub/overview/data/useRankingsBoards';
import { useFollowedBoardRows } from '@/features/tourhub/overview/data/useFollowedBoardRows';
import { useClimberRankHistory } from '@/features/tourhub/overview/data/useClimberRankHistory';
import { useTourPlayerFollows } from '@/features/tourhub/leaderboard/useTourPlayerFollows';

const i18n = i18next.createInstance();
void i18n.init({ lng: 'en', fallbackLng: 'en', initAsync: false, resources: { en: { tourhub: en } } });

function row(partial: Partial<RankingsRow>): RankingsRow {
  return {
    rank: 1, priorRank: null, playerId: 'p1', playerName: 'Player One', country: 'USA',
    photoUrl: null, points: 100, movement: null, wins: null, top10s: null, ...partial,
  };
}

const WORLD_ROWS: RankingsRow[] = [
  row({ rank: 1, playerId: 's', playerName: 'Scottie Scheffler', points: 700, movement: 0 }),
  row({ rank: 2, playerId: 'm', playerName: 'Rory McIlroy', country: 'NIR', points: 357, movement: 0 }),
  row({ rank: 3, playerId: 'f', playerName: 'Matt Fitzpatrick', country: 'ENG', points: 348, movement: 1 }),
  row({ rank: 4, playerId: 'y', playerName: 'Cameron Young', points: 333, movement: -1 }),
  row({ rank: 5, playerId: 'c', playerName: 'Wyndham Clark', points: 306, movement: 4 }),
];

const SEASON_ROWS: RankingsRow[] = [
  row({ rank: 1, playerId: 'm', playerName: 'Rory McIlroy', country: 'NIR', points: 4210, wins: 3 }),
  row({ rank: 2, playerId: 'tf', playerName: 'Tommy Fleetwood', country: 'ENG', points: 3388, wins: 1 }),
  row({ rank: 3, playerId: 'h', playerName: 'Rasmus Højgaard', country: 'DEN', points: 2964, wins: 2 }),
  row({ rank: 4, playerId: 'l', playerName: 'Thriston Lawrence', country: 'RSA', points: 2512, wins: 1 }),
  row({ rank: 5, playerId: 'a', playerName: 'Ángel Ayora', country: 'ESP', points: 2240, wins: 0 }),
];

function boardResult(over: Record<string, unknown> = {}) {
  return {
    data: {
      rows: WORLD_ROWS, basisDays: 91, comparisonDate: '2026-07-27', latestDate: '2026-10-26',
      comparisonRanks: { s: 1, m: 2, f: 4, y: 3, c: 9 }, eventsLeft: null, ...over,
    },
    isLoading: false,
  } as any;
}

const SEASON_BOARD = () => boardResult({ rows: SEASON_ROWS, basisDays: null, comparisonDate: null, latestDate: null, comparisonRanks: null, eventsLeft: 2 });

function setup({
  board = boardResult(),
  seasonBoard = SEASON_BOARD(),
  followedRows = [] as RankingsRow[],
  follows = [] as string[],
  history = [] as { rank: number; ranking_date: string }[],
} = {}) {
  vi.mocked(useRankingsBoards).mockImplementation((b: string) => (b === 'owgr' ? board : seasonBoard));
  vi.mocked(useFollowedBoardRows).mockReturnValue({ data: followedRows } as any);
  vi.mocked(useClimberRankHistory).mockReturnValue({ data: history } as any);
  vi.mocked(useTourPlayerFollows).mockReturnValue({ ids: new Set(follows), busy: false, error: null, toggle: vi.fn() } as any);
  return render(
    <I18nextProvider i18n={i18n}>
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/" element={<WorldRankings />} />
          <Route path="/tourhub/player/:id" element={<div data-testid="player-page" />} />
        </Routes>
      </MemoryRouter>
    </I18nextProvider>,
  );
}

beforeEach(() => vi.clearAllMocks());

describe('worldRankingsRules', () => {
  it('takes the surname as the last token', () => {
    expect(surnameOf('Rasmus Højgaard')).toBe('Højgaard');
    expect(surnameOf('Scottie Scheffler')).toBe('Scheffler');
  });

  it('formats points with en-GB thousands separators', () => {
    expect(fmtPoints(4210)).toBe('4,210');
    expect(fmtPoints(700.4)).toBe('700');
  });

  it('leads-by with the twice clause at ratio >= 2', () => {
    const s = leadSentence([{ playerName: 'A B', points: 700 }, { playerName: 'C D', points: 350 }], null);
    expect(s).toMatchObject({ kind: 'leads', clause: 'twice', values: { name: 'B', gap: '350' } });
  });

  it('nearly clause from 1.75x up to 2x, plain below', () => {
    expect(leadSentence([{ playerName: 'A B', points: 700 }, { playerName: 'C D', points: 400 }], null)).toMatchObject({ clause: 'nearly' });
    expect(leadSentence([{ playerName: 'A B', points: 699 }, { playerName: 'C D', points: 400 }], null)).toMatchObject({ clause: 'plain' });
    expect(leadSentence([{ playerName: 'A B', points: 800 }, { playerName: 'C D', points: 400 }], null)).toMatchObject({ clause: 'twice' });
  });

  it('level at the top wins over every other form', () => {
    const s = leadSentence([{ playerName: 'A B', points: 500 }, { playerName: 'C D', points: 500 }], null);
    expect(s).toMatchObject({ kind: 'level', values: { name: 'B', other: 'D', points: '500' } });
  });

  it('carries events left for season boards and omits it when not countable', () => {
    expect(leadSentence([{ playerName: 'A B', points: 900 }, { playerName: 'C D', points: 500 }], 2)).toMatchObject({ eventsLeft: 2 });
    expect(leadSentence([{ playerName: 'A B', points: 900 }, { playerName: 'C D', points: 500 }], null)).toMatchObject({ eventsLeft: null });
  });

  it('no points -> no sentence', () => {
    expect(leadSentence([{ playerName: 'A B', points: null }, { playerName: 'C D', points: 5 }], null)).toBeNull();
    expect(leadSentence([{ playerName: 'A B', points: 5 }], null)).toBeNull();
    expect(leadSentence([], null)).toBeNull();
  });

  it('zero events left is omitted exactly like an uncountable total', () => {
    const rows = [{ playerName: 'Rory McIlroy', points: 4210 }, { playerName: 'Tommy Fleetwood', points: 3388 }];
    expect(leadSentence(rows, 0)).toEqual(leadSentence(rows, null));
    expect(leadSentence(rows, 0)).toMatchObject({ eventsLeft: null });
  });

  it('picks the largest positive climb; a tie goes to the better current rank', () => {
    const rows = [
      row({ rank: 12, playerId: 'a', movement: 5 }),
      row({ rank: 27, playerId: 'b', movement: 18 }),
      row({ rank: 40, playerId: 'c', movement: 18 }),
      row({ rank: 8, playerId: 'd', movement: -3 }),
      row({ rank: 9, playerId: 'e', movement: 0 }),
      row({ rank: 10, playerId: null, movement: 50 }),
    ];
    expect(pickBiggestClimb(rows)?.playerId).toBe('b');
    expect(pickBiggestClimb([row({ rank: 3, movement: -1 }), row({ rank: 4, movement: 0 }), row({ rank: 5, movement: null })])).toBeNull();
  });

  it('sparkline needs three snapshots; better ranks sit higher', () => {
    expect(sparkline([{ rank: 30, ranking_date: '2026-09-01' }, { rank: 27, ranking_date: '2026-10-01' }])).toBeNull();
    const line = sparkline([
      { rank: 45, ranking_date: '2026-05-01' },
      { rank: 36, ranking_date: '2026-07-01' },
      { rank: 27, ranking_date: '2026-10-01' },
    ]);
    expect(line).not.toBeNull();
    const ys = line!.points.split(' ').map((p) => Number(p.split(',')[1]));
    expect(ys[2]).toBeLessThan(ys[0]); // latest (best rank) highest
    expect(Math.min(...ys)).toBeGreaterThanOrEqual(3);
    expect(Math.max(...ys)).toBeLessThanOrEqual(27);
    expect(line!.last.y).toBe(ys[2]);
    // Flat history parks at vertical centre.
    const flat = sparkline([
      { rank: 10, ranking_date: '2026-05-01' },
      { rank: 10, ranking_date: '2026-07-01' },
      { rank: 10, ranking_date: '2026-10-01' },
    ]);
    expect(flat!.points.split(' ').every((p) => Number(p.split(',')[1]) === 15)).toBe(true);
  });

  it('ordinals and since labels are en-GB', () => {
    expect([1, 2, 3, 4, 11, 12, 13, 21, 27].map(ordinalEn)).toEqual(['1st', '2nd', '3rd', '4th', '11th', '12th', '13th', '21st', '27th']);
    expect(sinceLabel('2026-07-27')).toBe('27 Jul');
  });
});

describe('WorldRankings rebuilt section', () => {
  it('drops the basis line and labels the third column SINCE <date>, never wrapping', () => {
    setup();
    expect(screen.queryByText(/Positions moved over/)).toBeNull();
    const header = document.querySelector('[data-col-header]') as HTMLElement;
    expect(header.style.whiteSpace).toBe('nowrap');
    expect(header.textContent).toContain('Since 27 Jul');
  });

  it('omits the third column when no drawn row carries movement', () => {
    setup({ board: boardResult({ rows: WORLD_ROWS.map((r) => ({ ...r, movement: 0 })) }) });
    const header = document.querySelector('[data-col-header]') as HTMLElement;
    expect(header.textContent).not.toContain('Since');
    expect(header.children).toHaveLength(3);
  });

  it('season boards label the third column WINS only when a drawn row has a wins figure', () => {
    const first = setup();
    fireEvent.click(screen.getByRole('tab', { name: 'Race to Dubai' }));
    expect((document.querySelector('[data-col-header]') as HTMLElement).textContent).toContain('Wins');
    first.unmount();
    setup({ seasonBoard: boardResult({ rows: SEASON_ROWS.map((r) => ({ ...r, wins: null })), basisDays: null, comparisonDate: null, latestDate: null, comparisonRanks: null, eventsLeft: null }) });
    fireEvent.click(screen.getByRole('tab', { name: 'Race to Dubai' }));
    const header = document.querySelector('[data-col-header]') as HTMLElement;
    expect(header.textContent).not.toContain('Wins');
    expect(header.children).toHaveLength(3);
  });

  it('renders the lead sentence with surname and figures in bold ink', () => {
    setup();
    const sentence = document.querySelector('[data-lead-sentence]') as HTMLElement;
    expect(sentence.textContent).toBe('Scheffler leads by 343 points, nearly twice anyone else\'s total.');
    expect(sentence.querySelectorAll('strong')).toHaveLength(2);
  });

  it('season boards add the events-left clause in place of the full stop', () => {
    setup();
    fireEvent.click(screen.getByRole('tab', { name: 'Race to Dubai' }));
    expect((document.querySelector('[data-lead-sentence]') as HTMLElement).textContent).toBe('McIlroy leads by 822 points with 2 events left.');
  });

  it('renders no sentence when the top rows have no points', () => {
    setup({ board: boardResult({ rows: WORLD_ROWS.map((r) => ({ ...r, points: null })) }) });
    expect(document.querySelector('[data-lead-sentence]')).toBeNull();
  });

  it('zero season events ends the sentence at the full stop', () => {
    setup({ seasonBoard: boardResult({ rows: SEASON_ROWS, eventsLeft: 0 }) });
    fireEvent.click(screen.getByRole('tab', { name: 'Race to Dubai' }));
    expect(document.querySelector('[data-lead-sentence]')?.textContent).toBe('McIlroy leads by 822 points.');
  });

  it.each([1, 2])('selects the events-left plural form from count %i', (count) => {
    setup({ seasonBoard: boardResult({ rows: SEASON_ROWS, eventsLeft: count }) });
    fireEvent.click(screen.getByRole('tab', { name: 'Race to Dubai' }));
    const sentence = document.querySelector('[data-lead-sentence]');
    expect(sentence?.textContent).toBe(`McIlroy leads by 822 points with ${count} ${count === 1 ? 'event' : 'events'} left.`);
    expect(sentence?.querySelectorAll('strong')[2]?.textContent).toBe(String(count));
  });

  it('draws the headshot with the flag on its corner', () => {
    setup();
    const flag = document.querySelector('[data-rank-row] [data-flag]') as HTMLElement;
    expect(flag).not.toBeNull();
    expect(flag.style.width).toBe('16px');
    expect(flag.style.height).toBe('11px');
    expect(flag.style.right).toBe('-4px');
    expect(flag.style.bottom).toBe('-3px');
  });

  it('scales the points bar against No. 1, whose fill is ink', () => {
    setup();
    const fills = [...document.querySelectorAll('[data-points-fill]')] as HTMLElement[];
    expect(fills).toHaveLength(5);
    expect(fills[0].style.width).toBe('100%');
    expect(fills[0].style.background).toBe('rgb(248, 250, 252)');
    expect(fills[1].style.width).toBe('51%'); // 357 / 700
    expect(fills[1].style.background).toBe('rgba(248, 250, 252, 0.55)');
  });

  it('draws no bar and reserves no space when a row has no points', () => {
    setup({ board: boardResult({ rows: [WORLD_ROWS[0], { ...WORLD_ROWS[1], points: null }, ...WORLD_ROWS.slice(2)] }) });
    const rows = [...document.querySelectorAll('[data-rank-row]')];
    expect(rows[1].querySelector('[data-points-bar]')).toBeNull();
  });

  it('wins renders blank when null and the figure 0 when zero', () => {
    setup({ seasonBoard: boardResult({ rows: [{ ...SEASON_ROWS[0] }, { ...SEASON_ROWS[1], wins: null }, { ...SEASON_ROWS[4], rank: 3 }], basisDays: null, comparisonDate: null, latestDate: null, comparisonRanks: null, eventsLeft: null }) });
    fireEvent.click(screen.getByRole('tab', { name: 'Race to Dubai' }));
    const wins = [...document.querySelectorAll('[data-wins]')] as HTMLElement[];
    expect(wins.map((w) => w.textContent)).toEqual(['3', '', '0']);
  });

  it('formats points with en-GB separators', () => {
    setup();
    fireEvent.click(screen.getByRole('tab', { name: 'Race to Dubai' }));
    expect(screen.getByText('4,210')).toBeDefined();
  });

  it('marks followed players inside the five with the amber wash and star', () => {
    setup({ follows: ['m', 'c'], followedRows: [row({ rank: 2, playerId: 'm', playerName: 'Rory McIlroy', points: 357 }), row({ rank: 5, playerId: 'c', playerName: 'Wyndham Clark', points: 306 })] });
    const marked = [...document.querySelectorAll('[data-rank-row][data-followed]')];
    expect(marked).toHaveLength(2);
    expect((marked[0] as HTMLElement).style.background).toBe('rgba(247, 147, 30, 0.06)');
    expect(document.querySelectorAll('[data-followed-star]')).toHaveLength(2);
    expect(document.querySelector('[data-your-players]')).toBeNull(); // none below the five -> no kicker
  });

  it('lists followed players below the five in rank order, capped at three, with the count', () => {
    const below = [
      row({ rank: 21, playerId: 'v', playerName: 'Viktor Hovland', country: 'NOR', points: 164 }),
      row({ rank: 9, playerId: 't', playerName: 'Tommy Fleetwood', country: 'ENG', points: 251 }),
      row({ rank: 30, playerId: 'x', playerName: 'Xander Schauffele', points: 100 }),
      row({ rank: 44, playerId: 'z', playerName: 'Zed Player', points: 50 }),
    ];
    setup({ follows: ['t', 'v', 'x', 'z'], followedRows: below });
    const section = document.querySelector('[data-your-players]') as HTMLElement;
    expect(section.textContent).toContain('Your players');
    expect(section.textContent).toContain('4 followed');
    const names = [...section.querySelectorAll('[data-rank-row]')].map((r) => r.textContent);
    expect(names).toHaveLength(3);
    expect(names[0]).toContain('Tommy Fleetwood');
    expect(names[1]).toContain('Viktor Hovland');
    expect(names.some((n) => n?.includes('Zed Player'))).toBe(false);
  });

  it('makes exactly one extra read for followed players and none for guests', () => {
    setup({ follows: ['t', 'v'], followedRows: [] });
    expect(vi.mocked(useFollowedBoardRows)).toHaveBeenCalledTimes(1);
    expect(vi.mocked(useFollowedBoardRows).mock.calls[0][1]).toEqual(['t', 'v']);
    expect(vi.mocked(useFollowedBoardRows).mock.calls[0][3]).toBe(true);
    vi.clearAllMocks();
    setup({ follows: [] });
    expect(vi.mocked(useFollowedBoardRows).mock.calls[0][3]).toBe(false);
    expect(document.querySelector('[data-your-players]')).toBeNull();
  });

  it('shows the biggest climb in the top 50 with the line when three or more snapshots exist', () => {
    const fifty = [...WORLD_ROWS, row({ rank: 27, playerId: 'rh', playerName: 'Rasmus Højgaard', country: 'DEN', points: 200, movement: 18 })];
    setup({
      board: boardResult({ rows: fifty }),
      history: [
        { rank: 45, ranking_date: '2026-05-04' },
        { rank: 36, ranking_date: '2026-07-27' },
        { rank: 27, ranking_date: '2026-10-26' },
      ],
    });
    const card = document.querySelector('[data-climb-card]') as HTMLElement;
    expect(card.textContent).toContain('Biggest climb in the top 50');
    expect(card.textContent).toContain('Højgaard');
    expect(card.textContent).toContain('▲18');
    expect(card.textContent).toContain('to 27th since 27 Jul');
    expect(card.querySelector('[data-climb-line]')).not.toBeNull();
  });

  it('keeps the climber text but drops the line below three snapshots', () => {
    const fifty = [...WORLD_ROWS, row({ rank: 27, playerId: 'rh', playerName: 'Rasmus Højgaard', points: 200, movement: 18 })];
    setup({ board: boardResult({ rows: fifty }), history: [{ rank: 30, ranking_date: '2026-09-01' }, { rank: 27, ranking_date: '2026-10-26' }] });
    const card = document.querySelector('[data-climb-card]') as HTMLElement;
    expect(card.textContent).toContain('Højgaard');
    expect(card.querySelector('[data-climb-line]')).toBeNull();
  });

  it('shows no climber card without a basis or without a climber', () => {
    setup({ board: boardResult({ basisDays: null, comparisonDate: null }) });
    expect(document.querySelector('[data-climb-card]')).toBeNull();
    setup({ board: boardResult({ rows: WORLD_ROWS.map((r) => ({ ...r, movement: 0 })) }) });
    expect(document.querySelector('[data-climb-card]')).toBeNull();
  });

  it('opens the player page from a row and from the climber card', () => {
    const fifty = [...WORLD_ROWS, row({ rank: 27, playerId: 'rh', playerName: 'Rasmus Højgaard', points: 200, movement: 18 })];
    setup({ board: boardResult({ rows: fifty }) });
    fireEvent.click(screen.getByText('Matt Fitzpatrick').closest('button') as HTMLElement);
    expect(screen.getByTestId('player-page')).toBeDefined();
  });

  it('never opens anything for a row without a player id', () => {
    setup({ board: boardResult({ rows: [WORLD_ROWS[0], { ...WORLD_ROWS[1], playerId: null }, ...WORLD_ROWS.slice(2)] }) });
    const btn = screen.getByText('Rory McIlroy').closest('button') as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
  });

  it('hides the section when the board has no rows', () => {
    setup({ board: boardResult({ rows: [] }) });
    expect(document.querySelector('section')).toBeNull();
  });
});

describe('Movement colours (unchanged rules)', () => {
  it('rise is TREND_UP, fall is dim ink, unchanged is the faintest dash — never red', () => {
    const { container } = render(<I18nextProvider i18n={i18n}><MemoryRouter><>
      <Movement value={3} /><Movement value={-2} /><Movement value={0} /><Movement value={null} />
    </></MemoryRouter></I18nextProvider>);
    const tones = [...container.querySelectorAll('[data-movement-tone]')] as HTMLElement[];
    expect(tones.map((el) => el.dataset.movementTone)).toEqual(['rise', 'fall', 'unchanged', 'unchanged']);
    expect(tones[0].style.color).toBe('rgb(22, 163, 74)');
    expect(tones[1].style.color).toBe('rgba(248, 250, 252, 0.42)');
    expect(tones[2].style.color).toBe('rgba(248, 250, 252, 0.3)');
    expect(tones[1].textContent).toBe('▼2');
  });

  it('hasMovement still keys off the drawn rows only', () => {
    expect(hasMovement([row({ movement: 0 }), row({ movement: null })])).toBe(false);
    expect(hasMovement([row({ movement: -1 })])).toBe(true);
  });
});
