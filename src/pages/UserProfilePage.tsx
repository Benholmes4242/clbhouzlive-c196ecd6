
import React from 'react';
import { useParams } from 'react-router-dom';
import Header from "@/components/Header";
import BottomNavigation from '@/components/BottomNavigation';
import UserProfileLoader from '@/components/profile/UserProfileLoader';
import UserProfileContent from '@/components/profile/UserProfileContent';
import { useUserProfileQueries } from '@/hooks/useUserProfileQueries';

const UserProfilePage = () => {
  const { username } = useParams<{ username: string }>();
  
  console.log('UserProfilePage - username from params:', username);
  
  const {
    profile,
    isLoading,
    relationshipStatus,
    currentUser
  } = useUserProfileQueries();

  console.log('UserProfilePage - profile data:', profile);
  console.log('UserProfilePage - isLoading:', isLoading);
  console.log('UserProfilePage - currentUser:', currentUser);

  return (
    <div className="min-h-screen bg-background pb-28 relative">
      {/* Critical profile photo preload at page level for immediate loading */}
      {profile?.profile_photo_url && (
        <>
          <link 
            rel="preload" 
            as="image" 
            href={profile.profile_photo_url}
            fetchPriority="high"
          />
          <link 
            rel="prefetch" 
            as="image" 
            href={profile.profile_photo_url}
          />
        </>
      )}
      
      {/* Header */}
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
