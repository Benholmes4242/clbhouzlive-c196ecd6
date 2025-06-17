
import React from 'react';
import Header from "@/components/Header";
import BottomNavigation from '@/components/BottomNavigation';
import UserProfileLoader from '@/components/profile/UserProfileLoader';
import UserProfileContent from '@/components/profile/UserProfileContent';
import { useUserProfileQueries } from '@/hooks/useUserProfileQueries';

const UserProfilePage = () => {
  const {
    profile,
    isLoading,
    relationshipStatus,
    currentUser
  } = useUserProfileQueries();

  return (
    <div className="min-h-screen bg-background pb-28">
      <Header />
      
      <UserProfileLoader isLoading={isLoading} profile={profile} />
      
      {profile && (
        <UserProfileContent
          profile={profile}
          currentUser={currentUser}
          relationshipStatus={relationshipStatus}
        />
      )}
      
      <BottomNavigation />
    </div>
  );
};

export default UserProfilePage;
