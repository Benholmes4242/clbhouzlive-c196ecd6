
import React from 'react';
import EGAppIntegration from '@/components/profile/EGAppIntegration';
import Top100Courses from '@/components/profile/Top100Courses';
import SocialActivity from '@/components/profile/SocialActivity';

interface ProfileSectionsProps {
  profile: any;
  user: any;
  onEGVisibilityToggle: (checked: boolean) => void;
  isOwnProfile?: boolean;
}

const ProfileSections: React.FC<ProfileSectionsProps> = ({
  profile,
  user,
  onEGVisibilityToggle,
  isOwnProfile
}) => {
  return (
    <div className="space-y-8">
      {/* EG App Integration */}
      <EGAppIntegration
        egAppConnected={profile?.eg_app_connected}
        handicapIndex={profile?.eg_handicap_index}
        recentRounds={profile?.eg_recent_rounds}
        userId={profile?.id || user?.id || ''}
        isOwnProfile={isOwnProfile}
        egVisible={profile?.eg_visible}
        onVisibilityToggle={onEGVisibilityToggle}
      />

      {/* Top 100 Courses */}
      <Top100Courses
        userId={profile?.id || user?.id || ''}
        isOwnProfile={isOwnProfile}
        top100Visible={profile?.top100_visible}
      />

      {/* Social Activity - User's Posts */}
      <SocialActivity
        userId={profile?.id || user?.id || ''}
        isOwnProfile={isOwnProfile}
        activityVisible={profile?.activity_visible !== false}
        profileDisplayName={profile?.display_name}
      />
    </div>
  );
};

export default ProfileSections;
