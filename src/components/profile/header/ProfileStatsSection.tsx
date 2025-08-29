import React from 'react';
import ResponsiveStatsDisplay from '../ResponsiveStatsDisplay';
import { useIsMobile } from '@/hooks/use-mobile';

interface ProfileStatsSectionProps {
  profile: any;
  postsCount: number;
  followersCount: number;
  followingCount: number;
  onStatClick: (statType: string) => void;
}

const ProfileStatsSection: React.FC<ProfileStatsSectionProps> = ({
  profile,
  postsCount,
  followersCount,
  followingCount,
  onStatClick
}) => {
  const isMobile = useIsMobile();

  return (
    <div className={`
      transition-all duration-300
      ${isMobile 
        ? 'px-6 py-8 bg-white' // Mobile: increased padding to match bio spacing
        : 'px-4 md:px-8 py-6' // Desktop: existing layout
      }
    `}>
      <div className={`
        ${isMobile 
          ? 'max-w-full' // Mobile: use full width
          : 'transition-transform duration-300 ease-out' // Desktop: existing
        }
      `}>
        <ResponsiveStatsDisplay
          primaryStats={{
            handicap: profile?.eg_handicap_index?.toFixed(1) || 'N/A',
            posts: postsCount,
            followers: followersCount,
            following: followingCount
          }}
          onStatClick={onStatClick}
        />
      </div>
    </div>
  );
};

export default ProfileStatsSection;