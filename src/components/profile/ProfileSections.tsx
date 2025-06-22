import React from 'react';
import EGAppIntegration from '@/components/profile/EGAppIntegration';
import Top100Courses from '@/components/profile/Top100Courses';
import UserAccountInfo from './UserAccountInfo';

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
      {/* User Account Information - Only show on own profile */}
      {isOwnProfile && (
        <UserAccountInfo
          profile={profile}
          userEmail={user?.email}
          onProfileUpdate={() => {
            // Trigger a refresh of profile data
            window.location.reload();
          }}
        />
      )}

      {/* EG App Integration */}
      <EGAppIntegration
        profile={profile}
        isOwnProfile={isOwnProfile}
        onEGVisibilityToggle={onEGVisibilityToggle}
      />

      {/* Top 100 Courses */}
      <Top100Courses
        userId={profile?.id || user?.id || ''}
        isOwnProfile={isOwnProfile}
        top100Visible={profile?.top100_visible}
      />
    </div>
  );
};

export default ProfileSections;
