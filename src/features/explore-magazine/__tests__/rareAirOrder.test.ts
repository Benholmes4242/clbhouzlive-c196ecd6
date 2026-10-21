import { describe, expect, it } from 'vitest';
import { rareAirRailRows } from '../rareAir';
import type { FeatKind, FeatYearRow } from '../useFeatsWindow';

const row = (feat_kind: FeatKind, events: number): FeatYearRow => ({
  feat_kind, events, rounds_with: 0, members: 0, denominator: 0, denominator_unit: 'holes',
  total_rounds: 0, total_holes: 0, total_members: 0, rounds_estimated: 0, viewer_events: 0, viewer_rounds_with: 0,
  latest_user_id: null, latest_display_name: null, latest_photo_url: null, latest_score_id: null,
  latest_course_id: null, latest_course_name: null, latest_play_date: null,
});

describe('CB21 rail-only order', () => {
  it('positive events lead while both groups retain incoming rarity order', () => {
    const rows = [row('ace', 0), row('albatross', 1), row('eagle', 20), row('clean_card', 0)];
    expect(rareAirRailRows(rows).map((r) => r.feat_kind)).toEqual(['albatross', 'eagle', 'ace', 'clean_card']);
  });

  it('all zero-event tiles remain in their incoming order', () => {
    const rows = [row('ace', 0), row('albatross', 0), row('eagle', 0), row('clean_card', 0)];
    expect(rareAirRailRows(rows)).toEqual(rows);
    expect(rareAirRailRows(rows)).toHaveLength(4);
  });

  it('sorting leaves the caller rows and first totals row untouched', () => {
    const rows = [row('ace', 0), row('eagle', 4)];
    const before = [...rows];
    rareAirRailRows(rows);
    expect(rows).toEqual(before);
    expect(rows[0]).toBe(before[0]);
  });
});