import React from 'react';
import { Navigate, useParams } from 'react-router-dom';

const CourseRoundsPage: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  if (!courseId) return <Navigate to="/courses" replace />;
  return <Navigate to={`/courses/${courseId}?tab=you&sheet=rounds`} replace />;
};

export default CourseRoundsPage;
