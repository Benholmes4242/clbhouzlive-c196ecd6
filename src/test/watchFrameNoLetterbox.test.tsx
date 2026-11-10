/** Guard tests: full-width Explore video units use the shared feed media rule
    (full width, clamped source ratio, feed max height, cover) — never a
    centred narrower frame with bars. The rail tile is unchanged. */
import React from 'react';
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';

vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));

import { VideoCard } from '@/features/explore-magazine/watch/videoUnit';
import { FALLBACK_RATIO, mediaMaxHeight } from '@/components/feed/feedMediaSizing';
import type { HubRpcRow } from '@/features/watch-v2/utils/toFeedPost';

afterEach(cleanup);

const row = (over: Partial<HubRpcRow>): HubRpcRow =>
  ({
    post_id: 'p1',
    creator_display_name: 'Ben',
    post_created_at: '2026-11-01T00:00:00Z',
    poster_url: 'https://x.test/poster.jpg',
    ...over,
  }) as HubRpcRow;

const frame = (c: HTMLElement) => c.querySelector('[data-watch-frame]') as HTMLElement;

describe('full-width video units never letterbox', () => {
  it('a 1080x1920 portrait source fills the width at the clamped 4:5 ratio with the feed max height', () => {
    const v = render(<VideoCard row={row({ width: 1080, height: 1920 })} onPress={() => {}} />);
    const f = frame(v.container);
    expect(f.style.width).toBe('100%');
    expect(f.style.aspectRatio).toBe('0.8');
    expect(f.style.maxHeight).toBe(mediaMaxHeight());
    expect(f.style.width).not.toContain('px');
    expect(f.style.width).not.toContain('min(100%');
    expect(f.style.alignSelf).toBe('');
  });

  it('a 1920x1080 landscape source keeps its 1.7778 ratio', () => {
    const v = render(<VideoCard row={row({ width: 1920, height: 1080 })} onPress={() => {}} />);
    const f = frame(v.container);
    expect(f.style.width).toBe('100%');
    expect(Number(f.style.aspectRatio)).toBeCloseTo(1.7778, 3);
  });

  it('missing dimensions fall back to FALLBACK_RATIO', () => {
    const v = render(<VideoCard row={row({ width: null, height: null })} onPress={() => {}} />);
    expect(frame(v.container).style.aspectRatio).toBe(String(FALLBACK_RATIO));
  });

  it('the poster and the autoplay video both use object-fit cover', () => {
    const v = render(<VideoCard row={row({ width: 1080, height: 1920, hls_url: 'https://x.test/v.m3u8' })} onPress={() => {}} />);
    const f = frame(v.container);
    expect(f.querySelector('img')?.style.objectFit).toBe('cover');
    const video = f.querySelector('video');
    if (video) expect(video.style.objectFit).toBe('cover');
  });

  it('the rail variant keeps its fixed 16:9 frame', () => {
    const v = render(<VideoCard row={row({ width: 1080, height: 1920 })} onPress={() => {}} size="rail" />);
    const f = frame(v.container);
    expect(f.style.width).toBe('100%');
    expect(f.style.aspectRatio).toBe('16 / 9');
    expect(f.style.maxHeight).toBe('');
  });
});

describe('no inline feed media frame in the swept files uses object-fit contain', () => {
  it.each([
    'src/features/explore-magazine/watch/videoUnit.tsx',
    'src/features/explore-magazine/watch/WatchLead.tsx',
    'src/features/watch-v2/components/HubVideoRow.tsx',
    'src/features/watch-v2/components/HubClipsRow.tsx',
  ])('%s', (p) => {
    expect(readFileSync(p, 'utf8')).not.toMatch(/objectFit:\s*['"]contain['"]/);
  });
  it('LoopCard media uses the cover class', () => {
    const src = readFileSync('src/components/loop-tab/LoopCard.tsx', 'utf8');
    expect(src).toContain('object-cover');
    expect(src).not.toMatch(/data-media-wrapper[\s\S]{0,400}?object-contain/);
  });
});
