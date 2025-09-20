
import React from 'react';
import Header from "@/components/Header";
import BottomNavigation from '@/components/BottomNavigation';
import CoursesContent from '@/components/courses/CoursesContent';

const Courses = () => {
  return (
    <div className="min-h-screen bg-background pb-28">
      <Header />
      
      <main className="px-4 md:container md:mx-auto md:px-0 py-6">
        <div className="max-w-6xl mx-auto">
          <CoursesContent />
        </div>
      </main>
      
      <BottomNavigation />
    </div>
  );
};

export default Courses;
