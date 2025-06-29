
import React from 'react';
import { DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { MapPin } from 'lucide-react';

interface Course {
  id: string;
  name: string;
  country: string;
  region?: string;
  sub_country?: string;
  global_rank?: number | null;
}

interface CourseDetailHeaderProps {
  course: Course;
}

// Helper function to format location display
const formatLocation = (course: Course) => {
  const parts = [];
  
  // Always start with country
  parts.push(course.country);
  
  // Add sub_country if it exists
  if (course.sub_country) {
    parts.push(course.sub_country);
  }
  
  // Add region if it exists and is different from country
  if (course.region && course.region !== course.country) {
    parts.push(course.region);
  }
  
  return parts.join(', ');
};

const CourseDetailHeader = ({ course }: CourseDetailHeaderProps) => {
  return (
    <DialogHeader>
      <DialogTitle>
        {course.name}
      </DialogTitle>
      <div className="flex items-center gap-2 text-muted-foreground mt-2">
        <MapPin className="h-4 w-4" />
        <span>{formatLocation(course)}</span>
      </div>
    </DialogHeader>
  );
};

export default CourseDetailHeader;
