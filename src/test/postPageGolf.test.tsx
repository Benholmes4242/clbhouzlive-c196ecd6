/** THE POST PAGE, REBUILT AROUND GOLF — rules, post_with writes (no client
 * notification), per-photo tag writes after upload. */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const calls = vi.hoisted(() => ({ tables: [] as string[], inserts: [] as unknown[], rpc: vi.fn(), invoke: vi.fn(), deleted: [] as unknown[] }));
vi.mock('@/integrations/supabase/client', () => {
  const builder = (table: string) => {
    const b: Record<string, unknown> = {};
    const chain = () => b;
    Object.assign(b, {
      insert: (rows: unknown) => { calls.inserts.push({ table, rows }); return Promise.resolve({ error: null }); },
      delete: () => { calls.deleted.push(table); return b; },
      eq: chain, in: chain, order: chain,
      select: () => Promise.resolve({ data: table === 'post_with' ? [] : [], error: null }),
      then: (r: (v: unknown) => unknown) => Promise.resolve({ error: null }).then(r),
    });
    return b;
  };
  return {
    supabase: {
      from: (table: string) => { calls.tables.push(table); return builder(table); },
      rpc: calls.rpc,
      functions: { invoke: calls.invoke },
    },
  };
});
const lib = vi.hoisted(() => ({ holePhoto: vi.fn(), holeVideo: vi.fn(), placePhoto: vi.fn(), placeVideo: vi.fn() }));
vi.mock('@/lib/courseMedia/holePhotoData', async (orig) => ({ ...(await orig<object>()), submitLibraryHolePhoto: lib.holePhoto, submitLibraryHoleVideo: lib.holeVideo }));
vi.mock('@/lib/courseMedia/libraryPlaceMedia', () => ({ submitLibraryPlacePhoto: lib.placePhoto, submitLibraryPlaceVideo: lib.placeVideo }));

import { roundCourseForDay, toggleWith, withLine, holeLine, shareSubLine, slideChip, rankPlayedWith, MAX_PLAYED_WITH } from '@/features/post-v2/lib/golfPostRules';
import { writePostWith, syncPostWith, removeMeFromPost } from '@/features/post-v2/lib/postWith';
import { writeShotTagAfterUpload } from '@/features/post-v2/lib/shotTagWrites';

beforeEach(() => { calls.tables.length = 0; calls.inserts.length = 0; calls.deleted.length = 0; calls.rpc.mockReset(); calls.invoke.mockReset(); Object.values(lib).forEach((f) => f.mockReset()); });

describe('course from the photo date', () => {
  it('one distinct course that day pre-tags it', () => {
    expect(roundCourseForDay([{ course_id: 'a' }, { course_id: 'a' }])).toBe('a');
  });
  it('two courses that day pre-tag nothing', () => {
    expect(roundCourseForDay([{ course_id: 'a' }, { course_id: 'b' }])).toBeNull();
  });
  it('no round that day pre-tags nothing', () => {
    expect(roundCourseForDay([])).toBeNull();
  });
});

describe('played with', () => {
  const p = (id: string) => ({ id, name: `Name ${id}`, avatarUrl: null, sameRound: false, lastInteraction: '' });
  it('never tags the poster', () => {
    expect(toggleWith([], p('me'), 'me')).toHaveLength(0);
  });
  it('caps at eight', () => {
    const eight = Array.from({ length: 8 }, (_, i) => p(String(i)));
    expect(MAX_PLAYED_WITH).toBe(8);
    expect(toggleWith(eight, p('x'), 'me')).toHaveLength(8);
  });
  it('a second tap untags', () => {
    expect(toggleWith([p('a')], p('a'), 'me')).toHaveLength(0);
  });
  it('ranks same course + day first, then most recent mutual interaction, without self', () => {
    const rows = [
      { ...p('old'), lastInteraction: '2026-01-01' },
      { ...p('new'), lastInteraction: '2026-09-01' },
      { ...p('round'), sameRound: true, lastInteraction: '2025-01-01' },
      { ...p('me'), sameRound: true, lastInteraction: '2027-01-01' },
    ];
    expect(rankPlayedWith(rows, 'me').map((r) => r.id)).toEqual(['round', 'new', 'old']);
  });
  it('feed line: one, two, three or more names', () => {
    expect(withLine(['Danny Lee'])).toBe('with Danny');
    expect(withLine(['Danny Lee', 'Thomas Ng'])).toBe('with Danny and Thomas');
    expect(withLine(['Danny', 'Thomas', 'Sam'])).toBe('with Danny and 2 others');
    expect(withLine([])).toBeNull();
  });
});

describe('hole line, share sub-line and slide chip', () => {
  it('no course: no hole line', () => { expect(holeLine(null, 2)).toBeNull(); });
  it('counts hole shots only', () => { expect(holeLine('Sundridge Park Golf Club', 2)?.count).toBe('2 shots'); });
  it('share sub-line names who is notified and how many hole shots', () => {
    expect(shareSubLine(['Danny'], 1)).toBe('Danny will be notified · 1 hole shot added to the course');
  });
  it('par shows only when known', () => {
    expect(slideChip({ hole: 7, par: 4 })).toBe('Hole 7 · Par 4');
    expect(slideChip({ hole: 7, par: null })).toBe('Hole 7');
  });
});

describe('post_with writes', () => {
  it('inserting post_with rows makes no notification call from the client', async () => {
    await writePostWith('post-1', 'me', ['a', 'b', 'me']);
    expect(calls.inserts).toEqual([{ table: 'post_with', rows: [{ post_id: 'post-1', user_id: 'a' }, { post_id: 'post-1', user_id: 'b' }] }]);
    expect(calls.tables.every((t) => t === 'post_with')).toBe(true);
    expect(calls.tables).not.toContain('notifications');
    expect(calls.rpc).not.toHaveBeenCalled();
    expect(calls.invoke).not.toHaveBeenCalled();
  });
  it('edit sync adds and removes without any notification call', async () => {
    await syncPostWith('post-1', 'me', ['a'], ['b']);
    expect(calls.deleted).toEqual(['post_with']);
    expect(calls.tables).not.toContain('notifications');
    expect(calls.rpc).not.toHaveBeenCalled();
    expect(calls.invoke).not.toHaveBeenCalled();
  });
  it('Remove me fails loudly when no row was removed', async () => {
    await expect(removeMeFromPost('post-1', 'a')).rejects.toThrow();
  });
});

describe('per-photo tags are written after upload', () => {
  const file = new File(['x'], 'a.jpg', { type: 'image/jpeg' });
  const job = { items: { m1: { tag: { hole: 7 }, courseId: 'c1', knownHoles: [7] } } };
  it('a hole-tagged photo goes through the Media tab library write once its url exists', async () => {
    await writeShotTagAfterUpload(job, 'me', { id: 'm1', type: 'image', file }, { url: 'https://x/a.jpg' });
    expect(lib.holePhoto).toHaveBeenCalledWith(file, 'https://x/a.jpg', 'c1', 'me', 7, [7]);
  });
  it('an untagged photo writes nothing', async () => {
    await writeShotTagAfterUpload(job, 'me', { id: 'other', type: 'image', file }, { url: 'u' });
    expect(lib.holePhoto).not.toHaveBeenCalled();
  });
  it('a failed tag write never throws into the upload', async () => {
    lib.holePhoto.mockRejectedValueOnce(new Error('boom'));
    await expect(writeShotTagAfterUpload(job, 'me', { id: 'm1', type: 'image', file }, { url: 'u' })).resolves.toBeUndefined();
  });
});
