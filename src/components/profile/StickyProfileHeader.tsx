import React from 'react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

interface StickyProfileHeaderProps {
  profile: {
    id: string;
    display_name?: string;
    username?: string;
    profile_photo_url?: string;
  };
  stats: {
    handicap?: number;
    posts: number;
    followers: number;
    following: number;
  };
  isScrolled: boolean;
}

const StickyProfileHeader: React.FC<StickyProfileHeaderProps> = ({
  profile,
  stats,
  isScrolled
}) => {
  return (
    <div 
      className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
        isScrolled 
          ? 'bg-white/95 backdrop-blur-md border-b border-border/20 py-2' 
          : 'bg-transparent py-0 pointer-events-none'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-between">
        {/* Left side - Avatar and Name */}
        <div className="flex items-center gap-3">
          <Avatar className="w-8 h-8">
            <AvatarImage 
              src={profile.profile_photo_url} 
              alt={profile.display_name || profile.username || 'User'} 
            />
            <AvatarFallback className="text-sm font-medium">
              {(profile.display_name || profile.username || 'U').charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex flex-col">
            <span className="font-bold text-sm leading-tight">
              {profile.display_name || profile.username || 'User'}
            </span>
            {profile.username && (
              <span className="text-xs text-muted-foreground">
                @{profile.username}
              </span>
            )}
          </div>
        </div>

        {/* Right side - Compact Stats (Desktop) */}
        <div className="hidden md:flex items-center gap-6 text-sm">
          <div className="text-center">
            <div className="font-bold">{stats.handicap?.toFixed(1) || '--'}</div>
            <div className="text-muted-foreground text-xs">Handicap</div>
          </div>
          
          <div className="text-center">
            <div className="font-bold">{stats.posts}</div>
            <div className="text-muted-foreground text-xs">Posts</div>
          </div>
          
          <div className="text-center">
            <div className="font-bold">{stats.followers}</div>
            <div className="text-muted-foreground text-xs">Followers</div>
          </div>
          
          <div className="text-center">
            <div className="font-bold">{stats.following}</div>
            <div className="text-muted-foreground text-xs">Following</div>
          </div>
        </div>

        {/* Mobile - Show stats below */}
        <div className="md:hidden flex items-center gap-4 text-xs">
          <span className="font-medium">{stats.handicap?.toFixed(1) || '--'} HCP</span>
          <span className="font-medium">{stats.posts} Posts</span>
          <span className="font-medium">{stats.followers} Followers</span>
        </div>
      </div>
    </div>
  );
};

export default StickyProfileHeader;