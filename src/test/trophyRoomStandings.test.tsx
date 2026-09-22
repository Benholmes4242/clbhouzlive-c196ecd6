import React from 'react';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { StandingsPanel } from '@/components/profile/handicap/whs/gam/trophy-room/career/panels/StandingsPanel';
import {
  discState,
  standingLine,
  tiedWith,
  groupStandings,
} from '@/components/profile/handicap/whs/gam/trophy-room/career/standings';
import type { MemberStandingRow } from '@/hooks/gam/useMemberStandings';
import CareerRecordSheet from '@/components/profile/handicap/whs/gam/trophy-room/career/CareerRecordSheet';
import { openGamAchievements } from '@/components/profile/handicap/whs/gam/events';

/* BRIEF_STANDINGS_FOLLOWUPS — the empty branch reads these through the hook. */
const standingsState = vi.hoisted(() => ({ rows: [] as unknown[] }));
vi.mock('@/hooks/gam/useMemberStandings', () => ({
  useMemberStandings: () => ({ data: standingsState.rows }),
}));
vi.mock('@/hooks/gam/useUserAchievements', () => ({
  useUserAchievements: () => ({ data: [], isLoading: false }),
}));
vi.mock('@/hooks/gam/useUserTopLegends', () => ({
  useUserTopLegends: () => ({ data: [], isLoading: false }),
}));
vi.mock('@/hooks/gam/useUserStreaks', () => ({
  useUserStreaks: () => ({ data: [] }),
}));
vi.mock('@/hooks/gam/useCareerRounds', () => ({
  useCareerRounds: () => ({ data: [] }),
}));
vi.mock('@/hooks/gam/useBadgePopulationShare', () => ({
  useBadgePopulationShare: () => ({ data: undefined }),
}));
vi.mock('@/hooks/gam/useTop100Distribution', () => ({
  useTop100Distribution: () => ({ data: [] }),
}));
vi.mock('@/hooks/gam/useGamRecordConfig', () => ({
  useGamRecordConfig: () => ({ data: undefined }),
  RECORD_CONFIG_DEFAULTS: {},
}));
vi.mock('@/hooks/gam/useCourseFieldSizes', () => ({
  useCourseFieldSizes: () => ({ data: undefined }),
}));
vi.mock('@/hooks/gam/useCourseFieldPlayers', () => ({
  useCourseFieldPlayers: () => ({ data: undefined }),
}));

afterEach(cleanup);

/**
 * BRIEF_TROPHY_ROOM_STANDINGS — every fixture below is a LIVE row read from
 * public.get_member_standings for benjamin@clbhouz.co.uk on 22 Sep 2026, so the
 * proofs test the data as shipped, not an invented shape.
 */
function row(over: Partial<MemberStandingRow>): MemberStandingRow {
  return {
    course_id: 'c1',
    course_name: 'A Course',
    category: 'best_stableford_all_time',
    is_tenure: false,
    lower_is_better: false,
    rank: 1,
    field_size: 4,
    ahead_count: 0,
    behind_count: 3,
    value: 40,
    leader_value: 40,
    better_value: null,
    next_value: 36,
    attained_at: '2026-05-01',
    medal_earned: true,
    ...over,
  };
}

/* LIVE: Sundridge Park Golf Club (East Course) */
const SUNDRIDGE_STABLEFORD = row({
  course_id: 'sundridge',
  course_name: 'Sundridge Park Golf Club (East Course)',
  category: 'best_stableford_90d',
  rank: 1,
  field_size: 17,
  ahead_count: 0,
  behind_count: 13,
  value: 41,
  leader_value: 41,
  next_value: 40,
  medal_earned: true,
});
/* LIVE: Queenwood Golf Club — one card, no field. */
const QUEENWOOD = row({
  course_id: 'queenwood',
  course_name: 'Queenwood Golf Club',
  category: 'lowest_gross_all_time',
  lower_is_better: true,
  rank: 1,
  field_size: 1,
  ahead_count: 0,
  behind_count: 0,
  value: 82,
  leader_value: 82,
  next_value: null,
  medal_earned: false,
});
/* LIVE: Vale do Lobo (Ocean) — attendance, not a placing. */
const VALE_ROUNDS = row({
  course_id: 'vale',
  course_name: 'Vale do Lobo (Ocean)',
  category: 'most_rounds_all_time',
  is_tenure: true,
  rank: 1,
  field_size: 4,
  ahead_count: 0,
  behind_count: 0,
  value: 1,
  leader_value: 1,
  next_value: null,
  medal_earned: false,
});
/* LIVE: Hankley Common — beat a field of seven, off the podium. */
const HANKLEY = row({
  course_id: 'hankley',
  course_name: 'Hankley Common Golf Club',
  category: 'best_stableford_all_time',
  rank: 4,
  field_size: 7,
  ahead_count: 3,
  behind_count: 2,
  value: 33,
  leader_value: 39,
  better_value: 34,
  next_value: 32,
  medal_earned: true,
});

function draw(rows: MemberStandingRow[]) {
  return render(<StandingsPanel rows={rows} />).container;
}

