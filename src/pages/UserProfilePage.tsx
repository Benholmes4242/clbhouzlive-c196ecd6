
import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Header from "@/components/Header";
import BottomNavigation from '@/components/BottomNavigation';
import UserProfileLoader from '@/components/profile/UserProfileLoader';
import UserProfileContent from '@/components/profile/UserProfileContent';
import { useUserProfileQueries } from '@/hooks/useUserProfileQueries';
import { preloadCriticalProfileAssets, preloadCommonBadges, batchPreloadProfileImages } from '@/utils/profileOptimizations';

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
    <div className="min-h-screen bg-background pb-28 relative overflow-hidden">
      {/* Critical profile assets preload with optimized sizes */}
      {profile?.profile_photo_url && (
        <>
          <link 
            rel="preload" 
            as="image" 
            href={`${profile.profile_photo_url}?quality=95&format=auto&width=256&height=256&fit=cover`}
            fetchPriority="high"
          />
          <link 
            rel="preload" 
            as="image" 
            href={`${profile.profile_photo_url}?quality=90&format=auto&width=1280&height=720&fit=cover`}
            fetchPriority="high"
          />
          <link 
            rel="prefetch" 
            as="image" 
            href={`${profile.profile_photo_url}?quality=85&format=auto&width=2048&height=2048&fit=cover`}
          />
        </>
      )}
      
      {/* Preload common achievement badges */}
      <link rel="preload" as="image" href="https://pub-73469fa1cd444caea8cb50c8c84a8b84.r2.dev/logos/birdie-blitz-badge.png" />
      <link rel="preload" as="image" href="https://pub-73469fa1cd444caea8cb50c8c84a8b84.r2.dev/logos/20-club-badge.png" />
      <link rel="preload" as="image" href="https://pub-73469fa1cd444caea8cb50c8c84a8b84.r2.dev/logos/50-club-badge.png" />
      
      {/* Header integrated into profile layout */}
      
      
      {/* Content flows naturally without fixed positioning */}
      <div className="relative">
        <UserProfileLoader isLoading={isLoading} profile={profile} />
        
        {profile && (
          <UserProfileContent
            profile={profile}
            currentUser={currentUser}
            relationshipStatus={relationshipStatus}
          />
        )}
      </div>
      
      <BottomNavigation />
    </div>
  );
};

export default UserProfilePage;
