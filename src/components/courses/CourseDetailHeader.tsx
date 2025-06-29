
import React from 'react';
import { DialogHeader, DialogTitle } from '@/components/ui/dialog';

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
      <DialogTitle>
        {course.name}
      </DialogTitle>
    </DialogHeader>
  );
};

export default CourseDetailHeader;
