
import React from 'react';
import { useParams } from 'react-router-dom';
import Header from '@/components/Header';
import BottomNavigation from '@/components/BottomNavigation';
import CoursesContent from '@/components/courses/CoursesContent';
import { useUserCoursesData } from '@/components/courses/user/useUserCoursesData';

const UserCoursesPage = () => {
  const { username } = useParams<{ username: string }>();
  const { displayName } = useUserCoursesData(username);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-6 pb-20">
        <div className="max-w-6xl mx-auto">
          <CoursesContent username={username} displayName={displayName} />
        </div>
      </main>
      
      <BottomNavigation />
    </div>
  );
};

export default UserCoursesPage;
