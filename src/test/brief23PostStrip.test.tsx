import React, { useState } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, renderHook, screen } from '@testing-library/react';
const h = vi.hoisted(() => ({ started: [] as unknown[][] }));
vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));
vi.mock('@/features/post-v2/components/SlideThumb', () => ({ default: () => null }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { rpc: async () => ({ data: { post_id: 'p1', status: 'processing' }, error: null }), from: () => ({ update: () => ({ eq: async () => ({ error: null }) }), insert: async () => ({ error: null }) }) } }));
vi.mock('@/context/ActiveActorContext', () => ({ useActiveActor: () => ({ activeActor: { type: 'personal', id: 'me' } }) }));
vi.mock('@/hooks/useProfileData', () => ({ useProfileData: () => ({ profile: { id: 'me' } }) }));
vi.mock('@/features/post-v2/lib/postUploadController', () => ({ startPostUpload: (...a: unknown[]) => { h.started.push(a); return {}; } }));
vi.mock('@/features/post-v2/lib/videoDetailsWrites', () => ({ writeVideoDetails: async () => {} }));
import { GolfShotStrip } from '@/features/post-v2/components/golf/GolfPostSections';
import { useStageComposer, type StageMediaItem } from '@/features/post-v2/hooks/useStageComposer';
import { usePostSubmit } from '@/features/post-v2/hooks/usePostSubmit';
import { keptMediaDisplayOrders } from '@/features/post-v2/lib/mediaOrder';

const item = (id: string, type: 'image' | 'video' = 'image'): StageMediaItem => ({ id, type, previewUrl: id, frame: 'original' } as StageMediaItem);
const three = [item('a'), item('b', 'video'), item('c')];
function Harness({ initial, onReorder, courseName = null, onTap = vi.fn(), onEdit = vi.fn() }: { initial: StageMediaItem[]; onReorder: (f: number, t: number) => void; courseName?: string | null; onTap?: (i: number) => void; onEdit?: (i: number) => void }) {
  const [media, setMedia] = useState(initial);
  return <GolfShotStrip media={media} tags={{}} courseName={courseName} onTap={onTap} onEdit={onEdit} onAdd={vi.fn()}
    onReorder={(f, t) => { onReorder(f, t); setMedia((m) => { const n = [...m]; const [x] = n.splice(f, 1); n.splice(t, 0, x); return n; }); }} />;
}
const order = () => screen.getAllByTestId('strip-tile').map((el) => el.getAttribute('data-media-id'));
const down = (el: Element, x: number) => fireEvent.pointerDown(el, { pointerId: 1, clientX: x, clientY: 50, button: 0, pointerType: 'touch' });

// jsdom ships no PointerEvent; without it fireEvent drops clientX/pointerId.
if (typeof window.PointerEvent === 'undefined') {
  class PE extends MouseEvent { pointerId: number; pointerType: string; constructor(type: string, init: PointerEventInit = {}) { super(type, init); this.pointerId = init.pointerId ?? 0; this.pointerType = init.pointerType ?? 'mouse'; } }
  (window as unknown as { PointerEvent: unknown }).PointerEvent = PE;
}
beforeEach(() => { h.started.length = 0; });
afterEach(() => { cleanup(); vi.useRealTimers(); });

