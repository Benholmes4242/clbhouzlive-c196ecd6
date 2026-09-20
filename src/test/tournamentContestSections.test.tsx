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
  'tournament.contest.withToPlay': 'With {{holes}} to play',
  'tournament.contest.sublineSecondThird': '{{second}} is second, with {{third}} next.',
  'tournament.contest.sublineSecond': '{{second}} is second.',
  'tournament.contest.leader': 'Leader',
  'tournament.contest.back': '{{gap}} back',
  'tournament.contest.allLevel': 'All level',
  'tournament.contest.packAria': 'The pack by shots behind',
  'tournament.move.liveEyebrow': 'The move',
};

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options: Record<string, unknown> = {}) => {
      let value = copy[key] ?? key;
      for (const [name, replacement] of Object.entries(options)) {
        if (name !== 'defaultValue') value = value.replaceAll(`{{${name}}}`, String(replacement));
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
} as TournamentMeta;

const row = (id: string, score: number, position: number, today = -1, thru = 12): BoardEntry => ({
  id,
  score,
  position,
  today,
  thru,
  player: { id, full_name: id },
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
});
