import React, { useState } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { readFileSync } from 'node:fs';
const h = vi.hoisted(() => ({ events: [] as unknown[], place: vi.fn(), remove: vi.fn() }));
vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { from: (table: string) => ({ update: (patch: unknown) => { h.events.push([table, patch]); return { eq: async () => ({ error: null }) }; } }) } }));
vi.mock('@/lib/courseMedia/removeHoleTag', () => ({ removeHoleTag: async (...args: unknown[]) => { h.events.push('remove'); return h.remove(...args); } }));
vi.mock('@/lib/courseMedia/libraryPlaceMedia', () => ({ submitLibraryPlacePhoto: h.place, submitLibraryPlaceVideo: h.place }));
vi.mock('@/components/course-media-tab/hooks/useCoursePlaceMedia', () => ({ removeCoursePlaceMedia: vi.fn(), submitCoursePlaceMedia: vi.fn() }));
import { existingTagFor, rewriteExistingShotTag, shotMediaPatch, writeShotTagAfterUpload } from '@/features/post-v2/lib/shotTagWrites';
import { holeLine, toggleWith, type WithCandidate } from '@/features/post-v2/lib/golfPostRules';
import { mediaHoleNo, type PostGolfContext } from '@/hooks/feed/usePostGolfContext';
import { FullscreenHoleChipSlot } from '@/components/feed/PostGolfContext';
import { PlayedWithSection, GolfShotStrip } from '@/features/post-v2/components/golf/GolfPostSections';
const ctx: PostGolfContext = { postId: 'p', courseId: 'c', holeNo: 15, shotTags: [], roundScoreId: null, roundGross: null, roundPar: null, roundPlayDate: null, roundHoles: null };
const person = (id: string): WithCandidate => ({ id, name: `Thomas ${id}`, username: id, homeClub: 'Sundridge Park', avatarUrl: null, sameRound: false, lastInteraction: '' });
beforeEach(() => { h.events.length = 0; h.place.mockReset(); h.remove.mockReset(); });
afterEach(cleanup);
describe('PF4 shot persistence', () => {
  it('a shot hole is carried by its own insert', () => { expect(shotMediaPatch({ items: { m: { tag: { hole: 2 }, courseId: 'c', knownHoles: [] } } }, 'm')).toEqual({ hole_no: 2 }); });
  it('an untagged shot carries no hole', () => { expect(shotMediaPatch(undefined, 'm')).toEqual({ hole_no: null }); });
  it('a place does not become a hole', () => { expect(shotMediaPatch({ items: { m: { tag: { place: 'clubhouse' }, courseId: 'c', knownHoles: [] } } }, 'm')).toEqual({ hole_no: null }); });
  it.each([[true, 'anyone', 1], [true, 'followers', 0], [true, 'private', 0], [false, 'anyone', 0]])('place publication personal=%s audience=%s', async (personal, visibility, count) => {
    await writeShotTagAfterUpload({ items: { m: { tag: { place: 'clubhouse' }, courseId: 'c', knownHoles: [] } }, personal, visibility }, 'me', { id: 'm', type: 'image', file: new File(['a'], 'a.jpg') }, { url: 'u' });
    expect(h.place).toHaveBeenCalledTimes(count);
  });
  it('hydration prefers shot hole over old URL tag', () => { expect(existingTagFor('u', { holes: [{ media_url: 'u', hole_no: 7 }] as never, places: [] }, 2)).toEqual({ hole: 2 }); });
  it('hydration falls back to old URL tag', () => { expect(existingTagFor('u', { holes: [{ media_url: 'u', hole_no: 7 }] as never, places: [] }, null)).toEqual({ hole: 7 }); });
  it('retag removes old URL row before setting shot hole', async () => { await rewriteExistingShotTag('c', 'me', [], { existingId: 'm', type: 'image', previewUrl: 'u' }, { hole: 4 }, { holes: [{ media_url: 'u' }] as never, places: [] }, 'me'); expect(h.events).toEqual(['remove', ['post_media', { hole_no: 4 }]]); });
  it('untag clears shot hole', async () => { await rewriteExistingShotTag('c', 'me', [], { existingId: 'm', type: 'image', previewUrl: 'u' }, null, { holes: [], places: [] }, 'me'); expect(h.events).toEqual([['post_media', { hole_no: null }]]); });
  it('composer writer has no client hole-library inserts', () => { const source = readFileSync('src/features/post-v2/lib/shotTagWrites.ts', 'utf8'); expect(source).not.toMatch(/submitLibraryHolePhoto|submitLibraryHoleVideo|submitHolePhoto\(/); });
});
describe('PF4 audience rules', () => {
  it('Everyone retains hole-page count', () => { expect(holeLine('Kingsbarns', 2)?.count).toBe('2 shots'); });
  it('Followers can open visibility', () => { expect(holeLine('Kingsbarns', 2, 'followers')?.visibilityAction).toBe(true); });
  it('business never offers hole-page count', () => { expect(holeLine('Kingsbarns', 2, 'anyone', false)?.count).toBeNull(); });
  it('no tags retain the untagged state', () => { expect(holeLine('Kingsbarns', 0, 'followers')?.visibilityAction).toBeUndefined(); });
  it('audience explanation opens the visibility callback', () => { const open = vi.fn(); render(<GolfShotStrip media={[{ id: 'm', type: 'image', previewUrl: 'u', frame: 'original' }]} tags={{ m: { hole: 2 } }} courseName="Kingsbarns" onTap={vi.fn()} onAdd={vi.fn()} visibility="followers" onVisibility={open}/>); fireEvent.click(screen.getByTestId('hole-line').querySelector('button') as HTMLButtonElement); expect(open).toHaveBeenCalledOnce(); });
});
describe('PF4 per-slide resolution', () => {
  it('media identity wins over display order', () => { expect(mediaHoleNo({ ...ctx, mediaHoles: [{ mediaId: 'm', displayOrder: 8, holeNo: 2 }, { mediaId: 'other', displayOrder: 1, holeNo: 4 }] }, { id: 'm', displayOrder: 1 }, 1)).toBe(2); });
  it('display order resolves when identity is absent', () => { expect(mediaHoleNo({ ...ctx, mediaHoles: [{ mediaId: 'old', displayOrder: 2, holeNo: 4 }] }, { id: 'new', displayOrder: 2 }, 2)).toBe(4); });
  it('cleared shot never inherits legacy hole', () => { expect(mediaHoleNo({ ...ctx, mediaHoles: [{ mediaId: 'm', displayOrder: 0, holeNo: null }] }, { id: 'm' }, 0)).toBeNull(); });
  it('legacy applies only on first slide', () => { expect(mediaHoleNo(ctx, { id: 'm' }, 0)).toBe(15); expect(mediaHoleNo(ctx, { id: 'm' }, 1)).toBeNull(); });
  it('fullscreen later slide uses its own hole metadata', () => { render(<FullscreenHoleChipSlot context={{ ...ctx, mediaHoles: [{ mediaId: 'm', displayOrder: 2, holeNo: 4 }] }} item={{ id: 'm' }} activeSlide={2} hole={null} holes={[{ hole_no: 4, par: 5, yards: 520, si: 1 }]}/>); expect(screen.getByTestId('post-hole-chip')).toHaveTextContent('4TH'); expect(screen.getByTestId('post-hole-chip')).toHaveTextContent('520 YDS'); });
});
describe('PF4 inline Played with', () => {
  function Demo({ initial = [] }: { initial?: WithCandidate[] }) { const [tagged, setTagged] = useState(initial); return <PlayedWithSection suggestions={[person('one'), person('me')]} tagged={tagged} selfId="me" search={async () => [person('two'), person('me')]} onToggle={p => setTagged(cur => toggleWith(cur, p, 'me'))}/>; }
  it('focus shows suggestions without yourself', () => { render(<Demo/>); fireEvent.focus(screen.getByRole('textbox')); expect(screen.getByRole('button', { name: /Thomas one/ })).toBeInTheDocument(); expect(screen.queryByRole('button', { name: /Thomas me/ })).toBeNull(); });
  it('typing shows inline results and adding clears the field', async () => { render(<Demo/>); const field = screen.getByRole('textbox'); fireEvent.focus(field); fireEvent.change(field, { target: { value: 'Tho' } }); fireEvent.click(await screen.findByRole('button', { name: /Thomas two/ })); expect(field).toHaveValue(''); expect(screen.getByRole('button', { name: 'Remove Thomas two' })).toBeInTheDocument(); });
  it('chosen chips remove people', () => { render(<Demo initial={[person('one')]}/>); fireEvent.click(screen.getByRole('button', { name: 'Remove Thomas one' })); expect(screen.queryByRole('button', { name: 'Remove Thomas one' })).toBeNull(); });
  it('eight chosen disables search', () => { render(<Demo initial={Array.from({ length: 8 }, (_, i) => person(String(i)))}/>); expect(screen.getByRole('textbox')).toBeDisabled(); });
});