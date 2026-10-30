import React from 'react';
import CoursesContent from '@/components/courses/CoursesContent';
import { PageRoot } from '@/components/layout/PageRoot';

const Courses = () => {
  // GUEST BROWSING §4: Courses locks for a guest 1.5 viewport heights down.
  useGuestScrollGate('courses');
  return (
    <PageRoot className="min-h-screen bg-[var(--bg-page)]" hasBottomNav>
      <main className="md:container md:mx-auto md:px-0">
        <div className="max-w-6xl mx-auto">
          <CoursesContent />
        </div>
      </main>
    </PageRoot>
  );
};

export default Courses;
