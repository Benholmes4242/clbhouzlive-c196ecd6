import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import ClubhouseHeaderNew from "@/components/clubhouse/ClubhouseHeaderNew";
import UserProfileLoader from '@/components/profile/UserProfileLoader';
import UserProfileContent from '@/components/profile/UserProfileContent';
import { useUserProfileQueries } from '@/hooks/useUserProfileQueries';
import { preloadCriticalProfileAssets, preloadCommonBadges, batchPreloadProfileImages } from '@/utils/profileOptimizations';
import { FadeInContent } from '@/components/ui/FadeInContent';

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

  // Preload critical assets immediately when profile loads
  useEffect(() => {
    if (profile) {
      // Preload profile assets with high priority
      preloadCriticalProfileAssets(profile);
      
      // Batch preload profile images at different sizes
      if (profile.profile_photo_url) {
        batchPreloadProfileImages(profile.profile_photo_url);
      }
    }
  }, [profile]);

  // Preload common badges on component mount
  useEffect(() => {
    preloadCommonBadges();
  }, []);

  return (
    <>
      <UserProfileLoader isLoading={isLoading} profile={profile} />
      
      {profile && (
        <FadeInContent>
          <UserProfileContent
            profile={profile}
            currentUser={currentUser}
            relationshipStatus={relationshipStatus}
          />
        </FadeInContent>
      )}
    </>
  );
};

export default UserProfilePage;
