import React from 'react';
import CoursesContent from '@/components/courses/CoursesContent';
import { FadeInContent } from '@/components/ui/FadeInContent';
import { PageRoot } from '@/components/layout/PageRoot';

const Courses = () => {
  return (
    <PageRoot className="min-h-screen bg-[var(--bg-page)]">
      <FadeInContent>
        <main className="px-4 md:container md:mx-auto md:px-0 pb-[30px]">
          <div className="max-w-6xl mx-auto">
            <CoursesContent />
          </div>
        </main>
      </FadeInContent>
    </PageRoot>
  );
};

export default Courses;