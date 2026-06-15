import React, { useState } from 'react';
import { Squircle } from '@/components/ui/squircle';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface PremiumStickyHeaderProps {
  isVisible: boolean;
  profile: {
    id: string;
    display_name?: string;
    username?: string;
    profile_photo_url?: string;
    home_club?: string;
  } | null;
  stats: {
    handicap?: string | number;
    posts: number;
    followers: number;
    following?: number;
    ratedCoursesCount?: number;
    averageRating?: number;
  };
  onStatClick?: (statType: string) => void;
}

const PremiumStickyHeader: React.FC<PremiumStickyHeaderProps> = ({
  isVisible,
  profile,
  stats,
  onStatClick
}) => {
  const [showAllStats, setShowAllStats] = useState(false);
  const isMobile = useIsMobile();

  if (!profile) return null;

  const liquidGlassStyle = {
    background: 'rgba(255, 255, 255, 0.08)',
    backdropFilter: 'blur(40px) saturate(180%)',
    WebkitBackdropFilter: 'blur(40px) saturate(180%)',
    border: '1px solid rgba(255, 255, 255, 0.15)',
    borderTop: 'none',
    boxShadow: '0 4px 20px -4px rgba(0, 0, 0, 0.2)',
  };

  const primaryStats = [
    { label: 'Handicap', value: stats.handicap?.toString() || '--', key: 'handicap' },
    { label: 'Posts', value: stats.posts.toString(), key: 'posts' },
    { label: 'Followers', value: stats.followers.toString(), key: 'followers' }
  ];

  const secondaryStats = [
    { label: 'Following', value: stats.following?.toString() || '0', key: 'following' },
    { label: 'Courses', value: stats.ratedCoursesCount?.toString() || '0', key: 'coursesRated' },
    { label: 'Avg Rating', value: stats.averageRating?.toFixed(1) || '--', key: 'avgRating' }
  ];

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ease-out ${
        isVisible ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'
      }`}
      style={liquidGlassStyle}
    >
      <div className="px-4 py-3">
        {/* Main Header Row */}
        <div className="flex items-center justify-between">
          {/* Profile Info */}
          <div className="flex items-center gap-3">
            <Squircle width={40} height={40}>
              {profile.profile_photo_url ? (
                <img src={profile.profile_photo_url} alt={profile.display_name || 'User'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.1)', fontSize: '16px', fontWeight: 600 }}>
                  {(profile.display_name || profile.username || 'U').charAt(0).toUpperCase()}
                </div>
              )}
            </Squircle>
            
            <div className="min-w-0">
              <div className="text-white font-bold text-base truncate">
                {profile.display_name || profile.username || 'Unknown User'}
              </div>
              {profile.username && (
                <div className="text-white/70 text-xs truncate">
                  @{profile.username}
                </div>
              )}
            </div>
          </div>

          {/* Primary Stats Strip */}
          <div className="flex items-center gap-4">
            {primaryStats.map((stat) => (
              <button
                key={stat.key}
                onClick={() => onStatClick?.(stat.key)}
                className="text-center hover:bg-white/10 rounded-lg px-2 py-1 transition-colors"
              >
                <div className="text-white font-bold text-sm">{stat.value}</div>
                <div className="text-white/70 text-xs">{stat.label}</div>
              </button>
            ))}
            
            {/* Show More Button */}
            <Button
              onClick={() => setShowAllStats(!showAllStats)}
              size="sm"
              variant="ghost"
              className="text-white/80 hover:text-white hover:bg-white/10 px-2 py-1 h-8"
            >
              {showAllStats ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Expandable Secondary Stats Row */}
        {showAllStats && (
          <div className="mt-3 pt-3 border-t border-white/10">
            <div className="flex items-center justify-center gap-6">
              {secondaryStats.map((stat) => (
                <button
                  key={stat.key}
                  onClick={() => onStatClick?.(stat.key)}
                  className="text-center hover:bg-white/10 rounded-lg px-3 py-2 transition-colors"
                >
                  <div className="text-white font-bold text-sm">{stat.value}</div>
                  <div className="text-white/70 text-xs">{stat.label}</div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PremiumStickyHeader;