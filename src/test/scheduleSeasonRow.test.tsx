import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { SeasonRow } from '@/features/tourhub/schedule-v2/SeasonRow';
import type { SeasonEvent } from '@/features/tourhub/schedule-v2/useSeasonTimeline';

vi.mock('react-i18next', async (importOriginal) => ({
  ...(await importOriginal<typeof import('react-i18next')>()),
  useTranslation: () => ({
    t: (key: string, values?: { count?: number }) => ({
      'schedule.badge.champion': 'CHAMPION',
      'schedule.badge.defends': 'DEFENDS',
      'schedule.badge.major': 'MAJOR',
      'schedule.badge.playoffs': 'PLAYOFFS',
      'schedule.leader.tied': `${values?.count ?? 0} tied`,
      'status.live': 'Live',
    }[key] ?? key),
  }),
}));

afterEach(cleanup);

function event(overrides: Partial<SeasonEvent> = {}): SeasonEvent {
  return {
    id: 'event-1',
    tourSlug: 'pgad',
    name: 'Simmons Bank Open for the Snedeker Foundation',
    venueName: 'Trump International Golf Links (Ireland)',
    venueCity: 'Clare',
    venueCountry: 'IRL',
    purse: 6_000_000,
    startDate: '2026-09-10',
    endDate: '2026-09-13',
    status: 'closed',
    state: 'completed',
    isMajor: false,
    isPlayoff: false,
    isThisWeek: false,
    daysAway: null,
    contextLabel: '',
    eventNumber: 1,
    champion: {
      playerId: null,
      name: 'Angel Ortiz',
      displayName: 'A. Ortiz',
      photoUrl: null,
      tourCode: 'pgad',
      scoreText: '−26',
      score: -26,
    },
    ...overrides,
  };
}

describe('SeasonRow overview grammar', () => {
  it('renders the completed kicker and one score/name figure stack without avatars', () => {
    const { container } = render(<SeasonRow event={event()} onSelect={() => {}} />);
    expect(screen.getByText(/Korn Ferry · 10 Sep/i)).toBeInTheDocument();
    expect(screen.getByText(/CHAMPION/)).toBeInTheDocument();
    expect(screen.getByText('−26')).toBeInTheDocument();
    expect(screen.getByText('A. Ortiz')).toBeInTheDocument();
    expect(container.querySelector('img')).toBeNull();
    expect(screen.getByRole('button').style.gridTemplateColumns).toBe('minmax(0,1fr) auto');
  });

  it('never renders the purse and still ellipsises the venue line', () => {
    const { container } = render(<SeasonRow event={event()} onSelect={() => {}} />);
    expect(screen.queryByText('$6M')).toBeNull();
    expect(screen.queryByText('6,000,000')).toBeNull();
    expect(container.textContent).not.toContain('$');
    expect(screen.getByText('Trump International Golf Links (Ireland) · Clare').style.textOverflow).toBe('ellipsis');
  });

  it('renders no meta line for an event with no live marker and no venue', () => {
    const { container } = render(
      <SeasonRow
        event={event({ venueName: null, venueCity: null, status: 'closed', state: 'completed' })}
        onSelect={() => {}}
      />,
    );
    expect(screen.queryByText(/CHAMPION/)).toBeInTheDocument();
    const spans = container.querySelectorAll('button > span > span');
    // Kicker, name, and nothing else — no empty meta row.
    expect(spans.length).toBe(2);
  });

  it('keeps only Live green and renders a tied leader in the figure stack', () => {
    render(<SeasonRow event={event({
      name: "Nationwide Children's Hospital Championship",
      state: 'live',
      status: 'inprogress',
      champion: null,
      leader: {
        playerId: null,
        name: 'Shared lead',
        displayName: 'Shared lead',
        photoUrl: null,
        tourCode: 'pgad',
        totalText: '−9',
        score: -9,
        tiedCount: 3,
      },
    })} onSelect={() => {}} />);
    const live = screen.getByText('Live');
    expect(live.style.color).toBe('rgb(22, 163, 74)');
    expect(live.parentElement?.textContent).toContain('Trump International Golf Links (Ireland) · Clare');
    expect(live.parentElement?.style.color).toBe('');
    expect(screen.getByText('3 tied')).toBeInTheDocument();
  });

  it('uses a defender stack or collapses the right column when no defender exists', () => {
    const upcoming = event({ state: 'upcoming', status: 'scheduled', champion: null, defendingChampion: { name: 'S. Lowry', photoUrl: null } });
    const withDefender = render(<SeasonRow event={upcoming} onSelect={() => {}} />);
    expect(screen.getByText('DEFENDS')).toBeInTheDocument();
    expect(screen.getByText('S. Lowry')).toBeInTheDocument();
    withDefender.unmount();

    render(<SeasonRow event={event({ name: 'Solheim Cup', state: 'upcoming', status: 'scheduled', champion: null, defendingChampion: null, purse: null })} onSelect={() => {}} />);
    expect(screen.getByRole('button').style.gridTemplateColumns).toBe('minmax(0,1fr)');
    expect(screen.queryByText('DEFENDS')).toBeNull();
  });
});