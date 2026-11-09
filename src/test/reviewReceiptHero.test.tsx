/**
 * FIX review confirmation notch — the receipt hero must be Step 1's hero
 * exactly: same HERO_CONTENT_TOP / HERO_CONTENT_BOTTOM padding, no height
 * override, photo running behind the notch. Source/props-level parity test.
 */
import React from 'react';
import { readFileSync } from 'node:fs';
import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, render } from '@testing-library/react';

vi.mock('react-i18next', () => ({
  initReactI18next: { type: '3rdParty', init: () => {} },
  useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }),
  Trans: ({ i18nKey }: { i18nKey?: string }) => <span>{i18nKey}</span>,
}));
vi.mock('@/hooks/top100/useTop100Config', () => ({ useTop100Config: () => ({ subscoreMinRatings: 10 }) }));
vi.mock('@/hooks/useCourseTop100Standing', () => ({ useCourseTop100Standing: () => ({ data: null }) }));
vi.mock('@/components/courses/course-detail/about/useHeroReferenceLine', () => ({ TEE_CHANGED_EVENT: 'clb:course-tee-changed', useHeroReferenceLine: () => null }));
vi.mock('@/features/review-v2/hooks/useReviewReceipt', () => ({ useReviewReceipt: () => ({ data: null }) }));
vi.mock('@/features/review-v2/hooks/useMyRatedScores', () => ({ useMyRatedScores: () => ({ data: [] }), calibrationRank: () => null, CALIBRATION_MIN_PEERS: 5 }));
vi.mock('@/features/composer-flow/hooks/useReviewCourseSearch', () => ({ useReviewCourseIdle: () => ({ data: null, isSuccess: false, isError: false }) }));
vi.mock('@/features/composer-flow/ReviewCourseSearchSheet', () => ({ default: () => null, CourseRow: () => null }));
vi.mock('@/features/review-v2/lib/reviewUploadController', () => ({ subscribeToReviewPublish: () => () => {} }));
vi.mock('@/utils/analyticsEvents', () => ({ analyticsEvents: { track: vi.fn() } }));

import { ReviewReceipt } from '@/features/review-v2/components/ReviewReceipt';
import { ReviewComposerHeader } from '@/features/review-v2/components/ReviewComposerHeader';
import { HERO_CONTENT_TOP, HERO_CONTENT_BOTTOM } from '@/lib/heroHeights';

afterEach(cleanup);

const course = { id: 'c1', name: 'Course A', thumbnail_image: '/course.jpg', country: 'Scotland', sub_country: null, region: 'Fife' };
const scores = { design: 8, condition: 7, clubhouse: 9, facilities: 6 };

function heroOf(container: HTMLElement) {
  const hero = container.querySelector<HTMLElement>('[data-photo-header]');
  expect(hero).not.toBeNull();
  return hero!;
}

it('receipt hero uses Step 1 geometry: HERO_CONTENT padding, no height override, no receipt class', () => {
  const { container } = render(
    <ReviewReceipt
      ratingId="r1" course={course} overall={7.5} scores={scores} shareToFeed={false}
      onClubhouse={() => {}} onBack={() => {}} onNextCourse={() => {}}
    />,
  );
  const hero = heroOf(container);
  expect(hero.className).not.toContain('rv2-receipt-hero');
  expect(hero.style.paddingTop).toBe(`${HERO_CONTENT_TOP}px`);
  expect(hero.style.paddingBottom).toBe(`${HERO_CONTENT_BOTTOM}px`);
  expect(hero.style.height).toBe('');
});

it('receipt and Step 1 photo heroes produce identical box geometry', () => {
  const receipt = render(
    <ReviewReceipt
      ratingId="r1" course={course} overall={7.5} scores={scores} shareToFeed={false}
      onClubhouse={() => {}} onBack={() => {}} onNextCourse={() => {}}
    />,
  );
  const stepOne = render(
    <ReviewComposerHeader
      form="photo" name={course.name} region={course.region} thumbnail={course.thumbnail_image}
      facts={{ avg: null, count: 0, rank: null } as never}
      courseId={course.id} courseRegion={course.region} subCountry={null} country={course.country}
      leadingIsClose onBack={() => {}} isEditMode={false} onDelete={() => {}}
    />,
  );
  const a = heroOf(receipt.container);
  const b = heroOf(stepOne.container);
  expect(a.style.paddingTop).toBe(b.style.paddingTop);
  expect(a.style.paddingBottom).toBe(b.style.paddingBottom);
  expect(a.style.height).toBe(b.style.height);
});

it('the receipt stylesheet carries no hero height override', () => {
  const css = readFileSync('src/features/review-v2/components/reviewReceipt.css', 'utf8');
  expect(css).not.toContain('rv2-receipt-hero');
});
