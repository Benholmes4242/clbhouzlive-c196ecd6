
import React, { useState } from 'react';
import HeroProfileHeader from './HeroProfileHeader';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import ProfileImagePreloader from '@/components/ui/profile-image-preloader';

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
      {/* Preload profile images for better performance */}
      <ProfileImagePreloader 
        profilePhotoUrl={profile.profile_photo_url}
        priority={true}
      />
      
      <div className="w-full px-4 md:px-8">
        <HeroProfileHeader 
          profile={profile}
          isOwnProfile={isOwnProfile}
          onProfileUpdate={() => {
            // Profile update will be handled by the HeroProfileHeader component
          }}
          activeSection={activeSection}
          onSectionChange={setActiveSection}
        />
      </div>
    </>
  );
};

export default UserProfileContent;
