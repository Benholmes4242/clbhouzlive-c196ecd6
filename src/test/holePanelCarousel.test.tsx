import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import type { CourseHole } from '@/hooks/gam/useCourseHoleAnalysis';
import type { HolePhoto } from '@/lib/courseMedia/holePhotoData';

vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));
const hls = vi.hoisted(() => ({ attach: vi.fn(() => ({ detach: vi.fn() })) }));
vi.mock('@/components/explore-tab-new/courseled/tileHlsPlayer', () => ({ attachTileHls: hls.attach }));

import { HoleWalk } from '@/components/course-media-tab/HoleWalk';
import { MediaPreviewViewer } from '@/components/shared/media/MediaPreviewViewer';
import { addedMonthLabel } from '@/lib/courseMedia/addedMonth';

afterEach(() => cleanup());

const hole = (n: number): CourseHole => ({ hole_no: n, par: 4, yards: 432, stroke_index: 1, avg_to_par: 0.8, avg_gross: 4.8, rounds: 10, dist: { ace: 0, albatross: 0, eagle: 0, birdie: 1, par: 5, bogey: 3, double: 1 } });
const shot = (id: string, over: Partial<HolePhoto> = {}): HolePhoto => ({
  id, hole_no: 14, status: 'approved', user_id: 'u1', media_type: 'image',
  media_url: `/${id}.jpg`, exif_captured_at: '2025-01-05T12:00:00Z',
  added_at: '2026-03-11T10:00:00Z', ...over,
}) as HolePhoto;
const video = (id: string, duration: number | null): HolePhoto => shot(id, {
  // buildHlsUrl only accepts a 32-hex Cloudflare UID, so the fixture uses one.
  media_type: 'video', stream_id: id.padEnd(32, '0').slice(0, 32).replace(/[^a-f0-9]/gi, '0'), poster_url: `/${id}-poster.jpg`, duration_seconds: duration,
});
const authors = new Map([['u1', 'Thomas Holmes'], ['u2', 'Benjamin Holmes']]);

const walk = (rows: HolePhoto[], props: Partial<Parameters<typeof HoleWalk>[0]> = {}) => {
  const view = render(<HoleWalk available holes={[hole(14)]} rows={rows} totalMedia={rows.length} courseName="Royal Portrush Golf Club (Dunluce)" authors={authors} onAddFirst={() => {}} {...props} />);
  fireEvent.click(screen.getByRole('button', { name: 'Hole 14' }));
  return view;
};
const panel = () => screen.getByRole('region', { name: 'Hole 14' });

