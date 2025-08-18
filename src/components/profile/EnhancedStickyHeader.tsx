import React, { useState, useEffect } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { TrendingUp, Users, Trophy } from 'lucide-react';

interface ProfileData {
  id: string;
  display_name?: string;
  username?: string;
  profile_photo_url?: string;
}

interface Stats {
  handicap?: number;
  posts: number;
  followers: number;
  following: number;
}

interface EnhancedStickyHeaderProps {
  isVisible: boolean;
  profile: ProfileData | null;
  stats: Stats;
  onStatClick?: (statType: string) => void;
}

const EnhancedStickyHeader: React.FC<EnhancedStickyHeaderProps> = ({
  isVisible,
  profile,
  stats,
  onStatClick
}) => {
  const isMobile = useIsMobile();
  const [hasScrolled, setHasScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setHasScrolled(window.scrollY > 100);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (!profile || !isVisible) return null;

  // Liquid glass style
  const liquidGlassStyle = {
    background: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(20px) saturate(1.2)',
    WebkitBackdropFilter: 'blur(20px) saturate(1.2)',
    borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
    boxShadow: '0 4px 20px 0 rgba(0, 0, 0, 0.08)',
  };

  const StatItem = ({ icon: Icon, label, value, onClick }: {
    icon: React.ElementType;
    label: string;
    value: string | number;
    onClick?: () => void;
  }) => (
    <button
      onClick={onClick}
      className="flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-black/5 transition-colors"
    >
      <Icon className="w-3 h-3 text-gray-500" />
      <span className="text-xs font-medium text-gray-700">{value}</span>
      <span className="text-xs text-gray-500 hidden sm:inline">{label}</span>
    </button>
  );

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
        hasScrolled ? 'translate-y-0 opacity-100' : '-translate-y-2 opacity-0'
      }`}
      style={liquidGlassStyle}
    >
      <div className="container mx-auto px-4 py-3">
        <div className={`flex items-center ${isMobile ? 'flex-col gap-2' : 'justify-between'}`}>
          {/* Profile Identity */}
          <div className="flex items-center gap-3">
            <Avatar className="w-8 h-8 rounded-xl ring-1 ring-black/10">
              <AvatarImage 
                src={profile.profile_photo_url || undefined}
                alt={profile.display_name || 'User'}
                className="rounded-xl"
              />
              <AvatarFallback className="rounded-xl bg-gray-100 text-gray-700 text-sm font-semibold">
                {(profile.display_name || profile.username || 'U').charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            
            <div className="min-w-0">
              <div className="text-sm font-bold text-gray-900 truncate">
                {profile.display_name || profile.username || 'User'}
              </div>
              {profile.username && (
                <div className="text-xs text-gray-500 truncate">
                  @{profile.username}
                </div>
              )}
            </div>
          </div>

          {/* Compact Stats Strip */}
          <div className={`flex items-center ${isMobile ? 'gap-4' : 'gap-6'}`}>
            <StatItem
              icon={TrendingUp}
              label="Handicap"
              value={stats.handicap ? `${stats.handicap}` : '--'}
              onClick={() => onStatClick?.('handicap')}
            />
            <StatItem
              icon={Trophy}
              label="Posts"
              value={stats.posts}
              onClick={() => onStatClick?.('posts')}
            />
            <StatItem
              icon={Users}
              label="Followers"
              value={stats.followers}
              onClick={() => onStatClick?.('followers')}
            />
            <StatItem
              icon={Users}
              label="Following"
              value={stats.following}
              onClick={() => onStatClick?.('following')}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedStickyHeader;