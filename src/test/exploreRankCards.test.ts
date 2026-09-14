import { describe, expect, it } from 'vitest';

import { applyRankCardRule } from '@/features/explore-magazine/rankCards';
import type { StreamItem } from '@/features/explore-magazine/streamItem';
import type { StandingRow } from '@/features/explore-magazine/useViewerStanding';

function standing(courseId: string, delta: number | null): StandingRow {
  return {
    course_id: courseId,
    course_name: 'A Course',
    region: null,
    sub_country: null,
    image_url: null,
    rank_now: 8,
    field_now: 18,
    rank_then: delta == null ? null : 8 + delta,
    delta,
    last_change_at: null,
    board: 'topar',
  };
}

function round(
  id: string,
  courseId: string,
  playDate: string,
  opts: {
    own?: boolean;
    lane?: 'news' | 'backlog';
    kind?: 'rank_down' | 'rank_up' | 'rank_hold' | 'played_nochange';
  } = {},
): StreamItem {
  return {
    id,
    kind: 'round',
    ring: 'own',
    lane: opts.lane ?? 'news',
    score: 1,
    consequence: { kind: opts.kind ?? 'rank_down', n: 8, of: 18, delta: 1 },
    subject: {
      course_id: courseId,
      course_name: 'A Course',
      region: null,
      sub_country: null,
      image_url: null,
      pending: false,
    },
    who: { user_id: 'u', display_name: 'Someone', photo_url: null, is_viewer: !!opts.own },
    facts: { gross: 67, play_date: playDate },
    payload: {},
    seen: false,
  };
}

describe('one rank card per course per change', () => {
  it('keeps exactly one card, the most recent round, per moved course', () => {
    const items = [round('a', 'c1', '2026-09-01'), round('b', 'c1', '2026-09-10'), round('c', 'c1', '2026-09-05')];
    const out = applyRankCardRule(items, new Map([['c1', standing('c1', -1)]]));
    const kept = out.items.filter((i) => i.consequence?.kind === 'rank_down');
    expect(kept.map((i) => i.id)).toEqual(['b']);
    expect(out.stats.after).toBe(1);
    expect(out.stats.strippedDuplicate).toBe(2);
  });

  it('never lets a backlog round carry a standing claim', () => {
    const items = [round('a', 'c1', '2021-11-03', { lane: 'backlog' })];
    const out = applyRankCardRule(items, new Map([['c1', standing('c1', -1)]]));
    expect(out.items[0].consequence).toBeNull();
    expect(out.stats.strippedBacklog).toBe(1);
  });

  it('draws nothing when the rank has not moved, or on a first-ever visit', () => {
    const zero = applyRankCardRule([round('a', 'c1', '2026-09-10')], new Map([['c1', standing('c1', 0)]]));
    expect(zero.items[0].consequence).toBeNull();
    const first = applyRankCardRule([round('a', 'c1', '2026-09-10')], new Map([['c1', standing('c1', null)]]));
    expect(first.items[0].consequence).toBeNull();
  });

  it('draws nothing when the course has no standing row at all', () => {
    const out = applyRankCardRule([round('a', 'c1', '2026-09-10')], new Map());
    expect(out.items[0].consequence).toBeNull();
  });

  it("leaves the viewer's own moved rounds untouched", () => {
    const items = [round('a', 'c1', '2026-09-10', { own: true, kind: 'rank_up' })];
    const out = applyRankCardRule(items, new Map());
    expect(out.items[0].consequence?.kind).toBe('rank_up');
  });

  it("strips an unchanged claim on the viewer's own round", () => {
    for (const kind of ['played_nochange', 'rank_hold'] as const) {
      const items = [round('a', 'c1', '2026-09-10', { own: true, kind })];
      const out = applyRankCardRule(items, new Map());
      expect(out.items[0].consequence).toBeNull();
    }
  });

  it('rations each course separately', () => {
    const items = [round('a', 'c1', '2026-09-10'), round('b', 'c2', '2026-09-09')];
    const out = applyRankCardRule(
      items,
      new Map([
        ['c1', standing('c1', -1)],
        ['c2', standing('c2', -2)],
      ]),
    );
    expect(out.items.filter((i) => i.consequence).length).toBe(2);
    expect(out.stats.courses).toBe(2);
  });
});
