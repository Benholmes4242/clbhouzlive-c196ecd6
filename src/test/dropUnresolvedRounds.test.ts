import { describe, it, expect } from 'vitest';
import { dropUnresolvedRounds } from '@/components/feed/dropUnresolvedRounds';

const p = (id: string, postType?: string) => ({ id, postType } as never);
const round = {} as never;

describe('dropUnresolvedRounds', () => {
  it('drops a settled round post whose round never resolved', () => {
    const out = dropUnresolvedRounds([p('a'), p('b', 'round'), p('c')], new Map([['b', 's1']]), new Map(), true);
    expect(out.map((x: { id: string }) => x.id)).toEqual(['a', 'c']);
  });
  it('drops a round-typed post with no score id once settled', () => {
    const out = dropUnresolvedRounds([p('a', 'round')], new Map(), new Map(), true);
    expect(out).toHaveLength(0);
  });
  it('keeps a resolved round post', () => {
    const out = dropUnresolvedRounds([p('b', 'round')], new Map([['b', 's1']]), new Map([['s1', round]]), true);
    expect(out).toHaveLength(1);
  });
  it('keeps a pending round post while the chain is in flight', () => {
    const out = dropUnresolvedRounds([p('b', 'round')], new Map([['b', 's1']]), new Map(), false);
    expect(out).toHaveLength(1);
  });
  it('drops an unresolved post with a score id even when postType is absent (real rows carry none)', () => {
    const out = dropUnresolvedRounds([p('a')], new Map([['a', 's1']]), new Map(), true);
    expect(out).toHaveLength(0);
  });
  it('keeps a post with neither a score id nor a round type', () => {
    const out = dropUnresolvedRounds([p('a')], new Map(), new Map(), true);
    expect(out).toHaveLength(1);
  });
  it('drops a round-typed post with no score id even when other rounds resolved', () => {
    const out = dropUnresolvedRounds([p('a', 'round'), p('b', 'round')], new Map([['b', 's1']]), new Map([['s1', round]]), true);
    expect(out.map((x: { id: string }) => x.id)).toEqual(['b']);
  });
});
