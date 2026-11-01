import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { SeasonRow } from '@/features/tourhub/schedule-v2/SeasonRow';
import type { SeasonEvent } from '@/features/tourhub/schedule-v2/useSeasonTimeline';

vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));

afterEach(cleanup);

const INK = 'rgb(248, 250, 252)';
const AMBER = 'rgb(247, 147, 30)';
const LIVE_GREEN = 'rgb(61, 220, 151)';
const INK_FAINT = 'rgba(248, 250, 252, 0.42)';

function event(overrides: Partial<SeasonEvent> = {}): SeasonEvent {
  return {
    id: 'event-1',
    tourSlug: 'pgad',
    name: 'Simmons Bank Open for the Snedeker Foundation',
    venueName: 'Trump International Golf Links (Ireland)',
    venueCity: 'Clare',
    venueCountry: 'IRL',
    purse: 6_000_000,
    eventType: null,
    golfCourseId: null,
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
      playerId: 'p-ortiz',
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

/** The right column is the third grid cell of the row button. */
function rightColumn(container: HTMLElement): HTMLElement {
  const button = container.querySelector('button')!;
  return button.children[2] as HTMLElement;
}

describe('SeasonRow rebuilt grammar', () => {
  it('renders the date block, kicker, two-line name, venue and date span in the signed-off grid', () => {
    const { container } = render(<SeasonRow event={event()} onSelect={() => {}} />);
    const button = screen.getByRole('button');
    expect(button.style.gridTemplateColumns).toBe('40px minmax(0,1fr) 104px');
    expect(button.style.padding).toBe('14px 24px');
    // Date block: two-digit day over the weekday.
    const dateBlock = button.children[0] as HTMLElement;
    expect(dateBlock.textContent).toBe('10THU');
    expect((dateBlock.children[0] as HTMLElement).style.fontSize).toBe('20px');
    expect((dateBlock.children[1] as HTMLElement).style.letterSpacing).toBe('0.12em');
    // Middle: tour label, name, venue, dates.
    expect(screen.getByText('Korn Ferry')).toBeInTheDocument();
    const name = screen.getByText('Simmons Bank Open for the Snedeker Foundation');
    expect(name.style.fontSize).toBe('15px');
    expect(name.style.webkitLineClamp).toBe('2');
    const venue = screen.getByText('Trump International Golf Links (Ireland) · Clare');
    expect(venue.style.textOverflow).toBe('ellipsis');
    expect(screen.getByText('Thu 10 – Sun 13 Sep')).toBeInTheDocument();
  });

  it('completed: WON stack with headshot, surname and score coloured by getScoreColor', () => {
    const { container } = render(<SeasonRow event={event())} onSelect={() => {}} />);
    const rc = rightColumn(container);
    const label = rc.querySelector('span') as HTMLElement;
    expect(label.style.letterSpacing).toBe('0.12em');
    expect(label.style.color).toBe(INK_FAINT);
    expect(rc.textContent).toContain('Ortiz');
    const score = rc.children[2] as HTMLElement;
    expect(score.textContent).toBe('−26');
    expect(score.style.fontSize).toBe('16px');
    expect(score.style.color).toBe('rgb(226, 75, 63)'); // TOPAR_UNDER_DARK
  });

  it('upcoming with a defending champion: DEFENDS stack plus the short purse', () => {
    const { container } = render(
      <SeasonRow
        event={event({
          state: 'upcoming',
          status: 'scheduled',
          champion: null,
          purse: 3_250_000,
          defendingChampion: { name: 'Shane Lowry', photoUrl: null },
        })}
        onSelect={() => {}}
      />,
    );
    const rc = rightColumn(container);
    expect(rc.textContent).toContain('Lowry');
    expect(rc.textContent).toContain('$3.25m');
  });

  it('upcoming without a defender shows the purse alone; neither known shows nothing', () => {
    const { container, unmount } = render(
      <SeasonRow
        event={event({ state: 'upcoming', status: 'scheduled', champion: null, defendingChampion: null, purse: 9_000_000 })}
        onSelect={() => {}}
      />,
    );
    expect(rightColumn(container).textContent).toBe('$9m');
    unmount();

    const { container: empty } = render(
      <SeasonRow
        event={event({ state: 'upcoming', status: 'scheduled', champion: null, defendingChampion: null, purse: null })}
        onSelect={() => {}}
      />,
    );
    expect(rightColumn(empty).textContent).toBe('');
  });

  it('live outright leader: green label with the live dot, surname and score', () => {
    const { container } = render(
      <SeasonRow
        event={event({
          state: 'live',
          status: 'inprogress',
          champion: null,
          leader: {
            playerId: 'p-fleet',
            name: 'Tommy Fleetwood',
            displayName: 'T. Fleetwood',
            photoUrl: null,
            tourCode: 'pga',
            totalText: '−15',
            score: -15,
            tiedCount: 1,
            currentRound: 3,
          },
        })}
        onSelect={() => {}}
      />,
    );
    const rc = rightColumn(container);
    const label = rc.querySelector('span') as HTMLElement;
    expect(label.style.color).toBe(LIVE_GREEN);
    const dot = label.querySelector('span') as HTMLElement;
    expect(dot.style.borderRadius).toBe('50%');
    expect(dot.style.background).toBe(LIVE_GREEN);
    expect(rc.textContent).toContain('Fleetwood');
    expect(rc.textContent).toContain('−15');
  });

  it('live tied: no headshot, the tied count line in muted ink', () => {
    const { container } = render(
      <SeasonRow
        event={event({
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
            currentRound: 2,
          },
        })}
        onSelect={() => {}}
      />,
    );
    const rc = rightColumn(container);
    expect(rc.querySelector('img')).toBeNull();
    const tiedLine = rc.children[1] as HTMLElement;
    expect(tiedLine.style.fontWeight).toBe('600');
    expect(tiedLine.style.color).toBe('rgba(248, 250, 252, 0.62)');
  });

  it('one neutral tag by priority, never amber', () => {
    const { container, unmount } = render(
      <SeasonRow event={event({ isMajor: true, isPlayoff: true, eventType: 'team' })} onSelect={() => {}} />,
    );
    let tags = container.querySelectorAll('button span[style*="rgba(255, 255, 255, 0.24)"]');
    expect(tags.length).toBe(1);
    expect((tags[0] as HTMLElement).style.color).toBe(INK);
    unmount();

    const { container: finale } = render(
      <SeasonRow event={event({ name: 'DP World Tour Championship', isPlayoff: true })} onSelect={() => {}} />,
    );
    tags = finale.querySelectorAll('button span[style*="rgba(255, 255, 255, 0.24)"]');
    expect(tags.length).toBe(1); // SEASON FINALE beats PLAYOFFS
    unmount();

    const { container: team } = render(
      <SeasonRow event={event({ name: 'Solheim Cup', eventType: 'team' })} onSelect={() => {}} />,
    );
    tags = team.querySelectorAll('button span[style*="rgba(255, 255, 255, 0.24)"]');
    expect(tags.length).toBe(1);
  });

  it('no tag for an ordinary event', () => {
    const { container } = render(<SeasonRow event={event()} onSelect={() => {}} />);
    expect(container.querySelectorAll('button span[style*="rgba(255, 255, 255, 0.24)"]').length).toBe(0);
  });

  it('venue line drops region words and falls back to the country only when there is no city', () => {
    const { unmount } = render(
      <SeasonRow event={event({ venueCity: 'Asia', venueCountry: 'KOR' })} onSelect={() => {}} />,
    );
    expect(screen.getByText('Trump International Golf Links (Ireland) · KOR')).toBeInTheDocument();
    unmount();
    render(
      <SeasonRow event={event({ venueCity: null, coursePlace: null, venueCountry: 'Caribbean' })} onSelect={() => {}} />,
    );
    expect(screen.getByText('Trump International Golf Links (Ireland)')).toBeInTheDocument();
  });

  it('amber: a followed winner takes the star and amber; field and played-here lines render in amber', () => {
    const { container } = render(
      <SeasonRow
        event={event()}
        you={{ followedPlayerId: 'p-ortiz', fieldNames: ['Fleetwood', 'Hatton'], playedHere: true }}
        onSelect={() => {}}
      />,
    );
    const rc = rightColumn(container);
    const who = rc.children[1] as HTMLElement;
    expect(who.style.color).toBe(AMBER);
    expect(who.textContent).toBe('★ Ortiz');
    const amberLines = container.querySelectorAll('button span[style*="rgb(247, 147, 30)"]');
    // who line + field line + played-here line
    expect(amberLines.length).toBe(3);
  });

  it('guests (no you prop) get no amber lines and no star', () => {
    const { container } = render(<SeasonRow event={event()} onSelect={() => {}} />);
    expect(container.querySelectorAll('button span[style*="rgb(247, 147, 30)"]').length).toBe(0);
    expect(container.textContent).not.toContain('★');
  });

  it('surnames never wrap in the right column', () => {
    const { container } = render(<SeasonRow event={event()} onSelect={() => {}} />);
    const who = rightColumn(container).children[1] as HTMLElement;
    expect(who.style.whiteSpace).toBe('nowrap');
  });
});
