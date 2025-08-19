import React from 'react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
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
  const { glassMode, glassStyles, sentinelRef } = useAdaptiveGlass();

  if (!profile) return null;

  const primaryStats = [
    { label: 'Handicap', value: stats.handicap?.toString() || '--', key: 'handicap' },
    { label: 'Posts', value: stats.posts.toString(), key: 'posts' },
    { label: 'Followers', value: stats.followers.toString(), key: 'followers' },
    { label: 'Following', value: stats.following?.toString() || '0', key: 'following' }
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
                    text-center px-2 py-1 transition-all duration-300
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
        </div>
      </div>
    </>
  );
};

export default AdaptiveGlassHeader;