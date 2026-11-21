import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const f = vi.hoisted(() => ({ register: vi.fn() }));
vi.mock('@/components/explore-tab-new/courseled/tileHlsPlayer', () => ({ attachTileHls: () => ({ detach: () => {} }) }));
vi.mock('@/hooks/usePrefersReducedMotion', () => ({ usePrefersReducedMotion: () => false }));

import { HoleInlineVideo } from '@/components/course-media-tab/HoleInlineVideo';
import * as autoplay from '@/components/explore-tab-new/courseled/reviewVideoAutoplay';

const src = (p: string) => readFileSync(resolve(process.cwd(), p), 'utf8');
const media = { media_url: 'https://example.test/a.m3u8', stream_id: 'a'.repeat(32), poster_url: '/a.jpg', duration_seconds: 12 };

describe('HoleInlineVideo play ceiling', () => {
  beforeEach(() => { f.register.mockReset(); f.register.mockReturnValue(() => {}); vi.spyOn(autoplay, 'registerReviewVideo').mockImplementation(f.register); });
  afterEach(() => { cleanup(); vi.restoreAllMocks(); });
  it('with no maxPlaying it registers with maxPlaying 1', () => {
    render(<HoleInlineVideo media={media} alt="" fit="cover" autoplayGroup="g" active />);
    expect(f.register).toHaveBeenCalledWith('g', expect.any(Element), expect.any(Function), { threshold: 0.5, maxPlaying: 1 });
  });
  it('forwards an explicit maxPlaying 2', () => {
    render(<HoleInlineVideo media={media} alt="" fit="cover" autoplayGroup="g2" maxPlaying={2} active />);
    expect(f.register).toHaveBeenCalledWith('g2', expect.any(Element), expect.any(Function), { threshold: 0.5, maxPlaying: 2 });
  });
});

const RAILS: Array<[string, string]> = [
  ['src/components/courses/browse/LatestHolesSection.tsx', 'autoplayGroup="courses-latest-holes" maxPlaying={2}'],
  ['src/components/courses/browse/LatestCoursesSection.tsx', 'autoplayGroup="courses-latest-courses" maxPlaying={2}'],
  ['src/components/courses/browse/PlayedTile.tsx', 'autoplayGroup="courses-played-tile" maxPlaying={2}'],
  ['src/components/courses/browse/RegionRails.tsx', 'autoplayGroup={autoplayGroup} maxPlaying={2}'],
  ['src/components/courses/ReviewRailSlot.tsx', 'autoplayGroup="courses-latest-reviews" maxPlaying={2}'],
];

describe('each Courses rail owns its group', () => {
  it.each(RAILS)('%s registers under its own group with maxPlaying 2', (file, needle) => {
    const s = src(file);
    expect(s).toContain(needle);
    expect(s).not.toContain('courses-member-shots" active');
  });
  it('two region rails get two different groups (keyed by rail.key)', () => {
    expect(src('src/components/courses/browse/RegionRails.tsx')).toContain('autoplayGroup={`courses-region-${rail.key}`}');
  });
});

class FakeIO {
  static all: FakeIO[] = [];
  els: Element[] = [];
  constructor(public cb: IntersectionObserverCallback) { FakeIO.all.push(this); }
  observe(el: Element) { this.els.push(el); }
  unobserve() {} disconnect() {}
  fire() { this.cb(this.els.map((target) => ({ target, intersectionRatio: 1, boundingClientRect: { top: 0, height: 10 } })) as any, this as any); }
}

describe('group ceiling', () => {
  const original = window.IntersectionObserver;
  beforeEach(() => { vi.useFakeTimers(); FakeIO.all = []; (window as any).IntersectionObserver = FakeIO; });
  afterEach(() => { vi.useRealTimers(); (window as any).IntersectionObserver = original; });
  it('a rail with three in-view videos tells at most two to play; a second rail plays alongside', () => {
    const verdicts = new Map<string, boolean>();
    const reg = (group: string, id: string) => autoplay.registerReviewVideo(group, document.createElement('div'), (p) => verdicts.set(id, p), { threshold: 0.5, maxPlaying: 2 });
    const offs = [reg('t-rail-a', 'a1'), reg('t-rail-a', 'a2'), reg('t-rail-a', 'a3'), reg('t-rail-b', 'b1')];
    FakeIO.all.forEach((io) => io.fire());
    vi.advanceTimersByTime(autoplay.AUTOPLAY_SETTLE_MS + 1);
    expect(['a1', 'a2', 'a3'].filter((id) => verdicts.get(id)).length).toBe(2);
    expect(verdicts.get('b1')).toBe(true);
    offs.forEach((off) => off());
  });
});

describe('overlay layers', () => {
  it.each([
    ['src/components/courses/browse/RegionRails.tsx', 1],
    ['src/components/courses/browse/PlayedTile.tsx', 5],
    ['src/components/courses/browse/LatestCoursesSection.tsx', 6],
    ['src/components/courses/ReviewRailSlot.tsx', 3],
  ] as const)('%s overlays carry translateZ(0)', (file, min) => {
    expect((src(file).match(/translateZ\(0\)/g) ?? []).length).toBeGreaterThanOrEqual(min);
  });
  it('RegionRails spreads its layer into the scrim, count badge and text block', () => {
    const s = src('src/components/courses/browse/RegionRails.tsx');
    expect(s).toContain("const LAYER: React.CSSProperties = { transform: 'translateZ(0)' }");
    expect((s.match(/\.\.\.LAYER/g) ?? []).length).toBe(3);
  });
  it('LatestHoleCard overlays do not', () => {
    expect(src('src/components/courses/browse/LatestHolesSection.tsx')).not.toContain('translateZ');
    expect(src('src/components/courses/browse/latestHoles.css')).not.toContain('translateZ');
  });
});

describe('Latest holes rail shape', () => {
  it('.latest-hole-card has border-radius 16px', () => {
    expect(src('src/components/courses/browse/latestHoles.css')).toMatch(/\.latest-hole-card \{[^}]*border-radius: 16px;/);
  });
  it('the Latest holes rail gap is 8', async () => {
    const { LATEST_HOLE_GAP } = await import('@/components/courses/browse/railTileHeights');
    expect(LATEST_HOLE_GAP).toBe(8);
    expect(src('src/components/courses/browse/LatestHolesSection.tsx')).toContain('gap: LATEST_HOLE_GAP');
  });
  it('the skeleton card radius is 16 and its shell gap is 8', () => {
    const s = src('src/components/courses/browse/sectionShells.tsx');
    expect(s).toContain("height: LATEST_HOLE_H, borderRadius: 16");
    expect(s).toMatch(/gap: 8 \}\}>\s*\{\[0, 1\]\.map\(i => <LatestHoleSkeletonCard/);
  });
});
