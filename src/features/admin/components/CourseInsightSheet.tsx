import React from 'react';
import AdminSheet from './AdminSheet';
import CourseInsight from './CourseInsight';
import { useCourseInsight } from '../hooks/useCourseInsight';

interface Props {
  courseId: string | null;
  open: boolean;
  onClose: () => void;
}

export default function CourseInsightSheet({ courseId, open, onClose }: Props) {
  const { data } = useCourseInsight(open ? courseId : null);
  return (
    <AdminSheet
      open={open}
      onClose={onClose}
      title={data?.courseName ?? 'Course insight'}
      subtitle={courseId ? `Course ${courseId.slice(0, 8)}` : undefined}
      maxWidth={560}
    >
      <CourseInsight courseId={open ? courseId : null} compact />
    </AdminSheet>
  );
}
