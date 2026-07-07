import { describe, it, expect } from 'vitest';
import {
  parseMentionSegments,
  extractMentions,
  serializeMention,
  stripMentionMarkup,
  diffMentions,
} from '../format';

const U1 = '11111111-2222-3333-4444-555555555555';
const U2 = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
const B1 = 'ffffffff-1111-2222-3333-444444444444';

describe('mentions/format', () => {
  it('parses a plain string with no mentions', () => {
    const segs = parseMentionSegments('just some plain text');
    expect(segs).toEqual([{ kind: 'text', text: 'just some plain text' }]);
  });

  it('parses a single user mention in the middle', () => {
    const segs = parseMentionSegments(`hey @[Alex](u:${U1}) how are you?`);
    expect(segs).toHaveLength(3);
    expect(segs[0]).toMatchObject({ kind: 'text', text: 'hey ' });
    expect(segs[1]).toMatchObject({ kind: 'mention', text: 'Alex', entityType: 'user', entityId: U1 });
    expect(segs[2]).toMatchObject({ kind: 'text', text: ' how are you?' });
  });

  it('handles mention at the very start and end', () => {
    const start = parseMentionSegments(`@[Alex](u:${U1}) rest`);
    expect(start[0].kind).toBe('mention');
    const end = parseMentionSegments(`hello @[Alex](u:${U1})`);
    expect(end[end.length - 1].kind).toBe('mention');
  });

  it('handles back-to-back mentions with no separator', () => {
    const segs = parseMentionSegments(`@[Alex](u:${U1})@[Golf Co](b:${B1})`);
    expect(segs).toHaveLength(2);
    expect(segs[0].entityType).toBe('user');
    expect(segs[1].entityType).toBe('business');
  });

  it('accepts display names with emoji and apostrophes', () => {
    const segs = parseMentionSegments(`hi @[O'Malley 🏌️](u:${U1})!`);
    expect(segs[1]).toMatchObject({ text: "O'Malley 🏌️", entityId: U1 });
  });

  it('renders malformed markup as literal text', () => {
    const bad = `not a mention @[Alex](u:not-a-uuid) trailing`;
    const segs = parseMentionSegments(bad);
    expect(segs).toHaveLength(1);
    expect(segs[0].kind).toBe('text');
  });

  it('extractMentions dedupes by (type,id)', () => {
    const text = `@[Alex](u:${U1}) and @[A. Jones](u:${U1}) and @[Bee](u:${U2})`;
    const out = extractMentions(text);
    expect(out).toHaveLength(2);
    expect(out.map(m => m.entityId)).toEqual([U1, U2]);
  });

  it('serializeMention round-trips', () => {
    const s = serializeMention({ display: 'Alex', entityType: 'user', entityId: U1 });
    expect(s).toBe(`@[Alex](u:${U1})`);
    const segs = parseMentionSegments(`x ${s} y`);
    expect(segs[1]).toMatchObject({ entityType: 'user', entityId: U1, text: 'Alex' });
  });

  it('serializeMention strips ] from display', () => {
    const s = serializeMention({ display: 'Al]ex', entityType: 'business', entityId: B1 });
    expect(s).toBe(`@[Alex](b:${B1})`);
  });

  it('stripMentionMarkup produces plain @Display Name', () => {
    const text = `Hey @[Alex](u:${U1}) at @[Golf Co](b:${B1})!`;
    expect(stripMentionMarkup(text)).toBe('Hey @Alex at @Golf Co!');
  });

  it('diffMentions reports added and removed', () => {
    const before = extractMentions(`@[A](u:${U1}) @[B](u:${U2})`);
    const after = extractMentions(`@[A](u:${U1}) @[C](b:${B1})`);
    const diff = diffMentions(before, after);
    expect(diff.removed.map(m => m.entityId)).toEqual([U2]);
    expect(diff.added.map(m => m.entityId)).toEqual([B1]);
  });
});
