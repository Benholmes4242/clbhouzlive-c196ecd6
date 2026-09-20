import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { A, courseSubScoreTone } from '@/features/courses/components/holes/analytical/tokens';

const src = (file: string) => fs.readFileSync(path.resolve(process.cwd(), file), 'utf8');
const locales = ['en', 'de', 'es', 'ja', 'ko', 'en-XA'] as const;

describe('C1 course rating consistency', () => {
  it.each(locales)('%s defines both empty-score messages', (locale) => {
    const courses = JSON.parse(src(`public/locales/${locale}/courses.json`));
    expect(courses.discover.scores.noOnePlayed).toContain('{{course}}');
    expect(courses.discover.scores.beTheFirst).toBeTruthy();
  });

  it('keeps explicit English safety nets in HowItPlays', () => {
    const file = src('src/components/courses/course-detail/about/HowItPlays.tsx');
    expect(file).toContain("t('discover.scores.noOnePlayed', 'No one has played {{course}} yet.', {");
    expect(file).toContain("t('discover.scores.beTheFirst', 'Play it and you will be the first.')");
  });

  it('renders review-tab categories without a sample-size gate', () => {
    const file = src('src/components/courses/course-detail/CourseReviewsTab.tsx');
    expect(file).toContain('<WhatTheyScored aggregates={categoryAggregates} />');
    expect(file).not.toContain('showCategories');
    expect(file).not.toContain('subscoreMinRatings');
  });

  it('keeps the requested category order on both tabs', () => {
    const course = src('src/components/courses/course-detail/about/WhatPeopleSay.tsx');
    const reviews = src('src/components/courses/course-detail/reviews/WhatTheyScored.tsx');
    for (const file of [course, reviews]) {
      expect(file.indexOf("label: 'Design'")).toBeLessThan(file.indexOf("label: 'Condition'"));
      expect(file.indexOf("label: 'Condition'")).toBeLessThan(file.indexOf("label: 'Clubhouse'"));
      expect(file.indexOf("label: 'Clubhouse'")).toBeLessThan(file.indexOf("label: 'Facilities'"));
    }
  });

  it('uses the canonical display tone for all three headline surfaces', () => {
    const course = src('src/components/courses/course-detail/about/WhatPeopleSay.tsx');
    const reviews = src('src/components/courses/course-detail/reviews/TheScore.tsx');
    const card = src('src/components/posts/ReviewBottomSheet.tsx');
    expect(course).toContain('tone={courseSubScoreTone(score)}');
    expect(reviews).toContain('const scoreColor = courseSubScoreTone(score)');
    expect(card).toContain('const ratingColor = courseSubScoreTone(rating)');
  });

  it('keeps category figures binary green-or-muted through one helper', () => {
    const course = src('src/components/courses/course-detail/about/WhatPeopleSay.tsx');
    const reviews = src('src/components/courses/course-detail/reviews/WhatTheyScored.tsx');
    const row = src('src/components/courses/course-detail/reviews/reviewFlatBits.tsx');
    const browse = src('src/components/courses/BrowseCourseCard.tsx');
    expect(course).toContain('value == null ? []');
    expect(course).toContain('courseSubScoreTone(value)');
    expect(reviews.match(/courseSubScoreTone\(row\.value\)/g)).toHaveLength(2);
    expect(row).toContain('courseSubScoreTone(value)');
    expect(browse.match(/courseSubScoreTone\(score\)/g)).toHaveLength(1);
    expect(browse).not.toContain('COURSE_RATING_THEMES');
    expect(browse).not.toContain('getRatingTier');
  });

  it('uses the exact 9.0 threshold and muted absent state', () => {
    expect(courseSubScoreTone(undefined)).toBe(A.MUTE);
    expect(courseSubScoreTone(null)).toBe(A.MUTE);
    expect(courseSubScoreTone(8.99)).toBe(A.MUTE);
    expect(courseSubScoreTone(9)).toBe(A.GREEN);
  });

  it('renders Berkshire category tones green, muted, green, muted', () => {
    expect([9.3, 8.3, 9.8, 7.1].map(courseSubScoreTone)).toEqual([
      A.GREEN,
      A.MUTE,
      A.GREEN,
      A.MUTE,
    ]);
  });

  it('routes every C3 display caller through the canonical helper', () => {
    const files = [
      'src/components/courses/ReviewRailSlot.tsx',
      'src/components/courses/ReviewFeaturedSlot.tsx',
      'src/components/courses/CourseCommunityRating.tsx',
      'src/components/courses/CourseSearchSheet.tsx',
      'src/components/business/hero/BusinessProfileHero.tsx',
      'src/components/courses/course-detail/reviews/TheScore.tsx',
      'src/components/courses/course-detail/about/WhatPeopleSay.tsx',
      'src/components/courses/phase5/PersonalReviewCard.tsx',
      'src/components/courses/review/ReviewBlockFlat.tsx',
      'src/components/explore-tab-new/courseled/ReviewTile.tsx',
      'src/components/posts/ReviewBottomSheet.tsx',
      'src/components/top100/Top100CourseStatsPanel.tsx',
      'src/pages/BusinessReviewsPage.tsx',
    ].map(src);

    for (const file of files) {
      expect(file).toContain('courseSubScoreTone');
      expect(file).not.toContain('bandColorOnDark(');
    }
  });

  it('uses the canonical tone for shared display bars without changing geometry', () => {
    const bands = src('src/features/courses/_shared/scoreBands.tsx');
    expect(bands.match(/courseSubScoreTone\(score\)/g)).toHaveLength(4);
    expect(bands).toContain("height: 3");
    expect(bands).toContain('(score / 10) * 100');
    expect(bands).toContain('actively CHOOSING');
    expect(bands).toContain('Display surfaces use `courseSubScoreTone`');
  });

  it('preserves viewing-member amber and composer three-band feedback', () => {
    const about = src('src/components/courses/course-detail/about/WhatPeopleSay.tsx');
    const rows = src('src/components/courses/course-detail/reviews/reviewFlatBits.tsx');
    expect(about).toContain('tone={A.AMBER_DEEP}');
    expect(rows).toContain('isMine ? A.AMBER : courseSubScoreTone(score)');

    const composerFiles = [
      'src/features/review-v2/components/OverallScrubber.tsx',
      'src/features/review-v2/components/CategoryGrid.tsx',
      'src/features/review-v2/components/ReviewReceipt.tsx',
    ].map(src);
    for (const file of composerFiles) expect(file).toContain('bandColor');
    expect(src('src/features/review-v2/bandColor.ts')).toContain('bandColorOnDark');
  });

  it('keeps photography neutral white while sourcing 9+ green from the helper', () => {
    const card = src('src/features/explore-magazine/ExploreCard.tsx');
    const shelf = src('src/features/explore-magazine/CourseShelf.tsx');
    expect(card.match(/courseSubScoreTone\(facts\.rating\)/g)).toHaveLength(2);
    expect(card).toContain(" : '#FFFFFF'");
    expect(shelf).toContain('courseSubScoreTone(row.rating) : undefined');
    expect(card).toContain('variable photography');
    expect(shelf).toContain("white default over photography");
  });

  it('leaves the independent amber sources unchanged for follow-up', () => {
    const pill = src('src/components/ui/RatingPill.tsx');
    const posts = src('src/lib/postHelpers.ts');
    expect(pill).toContain('ratingTextColor(resolvedScore)');
    expect(posts).toContain('COURSE_RATING_THEMES.EXCEPTIONAL');
    expect(posts).toContain('tierOverlayThemes[key]');
  });

  it('renders rail and Tralee tones at the canonical threshold', () => {
    expect(courseSubScoreTone(8.3)).toBe(A.MUTE);
    expect(courseSubScoreTone(9)).toBe(A.GREEN);
    expect([9.8, 9.3, 9.1, 8.7].map(courseSubScoreTone)).toEqual([
      A.GREEN,
      A.GREEN,
      A.GREEN,
      A.MUTE,
    ]);
  });
});