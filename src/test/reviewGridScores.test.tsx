import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import type { FeedPost } from '@/components/media-system/types/media';

vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));
vi.mock('@/features/pro-verification/InlineProMemberName', () => ({ InlineProMemberName: ({ children }: { children: React.ReactNode }) => <>{children}</> }));
vi.mock('@/components/ui/SquircleAvatar', () => ({ SquircleAvatar: () => <span /> }));
vi.mock('@/components/mentions/MentionText', () => ({ MentionText: ({ text }: { text: string }) => <>{text}</> }));

import { ReviewPostCard } from '@/components/feed/ReviewPostCard';

function post(count = 4, upright = false, video = false): FeedPost {
  return {
    id: 'p-grid', userId: 'u1', displayName: 'Member', createdAt: '2026-11-20T12:00:00Z', isReview: true,
    mediaItems: Array.from({ length: count }, (_, i) => ({ id: `m${i}`, type: video ? 'video' : 'image', imageUrl: '/photo.jpg', width: upright ? 800 : 1200, height: upright ? 1200 : 800 })),
    review: { reviewId: 'r1', courseId: 'c1', courseName: 'Camiral', courseImageUrl: null, courseRegion: 'Catalonia', courseSubCountry: 'Girona', courseCountry: 'Spain', rating: 8.5, reviewText: 'Review body', breakdown: { design: 8, conditions: 9, clubhouse: 8, facilities: 9 } },
  } as FeedPost;
}
function card(p = post(), tagged = false) {
  const openCourse = vi.fn();
  const view = render(<MemoryRouter><ReviewPostCard post={p} layout="mediaFirst" articleRef={() => {}} onProfile={vi.fn()} onReadReview={vi.fn()} onPrefetch={vi.fn()} onOpenCourse={openCourse}
    media={<div data-grid-media />} footer={<div data-footer />} playedWith={tagged ? [{ userId: 'friend', name: 'Friend', username: 'friend', avatarUrl: null }] : undefined} onPlayedWithProfile={vi.fn()} /></MemoryRouter>);
  return { ...view, openCourse };
}
afterEach(cleanup);
describe('photo-grid review scores', () => {
  for (const [shape, upright] of [['wide', false], ['upright', true]] as const) {
    it(`(${upright ? 'b' : 'a'}) ${shape}-lead grid places course, region and card scores after media without glass`, () => {
      const { container, openCourse } = card(post(4, upright));
      const media = container.querySelector<HTMLElement>('[data-review-media]');
      const block = container.querySelector('[data-review-grid-scores]');
      expect(block).not.toBeNull();
      expect(media?.nextElementSibling).toBe(block);
      expect(block?.nextElementSibling?.querySelector('[data-footer]')).not.toBeNull();
      expect(block?.querySelector('[data-review-course]')?.textContent).toBe('Camiral');
      expect(block?.querySelector('[data-review-glass-region]')?.textContent).toBe('Catalonia');
      expect(block?.querySelector('[data-review-score-row][data-variant="card"]')).not.toBeNull();
      expect(container.querySelector('[data-review-score-strip]')).toBeNull();
      expect(container.querySelector('[data-review-glass-fade]')).toBeNull();
      expect(media?.style.getPropertyValue('--review-glass-h')).toBe('');
      const link = block?.querySelector('[data-course-name-link]');
      if (!link) throw new Error('missing course link');
      fireEvent.click(link); expect(openCourse).toHaveBeenCalledTimes(1);
    });
  }
  for (const [kind, count, video] of [['single photo', 1, false], ['video', 1, true], ['three-photo carousel', 3, false]] as const) {
    it(`(c) ${kind} places scores below the media without glass`, () => {
      const { container } = card(post(count, false, video));
      const block = container.querySelector('[data-review-grid-scores]');
      expect(block).not.toBeNull();
      expect(container.querySelector('[data-review-media]')?.nextElementSibling).toBe(block);
      expect(container.querySelector('[data-review-score-strip]')).toBeNull();
      expect(container.querySelector('[data-review-glass-fade]')).toBeNull();
    });
  }
  it('(d) grid Played with chip uses the media offset', () => {
    const { container } = card(post(), true);
    expect(container.querySelector('[data-testid="played-with-chip"]')).toHaveAttribute('data-pw-offset', 'media');
  });
  it('(e) grid with no course name and no scores has no grid score block', () => {
    const { container } = card({ ...post(), review: null, courseName: null });
    expect(container.querySelector('[data-review-grid-scores]')).toBeNull();
    expect(container.querySelector('[data-review-score-strip]')).toBeNull();
  });
});