import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

import {
  PERSONAL_BESTS_TILE_LIMIT,
  personalBestTiles,
} from '@/features/explore-magazine/PersonalBestsShelf';
import type { PersonalBestRow } from '@/components/explore-tab-new/courseled/hooks/usePersonalBests';

const source = (file: string) => fs.readFileSync(path.resolve(process.cwd(), file), 'utf8');

function row(overrides: Partial<PersonalBestRow> = {}): PersonalBestRow {
  return {
    whs_score_id: 'score-1',
    user_id: 'member-1',
    display_name: 'danny.akers1',
    profile_photo_url: null,
    is_self: false,
    course_id: 'course-1',
    course_name: 'The Addington Golf Club',
    region: null,
    feat_kind: 'first_sub_70_here',
    figure: '68',
    figure_unit: 'GROSS',
    headline: 'First time under 70 here',
    reference_line: null,
    play_date: '2026-08-27',
    rarity: 0,
    second_figure: null,
    ...overrides,
  };
}

describe('PersonalBestsShelf', () => {
  it('preserves RPC order and takes exactly the first eight without a member budget', () => {
    const rows = Array.from({ length: 12 }, (_, index) =>
      row({ whs_score_id: `score-${index}`, user_id: index < 4 ? 'same-member' : `member-${index}` }),
    );
    expect(personalBestTiles(rows)).toEqual(rows.slice(0, PERSONAL_BESTS_TILE_LIMIT));
    expect(personalBestTiles(rows)).toHaveLength(8);
    expect(personalBestTiles(rows).filter((item) => item.user_id === 'same-member')).toHaveLength(4);
  });

  it('passes server copy, nullable reference lines, and varying units directly to StandoutTile', () => {
    const shelf = source('src/features/explore-magazine/PersonalBestsShelf.tsx');
    expect(shelf).toContain("detail={row.headline ?? ''}");
    expect(shelf).toContain('subline={row.reference_line}');
    expect(shelf).toContain('unit={row.figure_unit ?? undefined}');
    expect(shelf).not.toContain("unit=\"GROSS\"");
    expect(shelf).not.toContain('allowance');
    expect(shelf).not.toContain('standoutCounts');
  });

  it('keeps the RPC widening parameters and renders no empty-state shelf', () => {
    const hook = source('src/components/explore-tab-new/courseled/hooks/usePersonalBests.ts');
    const shelf = source('src/features/explore-magazine/PersonalBestsShelf.tsx');
    expect(hook).toContain('PERSONAL_BESTS_DAYS = 90');
    expect(hook).toContain('PERSONAL_BESTS_FETCH = 30');
    expect(hook).toContain('PERSONAL_BESTS_PER_MEMBER = 2');
    expect(shelf).toContain('if (rows.length === 0) return null;');
  });
});