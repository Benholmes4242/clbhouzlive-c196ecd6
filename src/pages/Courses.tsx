
import React from 'react';
import ClubhouseHeaderNew from '@/components/clubhouse/ClubhouseHeaderNew';
import CoursesContent from '@/components/courses/CoursesContent';
import { FadeInContent } from '@/components/ui/FadeInContent';

const Courses = () => {
  return (
    <div className="min-h-screen bg-background page-with-header m-0 p-0">
      <ClubhouseHeaderNew />
      <FadeInContent>
        <main className="px-4 md:container md:mx-auto md:px-0 pt-[72px] pb-[30px]">
          <div className="max-w-6xl mx-auto">
            <CoursesContent />
          </div>
        </main>
      </FadeInContent>
    </div>
  );
};

export default Courses;
