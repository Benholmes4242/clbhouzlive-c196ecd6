import React, { useState, useCallback, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import HeroProfileHeader from './HeroProfileHeader';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import ProfileReviewsStrip from './ProfileReviewsStrip';


interface UserProfileContentProps {
  profile: any;
  currentUser: any;
  relationshipStatus: {
    isFollowing: boolean;
  } | null;
}

const UserProfileContent: React.FC<UserProfileContentProps> = ({ 
  profile, 
  currentUser, 
  relationshipStatus 
}) => {
  const { user } = useSupabaseSession();
  const [searchParams] = useSearchParams();
  
  // Check if this is the user's own profile - handle both user ID and username matching
  const isOwnProfile = user?.id === profile?.id || 
                       (user && profile?.username && user.user_metadata?.username === profile.username) ||
                       (user && profile?.username === user.email?.split('@')[0]);
  
  // Get tab from URL query params, default to 'activity'
  const tabFromUrl = searchParams.get('tab');
  const validTabs = ['activity', 'courses', 'top100', 'achievements', 'stats'];
  const initialSection = validTabs.includes(tabFromUrl || '') ? tabFromUrl : 'activity';
  
  const [activeSection, setActiveSection] = useState(initialSection || 'activity');

  // Memoize the profile update callback to prevent infinite re-renders
  const handleProfileUpdate = useCallback(() => {
    // Profile update will be handled by the HeroProfileHeader component
  }, []);

  // Memoize the section change handler to prevent infinite re-renders
  const handleSectionChange = useCallback((section: string) => {
    setActiveSection(section);
  }, []);

  if (!profile) {
    return null;
  }

  return (
    <>
      <HeroProfileHeader 
        profile={profile}
        isOwnProfile={isOwnProfile}
        onProfileUpdate={handleProfileUpdate}
        activeSection={activeSection}
        onSectionChange={handleSectionChange}
      />
      
      {/* Reviews strip - shown below the profile header */}
      <div className="px-4 md:px-6 max-w-[1150px] mx-auto">
        <ProfileReviewsStrip
          userId={profile.id}
          username={profile.username}
          displayName={profile.display_name}
        />
      </div>
    </>
  );
};

export default UserProfileContent;
