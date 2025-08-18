import React, { useState, useEffect } from 'react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { MapPin, Zap, Trophy, Star, TrendingUp } from 'lucide-react';
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
    handicap: string | number;
    posts: number;
    followers: number;
    following: number;
  };
  onStatClick?: (statType: string) => void;
}

const PremiumStickyHeader: React.FC<PremiumStickyHeaderProps> = ({
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

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (!profile || !isVisible) return null;

  const StatItem = ({ icon: Icon, label, value, onClick }: {
    icon: React.ElementType;
    label: string;
    value: string | number;
    onClick?: () => void;
  }) => (
    <button
      onClick={onClick}
      className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-background/80 hover:bg-background/90 transition-all duration-200 backdrop-blur-sm border border-border/50"
    >
      <Icon className="w-3 h-3 text-primary" />
      <span className="text-xs font-medium text-foreground/80">{label}</span>
      <span className="text-xs font-bold text-foreground">{value}</span>
    </button>
  );

  return (
    <div 
      className={`fixed top-0 left-0 right-0 z-40 transition-all duration-700 ease-in-out ${
        isVisible && hasScrolled
          ? 'translate-y-0 opacity-100' 
          : '-translate-y-full opacity-0'
      }`}
      style={{
        background: 'rgba(255, 255, 255, 0.85)',
        backdropFilter: 'blur(20px) saturate(1.2)',
        WebkitBackdropFilter: 'blur(20px) saturate(1.2)',
        borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
        boxShadow: '0 4px 24px rgba(0, 0, 0, 0.08)'
      }}
    >
      <div className={`max-w-6xl mx-auto ${isMobile ? 'px-4 py-3' : 'px-6 py-4'}`}>
        <div className="flex items-center justify-between">
          {/* Left: Avatar + Name */}
          <div className="flex items-center gap-3">
            <Avatar className={`${isMobile ? 'w-10 h-10' : 'w-12 h-12'} rounded-xl border-2 border-primary/20`}>
              <AvatarImage 
                src={profile.profile_photo_url || undefined}
                alt={profile.display_name || 'User'}
              />
              <AvatarFallback className="rounded-xl bg-primary/10 text-primary font-semibold text-sm">
                {(profile.display_name || profile.username || 'U').charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>

            <div className="min-w-0">
              <div className={`font-bold text-foreground truncate ${isMobile ? 'text-sm' : 'text-base'}`}>
                {profile.display_name || profile.username || 'Unknown User'}
              </div>
              {profile.username && profile.display_name && (
                <div className={`text-muted-foreground truncate ${isMobile ? 'text-xs' : 'text-sm'}`}>
                  @{profile.username}
                </div>
              )}
              {profile.home_club && !isMobile && (
                <div className="flex items-center gap-1 text-muted-foreground text-xs truncate mt-0.5">
                  <MapPin className="w-3 h-3" />
                  <span>{profile.home_club}</span>
                </div>
              )}
            </div>
          </div>

          {/* Right: Stats */}
          <div className={`flex ${isMobile ? 'flex-col gap-1.5' : 'items-center gap-3'}`}>
            {isMobile ? (
              // Mobile: Vertical stack
              <>
                <div className="flex gap-1.5">
                  <StatItem 
                    icon={Zap} 
                    label="HC" 
                    value={stats.handicap}
                    onClick={() => onStatClick?.('handicap')}
                  />
                  <StatItem 
                    icon={Trophy} 
                    label="Posts" 
                    value={stats.posts}
                    onClick={() => onStatClick?.('posts')}
                  />
                </div>
                <div className="flex gap-1.5">
                  <StatItem 
                    icon={Star} 
                    label="Followers" 
                    value={stats.followers}
                    onClick={() => onStatClick?.('followers')}
                  />
                  <StatItem 
                    icon={TrendingUp} 
                    label="Following" 
                    value={stats.following}
                    onClick={() => onStatClick?.('following')}
                  />
                </div>
              </>
            ) : (
              // Desktop: Horizontal row
              <>
                <StatItem 
                  icon={Zap} 
                  label="Handicap" 
                  value={stats.handicap}
                  onClick={() => onStatClick?.('handicap')}
                />
                <StatItem 
                  icon={Trophy} 
                  label="Posts" 
                  value={stats.posts}
                  onClick={() => onStatClick?.('posts')}
                />
                <StatItem 
                  icon={Star} 
                  label="Followers" 
                  value={stats.followers}
                  onClick={() => onStatClick?.('followers')}
                />
                <StatItem 
                  icon={TrendingUp} 
                  label="Following" 
                  value={stats.following}
                  onClick={() => onStatClick?.('following')}
                />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PremiumStickyHeader;