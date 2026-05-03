export type SuitedCourse = {
  id: string;
  name: string;
  region: string;
  par: number;
  holes: number;
  slope: number;
  rating: number;
  yards: number;
  rationale: string;
};

export type HandicapInsights = {
  scoring_profile: string;
  suited_courses: SuitedCourse[];
  test_courses: SuitedCourse[];
  generated_at: string;
};
