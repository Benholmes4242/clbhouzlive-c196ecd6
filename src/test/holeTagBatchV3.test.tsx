/** BRIEF_HOLE_TAG_BATCH_V3 — batch window: select, confirm, stay open. */
import React from 'react';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { HolePhotoBatchPath } from '@/components/course-media-tab/HolePhotoFastPaths';
import { HolePhotoPicker } from '@/components/course-media-tab/HolePhotoPicker';
import { HolePhotoTagDialog } from '@/components/course-media-tab/HolePhotoTagDialog';
import { memberTagConfirmation, adminTagConfirmation } from '@/lib/courseMedia/holeTagConfirmation';
import type { BatchPhoto } from '@/lib/courseMedia/holePhotoBatch';
import type { HolePhoto } from '@/lib/courseMedia/holePhotoData';

const photo = (url: string, ownerName?: string): BatchPhoto & { ownerName?: string } => ({ url, createdAt: '2026-10-01T12:00:00Z', ownerName, exif: { captureDay: null, capturedAt: null, latitude: null, longitude: null } });
const shots = (n: number) => Array.from({ length: n }, (_, i) => photo(`/${i + 1}.jpg`));
const ok = () => vi.fn().mockResolvedValue({ status: 'approved' } as HolePhoto);
const hero = () => screen.getByAltText('Current photograph');
const confirmBtn = () => screen.getByRole('button', { name: /Confirm tag|Tagging\.\.\.|All tagged/ });
const pick = (n: number) => fireEvent.click(screen.getByRole('button', { name: `Hole ${n}` }));
const confirm = () => fireEvent.click(confirmBtn());
afterEach(cleanup);

describe('selection and confirm', () => {
  it('tapping a hole selects it without calling onTag', () => {
    const tag = ok(); render(<HolePhotoBatchPath photos={shots(2)} knownHoles={[4, 7]} onTag={tag} onClose={() => {}} />);
    pick(7);
    expect(tag).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Hole 7' })).toHaveAttribute('aria-pressed', 'true');
  });
  it('Confirm tag is disabled with no selection, enabled with one, and tags the current url and hole', async () => {
    const tag = ok(); render(<HolePhotoBatchPath photos={shots(2)} knownHoles={[4, 7]} onTag={tag} onClose={() => {}} />);
    expect(confirmBtn()).toBeDisabled(); expect(confirmBtn()).toHaveTextContent('Confirm tag');
    pick(4); expect(confirmBtn()).toBeEnabled();
    confirm(); await waitFor(() => expect(tag).toHaveBeenCalledWith('/1.jpg', 4));
  });
  it('changing the selection before confirming tags the last selected hole', async () => {
    const tag = ok(); render(<HolePhotoBatchPath photos={shots(2)} knownHoles={[4, 7]} onTag={tag} onClose={() => {}} />);
    pick(4); pick(7); confirm();
    await waitFor(() => expect(tag).toHaveBeenCalledTimes(1)); expect(tag).toHaveBeenCalledWith('/1.jpg', 7);
  });
  it('after a tag the selection clears and the next untagged shot becomes the hero', async () => {
    render(<HolePhotoBatchPath photos={shots(3)} knownHoles={[4, 7]} onTag={ok()} onClose={() => {}} />);
    pick(4); confirm();
    await waitFor(() => expect(hero()).toHaveAttribute('src', '/2.jpg'));
    expect(screen.getByRole('button', { name: 'Hole 4' })).toHaveAttribute('aria-pressed', 'false');
    expect(confirmBtn()).toBeDisabled();
  });
  it('wraps around to an earlier untagged shot', async () => {
    render(<HolePhotoBatchPath photos={shots(3)} knownHoles={[4]} onTag={ok()} onClose={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: 'Shot 3 of 3' }));
    pick(4); confirm();
    await waitFor(() => expect(hero()).toHaveAttribute('src', '/1.jpg'));
  });
  it('"All tagged" when nothing is left, window still open, grid disabled', async () => {
    const close = vi.fn(); render(<HolePhotoBatchPath photos={shots(1)} knownHoles={[4, 7]} onTag={ok()} onClose={close} />);
    pick(7); confirm();
    await waitFor(() => expect(confirmBtn()).toHaveTextContent('All tagged'));
    expect(confirmBtn()).toBeDisabled(); expect(close).not.toHaveBeenCalled();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(hero()).toHaveAttribute('src', '/1.jpg');
    expect(screen.getByRole('button', { name: 'Hole 4' })).toBeDisabled();
  });
  it('Close closes and is disabled while a tag is pending', async () => {
    let release!: (v: HolePhoto) => void;
    const tag = vi.fn(() => new Promise<HolePhoto>(res => { release = res; }));
    const close = vi.fn(); render(<HolePhotoBatchPath photos={shots(2)} knownHoles={[4]} onTag={tag} onClose={close} />);
    pick(4); confirm();
    await waitFor(() => expect(confirmBtn()).toHaveTextContent('Tagging...'));
    expect(confirmBtn()).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Close' })).toBeDisabled();
    await act(async () => { release({ status: 'approved' } as HolePhoto); });
    fireEvent.click(screen.getByRole('button', { name: 'Close' })); expect(close).toHaveBeenCalledTimes(1);
  });
});