describe('Brief 23 edit badge', () => {
  it('badge on every media tile and not on the add tile', () => {
    render(<Harness initial={three} onReorder={vi.fn()} />);
    expect(screen.getAllByTestId('strip-edit')).toHaveLength(3);
    expect(screen.getByRole('button', { name: 'Edit video 2' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Add' }).querySelector('[data-testid="strip-edit"]')).toBeNull();
  });
  it('badge tap opens the studio with a course tagged, never the tile tap', () => {
    const onTap = vi.fn(), onEdit = vi.fn();
    render(<Harness initial={three} onReorder={vi.fn()} courseName="Kingsbarns" onTap={onTap} onEdit={onEdit} />);
    fireEvent.click(screen.getByRole('button', { name: 'Edit photo 3' }));
    expect(onEdit).toHaveBeenCalledWith(2); expect(onTap).not.toHaveBeenCalled();
  });
  it('tile tap keeps the shot-tag path', () => {
    const onTap = vi.fn(), onEdit = vi.fn();
    render(<Harness initial={three} onReorder={vi.fn()} courseName="Kingsbarns" onTap={onTap} onEdit={onEdit} />);
    fireEvent.click(screen.getByRole('button', { name: 'Photo 1' }));
    expect(onTap).toHaveBeenCalledWith(0); expect(onEdit).not.toHaveBeenCalled();
  });
  it('shot chip ends before the badge', () => {
    render(<Harness initial={three} onReorder={vi.fn()} courseName="Kingsbarns" />);
    expect(screen.getAllByTestId('shot-chip')[0].style.right).toBe('38px');
    expect(screen.getAllByTestId('strip-edit')[0].style.right).toBe('6px');
  });
});

describe('Brief 23 hold and drag', () => {
  it('hold 300ms, move, release over slot 3 reorders (0, 2) once', () => {
    vi.useFakeTimers(); const spy = vi.fn();
    render(<Harness initial={three} onReorder={spy} />);
    const tile = screen.getAllByTestId('strip-tile')[0];
    down(tile, 50); act(() => { vi.advanceTimersByTime(300); });
    expect(tile.getAttribute('data-lifted')).toBe('true');
    fireEvent.pointerMove(tile, { pointerId: 1, clientX: 250, clientY: 50 });
    fireEvent.pointerUp(tile, { pointerId: 1, clientX: 250, clientY: 50 });
    expect(spy).toHaveBeenCalledTimes(1); expect(spy).toHaveBeenCalledWith(0, 2);
    expect(order()).toEqual(['b', 'c', 'a']);
  });
  it('moving 12px inside 300ms neither lifts nor reorders', () => {
    vi.useFakeTimers(); const spy = vi.fn();
    render(<Harness initial={three} onReorder={spy} />);
    const tile = screen.getAllByTestId('strip-tile')[0];
    down(tile, 50); fireEvent.pointerMove(tile, { pointerId: 1, clientX: 62, clientY: 50 });
    act(() => { vi.advanceTimersByTime(400); });
    expect(tile.getAttribute('data-lifted')).toBeNull();
    fireEvent.pointerUp(tile, { pointerId: 1, clientX: 250, clientY: 50 });
    expect(spy).not.toHaveBeenCalled(); expect(order()).toEqual(['a', 'b', 'c']);
  });
  it('pointer cancel restores the order', () => {
    vi.useFakeTimers(); const spy = vi.fn();
    render(<Harness initial={three} onReorder={spy} />);
    const tile = screen.getAllByTestId('strip-tile')[0];
    down(tile, 50); act(() => { vi.advanceTimersByTime(300); });
    fireEvent.pointerMove(tile, { pointerId: 1, clientX: 250, clientY: 50 });
    fireEvent.pointerCancel(tile, { pointerId: 1 });
    expect(spy).not.toHaveBeenCalled(); expect(order()).toEqual(['a', 'b', 'c']);
    expect(tile.getAttribute('data-lifted')).toBeNull();
  });
});

describe('Brief 23 hint line', () => {
  it('shows with two items, above the hole line', () => {
    render(<GolfShotStrip media={[item('a'), item('b')]} tags={{ a: { hole: 2 } }} courseName="Kingsbarns" onTap={vi.fn()} onAdd={vi.fn()} />);
    const hint = screen.getByTestId('reorder-hint'), hole = screen.getByTestId('hole-line');
    expect(hint.compareDocumentPosition(hole) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(hole.style.paddingTop).toBe('6px');
  });
  it('absent with one item', () => {
    render(<GolfShotStrip media={[item('a')]} tags={{}} courseName={null} onTap={vi.fn()} onAdd={vi.fn()} />);
    expect(screen.queryByTestId('reorder-hint')).toBeNull();
  });
});

describe('Brief 23 order reaches every writer', () => {
  it('submit hands the upload media in the reordered order', async () => {
    const c = renderHook(() => useStageComposer());
    act(() => { c.result.current.hydrate({ media: three }); });
    act(() => { c.result.current.reorder(0, 2); });
    const media = c.result.current.state.media;
    expect(media.map((m) => m.id)).toEqual(['b', 'c', 'a']);
    const s = renderHook(() => usePostSubmit());
    await act(async () => { await s.result.current.submit({ caption: '', media, course: null, scheduledAt: null, actorType: 'personal', actorId: 'me', authorName: 'Me', authorAvatarUrl: null, authorUsername: null } as never); });
    expect((h.started[0][1] as StageMediaItem[]).map((m) => m.id)).toEqual(['b', 'c', 'a']);
  });
  it('edit mode numbers kept media by the new positions', () => {
    const kept = [{ ...item('b'), existingId: 'eb' }, item('new'), { ...item('a'), existingId: 'ea' }];
    expect(keptMediaDisplayOrders(kept)).toEqual([{ existingId: 'eb', display_order: 0 }, { existingId: 'ea', display_order: 1 }]);
  });
});
