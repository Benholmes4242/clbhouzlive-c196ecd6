
import React from 'react';
import { useUserCoursesData } from './user/useUserCoursesData';
import UserCoursesHeader from './user/UserCoursesHeader';
import UserCoursesStats from './user/UserCoursesStats';
import UserCoursesTabs from './user/UserCoursesTabs';
import { 
  SignInRequiredState, 
  LoadingState, 
  UserNotFoundState 
} from './user/UserCoursesEmptyStates';

interface UserCoursesContentProps {
  username?: string;
}

const UserCoursesContent: React.FC<UserCoursesContentProps> = ({ username }) => {
  const {
    currentUser,
    targetUserProfile,
    targetUserId,
    displayName,
    isOwnProfile,
    activeTab,
    setActiveTab,
    top100CoursesRaw,
    isLoadingTop100,
    averageRating,
    recentCourses,
    handleAverageRatingClick
  } = useUserCoursesData(username);

  // Handle different states
  if (!currentUser && !isOwnProfile) {
    return <SignInRequiredState />;
  }

  if (!isOwnProfile && !targetUserProfile && username) {
    return <LoadingState />;
  }

  if (!isOwnProfile && !targetUserProfile && username) {
    return <UserNotFoundState />;
  }

  const totalTop100Played = top100CoursesRaw.length;

  return (
    <div className="space-y-6">
      <UserCoursesHeader 
        displayName={displayName} 
        isOwnProfile={isOwnProfile} 
      />

      <UserCoursesStats
        totalTop100Played={totalTop100Played}
        averageRating={averageRating}
        isOwnProfile={isOwnProfile}
        onAverageRatingClick={handleAverageRatingClick}
      />

      <UserCoursesTabs
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        top100Courses={top100CoursesRaw}
        recentCourses={recentCourses}
        isLoadingTop100={isLoadingTop100}
        targetUserId={targetUserId}
        isOwnProfile={isOwnProfile}
        displayName={displayName}
      />
    </div>
  );
};

export default UserCoursesContent;
