
import React from 'react';
import { useParams } from 'react-router-dom';
import ClubhouseHeaderNew from '@/components/clubhouse/ClubhouseHeaderNew';
import BottomNavigation from '@/components/BottomNavigation';
import CoursesContent from '@/components/courses/CoursesContent';
import { useUserCoursesData } from '@/components/courses/user/useUserCoursesData';

const UserCoursesPage = () => {
  const { username } = useParams<{ username: string }>();
  const { displayName } = useUserCoursesData(username);

  return (
    <div className="min-h-screen bg-background">
      <ClubhouseHeaderNew />
      
      <main className="px-4 md:container md:mx-auto md:px-0 py-6 pb-20">
        <div className="max-w-6xl mx-auto">
          <CoursesContent username={username} displayName={displayName} />
        </div>
      </main>
      
      
    </div>
  );
};

export default UserCoursesPage;
