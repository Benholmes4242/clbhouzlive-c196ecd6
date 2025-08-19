import React, { useState } from 'react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAdaptiveGlass } from '@/hooks/useAdaptiveGlass';

interface AdaptiveGlassHeaderProps {
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

const AdaptiveGlassHeader: React.FC<AdaptiveGlassHeaderProps> = ({
  isVisible,
  profile,
  stats,
  onStatClick
}) => {
  const [showAllStats, setShowAllStats] = useState(false);
  const isMobile = useIsMobile();
  const { glassMode, glassStyles, sentinelRef } = useAdaptiveGlass();

  if (!profile) return null;

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
    <>
      {/* Invisible sentinel for background sampling */}
      <div
        ref={sentinelRef}
        className="fixed top-0 left-0 right-0 h-20 pointer-events-none z-0"
        style={{ opacity: 0 }}
      />
      
      <div
        className={`
          fixed top-0 left-0 right-0 z-50 
          transition-all duration-300 ease-out
          ${isVisible ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'}
        `}
        style={{
          ...glassStyles,
          background: `var(--glass-bg)`,
          backdropFilter: `var(--glass-blur) saturate(180%)`,
          WebkitBackdropFilter: `var(--glass-blur) saturate(180%)`,
          border: `var(--glass-border)`,
          borderTop: 'none',
          boxShadow: `var(--glass-shadow)`,
          color: `var(--glass-text)`,
        }}
        data-glass-mode={glassMode}
      >
        <div className="px-4 py-3">
          {/* Main Header Row */}
          <div className="flex items-center justify-between">
            {/* Profile Info */}
            <div className="flex items-center gap-3">
              <Avatar className="w-10 h-10 rounded-xl">
                <AvatarImage 
                  src={profile.profile_photo_url || undefined}
                  alt={profile.display_name || 'User'}
                />
                <AvatarFallback 
                  className={`
                    rounded-xl font-semibold text-sm transition-colors duration-300
                    ${glassMode === 'elevated' 
                      ? 'bg-black/10 text-black' 
                      : 'bg-white/20 text-white'
                    }
                  `}
                >
                  {(profile.display_name || profile.username || 'U').charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              
              <div className="min-w-0">
                <div 
                  className={`
                    font-bold text-base truncate transition-colors duration-300
                    ${glassMode === 'elevated' ? 'text-black' : 'text-white'}
                  `}
                >
                  {profile.display_name || profile.username || 'Unknown User'}
                </div>
                {profile.username && (
                  <div 
                    className={`
                      text-xs truncate transition-colors duration-300
                      ${glassMode === 'elevated' ? 'text-black/70' : 'text-white/70'}
                    `}
                  >
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
                  className={`
                    text-center rounded-lg px-2 py-1 transition-all duration-300
                    ${glassMode === 'elevated' 
                      ? 'hover:bg-black/5 border border-black/8' 
                      : 'hover:bg-white/10 border border-white/16'
                    }
                  `}
                  style={{
                    background: glassMode === 'elevated' 
                      ? 'rgba(0, 0, 0, 0.04)' 
                      : 'rgba(255, 255, 255, 0.16)'
                  }}
                >
                  <div 
                    className={`
                      font-bold text-sm transition-colors duration-300
                      ${glassMode === 'elevated' ? 'text-black' : 'text-white'}
                    `}
                  >
                    {stat.value}
                  </div>
                  <div 
                    className={`
                      text-xs transition-colors duration-300
                      ${glassMode === 'elevated' ? 'text-black/70' : 'text-white/70'}
                    `}
                  >
                    {stat.label}
                  </div>
                </button>
              ))}
              
              {/* Show More Button */}
              <Button
                onClick={() => setShowAllStats(!showAllStats)}
                size="sm"
                variant="ghost"
                className={`
                  px-2 py-1 h-8 transition-all duration-300
                  ${glassMode === 'elevated' 
                    ? 'text-black/80 hover:text-black hover:bg-black/5' 
                    : 'text-white/80 hover:text-white hover:bg-white/10'
                  }
                `}
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
            <div 
              className={`
                mt-3 pt-3 transition-colors duration-300
                ${glassMode === 'elevated' ? 'border-black/10' : 'border-white/10'}
              `}
              style={{ 
                borderTopWidth: '1px',
                borderTopStyle: 'solid'
              }}
            >
              <div className="flex items-center justify-center gap-6">
                {secondaryStats.map((stat) => (
                  <button
                    key={stat.key}
                    onClick={() => onStatClick?.(stat.key)}
                    className={`
                      text-center rounded-lg px-3 py-2 transition-all duration-300
                      ${glassMode === 'elevated' 
                        ? 'hover:bg-black/5' 
                        : 'hover:bg-white/10'
                      }
                    `}
                  >
                    <div 
                      className={`
                        font-bold text-sm transition-colors duration-300
                        ${glassMode === 'elevated' ? 'text-black' : 'text-white'}
                      `}
                    >
                      {stat.value}
                    </div>
                    <div 
                      className={`
                        text-xs transition-colors duration-300
                        ${glassMode === 'elevated' ? 'text-black/70' : 'text-white/70'}
                      `}
                    >
                      {stat.label}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default AdaptiveGlassHeader;