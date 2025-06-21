
import React from 'react';
import { DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';

interface Course {
  id: string;
  name: string;
  global_rank?: number | null;
}

interface CourseDetailHeaderProps {
  course: Course;
}

const CourseDetailHeader = ({ course }: CourseDetailHeaderProps) => {
  return (
    <DialogHeader>
      <DialogTitle className="flex items-center gap-2">
        <span>{course.name}</span>
        {course.global_rank && (
          <Badge variant="secondary">#{course.global_rank} Global</Badge>
        )}
      </DialogTitle>
    </DialogHeader>
  );
};

export default CourseDetailHeader;
