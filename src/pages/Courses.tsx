
import React from 'react';
import Header from '@/components/Header';
import BottomNavigation from '@/components/BottomNavigation';
import FloatingPostButton from '@/components/posts/FloatingPostButton';
import CoursesContent from '@/components/courses/CoursesContent';

const Courses = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-6 pb-20">
        <CoursesContent />
      </div>
      <FloatingPostButton />
      <BottomNavigation />
    </div>
  );
};

export default Courses;
