/**
 * Media tray: once anything is picked, the dashed Add tile leads the strip so it
 * is never parked past the right edge of the screen. Empty tray keeps the
 * full-width row; at the ceiling (or disabled) the control disappears.
 */

import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';

vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));

import { MediaTray } from '@/features/review-v2/components/MediaTray';
import { REVIEW_V2_LIMITS } from '@/features/review-v2/tokens';
import type { MediaItem } from '@/features/review-v2/types';

const tile = (id: string): MediaItem => ({ id, type: 'image', previewUrl: `https://media.test/${id}.jpg`, status: 'uploaded', progress: 100 });

const srcsOf = (root: HTMLElement) =>
  Array.from(root.querySelectorAll('img.review-upload-image')).map(i => i.getAttribute('src'));

afterEach(cleanup);

describe('media tray Add tile leads the strip', () => {
  it('with items present and capacity left, the Add button is the strip’s first child', () => {
    const items = ['a', 'b', 'c'].map(tile);
    const { getByLabelText, container } = render(<MediaTray items={items} onPick={vi.fn()} onRemove={vi.fn()} />);
    const add = getByLabelText('Add photo or video');
    const strip = add.parentElement as HTMLElement;

    expect(strip.firstElementChild).toBe(add);
    expect(strip.children).toHaveLength(items.length + 1);

    // Same square presentation as before the move: 72x72, 12px radius, dashed hairline.
    expect(add.style.width).toBe('72px');
    expect(add.style.height).toBe('72px');
    expect(add.style.borderRadius).toBe('12px');
    expect(add.style.borderStyle).toBe('dashed');
    expect(add.style.flexShrink).toBe('0');
    // CAPS action label keeps its positive tracking, never a negative value.
    const label = add.querySelector('span:last-child') as HTMLElement;
    expect(label.style.letterSpacing).toBe('0.1em');
    expect(label.style.textTransform).toBe('uppercase');

    // Items keep their order, appended after the Add tile.
    expect(srcsOf(strip)).toEqual([
      'https://media.test/a.jpg',
      'https://media.test/b.jpg',
      'https://media.test/c.jpg',
    ]);
    expect(container.querySelectorAll('input[type="file"]')).toHaveLength(1);
  });

  it('with no items, the full-width Add row renders and nothing else is in the strip', () => {
    const { getByLabelText } = render(<MediaTray items={[]} onPick={vi.fn()} onRemove={vi.fn()} />);
    const add = getByLabelText('Add photo or video');
    const strip = add.parentElement as HTMLElement;

    expect(add.style.width).toBe('100%');
    expect(strip.children).toHaveLength(1);
    expect(srcsOf(strip)).toEqual([]);
  });

  it('at the ceiling no Add control renders', () => {
    const items = Array.from({ length: REVIEW_V2_LIMITS.MAX_MEDIA }, (_, i) => tile(String(i)));
    const { queryByLabelText, container } = render(<MediaTray items={items} onPick={vi.fn()} onRemove={vi.fn()} />);

    expect(queryByLabelText('Add photo or video')).toBeNull();
    expect(srcsOf(container as HTMLElement)).toHaveLength(REVIEW_V2_LIMITS.MAX_MEDIA);
  });

  it('while disabled no Add control renders', () => {
    const { queryByLabelText } = render(<MediaTray items={[tile('a')]} onPick={vi.fn()} onRemove={vi.fn()} disabled />);
    expect(queryByLabelText('Add photo or video')).toBeNull();
  });
});
