
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
  // All profiles are now personal profiles
  const showPersonalSections = true;

  return (
    <div className="space-y-8">
      {/* Show EG App Integration and Top 100 Courses for all personal profiles */}
      {showPersonalSections && (
        <>
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
            userDisplayName={profile?.display_name?.split(' ')[0] || profile?.username || 'this user'}
          />
        </>
      )}

    </div>
  );
};

export default ProfileSections;
