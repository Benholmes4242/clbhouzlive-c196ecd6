import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { BoardEntry } from '@/features/tourhub/leaderboard/BoardTable';
import type { TournamentMeta } from '@/features/tourhub/leaderboard/useTournamentMeta';
import { selectTournamentContest } from '@/features/tourhub/tournament-v2/data/tournamentContest';
import { ContestSection } from '@/features/tourhub/tournament-v2/sections/ContestSection';
import { HeroSection } from '@/features/tourhub/tournament-v2/sections/HeroSection';
import { MoveSection } from '@/features/tourhub/tournament-v2/sections/MoveSection';

const copy: Record<string, string> = {
  'status.live': 'LIVE',
  'status.results': 'RESULTS',
  'status.upcoming': 'UPCOMING',
  'overview.hero.factRound': 'ROUND',
  'tour.par': 'PAR',
  'tournament.hero.fieldLabel': 'FIELD',
  'tournament.hero.purseLabel': 'PURSE',
  'tournament.hero.verdict.liveContest': '{{leader}} leads by {{margin}} — and {{count}} players are inside four shots with {{holes}} to play.',
  'tournament.hero.verdict.liveShared': '{{count}} players share the lead with {{holes}} to play.',
  'tournament.hero.verdict.liveClear': '{{leader}} leads by {{margin}}.',
  'tournament.hero.verdict.liveScore': '{{leader}} leads on {{score}}.',
  'tournament.contest.liveEyebrow': 'The contest',
  'tournament.contest.completedEyebrow': 'The margin',
  'tournament.contest.sharedLead': '{{count}} share the lead',
  'tournament.contest.playoff': 'Won a playoff',
  'tournament.contest.finishedLevel': 'Finished level',
  'tournament.contest.withToPlay': 'With {{holes}} to play',
  'tournament.contest.shotsClear': 'Shots clear',
  'tournament.contest.gapShots_one': 'a shot',
  'tournament.contest.gapShots_other': '{{count}} shots',
  'tournament.contest.sublineSingle': '{{leader}} from {{next}}.',
  'tournament.contest.sublineSingleThird': '{{leader}} from {{next}}, with {{third}} {{gap}} further back.',
  'tournament.contest.sublineLevelTwoChaser': '{{a}} and {{b}}, level at {{score}}, with {{next}} {{gap}} back.',
  'tournament.contest.sublineLevelThreeChaser': '{{a}}, {{b}} and {{c}}, level at {{score}}, with {{next}} {{gap}} back.',
  'tournament.contest.sublineLevelMany': '{{a}}, {{b}} and {{count}} others, level at {{score}}.',
  'tournament.contest.sublineLevelManyChaser': '{{a}}, {{b}} and {{count}} others, level at {{score}}, with {{next}} {{gap}} back.',
  'tournament.contest.sublineLevelThree': '{{a}}, {{b}} and {{c}}, level at {{score}}.',
  'tournament.contest.sublineLevelTwo': '{{a}} and {{b}}, level at {{score}}.',
  'tournament.contest.sublineLevelTwoPast': '{{a}} and {{b}} were level at {{score}}.',
  'tournament.contest.sublinePlayoffTwo': '{{a}} beat {{b}} after both finished on {{score}}.',
  'tournament.contest.leader': 'Leader',
  'tournament.contest.back': '{{gap}} back',
  'tournament.contest.allLevel': 'All level',
  'tournament.contest.packAria': 'The pack by shots behind',
  'tournament.move.liveEyebrow': 'The move',
};

vi.mock('react-i18next', () => ({
  initReactI18next: { type: '3rdParty', init: () => {} },
  useTranslation: () => ({
    t: (key: string, options: Record<string, unknown> = {}) => {
      const plural = typeof options.count === 'number'
        ? copy[`${key}_${options.count === 1 ? 'one' : 'other'}`]
        : undefined;
      let value = copy[key] ?? plural ?? key;
      for (const [name, replacement] of Object.entries(options)) {
        if (name !== 'defaultValue') value = value.split(`{{${name}}}`).join(String(replacement));
      }
      return value;
    },
    i18n: { language: 'en' },
  }),
}));

