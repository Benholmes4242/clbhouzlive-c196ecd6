/**
 * YOU_TAB_CIRCLE_NAMES_2 T2 — the three rules that made the You tab's
 * "who you know has played it" line wrong twice:
 *
 * 1. The count and the names come from ONE call, so they can never disagree.
 * 2. A member with no readable display name is absent from BOTH the count
 *    and the names.
 * 3. When the rounds-based source returns nobody, the line does not render —
 *    and there is no ratings-based fallback in any state.
 */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';

import {
  CIRCLE_PLAYERS_LIMIT,
  circleNamesLine,
} from '@/components/courses/course-detail/you/circleNamesLine';
import type { BoardCoursePlayer } from '@/components/explore-tab-new/courseled/hooks/useBoardCoursePlayers';

const player = (id: string, name: string | null): BoardCoursePlayer => ({
  user_id: id,
  display_name: name,
  profile_photo_url: null,
  rounds: 1,
  best_gross: null,
  best_to_par: null,
  last_played: null,
});

describe('circleNamesLine', () => {
  it('derives the count and the names from the same result, so they agree by construction', () => {
    const line = circleNamesLine([
      player('a', 'Anna'),
      player('b', 'Ben'),
      player('c', 'Chloe'),
      player('d', 'Dan'),
      player('e', 'Eve'),
    ]);
    expect(line.count).toBe(5);
    expect(line.shown.map((p) => p.display_name)).toEqual(['Anna', 'Ben', 'Chloe']);
    expect(line.others).toBe(2);
    expect(line.count).toBe(line.shown.length + line.others);
  });

  it('excludes a member with no readable display name from the count AND the names', () => {
    const line = circleNamesLine([
      player('a', 'Anna'),
      player('b', null),
      player('c', ''),
      player('d', '   '),
      player('e', 'Eve'),
    ]);
    expect(line.count).toBe(2);
    expect(line.shown.map((p) => p.display_name)).toEqual(['Anna', 'Eve']);
  });

  it('returns an empty line when the rounds-based source returns nobody', () => {
    const line = circleNamesLine([]);
    expect(line.count).toBe(0);
    expect(line.shown).toEqual([]);
    expect(line.others).toBe(0);
  });

  it('flags a capped read so the count is never presented as exact', () => {
    const raw = Array.from({ length: CIRCLE_PLAYERS_LIMIT }, (_, i) => player(`u${i}`, `Member ${i}`));
    const line = circleNamesLine(raw);
    expect(line.capped).toBe(true);
    expect(line.count).toBe(CIRCLE_PLAYERS_LIMIT);
    expect(circleNamesLine(raw.slice(0, CIRCLE_PLAYERS_LIMIT - 1)).capped).toBe(false);
  });
});

describe('CourseYouTab circle line (source rules)', () => {
  const src = readFileSync(
    path.resolve(__dirname, '../components/courses/course-detail/CourseYouTab.tsx'),
    'utf8',
  );

  it('renders the line only when the rounds-based count is above zero', () => {
    expect(src).toContain('{circleCount > 0 ? (');
  });

  it('has no ratings-based fallback for any part of the line', () => {
    expect(src).not.toContain('useMembersWhoPlayedCourse');
    expect(src).not.toContain('circle_played');
  });
});
