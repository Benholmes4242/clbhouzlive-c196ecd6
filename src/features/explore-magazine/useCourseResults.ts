import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { courseHeadline, courseEventStrength, type CourseEventKind } from './courseHeadline';
import type { CourseCandidateIndex } from './useCourseCandidateIndex';
import type { StreamItem } from './streamItem';

/**
 * ONE RESULTS COMPOSER, THREE CALLERS (BRIEF_COURSES_MERGED §5, §6, §7).
 *
 * A bounded set of candidate courses becomes the SAME mixed stream the view
 * shows everywhere else: course cards and review cards, one kind per card, no
 * labels. Its three callers are
 *   - SEARCH (§6): the matched courses, plus the matched reviews as their own
 *     cards, because a word found inside a review is the reason that card is on
 *     the page.
 *   - THE REGION DROPDOWN (§7): the candidate courses in the chosen place.
 *   - THE MY CIRCLE SCOPE (§5): the courses the follow set has played or rated.
 *
 * THE HEADLINE LADDER, AND ITS ONE DEPARTURE FROM THE STREAM'S. Ratings burst
 * beats a stable fact, exactly as courseHeadline defines them. The 30-day board
 * LOW is NOT available here — this path holds no board read, and inventing a low
 * from the round count would be a figure with no round behind it. So a filtered
 * or searched course card carries a burst or a stable fact. REPORTED as a
 * difference from the ranked stream, which does read the low.
 *
 * §8 IS ENFORCED HERE TOO: no rounds and no rating is not a candidate (such a
 * course is not even in the index), and a rating with no words is never a review
 * card (the index only holds reviews with prose).
 */

export interface CourseResults {
  items: StreamItem[];
  total: number;
}

export function useCourseResults(
  index: CourseCandidateIndex,
  courseIds: string[] | null,
  reviewIds: string[] | null,
  viewerId: string | undefined,
): CourseResults {
  const { t } = useTranslation('courses');

  return useMemo(() => {
    if (!courseIds) return { items: [], total: 0 };
    const wanted = new Set(courseIds);
    const wantedReviews = reviewIds ? new Set(reviewIds) : null;
    const items: StreamItem[] = [];

    for (const courseId of wanted) {
      const course = index.courses.get(courseId);
      const ratings = index.ratingsByCourse.get(courseId) ?? null;
      const rounds = index.roundsByCourse.get(courseId) ?? 0;
      if (rounds <= 0 && !ratings) continue;

      const event: CourseEventKind = ratings && ratings.n30 >= 2 ? 'ratings' : 'stable';
      const headline =
        courseHeadline(t, {
          event,
          burstCount: event === 'ratings' ? ratings?.n30 ?? null : null,
          burstMean: event === 'ratings' ? ratings?.mean30 ?? null : null,
          lowGross: null,
          lowBy: null,
          rounds,
          rating: ratings?.mean ?? null,
          ratingCount: ratings?.n ?? null,
        }) ?? '';

      items.push({
        id: `course:${courseId}`,
        kind: 'course',
        ring: 'world',
        lane: 'news',
        score: courseEventStrength(event, ratings?.n30 ?? null) * 100 + (ratings?.mean ?? 0) * 5 + Math.min(rounds, 100) / 100,
        consequence: null,
        subject: {
          course_id: courseId,
          course_name: course?.name ?? null,
          region: course?.region ?? course?.subCountry ?? null,
          sub_country: course?.subCountry ?? null,
          image_url: course?.imageUrl ?? null,
          pending: false,
        },
        who: null,
        facts: {
          headline,
          rating: ratings?.mean ?? null,
          rating_n: ratings?.n ?? null,
          rounds_tracked: rounds,
          course_event: event,
        },
        payload: {},
        seen: false,
      });
    }

    for (const review of index.reviews) {
      if (wantedReviews ? !wantedReviews.has(review.id) : !wanted.has(review.courseId)) continue;
      const course = index.courses.get(review.courseId);
      const reviewer = review.userId ? index.reviewersById.get(review.userId) : undefined;
      const payload = {
        reviewId: review.id,
        courseId: review.courseId,
        courseName: course?.name ?? '',
        courseImage: course?.imageUrl ?? null,
        rating: review.rating ?? 0,
        quote: review.review,
        at: review.createdAt,
        userId: review.userId,
        reviewerName: reviewer?.name ?? '',
        reviewerUsername: reviewer?.username ?? null,
        reviewerAvatar: reviewer?.photo ?? null,
        mediaUrl: null,
        mediaType: null,
        posterUrl: null,
        courseCountry: course?.country ?? null,
        courseRegion: course?.region ?? null,
        courseSubCountry: course?.subCountry ?? null,
        breakdown: { design: null, conditions: null, clubhouse: null, facilities: null },
      };
      items.push({
        id: `review:${review.id}`,
        kind: 'review',
        ring: 'world',
        lane: 'news',
        score: 50 + (review.rating ?? 0),
        consequence: null,
        subject: {
          course_id: review.courseId,
          course_name: course?.name ?? null,
          region: course?.region ?? null,
          sub_country: course?.subCountry ?? null,
          image_url: course?.imageUrl ?? null,
          pending: false,
        },
        who: {
          user_id: review.userId,
          display_name: reviewer?.name ?? null,
          photo_url: reviewer?.photo ?? null,
          is_viewer: !!viewerId && review.userId === viewerId,
        },
        facts: {
          rating: review.rating,
          review_id: review.id,
          first_sentence: review.review,
          arrived_at: review.createdAt,
          play_date: review.createdAt,
        },
        payload: { review: payload as never },
        seen: false,
      });
    }

    /* REVIEWS FIRST WHERE THEY MATCHED ON THEIR OWN WORDS — the member asked for
       the words, so the card carrying them leads. Otherwise the course ladder's
       own order stands. */
    items.sort((a, b) => b.score - a.score || a.id.localeCompare(b.id));
    return { items, total: items.length };
  }, [index, courseIds, reviewIds, viewerId, t]);
}