describe('thumbnails and hero', () => {
  it('tapping an untagged thumbnail changes the hero with no write', () => {
    const tag = ok(); render(<HolePhotoBatchPath photos={shots(3)} knownHoles={[4]} onTag={tag} onClose={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: 'Shot 2 of 3' }));
    expect(hero()).toHaveAttribute('src', '/2.jpg'); expect(tag).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Shot 2 of 3' })).toHaveAttribute('aria-current', 'true');
  });
  it('a tagged thumbnail cannot be re-tagged', async () => {
    const tag = ok(); render(<HolePhotoBatchPath photos={shots(3)} knownHoles={[4]} onTag={tag} onClose={() => {}} />);
    pick(4); confirm();
    const tagged = await screen.findByRole('button', { name: 'Shot 1 of 3, tagged to the 4th' });
    expect(tagged).toHaveAttribute('aria-disabled', 'true');
    expect(tagged.querySelector('.hole-photo-batch-badge')?.textContent).toBe('4');
    fireEvent.click(tagged);
    expect(hero()).toHaveAttribute('src', '/2.jpg');
    expect(tag).toHaveBeenCalledTimes(1);
  });
  it('the chip shows position / n', () => {
    const { baseElement } = render(<HolePhotoBatchPath photos={shots(12)} knownHoles={[4]} onTag={ok()} onClose={() => {}} />);
    expect(baseElement.querySelector('[data-chip]')?.textContent).toBe('1 / 12');
    fireEvent.click(screen.getByRole('button', { name: 'Shot 5 of 12' }));
    expect(baseElement.querySelector('[data-chip]')?.textContent).toBe('5 / 12');
  });
  it('no Skip or Done button exists', () => {
    render(<HolePhotoBatchPath photos={shots(2)} knownHoles={[4]} onTag={ok()} onClose={() => {}} />);
    expect(screen.queryByRole('button', { name: /Skip/ })).toBeNull();
    expect(screen.queryByRole('button', { name: /^Done$/ })).toBeNull();
  });
  it('renders all 100 shots in one non-wrapping row; sheet keeps its max-height rules', () => {
    const { baseElement } = render(<HolePhotoBatchPath photos={shots(100)} knownHoles={[4]} onTag={ok()} onClose={() => {}} />);
    const row = baseElement.querySelector('.hole-photo-batch-row');
    expect(row?.querySelectorAll('.hole-photo-batch-thumb')).toHaveLength(100);
    const css = readFileSync('src/components/course-media-tab/hole-photo-fast.css', 'utf8');
    expect(css).toMatch(/\.hole-photo-batch-row \{[^}]*flex-wrap: nowrap/);
    expect(css).toMatch(/\.hole-photo-batch-strip \{[^}]*overflow-x: auto/);
    expect(css).toMatch(/\.hole-photo-fast-sheet \{[^}]*max-height: calc\(100vh - 48px\); max-height: calc\(100dvh - 48px\); overflow-y: auto/);
  });
});

