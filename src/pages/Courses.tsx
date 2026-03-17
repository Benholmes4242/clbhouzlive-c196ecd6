import React from 'react';
import CoursesContent from '@/components/courses/CoursesContent';
import { PageRoot } from '@/components/layout/PageRoot';

const Courses = () => {
  return (
    <PageRoot className="min-h-screen bg-background" hasBottomNav>
      <main className="md:container md:mx-auto md:px-0 px-4">
        <div className="max-w-6xl mx-auto">
          <CoursesContent />
        </div>
      </main>
    </PageRoot>
  );
};

export default Courses;
