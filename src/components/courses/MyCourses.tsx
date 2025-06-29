
import React from 'react';
import UserCoursesContent from './UserCoursesContent';

const MyCourses = () => {
  // For the current user's own courses, we don't pass a username
  return <UserCoursesContent />;
};

export default MyCourses;
