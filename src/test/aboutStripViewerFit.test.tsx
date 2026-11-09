/**
 * FIX Course photos viewer fit — the Course tab Photos strip open
 * (openedFrom 'about-strip', readOnly) must use the course gallery's fit
 * decision: portrait media covers the screen edge to edge, landscape media
 * is letterboxed contain. The Clubhouse feed's safe-area contain is
 * untouched.
 */
import { beforeEach, expect, it } from 'vitest';
import { resolveViewerRect } from '@/components/feed/FeedSlide';
import { useFullscreenFeedStore } from '@/store/fullscreenFeedStore';

const VP = { w: 390, h: 844, safeTop: 47, safeBottom: 34, safeLeft: 0, safeRight: 0 };

beforeEach(() => {
  useFullscreenFeedStore.setState({ openedFrom: null, courseGallery: null });
});

it('about-strip portrait media resolves to full-bleed cover', () => {
  useFullscreenFeedStore.setState({ openedFrom: 'about-strip' });
  const rect = resolveViewerRect(1080, 1920, VP, 'image');
  expect(rect.fit).toBe('cover');
  expect(rect).toMatchObject({ top: 0, left: 0, width: VP.w, height: VP.h });
});

it('about-strip landscape media resolves to letterboxed contain', () => {
  useFullscreenFeedStore.setState({ openedFrom: 'about-strip' });
  const rect = resolveViewerRect(1920, 1080, VP, 'image');
  expect(rect.fit).toBe('contain');
  expect(rect).toMatchObject({ top: 0, left: 0, width: VP.w, height: VP.h });
});

it('about-strip and gallery opens produce identical rects', () => {
  useFullscreenFeedStore.setState({ openedFrom: 'about-strip' });
  const strip = resolveViewerRect(1080, 1920, VP, 'video');
  useFullscreenFeedStore.setState({
    openedFrom: null,
    courseGallery: { courseId: 'c1', courseName: 'Course', filter: 'all' },
  });
  const gallery = resolveViewerRect(1080, 1920, VP, 'video');
  expect(strip).toEqual(gallery);
});

it('the Clubhouse feed keeps safe-area contain (no fit change)', () => {
  useFullscreenFeedStore.setState({ openedFrom: 'clubhouse' });
  const rect = resolveViewerRect(1080, 1920, VP, 'image');
  expect(rect.fit).toBe('contain');
  expect(rect.height).toBeLessThan(VP.h);
  expect(rect.top).toBeGreaterThanOrEqual(0);
});
