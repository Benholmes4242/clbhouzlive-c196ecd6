import React from 'react';
import { Navigate, useParams, useSearchParams } from 'react-router-dom';

const CourseHolesPage: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const [params] = useSearchParams();
  const personal = params.get('scope') === 'you';
  if (!courseId) return <Navigate to="/courses" replace />;
  const query = new URLSearchParams({ sheet: personal ? 'your-holes' : 'holes' });
  if (personal) query.set('tab', 'you');
  return <Navigate to={`/courses/${courseId}?${query.toString()}`} replace />;
};


export default CourseHolesPage;
