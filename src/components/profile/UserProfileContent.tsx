
import React, { useState } from 'react';
import InstagramStyleProfileHeader from './InstagramStyleProfileHeader';
import SlidingProfileSections from './SlidingProfileSections';
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
  const [activeSection, setActiveSection] = useState('activity');
  const isOwnProfile = user?.id === profile?.id;

  if (!profile) {
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto">
      <InstagramStyleProfileHeader 
        profile={profile}
        currentUser={currentUser}
        relationshipStatus={relationshipStatus}
      />
      
      <SlidingProfileSections
        userId={profile?.id}
        profile={profile}
        isOwnProfile={isOwnProfile}
        activeSection={activeSection}
      />
    </div>
  );
};

export default UserProfileContent;
