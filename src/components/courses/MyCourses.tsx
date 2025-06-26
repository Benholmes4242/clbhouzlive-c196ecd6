
import React from 'react';
import { useMyCourses } from './hooks/useMyCourses';
import MyCoursesStats from './MyCoursesStats';
import MyCoursesTabs from './MyCoursesTabs';

const MyCourses = () => {
  const {
    user,
    activeTab,
    setActiveTab,
    allPlayedCourses,
    top100Courses,
    recentCourses,
    totalCoursesPlayed,
    totalTop100Played,
    averageRating,
    isLoading,
    isLoadingTop100
  } = useMyCourses();

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <MyCoursesStats
        totalCoursesPlayed={totalCoursesPlayed}
        totalTop100Played={totalTop100Played}
        averageRating={averageRating}
      />

      {/* Course Lists */}
      <MyCoursesTabs
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        allPlayedCourses={allPlayedCourses}
        top100Courses={top100Courses}
        recentCourses={recentCourses}
        userId={user?.id}
        isLoading={isLoading}
        isLoadingTop100={isLoadingTop100}
      />
    </div>
  );
};

export default MyCourses;
