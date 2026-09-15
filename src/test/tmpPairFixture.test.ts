import { describe, it } from 'vitest';

import { buildBlocks } from '@/features/explore-magazine/ExploreMagazine';
import type { ConsequenceKind, StreamItem } from '@/features/explore-magazine/streamItem';

let seq = 0;
function round(consequence: ConsequenceKind | null, course: string): StreamItem {
  seq += 1;
  return {
    id: `r${seq}`, kind: 'round', ring: null, lane: 'news', score: 1,
    consequence: consequence ? { kind: consequence } : null,
    subject: { course_id: course, course_name: course, region: 'Kent', sub_country: 'England', image_url: null, pending: false },
    who: { user_id: `u${seq}`, display_name: 'A member', photo_url: null, is_viewer: false },
    facts: { gross: 84, to_par: 12, play_date: '2026-09-01', score_id: `s${seq}` },
    payload: {}, seen: false,
  };
}

const mix: [ConsequenceKind | null, string][] = [
  ['record_taken', 'c1'],
  ['circle_round', 'c2'], ['circle_round', 'c3'],
  ['circle_round', 'c4'], ['list_first', 'c5'],
  ['platform_notable', 'c6'],
  ['circle_round', 'sundridge'], ['circle_round', 'sundridge'],
  ['circle_round', 'c7'], [null, 'c8'],
  ['list_first', 'c9'], ['circle_round', 'c10'],
  ['platform_notable', 'c11'],
  ['circle_round', 'c12'], ['circle_round', 'c13'], [null, 'c14'],
];

describe('fixture', () => {
  it('reports', () => {
    const items = mix.map(([c, id]) => round(c, id));
    const before = buildBlocks(items, [], false, { bareRoundPairs: false, repeatShelves: true });
    const after = buildBlocks(items, [], false, { bareRoundPairs: true, repeatShelves: true });
    const h = (bs: ReturnType<typeof buildBlocks>) =>
      bs.reduce((n, b) => n + (b.kind === 'lead' ? 430 : b.kind === 'std' ? 300 : b.kind === 'pair' ? 205 : 0) + 26, 0);
    console.log('BEFORE', before.map((b) => b.kind).join(','), 'height~', h(before));
    console.log('AFTER ', after.map((b) => b.kind).join(','), 'height~', h(after));
  });
});