describe('Trophy Room · where you stand', () => {
  it('Sundridge Park East stableford: GOLD disc, 1 of 17, shared with 3 and clear by 1', () => {
    const c = draw([SUNDRIDGE_STABLEFORD]);
    const disc = c.querySelector<HTMLElement>('[data-standing-disc]');
    expect(disc?.dataset.standingDisc).toBe('gold');
    expect(disc?.textContent).toBe('1of 17');
    expect(c.querySelector('[data-standing-line="true"]')?.textContent).toBe(
      'Shared with 3 · clear by 1',
    );
    expect(tiedWith(SUNDRIDGE_STABLEFORD)).toBe(3);
  });

  it('Queenwood: DASHED disc, 1 of 1, only card on this board', () => {
    const c = draw([QUEENWOOD]);
    const disc = c.querySelector<HTMLElement>('[data-standing-disc]');
    expect(disc?.dataset.standingDisc).toBe('plain');
    expect(disc?.firstElementChild).toHaveProperty('style');
    expect((disc?.firstElementChild as HTMLElement).style.border).toContain('dashed');
    expect(disc?.textContent).toBe('1of 1');
    expect(c.querySelector('[data-standing-line="true"]')?.textContent).toBe(
      'Only card on this board',
    );
  });

  it('Vale do Lobo rounds played: under AT THIS COURSE with NO disc at all', () => {
    const c = draw([VALE_ROUNDS]);
    expect(c.querySelector('[data-standing-disc]')).toBeNull();
    expect(c.textContent).toContain('At this course');
    expect(c.textContent).not.toContain('Standings');
    expect(c.querySelector('[data-standing-row="most_rounds_all_time"]')).not.toBeNull();
  });

  it('rank > 3 with a medal renders the solid "placed" disc, distinct from bronze and dashed', () => {
    const c = draw([HANKLEY]);
    const disc = c.querySelector<HTMLElement>('[data-standing-disc]');
    expect(disc?.dataset.standingDisc).toBe('placed');
    const inner = disc?.firstElementChild as HTMLElement;
    expect(inner.style.border).not.toContain('dashed');
    expect(inner.style.background).toBe('rgb(27, 34, 43)');
    expect(discState({ ...HANKLEY, rank: 3 })).toBe('bronze');
    expect(discState({ ...HANKLEY, medal_earned: false })).toBe('plain');
    expect(c.querySelector('[data-standing-line="true"]')?.textContent).toBe(
      '1 off the player above · 6 off the lead',
    );
  });

  it('picks ONE line, in the brief order, from the named columns only', () => {
    expect(standingLine(row({ field_size: 1 }))).toBe('Only card on this board');
    expect(standingLine(row({ ahead_count: 0, behind_count: 0, field_size: 4 }))).toBe(
      'Level with everyone here',
    );
    /* ahead 0, no ties: clear by the next value — bare number, no unit. */
    expect(standingLine(row({ field_size: 4, behind_count: 3, next_value: 36 }))).toBe(
      'Clear by 4',
    );
    /* Behind: no lead clause when the leader IS the player above. */
    expect(
      standingLine(
        row({ rank: 2, field_size: 4, ahead_count: 1, behind_count: 2, value: 33, better_value: 34, leader_value: 34 }),
      ),
    ).toBe('1 off the player above');
    /* Differentials keep one decimal and take no unit. */
    expect(
      standingLine(
        row({
          category: 'best_score_diff_all_time',
          lower_is_better: true,
          rank: 4,
          field_size: 4,
          ahead_count: 3,
          behind_count: 0,
          value: 14.3,
          better_value: 9.7,
          leader_value: -0.8,
          next_value: null,
        }),
      ),
    ).toBe('4.6 off the player above · 15.1 off the lead');
  });

  it('groups by course in the order the RPC returned, splitting tenure out', () => {
    const groups = groupStandings([SUNDRIDGE_STABLEFORD, VALE_ROUNDS, QUEENWOOD, HANKLEY]);
    expect(groups.map((g) => g.courseId)).toEqual(['sundridge', 'vale', 'queenwood', 'hankley']);
    expect(groups[1].standings).toHaveLength(0);
    expect(groups[1].tenure).toHaveLength(1);
  });

  it('shows one honest line when a member has no standings', () => {
    const c = draw([]);
    expect(c.textContent).toContain(
      'No course standings yet — they start once someone else has played a course you have.',
    );
    expect(c.querySelector('[data-standing-disc]')).toBeNull();
  });
});

describe('BRIEF_STANDINGS_FOLLOWUPS · the empty branch', () => {
  const SHEET_USER = '11111111-1111-1111-1111-111111111111';

  function mountSheet() {
    return render(<CareerRecordSheet userId={SHEET_USER} />);
  }

  it('a member with standings and no badges sees standings, never "Nothing on the record yet"', async () => {
    standingsState.rows = [SUNDRIDGE_STABLEFORD];
    mountSheet();
    await act(async () => {
      openGamAchievements();
    });
    await waitFor(() => {
      expect(screen.getByText('Where you stand')).toBeTruthy();
    });
    expect(screen.queryByText(/Nothing on the record yet/)).toBeNull();
    expect(screen.getByText('Sundridge Park Golf Club (East Course)')).toBeTruthy();
  });

  it('a member with nothing at all still sees the honest empty line', async () => {
    standingsState.rows = [];
    mountSheet();
    await act(async () => {
      openGamAchievements();
    });
    await waitFor(() => {
      expect(screen.getByText(/Nothing on the record yet/)).toBeTruthy();
    });
  });
});