vi.mock('@/features/tourhub/hooks/useTournamentDefendingChamp', () => ({
  useTournamentDefendingChamp: () => ({ data: null }),
}));

vi.mock('@/features/tourhub/components/PlayerAvatar', () => ({
  PlayerAvatar: () => <div data-testid="avatar" />,
}));

afterEach(cleanup);

const meta = {
  id: 'tournament-1',
  name: 'Test Championship',
  venue_name: 'Test Club',
  venue_city: 'Test Town',
  venue_country: 'USA',
  venue_par: 71,
  purse: 5_000_000,
  current_round: 4,
  current_round_status: 'inprogress',
  tour_full_name: 'PGA Tour',
  winner_id: null,
} as TournamentMeta;

const row = (id: string, score: number, position: number, today = -1, thru = 12, positionTied = false): BoardEntry => ({
  id,
  score,
  position,
  position_tied: positionTied,
  today,
  thru,
  player: { id, sr_id: `sr-${id}`, full_name: id },
});

const teamRow = (id: string, score: number, position: number, abbrName: string, displayName: string, members: string[]): BoardEntry => ({
  id,
  score,
  position,
  position_tied: false,
  today: null,
  thru: 18,
  player: null,
  team: {
    id: `team-${id}`,
    abbr_name: abbrName,
    display_name: displayName,
    members: members.map((fullName, index) => ({ position_in_team: index + 1, player: { id: `${id}-${index}`, full_name: fullName } })),
  },
});

