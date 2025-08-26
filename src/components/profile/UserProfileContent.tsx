
import React, { useState } from 'react';
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
  const isOwnProfile = user?.id === profile?.id;
  const [activeSection, setActiveSection] = useState('activity');


  if (!profile) {
    return null;
  }

  return (
    <>
      <HeroProfileHeader 
        profile={profile}
        isOwnProfile={isOwnProfile}
        onProfileUpdate={() => {
          // Profile update will be handled by the HeroProfileHeader component
        }}
        activeSection={activeSection}
        onSectionChange={setActiveSection}
      />
    </>
  );
};

export default UserProfileContent;
