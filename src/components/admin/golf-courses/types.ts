
export interface GolfCourse {
  id: string;
  name: string;
  country: string;
  region: string;
  continent: string;
  global_rank: number | null;
  regional_rank: number | null;
  description: string | null;
  thumbnail_image: string | null;
  website_url: string | null;
  latitude: number | null;
  longitude: number | null;
}

export interface CourseRating {
  id: string;
  rating: number;
  review: string | null;
  review_date: string;
  user_id: string;
  user_profile?: {
    username: string | null;
    display_name: string | null;
  } | null;
}

export interface GolfCourseEditorProps {
  course: GolfCourse | null;
  isCreating: boolean;
  onClose: () => void;
}
