export type SuitedCourse = {
  id: string;
  name: string;
  region: string;
  rationale: string;
};

export type HandicapInsights = {
  scoring_profile: string;
  rounds_pattern: string;
  suited_courses: SuitedCourse[];
  test_courses: SuitedCourse[];
  generated_at: string;
};
