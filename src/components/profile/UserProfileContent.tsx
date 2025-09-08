
import React, { useState, useCallback } from 'react';
import HeroProfileHeader from './HeroProfileHeader';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';


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
  // Check if this is the user's own profile - handle both user ID and username matching
  const isOwnProfile = user?.id === profile?.id || 
                       (user && profile?.username && user.user_metadata?.username === profile.username) ||
                       (user && profile?.username === user.email?.split('@')[0]);
  const [activeSection, setActiveSection] = useState('activity');

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
    </>
  );
};

export default UserProfileContent;
