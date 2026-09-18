import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

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

  it('uses the dark score band for all three headline surfaces', () => {
    const course = src('src/components/courses/course-detail/about/WhatPeopleSay.tsx');
    const reviews = src('src/components/courses/course-detail/reviews/TheScore.tsx');
    const card = src('src/components/posts/ReviewBottomSheet.tsx');
    expect(course).toContain('tone={bandColorOnDark(score)}');
    expect(reviews).toContain('const scoreColor = bandColorOnDark(score)');
    expect(card).toContain('const ratingColor = bandColorOnDark(rating)');
  });

  it('keeps category figures binary green-or-muted and omits missing values', () => {
    const course = src('src/components/courses/course-detail/about/WhatPeopleSay.tsx');
    const reviews = src('src/components/courses/course-detail/reviews/WhatTheyScored.tsx');
    const card = src('src/components/posts/ReviewBottomSheet.tsx');
    expect(course).toContain('value == null ? []');
    expect(course).toContain('value >= 9 ? A.GREEN : A.MUTE');
    expect(reviews).toContain('row.value >= 9 ? A.GREEN : A.MUTE');
    expect(card).toContain('value >= 9 ? A.GREEN : A.MUTE');
  });
});