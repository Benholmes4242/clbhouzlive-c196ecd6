
import React from 'react';
import { Badge } from '@/components/ui/badge';
import CountryFlag from '@/components/ui/country-flag';

interface Course {
  id: string;
  name: string;
  country: string;
  sub_country?: string;
  region?: string;
  global_rank?: number | null;
  regional_rank?: number | null;
  usa_rank?: number | null;
}

interface CourseInfoProps {
  course: Course;
  viewContext?: 'global' | 'regional';
}

const CourseInfo: React.FC<CourseInfoProps> = ({ course, viewContext = 'global' }) => {
  const getRankDisplay = () => {
    if (viewContext === 'global' && course.global_rank) {
      return `#${course.global_rank} Global`;
    }
    if (viewContext === 'regional' && course.regional_rank) {
      return `#${course.regional_rank} Regional`;
    }
    if (course.usa_rank && course.country === 'USA') {
      return `#${course.usa_rank} USA`;
    }
    return null;
  };

  const rankDisplay = getRankDisplay();

  return (
    <div className="flex items-center gap-2">
      <CountryFlag country={course.country} size="sm" />
      <span className="text-sm text-muted-foreground">
        {course.sub_country || course.country}
        {course.regional_rank && ` #${course.regional_rank}`}
      </span>
    </div>
  );
};

export default CourseInfo;
