
import React from 'react';
import CoursesContent from '@/components/courses/CoursesContent';

const Courses = () => {
  return (
    <div className="min-h-screen bg-background page-with-header">
      <main className="px-4 md:container md:mx-auto md:px-0 py-6">
        <div className="max-w-6xl mx-auto">
          <CoursesContent />
        </div>
      </main>
    </div>
  );
};

export default Courses;
