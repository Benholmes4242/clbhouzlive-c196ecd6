
import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import HandicapCard from './HandicapCard';
import UserCoursesContent from '@/components/courses/UserCoursesContent';
import ProfileModalRouter from './ProfileModalRouter';

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
  const location = useLocation();

  // Handle deep link scroll to all-courses-played section
  useEffect(() => {
    if (location.hash === '#all-courses-played') {
      // Small delay to ensure DOM is ready
      const timer = setTimeout(() => {
        const element = document.getElementById('all-courses-played');
        if (element) {
          element.scrollIntoView({ behavior: 'instant', block: 'start' });
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [location.hash]);

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

      {/* My Courses Content - embedded inline with anchor for deep linking */}
      <div id="all-courses-played" className="mt-6 scroll-mt-4">
        <UserCoursesContent username={username} />
      </div>

      {/* Modal Router handled by parent ProfileModalRouter */}
    </div>
  );
};

export default InlineMyCoursesTab;
