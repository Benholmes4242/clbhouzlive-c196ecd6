export type SuitedCourse = {
  id: string;
  name: string;
  region: string;
  country: string;
  rationale: string;
  /** Predicted differential at this course based on user's recent form +
   *  course slope. Null if either input was unavailable at generation time. */
  expected_differential: number | null;
  /**
   * Course thumbnail from `golf_courses.thumbnail_image`.
   * May be null if the course has no thumbnail set, or if the cached row
   * pre-dates the field being added. Client-side enrichment fills this in
   * for legacy rows.
   */
  thumbnail_image: string | null;
  /** Course slope rating (e.g. 131). Null when not mappable via whs bridge. */
  slope_rating: number | null;
  /** Course rating (e.g. 72.1). Null when missing on golf_courses. */
  course_rating: number | null;
  /** Distance from user's home location in miles, rounded.
   *  Null if user has no stored location or course lacks lat/lng. */
  distance_miles: number | null;

};

export type HandicapInsights = {
  scoring_profile: string;
  rounds_pattern: string;
  /** Trends-tab cross-card narrative. Empty string when not yet generated. */
  trend_narrative: string;
  /** Friends-tab Echo narrative. Empty string when no framing fires. */
  friend_narrative: string;
  suited_courses: SuitedCourse[];
  test_courses: SuitedCourse[];
  generated_at: string;
};
