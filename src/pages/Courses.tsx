
import React from 'react';
import ClubhouseHeaderNew from '@/components/clubhouse/ClubhouseHeaderNew';
import CoursesContent from '@/components/courses/CoursesContent';

const Courses = () => {
  return (
    <div className="bg-background page-with-header m-0 p-0">
      <ClubhouseHeaderNew />
      <main className="px-4 md:container md:mx-auto md:px-0 pt-[64px] md:pt-[72px] pb-6 min-h-[calc(100vh-64px)] md:min-h-[calc(100vh-72px)]">
        <div className="max-w-6xl mx-auto">
          <CoursesContent />
        </div>
      </main>
    </div>
  );
};

export default Courses;
