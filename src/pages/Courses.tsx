import React from 'react';
import CoursesContent from '@/components/courses/CoursesContent';
import { PageRoot } from '@/components/layout/PageRoot';

const Courses = () => {
  return (
    <PageRoot className="min-h-screen bg-[var(--bg-page)]">
      <main className="px-4 md:container md:mx-auto md:px-0">
        <div className="max-w-6xl mx-auto">
          <CoursesContent />
        </div>
      </main>
    </PageRoot>
  );
};

export default Courses;
