import { describe, it, expect } from 'vitest';
import { roundPostItem } from '@/components/feed/roundPostItem';
import type { ConsequenceSources } from '@/features/explore-magazine/consequences';
import type { StandingRow } from '@/features/explore-magazine/useViewerStanding';

const VIEWER = 'viewer';
const post = (userId: string, courseId = 'c1') =>
  ({ id: `p-${userId}`, userId, courseId, postType: 'round' } as never);
const round = (gross: number) =>
  ({ whsScoreId: 's1', grossScore: gross, coursePar: 72, holeShape: null, totalHoles: 18, playDate: '2026-10-01' } as never);
const stand = (rank_now: number, field_now: number, delta: number | null): StandingRow => ({
  course_id: 'c1', course_name: null, region: null, sub_country: null, image_url: null,
  rank_now, field_now, rank_then: null, delta, last_change_at: null, board: "topar",
});
const sources = (over: Partial<ConsequenceSources> = {}): ConsequenceSources => ({
  standing: new Map([['c1', stand(5, 42, 2)]]),
  records: { holders: new Map(), lostToViewer: new Set(), isFetched: true },
  bests: new Map([['c1', 80]]),
  shortlist: new Set(),
  ...over,
});

describe('Home round consequence', () => {
  it("viewer's own round that moved them up states rank_up", () => {
    const c = roundPostItem(post(VIEWER), round(76), VIEWER, sources()).consequence;
    expect(c).toMatchObject({ kind: 'rank_up', n: 5, of: 42, delta: 2 });
  });
  it("another member's round that passed the viewer states rank_down", () => {
    const c = roundPostItem(post('other'), round(75), VIEWER, sources()).consequence;
    expect(c).toMatchObject({ kind: 'rank_down', n: 5, of: 42 });
  });
  it('a course where the viewer has no standing produces no line', () => {
    const s = sources({ standing: new Map(), bests: new Map() });
    expect(roundPostItem(post('other'), round(75), VIEWER, s).consequence).toBeNull();
  });
  it('a page whose standing has not fetched produces no line, not a provisional one', () => {
    expect(roundPostItem(post('other'), round(75), VIEWER, null).consequence).toBeNull();
    expect(roundPostItem(post(VIEWER), round(76), VIEWER, null).consequence).toBeNull();
  });
});