describe('confirmation copy', () => {
  it('member first and second tag, counting existingHoleTags', async () => {
    expect(memberTagConfirmation(9, 1)).toBe('Tag confirmed on the 9th.');
    expect(memberTagConfirmation(9, 2)).toBe('Tag confirmed. This is your second tag on the 9th.');
    render(<HolePhotoBatchPath photos={shots(3)} knownHoles={[9]} existingHoleTags={[9, 3]} onTag={ok()} onClose={() => {}} />);
    pick(9); confirm();
    expect(await screen.findByRole('status')).toHaveTextContent('Tag confirmed. This is your second tag on the 9th.');
    pick(9); confirm();
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Tag confirmed. This is your third tag on the 9th.'));
  });
  it('member first tag with no existing tags', async () => {
    render(<HolePhotoBatchPath photos={shots(2)} knownHoles={[9]} onTag={ok()} onClose={() => {}} />);
    pick(9); confirm();
    expect(await screen.findByRole('status')).toHaveTextContent('Tag confirmed on the 9th.');
  });
  it('admin copy with and without owner name', async () => {
    expect(adminTagConfirmation(9, '')).toBe('Tag confirmed on the 9th.');
    render(<HolePhotoBatchPath adminMode photos={[photo('/a.jpg', 'Thomas Holmes'), photo('/b.jpg')]} knownHoles={[9]} existingHoleTags={[9]} onTag={ok()} onClose={() => {}} />);
    pick(9); confirm();
    expect(await screen.findByRole('status')).toHaveTextContent('Tag confirmed on the 9th for Thomas Holmes.');
    pick(9); confirm();
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent(/^Tag confirmed on the 9th\.$/));
  });
  it('an error hides the confirmation and keeps shot and selection', async () => {
    const tag = vi.fn().mockResolvedValueOnce({ status: 'approved' } as HolePhoto).mockRejectedValueOnce(new Error('nope'));
    render(<HolePhotoBatchPath photos={shots(3)} knownHoles={[4]} onTag={tag} onClose={() => {}} />);
    pick(4); confirm(); await screen.findByRole('status');
    pick(4); confirm(); await screen.findByRole('alert');
    expect(screen.queryByRole('status')).toBeNull();
    expect(hero()).toHaveAttribute('src', '/2.jpg');
    expect(screen.getByRole('button', { name: 'Hole 4' })).toHaveAttribute('aria-pressed', 'true');
  });
  it('admin 23505 marks the shot unavailable and moves on', async () => {
    const tag = vi.fn().mockRejectedValueOnce({ code: '23505' }).mockResolvedValue({ status: 'approved' } as HolePhoto);
    render(<HolePhotoBatchPath adminMode photos={shots(2)} knownHoles={[4]} onTag={tag} onClose={() => {}} />);
    pick(4); confirm();
    expect(await screen.findByRole('alert')).toHaveTextContent('That shot is already tagged.');
    expect(hero()).toHaveAttribute('src', '/2.jpg');
    const first = screen.getByRole('button', { name: 'Shot 1 of 2' });
    expect(first).toHaveAttribute('data-unavailable', 'true'); expect(first).toHaveAttribute('aria-disabled', 'true');
    expect(first.querySelector('.hole-photo-batch-badge')).toBeNull();
    pick(4); confirm();
    await waitFor(() => expect(confirmBtn()).toHaveTextContent('All tagged'));
  });
});

describe('picker has no used-hole treatment', () => {
  it('renders no green and no note anywhere', () => {
    const { container } = render(<HolePhotoPicker holeCount={9} selectedHole={3} onSelect={() => {}} />);
    expect(container.querySelector('p')).toBeNull();
    for (const b of container.querySelectorAll('button')) {
      expect(['open', 'closed']).toContain(b.getAttribute('data-state'));
      expect(b.getAttribute('style') ?? '').not.toMatch(/34, ?197, ?94|52, ?211, ?153|4ADE80|2FA35A|IMPROVED/i);
    }
    const src = readFileSync('src/components/course-media-tab/HolePhotoPicker.tsx', 'utf8');
    expect(src).not.toMatch(/IMPROVED|usedHoles|already tagged/);
  });
  it('tag dialog keeps tap-to-tag with no note', () => {
    const submit = vi.fn();
    render(<HolePhotoTagDialog imageUrl="/p.jpg" holeCount={3} knownHoleNumbers={[1, 2, 3]} pending={false} error={null} onClose={() => {}} onSubmit={submit} />);
    fireEvent.click(screen.getByRole('button', { name: 'Hole 2' })); expect(submit).toHaveBeenCalledWith(2);
    expect(screen.queryByText(/already tagged/)).toBeNull();
  });
});
