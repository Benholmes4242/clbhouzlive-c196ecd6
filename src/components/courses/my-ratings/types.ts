/**
 * Shared data shape consumed by the three stratified My Ratings cards.
 * Mirrors the runtime fields produced by the AllCoursesList query
 * (CourseCardData augmented with breakdown + review_text + global_rank).
 */

export interface MyRatingsTierCourse {
  id: string;
  name: string;
  country: string | null;
  sub_country: string | null;
  thumbnail_image: string | null;
  global_rank: number | null;
  /** Stable id used for deep-link to the user's review. */
  rating_id: string | null;
  /** Numeric rating (e.g. 9.7). Caller guarantees this is non-null. */
  rating_value: number;
  /** Review date (ISO). Falls back to last_played_at upstream. */
  review_date: string | null;
  /** Free-text review used for Tier 1 pull-quote / Tier 2 one-liner. */
  review_text: string | null;
  // Breakdown — null when the user hasn't filled the analytical scores.
  design_score: number | null;
  condition_score: number | null;
  clubhouse_score: number | null;
  facilities_score: number | null;
}

export interface MyRatingsTierCardProps {
  course: MyRatingsTierCourse;
  /** Overall rank within the rated list (1 = top). */
  rank: number;
  onClick: () => void;
}
