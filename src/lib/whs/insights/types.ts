export type SuitedCourse = {
  id: string;
  name: string;
  region: string;
  rationale: string;
  /** Predicted differential at this course based on user's recent form +
   *  course slope. Null if either input was unavailable at generation time. */
  expected_differential: number | null;
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
