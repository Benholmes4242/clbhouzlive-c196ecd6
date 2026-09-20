import { describe, expect, it } from 'vitest';

import { boardFeatMarker } from '@/components/explore-tab-new/courseled/BoardRows';
import { calloutFor } from '@/features/explore-magazine/cardTreatment';
import { notability } from '@/features/explore-magazine/useExploreStreamClient';
import type { StreamFacts, StreamItem } from '@/features/explore-magazine/streamItem';

const t = (_key: string, options?: Record<string, unknown>) => {
  const count = Number(options?.count ?? 0);
  const first = String(options?.first ?? '');
  const second = String(options?.second ?? '');
  if (_key.endsWith('featJoin')) return `${first} + ${second}`;
  if (_key.endsWith('featAce')) return count === 1 ? 'HOLE IN ONE' : `${count} HOLES IN ONE`;
  if (_key.endsWith('featAlbatross')) return count === 1 ? 'ALBATROSS' : `${count} ALBATROSSES`;
  if (_key.endsWith('featEagle')) return count === 1 ? 'EAGLE' : `${count} EAGLES`;
  return '';
};

function item(facts: StreamFacts): StreamItem {
  return {
    id: 'fixture', kind: 'round', ring: 'world', lane: 'news', score: 0, consequence: null,
    subject: { course_id: 'course', course_name: 'Course', region: null, sub_country: null, image_url: null, pending: false },
    who: { user_id: 'member', display_name: 'Member', photo_url: null, is_viewer: false },
    facts: { gross: 68, ...facts }, payload: {}, seen: false,
  };
}

const cases = [
  ['one eagle', { eagles: 1 }, 'ink', 'EAGLE'],
  ['two eagles', { eagles: 2 }, 'gold', '2 EAGLES'],
  ['one ace', { holes_in_one: 1 }, 'gold', 'HOLE IN ONE'],
  ['two aces', { holes_in_one: 2 }, 'top', '2 HOLES IN ONE'],
  ['ace and albatross', { holes_in_one: 1, albatrosses: 1 }, 'top', 'HOLE IN ONE + ALBATROSS'],
  ['ace, albatross and two eagles', { holes_in_one: 1, albatrosses: 1, eagles: 2 }, 'top', 'HOLE IN ONE + ALBATROSS'],
] as const;

describe('E2 round feat fixtures', () => {
  it.each(cases)('%s uses tier %s and marker %s', (_name, facts, tier, marker) => {
    const round = item(facts);
    expect(calloutFor(round)).toMatchObject({ tier });
    expect(boardFeatMarker(round.facts as never, t as never)).toBe(marker);
  });

  it('uses bounded count bonuses inside rarity bands', () => {
    expect(notability(item({ eagles: 2 }))).toBeGreaterThan(notability(item({ eagles: 1 })));
    expect(notability(item({ eagles: 20 }))).toBeLessThan(notability(item({ albatrosses: 1 })));
    expect(notability(item({ holes_in_one: 2 }))).toBeGreaterThan(notability(item({ holes_in_one: 1 })));
    expect(notability(item({ holes_in_one: 1, albatrosses: 1 }))).toBeGreaterThan(notability(item({ holes_in_one: 1 })));
    expect(notability(item({ holes_in_one: 20 }))).toBeLessThan(5.31);
  });
});