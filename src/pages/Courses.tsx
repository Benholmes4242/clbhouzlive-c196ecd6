
import React, { useRef } from 'react';
import ClubhouseHeaderNew from '@/components/clubhouse/ClubhouseHeaderNew';
import CoursesContent from '@/components/courses/CoursesContent';
import { FadeInContent } from '@/components/ui/FadeInContent';

const Courses = () => {
  const coursesScrollRef = useRef<HTMLDivElement>(null);

  return (
    <div className="flex flex-col h-screen bg-background page-with-header m-0 p-0">
      <ClubhouseHeaderNew />
      <div 
        ref={coursesScrollRef}
        className="courses-scroll-region flex-1 overflow-y-auto overflow-x-hidden"
      >
        <FadeInContent>
          <main className="px-4 md:container md:mx-auto md:px-0 pt-[72px] pb-[30px]">
            <div className="max-w-6xl mx-auto">
              <CoursesContent coursesScrollRef={coursesScrollRef} />
            </div>
          </main>
        </FadeInContent>
      </div>
    </div>
  );
};

export default Courses;
