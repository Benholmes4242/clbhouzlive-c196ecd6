
import React from 'react';
import HandicapCard from './HandicapCard';
import UserCoursesContent from '@/components/courses/UserCoursesContent';

interface InlineMyCoursesTabProps {
  profile: any;
  regionProgress: any;
  isOwnProfile: boolean;
  username?: string;
  onRegionClick: (region: string) => void;
  onEGConnect: () => void;
}

const InlineMyCoursesTab: React.FC<InlineMyCoursesTabProps> = ({
  profile,
  regionProgress,
  isOwnProfile,
  username,
  onRegionClick,
  onEGConnect
}) => {
  return (
    <div className="space-y-6 p-4">
      {/* Handicap Card - only for individual users */}
      {profile?.user_type === 'individual' && (
        <HandicapCard
          handicapIndex={profile?.eg_handicap_index}
          egAppConnected={profile?.eg_app_connected || false}
          lastUpdated={profile?.updated_at}
          isOwnProfile={isOwnProfile}
          onEGConnect={onEGConnect}
          userUsername={profile?.username || username}
          profile={profile}
        />
      )}
      
      {/* My Courses Content - embedded inline */}
      <div className="mt-6">
        <UserCoursesContent username={username} />
      </div>
    </div>
  );
};

export default InlineMyCoursesTab;
