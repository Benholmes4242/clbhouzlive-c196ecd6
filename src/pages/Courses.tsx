import React from 'react';
import CoursesContent from '@/components/courses/CoursesContent';
import { FadeInContent } from '@/components/ui/FadeInContent';
import { PageRoot } from '@/components/layout/PageRoot';

const Courses = () => {
  return (
    <PageRoot className="min-h-screen bg-background safe-top compact-header-offset">
      <FadeInContent>
        <main className="px-4 md:container md:mx-auto md:px-0 pb-[var(--page-bottom-padding)]">
          <div className="max-w-6xl mx-auto">
            <CoursesContent />
          </div>
        </main>
      </FadeInContent>
    </PageRoot>
  );
};

export default Courses;