describe('tournament contest sections', () => {
  it('counts four chasers, not the leader plus four chasers', () => {
    const contest = selectTournamentContest([
      row('Castillo', -12, 1),
      row('Shipley', -11, 2),
      row('James', -10, 3),
      row('Bridgeman', -9, 4),
      row('Greyserman', -8, 5),
      row('Outside', -7, 6),
    ], meta, 'live');

    render(<HeroSection meta={meta} state="live" imageUrl={null} tourCode="pga" contest={contest} fieldCount={6} />);

    expect(contest.chasersWithinFour).toBe(4);
    expect(screen.getByText('Castillo leads by 1 — and 4 players are inside four shots with 6 to play.')).toBeInTheDocument();
  });

  it('renders the shared-lead word form and an all-level pack without a zero-division artefact', () => {
    const board = Array.from({ length: 5 }, (_, index) => row(`Leader ${index + 1}`, -10, 1, -2));
    const contest = selectTournamentContest(board, meta, 'live');

    render(
      <>
        <HeroSection meta={meta} state="live" imageUrl={null} tourCode="pga" contest={contest} fieldCount={5} />
        <ContestSection contest={contest} state="live" />
      </>,
    );

    expect(screen.getByText('5 players share the lead with 6 to play.')).toBeInTheDocument();
    expect(screen.getByText('5 share the lead')).toBeInTheDocument();
    expect(screen.getByText('All level')).toBeInTheDocument();
    expect(screen.queryByText(/NaN/)).not.toBeInTheDocument();
  });

  it('hides the move when the leader is also the biggest mover', () => {
    const contest = selectTournamentContest([
      row('Leader', -12, 1, -7),
      row('Second', -10, 2, -4),
    ], meta, 'live');

    const { container } = render(<MoveSection contest={contest} state="live" tourCode="pga" />);

    expect(contest.mover).toBeNull();
    expect(container).toBeEmptyDOMElement();
  });

  it('does not use the contest verdict for one chaser inside four shots', () => {
    const contest = selectTournamentContest([
      row('Leader', -12, 1),
      row('Only chaser', -11, 2),
      row('Outside', -7, 3),
    ], meta, 'live');

    render(<HeroSection meta={meta} state="live" imageUrl={null} tourCode="pga" contest={contest} fieldCount={3} />);

    expect(contest.chasersWithinFour).toBe(1);
    expect(screen.getByText('Leader leads on -12.')).toBeInTheDocument();
    expect(screen.queryByText(/inside four shots/)).not.toBeInTheDocument();
  });

  it('names players and gaps, never an ordinal word, with a single leader and two chasers', () => {
    const contest = selectTournamentContest([
      row('Castillo', -12, 1),
      row('Shipley', -11, 2),
      row('James', -9, 3),
    ], meta, 'live');

    render(<ContestSection contest={contest} state="live" />);

    expect(screen.getByText('Castillo from Shipley, with James 2 shots further back.')).toBeInTheDocument();
    expect(screen.queryByText(/second|third|runner/i)).not.toBeInTheDocument();
  });

  it('uses the "and n others" form for a four-way tie', () => {
    const contest = selectTournamentContest([
      row('A', -12, 1),
      row('B', -12, 1),
      row('C', -12, 1),
      row('D', -12, 1),
      row('E', -11, 5),
    ], meta, 'live');

    render(<ContestSection contest={contest} state="live" />);

    expect(screen.getByText('A, B and 2 others, level at -12, with E a shot back.')).toBeInTheDocument();
    expect(screen.queryByText(/second/i)).not.toBeInTheDocument();
  });

  it('states a decided completed playoff without a stale holes caption', () => {
    const contest = selectTournamentContest([
      row('Rory Sabbatini', -12, 1, -3, 13, true),
      row('Zach Johnson', -12, 1, -4, 13, true),
      row('Ryan Armour', -10, 3, -2, 13),
      row('Steven Alker', -10, 3, -1, 13),
      row('Henrik Stenson', -10, 3, -1, 13),
    ], { ...meta, winner_id: 'sr-Zach Johnson' }, 'completed');

    render(<ContestSection contest={contest} state="completed" />);

    expect(screen.getByText('Won a playoff')).toBeInTheDocument();
    expect(screen.getByText('Zach Johnson beat Rory Sabbatini after both finished on -12.')).toBeInTheDocument();
    expect(screen.queryByText(/to play/i)).not.toBeInTheDocument();
  });

  it('keeps an unresolved completed tie on the finished-level path', () => {
    const contest = selectTournamentContest([
      row('A', -12, 1, -4, 13, true),
      row('B', -12, 1, -3, 13, true),
    ], meta, 'completed');

    render(<ContestSection contest={contest} state="completed" />);

    expect(screen.getByText('Finished level')).toBeInTheDocument();
    expect(screen.getByText('A and B were level at -12.')).toBeInTheDocument();
    expect(screen.queryByText(/to play/i)).not.toBeInTheDocument();
  });

  it('keeps a completed non-playoff event in the margin figure branch', () => {
    const contest = selectTournamentContest([
      row('Winner', -12, 1, -4, 18),
      row('Runner', -10, 2, -3, 18),
    ], meta, 'completed');

    render(<ContestSection contest={contest} state="completed" />);

    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('Shots clear')).toBeInTheDocument();
    expect(screen.queryByText('Won a playoff')).not.toBeInTheDocument();
  });

  it('renders team prose in the contest and suppresses the empty move section', () => {
    const teamMeta = { ...meta, event_type: 'team' } as TournamentMeta;
    const contest = selectTournamentContest([
      teamRow('leaders', -18, 1, 'Kim / Wilson', 'G.Kim/Y.Wilson', ['Gina Kim', 'Yana Wilson']),
      teamRow('chasers', -17, 2, 'Kim / Choi', 'H.J.Kim/H.J.Choi', ['Hyo Joo Kim', 'Hye Jin Choi']),
    ], teamMeta, 'live');

    const { container } = render(
      <>
        <HeroSection meta={teamMeta} state="live" imageUrl={null} tourCode="lpga" contest={contest} fieldCount={2} />
        <ContestSection contest={contest} state="live" />
        <div data-testid="move"><MoveSection contest={contest} state="live" tourCode="lpga" /></div>
      </>,
    );

    expect(screen.getByText('Gina Kim and Yana Wilson leads on -18.')).toBeInTheDocument();
    expect(screen.getByText('Gina Kim and Yana Wilson from Hyo Joo Kim and Hye Jin Choi.')).toBeInTheDocument();
    expect(screen.getByTestId('move')).toBeEmptyDOMElement();
    expect(container.textContent).not.toContain('undefined');
  });
});
