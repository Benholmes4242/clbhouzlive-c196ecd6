import React, { useState, useEffect } from 'react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { MapPin } from 'lucide-react';

interface Profile {
  id: string;
  display_name?: string;
  username?: string;
  profile_photo_url?: string;
  home_club?: string;
}

interface PremiumStickyHeaderProps {
  profile: Profile;
  isVisible: boolean;
  stats: {
    handicap?: number;
    posts: number;
    followers: number;
    following: number;
  };
}

const PremiumStickyHeader: React.FC<PremiumStickyHeaderProps> = ({
  profile,
  isVisible: initialVisible,
  stats
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const shouldShow = scrollY > 400; // Show after scrolling past 400px
      setIsVisible(shouldShow);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  const liquidGlassStyle = {
    background: 'rgba(255, 255, 255, 0.08)',
    backdropFilter: 'blur(20px) saturate(1.8)',
    WebkitBackdropFilter: 'blur(20px) saturate(1.8)',
    border: '1px solid rgba(255, 255, 255, 0.15)',
    boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.2)',
  };

  return (
    <div
      className={`fixed top-16 left-0 right-0 z-40 transition-all duration-500 ease-out ${
        isVisible 
          ? 'translate-y-0 opacity-100' 
          : '-translate-y-full opacity-0'
      }`}
      style={liquidGlassStyle}
    >
      <div className="px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Left: Avatar + Name */}
          <div className="flex items-center gap-3">
            <Avatar className="w-10 h-10 rounded-lg">
              <AvatarImage 
                src={profile.profile_photo_url || undefined}
                alt={profile.display_name || 'User'}
              />
              <AvatarFallback className="rounded-lg bg-primary/20 text-primary font-semibold">
                {(profile.display_name || profile.username || 'U').charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            
            <div className="min-w-0">
              <div className="text-white font-semibold text-sm truncate">
                {profile.display_name || profile.username || 'Unknown User'}
              </div>
              {profile.username && (
                <div className="text-white/70 text-xs truncate">
                  @{profile.username}
                </div>
              )}
            </div>
          </div>

          {/* Right: Compact Stats (Desktop) */}
          <div className="hidden md:flex items-center gap-6">
            {stats.handicap && (
              <div className="text-center">
                <div className="text-white font-bold text-sm">{stats.handicap}</div>
                <div className="text-white/70 text-xs">HCP</div>
              </div>
            )}
            <div className="text-center">
              <div className="text-white font-bold text-sm">{stats.posts}</div>
              <div className="text-white/70 text-xs">Posts</div>
            </div>
            <div className="text-center">
              <div className="text-white font-bold text-sm">{stats.followers}</div>
              <div className="text-white/70 text-xs">Followers</div>
            </div>
            <div className="text-center">
              <div className="text-white font-bold text-sm">{stats.following}</div>
              <div className="text-white/70 text-xs">Following</div>
            </div>
          </div>
        </div>

        {/* Mobile Stats Strip */}
        <div className="md:hidden mt-3 flex justify-center">
          <div className="flex items-center gap-4 text-xs">
            {stats.handicap && (
              <>
                <span className="text-white/90">
                  <span className="font-semibold">{stats.handicap}</span> HCP
                </span>
                <span className="text-white/40">•</span>
              </>
            )}
            <span className="text-white/90">
              <span className="font-semibold">{stats.posts}</span> Posts
            </span>
            <span className="text-white/40">•</span>
            <span className="text-white/90">
              <span className="font-semibold">{stats.followers}</span> Followers
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PremiumStickyHeader;