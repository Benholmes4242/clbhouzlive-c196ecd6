import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';

vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));
const hls = vi.hoisted(() => ({ attach: vi.fn(() => ({ detach: vi.fn() })) }));
vi.mock('@/components/explore-tab-new/courseled/tileHlsPlayer', () => ({ attachTileHls: hls.attach }));

import { MediaPreviewViewer } from '@/components/shared/media/MediaPreviewViewer';

afterEach(cleanup);

const items = [
  { id: 'i1', type: 'image' as const, previewUrl: '/one.jpg', order: 0 },
  { id: 'i2', type: 'image' as const, previewUrl: '/two.jpg', order: 1 },
];

const swipeSurface = () => {
  const el = document.querySelector('.fixed.inset-0 .absolute.inset-0.flex') as HTMLElement | null;
  expect(el).not.toBeNull();
  return el as HTMLElement;
};

const drag = (el: HTMLElement, fromX: number, toX: number) => {
  fireEvent.touchStart(el, { targetTouches: [{ clientX: fromX, clientY: 400 }] });
  fireEvent.touchMove(el, { targetTouches: [{ clientX: toX, clientY: 400 }] });
};

describe('BRIEF_COURSES_LATEST_FROM_COURSES §8 edge bounce', () => {
  it('a right drag on the first item moves the media by dx * 0.35, capped at 80px, and springs back without changing the index', async () => {
    render(<MediaPreviewViewer items={items} initialIndex={0} onClose={() => {}} edgeBounce />);
    const el = swipeSurface();
    drag(el, 100, 300); // dx 200 -> 70px
    await waitFor(() => expect(el.style.transform).toBe('translateX(70px)'));
    drag(el, 100, 500); // dx 400 -> capped at 80px
    await waitFor(() => expect(el.style.transform).toBe('translateX(80px)'));
    fireEvent.touchEnd(el, { targetTouches: [] });
    await waitFor(() => expect(el.style.transform).toBe(''));
    expect(screen.getByText('1 / 2')).toBeInTheDocument();
  });

  it('a left drag on the last item bounces and the index stays on the last item', async () => {
    render(<MediaPreviewViewer items={items} initialIndex={1} onClose={() => {}} edgeBounce />);
    const el = swipeSurface();
    drag(el, 300, 100); // dx -200 -> -70px
    await waitFor(() => expect(el.style.transform).toBe('translateX(-70px)'));
    fireEvent.touchEnd(el, { targetTouches: [] });
    await waitFor(() => expect(el.style.transform).toBe(''));
    expect(screen.getByText('2 / 2')).toBeInTheDocument();
  });

  it('without the prop the same drag moves nothing', () => {
    render(<MediaPreviewViewer items={items} initialIndex={0} onClose={() => {}} />);
    const el = swipeSurface();
    drag(el, 100, 500);
    fireEvent.touchEnd(el, { targetTouches: [] });
    expect(el.style.transform).toBe('');
    expect(screen.getByText('1 / 2')).toBeInTheDocument();
  });
});
