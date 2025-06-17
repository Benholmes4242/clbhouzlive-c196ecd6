
import React from 'react';
import BagManager from '@/components/BagManager';
import EGAppIntegration from './EGAppIntegration';
import SocialActivity from './SocialActivity';
import Top100Courses from './Top100Courses';

interface ProfileSectionsProps {
  profile: {
    eg_app_connected?: boolean | null;
    eg_handicap_index?: number | null;
    eg_recent_rounds?: any | null;
    bag_visible?: boolean | null;
    eg_visible?: boolean | null;
    top100_visible?: boolean | null;
    display_name?: string | null;
    username?: string | null;
  } | null;
  user: any;
  onEGVisibilityToggle: (checked: boolean) => void;
  isOwnProfile?: boolean;
}

const ProfileSections: React.FC<ProfileSectionsProps> = ({
  profile,
  user,
  onEGVisibilityToggle,
  isOwnProfile = false
}) => {
  // Get the profile owner's name for post attribution
  const profileOwnerName = profile?.display_name || profile?.username || "User";

  return (
    <>
      <EGAppIntegration
        egAppConnected={profile?.eg_app_connected ?? false}
        handicapIndex={profile?.eg_handicap_index ?? null}
        recentRounds={profile?.eg_recent_rounds ?? null}
        userId={user?.id}
        isOwnProfile={isOwnProfile}
        egVisible={profile?.eg_visible ?? true}
        onVisibilityToggle={isOwnProfile ? onEGVisibilityToggle : undefined}
      />
      
      {user && (
        <BagManager 
          userId={user.id} 
          isOwnProfile={isOwnProfile}
          bagVisible={profile?.bag_visible ?? true}
        />
      )}

      {user && (
        <Top100Courses
          userId={user.id}
          isOwnProfile={isOwnProfile}
          top100Visible={profile?.top100_visible ?? true}
        />
      )}

      <SocialActivity
        userId={user?.id}
        isOwnProfile={isOwnProfile}
        activityVisible={true}
        profileOwnerName={profileOwnerName}
      />
    </>
  );
};

export default ProfileSections;
