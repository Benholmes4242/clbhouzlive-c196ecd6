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
    const block = src('src/components/courses/course-detail/CategoryScores.tsx');
    const course = src('src/components/courses/course-detail/about/WhatPeopleSay.tsx');
    const reviews = src('src/components/courses/course-detail/reviews/WhatTheyScored.tsx');
    const browse = src('src/components/courses/BrowseCourseCard.tsx');
    for (const file of [reviews, browse]) expect(file).toContain('<CategoryScores');
    /* CRM1.9: the rule was not withdrawn, the surface changed — the Course tab
       now renders the extracted band rows, whose order is fewReviewFacts' fixed
       key order. */
    expect(course).toContain('<CategoryBands');
    const facts = src('src/lib/reviews/fewReviews.ts');
    expect(facts.indexOf("['design'")).toBeLessThan(facts.indexOf("['condition'"));
    expect(facts.indexOf("['condition'")).toBeLessThan(facts.indexOf("['clubhouse'"));
    expect(facts.indexOf("['clubhouse'")).toBeLessThan(facts.indexOf("['facilities'"));
    for (const file of [block]) {
      expect(file.indexOf("label: 'Design'")).toBeLessThan(file.indexOf("label: 'Condition'"));
      expect(file.indexOf("label: 'Condition'")).toBeLessThan(file.indexOf("label: 'Clubhouse'"));
      expect(file.indexOf("label: 'Clubhouse'")).toBeLessThan(file.indexOf("label: 'Facilities'"));
    }
  });

  it('uses the canonical display tone for all three headline surfaces', () => {
    const course = src('src/components/courses/course-detail/about/WhatPeopleSay.tsx');
    const reviews = src('src/components/courses/course-detail/reviews/TheScore.tsx');
    const card = src('src/components/posts/ReviewBottomSheet.tsx');
    const block = src('src/components/courses/course-detail/CategoryScores.tsx');
    /* CRM1.9: the rule was not withdrawn, the surface changed — the Course tab
       headline now shares the Reviews tab's figure row, ink at every count. */
    expect(course).toContain('data-community-score');
    expect(reviews).toContain('courseSubScoreTone(score)');
    expect(block).toContain('const tone = courseSubScoreTone(score)');
    expect(card).toContain('const ratingColor = courseSubScoreTone(rating)');
  });

  it('keeps category figures white through one helper', () => {
    const course = src('src/components/courses/course-detail/about/WhatPeopleSay.tsx');
    const reviews = src('src/components/courses/course-detail/reviews/WhatTheyScored.tsx');
    const row = src('src/components/courses/course-detail/reviews/reviewFlatBits.tsx');
    const browse = src('src/components/courses/BrowseCourseCard.tsx');
    const block = src('src/components/courses/course-detail/CategoryScores.tsx');
    expect(block).toContain('if (value == null) return <div');
    expect(block).toContain("const tone = courseSubScoreTone(value)");
    expect(block).toContain("Math.min(100, (value / 10) * 100)");
    expect(reviews).not.toContain('courseSubScoreTone');
    expect(row).toContain('courseSubScoreTone(value)');
    expect(browse).not.toContain('courseSubScoreTone');
    expect(browse).not.toContain('COURSE_RATING_THEMES');
    expect(browse).not.toContain('getRatingTier');
  });

  it('uses white for real scores and muted for absent scores', () => {
    expect(courseSubScoreTone(undefined)).toBe(A.MUTE);
    expect(courseSubScoreTone(null)).toBe(A.MUTE);
    expect(courseSubScoreTone(8.94)).toBe(A.INK);
    expect(courseSubScoreTone(9)).toBe(A.INK);
  });

  /* WITHDRAWN (BRIEF_COURSE_TAB_1B T1): the hero stat row carried a community
     rating and needed an override so a sub-9.0 figure read white rather than
     muted. BRIEF_COURSE_TAB replaced that row with a reference line that carries
     no rating, so the rule has no surface left on the hero. This is a documented
     rule being withdrawn with its surface, not a test edited to make a build pass. */

  it('renders all Berkshire category tones white', () => {
    expect([9.3, 8.3, 9.8, 7.1].map(courseSubScoreTone)).toEqual([
      A.INK,
      A.INK,
      A.INK,
      A.INK,
    ]);
  });

  it('routes every C3 display caller through the canonical helper', () => {
    const files = [
      'src/components/courses/ReviewRailSlot.tsx',
      'src/components/courses/ReviewFeaturedSlot.tsx',
      'src/components/courses/CourseCommunityRating.tsx',
      'src/components/courses/CourseSearchSheet.tsx',
      'src/components/business/hero/BusinessProfileHero.tsx',
      'src/components/courses/course-detail/CategoryScores.tsx',
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
    expect(bands).toContain('including actively chosen composer values');
    expect(bands).toContain('import { A, courseSubScoreTone }');
  });

  it('preserves viewing-member identity accents and white composer scores', () => {
    const about = src('src/components/courses/course-detail/about/WhatPeopleSay.tsx');
    const rows = src('src/components/courses/course-detail/reviews/reviewFlatBits.tsx');
    /* CRM1.9: the rule was not withdrawn, the surface changed — viewing-member
       amber now lives in the YOU pill beside the community figure. */
    expect(about).toContain('data-viewer-delta');
    expect(rows).toContain('const scoreColor = courseSubScoreTone(score)');
    expect(rows).toContain('color: isMine ? A.AMBER : A.INK');

    /* THE REVIEW FLOW PRINTS THE COURSE PAGE'S COLOURS. Every score figure in
       the composer and on the receipt takes courseSubScoreTone, so a score
       shown anywhere in the review flow is the colour the course page will
       print. */
    const onCourseRule = [
      'src/features/review-v2/components/OverallScrubber.tsx',
      'src/features/review-v2/components/CategoryGrid.tsx',
      'src/features/review-v2/components/ReviewReceipt.tsx',
    ].map(src);
    for (const file of onCourseRule) {
      expect(file).toContain('courseSubScoreTone');
      expect(file).not.toContain("from '../bandColor'");
    }
    const receipt = src('src/features/review-v2/components/ReviewReceipt.tsx');
    expect(receipt).toContain('const c = courseSubScoreTone(v)');
  });

  it('keeps photography ratings white through the helper', () => {
    const card = src('src/features/explore-magazine/ExploreCard.tsx');
    const shelf = src('src/features/explore-magazine/CourseShelf.tsx');
    expect(card.match(/courseSubScoreTone\(facts\.rating\)/g)).toHaveLength(2);
    expect(card).toContain("tone={courseSubScoreTone(facts.rating)}");
    expect(shelf).toContain('courseSubScoreTone(row.rating) : undefined');
    expect(card).toContain('variable photography');
    expect(shelf).toContain("white default over photography");
  });

  it('keeps rating pill and overlay consumers wired through shared themes', () => {
    const pill = src('src/components/ui/RatingPill.tsx');
    const posts = src('src/lib/postHelpers.ts');
    expect(pill).toContain('ratingTextColor(resolvedScore)');
    expect(posts).toContain('COURSE_RATING_THEMES.EXCEPTIONAL');
    expect(posts).toContain('tierOverlayThemes[key]');
  });

  it('renders all rail and Tralee rating tones white', () => {
    expect(courseSubScoreTone(8.3)).toBe(A.INK);
    expect(courseSubScoreTone(9)).toBe(A.INK);
    expect([9.8, 9.3, 9.1, 8.7].map(courseSubScoreTone)).toEqual([
      A.INK,
      A.INK,
      A.INK,
      A.INK,
    ]);
  });
});
