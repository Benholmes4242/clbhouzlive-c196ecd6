
import React, { useState } from 'react';
import InstagramStyleProfileHeader from './InstagramStyleProfileHeader';
import InstagramStyleProfileTabs from './InstagramStyleProfileTabs';
import ActivityFeed from './ActivityFeed';
import InlineMyCoursesTab from './InlineMyCoursesTab';
import BadgeCarousel from '@/components/badges/BadgeCarousel';

interface ProfilePageLayoutProps {
  profile: any;
  currentUser: any;
  relationshipStatus: {
    isFollowing: boolean;
  } | null;
  regionProgress: any;
  onRegionClick: (region: string) => void;
  onEGConnect: () => void;
}

const ProfilePageLayout: React.FC<ProfilePageLayoutProps> = ({
  profile,
  currentUser,
  relationshipStatus,
  regionProgress,
  onRegionClick,
  onEGConnect
}) => {
  const [activeTab, setActiveTab] = useState('activity');
  const isOwnProfile = currentUser?.id === profile?.id;

  return (
    <div className="max-w-2xl mx-auto bg-white min-h-screen">
      {/* Instagram-style Header */}
      <InstagramStyleProfileHeader
        profile={profile}
        currentUser={currentUser}
        relationshipStatus={relationshipStatus}
      />

      {/* Tab Navigation - positioned with spacing after removing divider */}
      <div className="mt-4">
        <InstagramStyleProfileTabs
        activeTab={activeTab}
        onTabChange={setActiveTab}
        children={{
          activity: (
            <ActivityFeed
              userId={profile?.id}
              isOwnProfile={isOwnProfile}
              profileDisplayName={profile?.display_name}
            />
          ),
          courses: (
            <InlineMyCoursesTab
              profile={profile}
              regionProgress={regionProgress}
              isOwnProfile={isOwnProfile}
              username={profile?.username}
              onRegionClick={onRegionClick}
              onEGConnect={onEGConnect}
            />
          ),
          badges: (
            <div className="p-4">
              <BadgeCarousel userId={profile?.id} />
            </div>
          )
        }}
        />
      </div>
    </div>
  );
};

export default ProfilePageLayout;
