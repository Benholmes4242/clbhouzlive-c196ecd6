import { describe, expect, it } from 'vitest';

import { getContextLabel } from '@/features/tourhub/utils/tournamentClassification';
import {
  currentWeekKey,
  weekKey,
  weekMonday,
  weekRelation,
} from '@/features/tourhub/schedule-v2/timelineUtils';
import {
  dateSpanLabel,
  followedFieldNames,
  formatPurseShort,
  rightColumn,
  scheduleTag,
  venueLine,
  weekRangeLabel,
} from '@/features/tourhub/schedule-v2/scheduleRules';
import type { SeasonEvent } from '@/features/tourhub/schedule-v2/useSeasonTimeline';

// 1 Nov 2026 is a Sunday; its Monday-start week begins 26 Oct 2026.
const NOW = new Date('2026-11-01T15:00:00Z');

function evt(overrides: Partial<SeasonEvent> = {}): SeasonEvent {
  return {
    id: 'e1',
    tourSlug: 'pga',
    name: 'World Wide Technology Championship',
    venueName: 'El Cardonal at Diamante',
    venueCity: 'Cabo San Lucas',
    venueCountry: 'MEX',
    purse: 6_000_000,
    eventType: null,
    golfCourseId: null,
    startDate: '2026-11-05',
    endDate: '2026-11-08',
    status: 'scheduled',
    state: 'upcoming',
    isMajor: false,
    isPlayoff: false,
    isThisWeek: true,
    daysAway: 4,
    contextLabel: '',
    eventNumber: 1,
    ...overrides,
  };
}

describe('classification: Charles Schwab Cup Championship is not a major', () => {
  it('is a plain Champions Tour event, not MAJOR CHAMPIONSHIP', () => {
    expect(
      getContextLabel({ name: 'Charles Schwab Cup Championship', tourName: 'Champions Tour' }),
    ).toBe('CHAMPIONS TOUR EVENT');
  });

  it('the five senior majors still classify as majors', () => {
    const majors = [
      'Senior PGA Championship',
      'Regions Tradition',
      'U.S. Senior Open',
      'The Senior Open',
      'Senior Players Championship',
      'Kaulig Companies Championship',
    ];
    for (const name of majors) {
      expect(getContextLabel({ name, tourName: 'Champions Tour' })).toBe('MAJOR CHAMPIONSHIP');
    }
  });
});

describe('week helpers', () => {
  it('groups by the Monday-to-Sunday week of the start date', () => {
    expect(weekKey('2026-10-26')).toBe('2026-10-26'); // Monday
    expect(weekKey('2026-11-01')).toBe('2026-10-26'); // Sunday → same week
    expect(weekKey('2026-11-02')).toBe('2026-11-02'); // next Monday
    expect(weekMonday('2026-11-01').toISOString().slice(0, 10)).toBe('2026-10-26');
  });

  it('labels last/this/next week relative to now', () => {
    expect(currentWeekKey(NOW)).toBe('2026-10-26');
    expect(weekRelation('2026-10-19', NOW)).toBe('last');
    expect(weekRelation('2026-10-26', NOW)).toBe('this');
    expect(weekRelation('2026-11-02', NOW)).toBe('next');
    expect(weekRelation('2026-11-09', NOW)).toBe('other');
  });

  it('ranges span months and carry the year only outside the current year', () => {
    expect(weekRangeLabel('2026-10-26', NOW)).toBe('26 Oct – 1 Nov');
    expect(weekRangeLabel('2026-11-02', NOW)).toBe('2 – 8 Nov');
    expect(weekRangeLabel('2026-11-30', NOW)).toBe('30 Nov – 6 Dec');
    expect(weekRangeLabel('2027-03-15', NOW)).toBe('15 Mar – 21 Mar 2027');
    expect(weekRangeLabel('2026-12-28', NOW)).toBe('28 Dec 2026 – 3 Jan 2027');
  });
});

describe('row date spans', () => {
  it('prints the month once when start and end share it', () => {
    expect(dateSpanLabel('2026-11-05', '2026-11-08')).toBe('Thu 5 – Sun 8 Nov');
  });
  it('prints both months when they differ', () => {
    expect(dateSpanLabel('2026-10-29', '2026-11-01')).toBe('Thu 29 Oct – Sun 1 Nov');
  });
});

