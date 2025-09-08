
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
  // Determine the display name for the header
  const getDisplayName = () => {
    if (isOwnProfile) {
      return 'My';
    }
    return profile?.display_name || profile?.username || 'User\'s';
  };

  const displayName = getDisplayName();

  return (
    <div className="space-y-6 p-4">
      {/* Handicap Card - show for all personal profiles */}
      {profile && (
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
      
      {/* Top 100 Profile Header - Simplified for Netflix layout */}
      <div className="mt-8 mb-4">
        <h2 className="text-xl font-semibold text-foreground mb-2">
          {isOwnProfile ? 'My Golf Courses' : `${displayName}'s Golf Courses`}
        </h2>
      </div>

      {/* My Courses Content - embedded inline */}
      <div className="mt-6">
        <UserCoursesContent username={username} />
      </div>

      {/* Modal Router handled by parent ProfileModalRouter */}
    </div>
  );
};

export default InlineMyCoursesTab;