describe('BRIEF_HOLE_PANEL_CAROUSEL frame and strip', () => {
  it('three shots render three slides, a "1 / 3" chip and a three-button strip with the first current', () => {
    walk([shot('a'), shot('b', { user_id: 'u2', added_at: '2026-06-02T09:00:00Z' }), video('c', 42)]);
    expect(panel().querySelectorAll('.hole-walk-slide')).toHaveLength(3);
    expect(panel().querySelector('.hole-walk-frame-count')?.textContent).toBe('1 / 3');
    const buttons = screen.getAllByRole('button', { name: /^Show shot \d of 3$/ });
    expect(buttons).toHaveLength(3);
    expect(buttons[0]).toHaveAttribute('aria-current', 'true');
    expect(buttons[1]).not.toHaveAttribute('aria-current');
  });

  it('tapping strip button 2 makes it current, moves the chip and the owner row follows that shot', () => {
    walk([shot('a'), shot('b', { user_id: 'u2', added_at: '2026-06-02T09:00:00Z' }), video('c', 42)], { memberId: 'u2', onMove: () => {}, onRemove: () => {} });
    expect(panel().querySelector('.hole-walk-owner')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Show shot 2 of 3' }));
    expect(screen.getByRole('button', { name: 'Show shot 2 of 3' })).toHaveAttribute('aria-current', 'true');
    expect(screen.getByRole('button', { name: 'Show shot 1 of 3' })).not.toHaveAttribute('aria-current');
    expect(panel().querySelector('.hole-walk-frame-count')?.textContent).toBe('2 / 3');
    expect(panel().querySelector('.hole-walk-owner')).not.toBeNull();
  });

  it('one shot renders no chip and no strip', () => {
    walk([shot('a')]);
    expect(panel().querySelector('.hole-walk-slide')).not.toBeNull();
    expect(panel().querySelector('.hole-walk-frame-count')).toBeNull();
    expect(panel().querySelector('.hole-walk-strip')).toBeNull();
  });

  it('the caption reads the added-to-clbhouz month and ignores the EXIF capture date', () => {
    walk([shot('a')]);
    const caption = panel().querySelector('.hole-walk-caption');
    expect(caption?.textContent).toBe('Thomas Holmes · Mar 2026');
    expect(caption?.textContent).not.toContain('2025');
  });

  it('a video slide shows its poster with the decorative disc and never a playable element', () => {
    walk([video('c', 42)]);
    expect(panel().querySelector('.hole-walk-play-disc')).not.toBeNull();
    expect(panel().querySelector('video')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Play video' })).toBeNull();
  });
});

describe('BRIEF_HOLE_PANEL_CAROUSEL fullscreen viewer', () => {
  const viewer = () => {
    const el = document.querySelector('.fixed.inset-0');
    expect(el).not.toBeNull();
    return within(el as HTMLElement);
  };
  it('tapping the second slide opens the viewer on that shot with the hole caption', () => {
    walk([shot('a'), shot('b', { user_id: 'u2', added_at: '2026-06-02T09:00:00Z' }), video('c', 42)]);
    fireEvent.click(panel().querySelectorAll('.hole-walk-slide')[1] as HTMLElement);
    expect(viewer().getByText('2 / 3')).toBeInTheDocument();
    expect(viewer().getByText('The fourteenth')).toBeInTheDocument();
    expect(viewer().getByText('Royal Portrush (Dunluce) · Par 4 · 432 yards')).toBeInTheDocument();
    expect(viewer().getByText('Benjamin Holmes · Jun 2026')).toBeInTheDocument();
  });

  it('a processing video slide does not open the viewer and is not in its items', () => {
    walk([shot('a'), video('p', null)]);
    fireEvent.click(panel().querySelectorAll('.hole-walk-slide')[1] as HTMLElement);
    expect(document.querySelector('[data-viewer-caption]')).toBeNull();
    fireEvent.click(panel().querySelectorAll('.hole-walk-slide')[0] as HTMLElement);
    expect(viewer().getByText('The fourteenth')).toBeInTheDocument();
    expect(viewer().queryByText('1 / 2')).toBeNull();
    expect(viewer().getByText('Thomas Holmes · Mar 2026')).toBeInTheDocument();
  });

  it('closing the viewer returns the frame to the shot that was showing', () => {
    walk([shot('a'), shot('b', { user_id: 'u2', added_at: '2026-06-02T09:00:00Z' }), video('c', 42)]);
    fireEvent.click(panel().querySelectorAll('.hole-walk-slide')[0] as HTMLElement);
    fireEvent.click(viewer().getByRole('button', { name: 'Next' }));
    expect(viewer().getByText('2 / 3')).toBeInTheDocument();
    fireEvent.click(viewer().getByRole('button', { name: 'Back' }));
    expect(panel().querySelector('.hole-walk-frame-count')?.textContent).toBe('2 / 3');
    expect(screen.getByRole('button', { name: 'Show shot 2 of 3' })).toHaveAttribute('aria-current', 'true');
  });

  it('a video item carries hlsUrl and the viewer attaches the stream instead of src', () => {
    walk([video('c', 42)]);
    hls.attach.mockClear();
    fireEvent.click(panel().querySelector('.hole-walk-slide') as HTMLElement);
    const el = document.querySelector('video');
    expect(el).not.toBeNull();
    expect(el?.getAttribute('src')).toBeNull();
    expect(hls.attach).toHaveBeenCalledTimes(1);
  });
});

describe('BRIEF_HOLE_PANEL_CAROUSEL viewer callers without the new fields', () => {
  it('render exactly as before: no caption, video src from previewUrl', () => {
    render(<MediaPreviewViewer
      items={[
        { id: 'i1', type: 'image', previewUrl: '/one.jpg', order: 0 },
        { id: 'v1', type: 'video', previewUrl: '/two.mp4', thumbnailUrl: '/two.jpg', order: 1 },
      ]}
      initialIndex={0}
      onClose={() => {}}
    />);
    expect(screen.getByText('1 / 2')).toBeInTheDocument();
    hls.attach.mockClear();
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    const el = document.querySelector('video');
    expect(el?.getAttribute('src')).toBe('/two.mp4');
    expect(hls.attach).not.toHaveBeenCalled();
    expect(document.querySelector('[data-viewer-caption]')).toBeNull();
  });
});

describe('BRIEF_HOLE_PANEL_CAROUSEL shared added-month helper', () => {
  it('formats the UTC month and four-digit year', () => {
    expect(addedMonthLabel('2026-03-11T10:00:00Z')).toBe('Mar 2026');
    expect(addedMonthLabel('2026-03-31T23:30:00-02:00')).toBe('Apr 2026');
  });
  it('returns null for missing or invalid values', () => {
    expect(addedMonthLabel(null)).toBeNull();
    expect(addedMonthLabel(undefined)).toBeNull();
    expect(addedMonthLabel('not-a-date')).toBeNull();
  });
});