describe('purse short form', () => {
  it('formats millions, trimming zeros, and thousands below a million', () => {
    expect(formatPurseShort(9_000_000)).toBe('$9m');
    expect(formatPurseShort(3_250_000)).toBe('$3.25m');
    expect(formatPurseShort(2_100_000)).toBe('$2.1m');
    expect(formatPurseShort(500_000)).toBe('$500k');
    expect(formatPurseShort(null)).toBeNull();
    expect(formatPurseShort(0)).toBeNull();
  });
});

describe('tag priority', () => {
  it('MAJOR beats everything; SEASON FINALE beats PLAYOFFS; TEAM is last', () => {
    expect(scheduleTag(evt({ isMajor: true, isPlayoff: true, eventType: 'team' }))).toBe('major');
    expect(scheduleTag(evt({ name: 'DP World Tour Championship', isPlayoff: true }))).toBe('seasonFinale');
    expect(scheduleTag(evt({ name: 'Charles Schwab Cup Championship' }))).toBe('seasonFinale');
    expect(scheduleTag(evt({ name: 'BMW Championship', isPlayoff: true }))).toBe('playoffs');
    expect(scheduleTag(evt({ name: 'Solheim Cup', eventType: 'team' }))).toBe('team');
    expect(scheduleTag(evt())).toBeNull();
  });
});

describe('venue line', () => {
  it('joins venue and city, uses the country only with no city, never a region', () => {
    expect(venueLine(evt())).toBe('El Cardonal at Diamante · Cabo San Lucas');
    expect(venueLine(evt({ venueCity: null, coursePlace: null }))).toBe('El Cardonal at Diamante · MEX');
    expect(venueLine(evt({ venueCity: 'Asia' }))).toBe('El Cardonal at Diamante · MEX');
    expect(venueLine(evt({ venueCity: null, coursePlace: null, venueCountry: 'Caribbean' }))).toBe('El Cardonal at Diamante');
  });
});

describe('right column model', () => {
  it('completed → WON with the champion surname and score', () => {
    const rc = rightColumn(
      evt({
        state: 'completed',
        status: 'closed',
        champion: {
          playerId: 'p1',
          name: 'Alex Novak',
          displayName: 'A. Novak',
          photoUrl: null,
          tourCode: 'pga',
          scoreText: '−24',
          score: -24,
        },
      }),
    );
    expect(rc).toMatchObject({ kind: 'won', name: 'Novak', score: -24, scoreText: '−24' });
  });

  it('live outright → LEADS with the round; tied → LEAD with the count', () => {
    const leader = {
      playerId: 'p2',
      name: 'Tommy Fleetwood',
      displayName: 'T. Fleetwood',
      photoUrl: null,
      tourCode: 'pga',
      totalText: '−15',
      score: -15,
      tiedCount: 1,
      currentRound: 3,
    };
    expect(rightColumn(evt({ state: 'live', status: 'inprogress', leader }))).toMatchObject({
      kind: 'leads',
      name: 'Fleetwood',
      round: 3,
    });
    expect(
      rightColumn(evt({ state: 'live', status: 'inprogress', leader: { ...leader, tiedCount: 3 } })),
    ).toMatchObject({ kind: 'tied', tiedCount: 3 });
  });

  it('upcoming → DEFENDS with purse, PURSE alone, or nothing', () => {
    expect(
      rightColumn(evt({ defendingChampion: { name: 'Scottie Scheffler', photoUrl: null } })),
    ).toMatchObject({ kind: 'defends', name: 'Scheffler', purse: '$6m' });
    expect(rightColumn(evt({ defendingChampion: null }))).toEqual({ kind: 'purse', purse: '$6m' });
    expect(rightColumn(evt({ defendingChampion: null, purse: null }))).toEqual({ kind: 'none' });
  });
});

describe('followed field names', () => {
  const field = [
    { id: 'a', name: 'Tommy Fleetwood' },
    { id: 'b', name: 'Tyrrell Hatton' },
    { id: 'c', name: 'Rory McIlroy' },
    { id: 'd', name: 'Shane Lowry' },
  ];
  it('keeps field order, surnames only, deduped, followed only', () => {
    expect(followedFieldNames(field, new Set(['b', 'a']))).toEqual(['Fleetwood', 'Hatton']);
    expect(followedFieldNames(field, new Set(['d']))).toEqual(['Lowry']);
    expect(followedFieldNames(field, new Set())).toEqual([]);
    expect(followedFieldNames(undefined, new Set(['a']))).toEqual([]);
    expect(followedFieldNames([...field, { id: 'a', name: 'Tommy Fleetwood' }], new Set(['a']))).toEqual([
      'Fleetwood',
    ]);
  });
});
