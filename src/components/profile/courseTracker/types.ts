
export interface CourseTrackerProps {
  trackerStats: { [cat: string]: number };
  totalStats: { [cat: string]: number };
  userId?: string;
  isOwnProfile?: boolean;
  trackerVisible?: boolean;
  onVisibilityToggle?: (visible: boolean) => void;
  onTrackerUpdate?: () => void;
}

export interface PlayedCourse {
  id: string;
  course_id: string;
  played: boolean;
  played_date?: string;
  golf_courses?: {
    id: string;
    name: string;
    country: string;
    region: string;
    continent: string;
    global_rank: number;
    regional_rank: number;
  };
}
