
import React from 'react';
import BagManager from '@/components/BagManager';
import EGAppIntegration from './EGAppIntegration';
import CourseTracker from './CourseTracker';
import SocialActivity from './SocialActivity';

interface ProfileSectionsProps {
  profile: {
    eg_app_connected?: boolean | null;
    eg_handicap_index?: number | null;
    eg_recent_rounds?: any | null;
    bag_visible?: boolean | null;
    tracker_visible?: boolean | null;
    eg_visible?: boolean | null;
  } | null;
  user: any;
  trackerStats: { [cat: string]: number };
  totalStats: { [cat: string]: number };
  onEGVisibilityToggle: (checked: boolean) => void;
  onTrackerVisibilityToggle: (checked: boolean) => void;
  onTrackerUpdate: () => void;
  isOwnProfile?: boolean;
}

const ProfileSections: React.FC<ProfileSectionsProps> = ({
  profile,
  user,
  trackerStats,
  totalStats,
  onEGVisibilityToggle,
  onTrackerVisibilityToggle,
  onTrackerUpdate,
  isOwnProfile = false
}) => {
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
      
      <CourseTracker 
        trackerStats={trackerStats} 
        totalStats={totalStats}
        userId={user?.id}
        isOwnProfile={isOwnProfile}
        trackerVisible={profile?.tracker_visible ?? true}
        onVisibilityToggle={isOwnProfile ? onTrackerVisibilityToggle : undefined}
        onTrackerUpdate={onTrackerUpdate}
      />

      <SocialActivity
        userId={user?.id}
        isOwnProfile={isOwnProfile}
        activityVisible={true}
      />
    </>
  );
};

export default ProfileSections;
