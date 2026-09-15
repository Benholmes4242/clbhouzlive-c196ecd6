import { describe, it, expect } from 'vitest';

import { dedupePages, dedupeItems } from '@/features/explore-magazine/dedupeStream';

/**
 * BRIEF_ROUND_SHEET_TALL §2 — TWO PAGES SHARING ONE ROUND GIVE ONE CARD.
 *
 * The console carried a duplicate key for one round id. Everything downstream is
 * keyed by item.id — the card refs used to reveal a card, the ring on the tapped
 * card, and the round sequence paging walks — so one item twice is one round
 * reachable twice.
 */
const round = (id: string) => ({ id, kind: 'round' as const, facts: { score_id: id } });

describe('stream dedupe', () => {
  it('two pages sharing one round id give one card, one seq entry, one ref', () => {
    const pages = [
      [round('a'), round('b')],
      [round('b'), round('c')],
    ];
    const { items, drops } = dedupePages(pages);

    expect(items.map((i) => i.id)).toEqual(['a', 'b', 'c']);

    /* The round sequence and the ref map are both built from this list. */
    const seq = items.filter((i) => i.kind === 'round' && !!i.facts.score_id);
    expect(seq.filter((i) => i.id === 'b')).toHaveLength(1);
    const refs = new Map<string, number>();
    items.forEach((i, ix) => refs.set(i.id, ix));
    expect(refs.size).toBe(3);

    /* And the overlap is reported, naming both pages and both positions. */
    expect(drops).toEqual([
      { id: 'b', keptPage: 0, keptPos: 1, dropPage: 1, dropPos: 0 },
    ]);
  });

  it('keeps the served order and the first occurrence', () => {
    const first = round('a');
    const second = { ...round('a'), facts: { score_id: 'a-late' } };
    const { items } = dedupePages([[first, round('z')], [second]]);
    expect(items.map((i) => i.id)).toEqual(['a', 'z']);
    expect(items[0]).toBe(first);
  });

  it('dedupes an already flat list, and leaves a clean list untouched', () => {
    expect(dedupeItems([round('a'), round('a')]).items).toHaveLength(1);
    const clean = [round('a'), round('b')];
    expect(dedupeItems(clean).items).toEqual(clean);
    expect(dedupeItems(clean).drops).toEqual([]);
  });
});
