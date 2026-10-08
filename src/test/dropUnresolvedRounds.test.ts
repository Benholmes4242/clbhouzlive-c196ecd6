import { describe, it, expect } from 'vitest';
import { dropUnresolvedRounds } from '@/components/feed/dropUnresolvedRounds';

const p = (id: string, postType?: string) => ({ id, postType } as never);
const round = {} as never;

describe('dropUnresolvedRounds', () => {
  it('drops a settled round post whose round never resolved', () => {
    const out = dropUnresolvedRounds([p('a'), p('b'), p('c')], new Map([['b', 's1']]), new Map(), true);
    expect(out.map((x: { id: string }) => x.id)).toEqual(['a', 'c']);
  });
  it('drops a round-typed post with no score id once settled', () => {
    const out = dropUnresolvedRounds([p('a', 'round')], new Map(), new Map(), true);
    expect(out).toHaveLength(0);
  });
  it('keeps a resolved round post', () => {
    const out = dropUnresolvedRounds([p('b')], new Map([['b', 's1']]), new Map([['s1', round]]), true);
    expect(out).toHaveLength(1);
  });
  it('keeps a pending round post while the chain is in flight', () => {
    const out = dropUnresolvedRounds([p('b')], new Map([['b', 's1']]), new Map(), false);
    expect(out).toHaveLength(1);
  });
});
