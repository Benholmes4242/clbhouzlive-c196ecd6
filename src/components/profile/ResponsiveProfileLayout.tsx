import React from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { UserPlus, MessageCircle } from 'lucide-react';

interface ProfileData {
  id: string;
  display_name?: string;
  username?: string;
  profile_photo_url?: string;
  club_name?: string;
}

interface Stats {
  handicap?: number;
  posts: number;
  followers: number;
  following: number;
}

interface ResponsiveProfileLayoutProps {
  profile: ProfileData | null;
  stats: Stats;
  isOwnProfile: boolean;
  onStatClick?: (statType: string) => void;
  children?: React.ReactNode;
}

const ResponsiveProfileLayout: React.FC<ResponsiveProfileLayoutProps> = ({
  profile,
  stats,
  isOwnProfile,
  onStatClick,
  children
}) => {
  const isMobile = useIsMobile();

  if (!profile) return null;

  if (isMobile) {
    // Mobile: Inline identity bar
    return (
      <div className="bg-white">
        {/* Inline Identity Bar */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          {/* Left: Avatar + Name */}
          <div className="flex items-center gap-3">
            <Avatar className="w-12 h-12 rounded-2xl">
              <AvatarImage 
                src={profile.profile_photo_url || undefined}
                alt={profile.display_name || 'User'}
                className="rounded-2xl"
              />
              <AvatarFallback className="rounded-2xl bg-gray-100 text-gray-700 font-semibold">
                {(profile.display_name || profile.username || 'U').charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            
            <div className="min-w-0">
              <div className="text-lg font-bold text-gray-900 truncate">
                {profile.display_name || profile.username || 'User'}
              </div>
              {profile.username && (
                <div className="text-sm text-gray-500 truncate">
                  @{profile.username}
                </div>
              )}
            </div>
          </div>

          {/* Right: Action Buttons */}
          {!isOwnProfile && (
            <div className="flex items-center gap-2">
              <Button size="sm" className="rounded-full px-4 h-8">
                <UserPlus className="w-3 h-3 mr-1" />
                Follow
              </Button>
              <Button size="sm" variant="outline" className="rounded-full px-4 h-8">
                <MessageCircle className="w-3 h-3 mr-1" />
                Message
              </Button>
            </div>
          )}
        </div>

        {/* Mobile Stats Strip */}
        <div className="flex items-center justify-around py-3 border-b border-gray-100">
          <button
            onClick={() => onStatClick?.('handicap')}
            className="text-center"
          >
            <div className="text-lg font-bold text-gray-900">
              {stats.handicap || '--'}
            </div>
            <div className="text-xs text-gray-500">Handicap</div>
          </button>
          <button
            onClick={() => onStatClick?.('posts')}
            className="text-center"
          >
            <div className="text-lg font-bold text-gray-900">{stats.posts}</div>
            <div className="text-xs text-gray-500">Posts</div>
          </button>
          <button
            onClick={() => onStatClick?.('followers')}
            className="text-center"
          >
            <div className="text-lg font-bold text-gray-900">{stats.followers}</div>
            <div className="text-xs text-gray-500">Followers</div>
          </button>
          <button
            onClick={() => onStatClick?.('following')}
            className="text-center"
          >
            <div className="text-lg font-bold text-gray-900">{stats.following}</div>
            <div className="text-xs text-gray-500">Following</div>
          </button>
        </div>

        {children}
      </div>
    );
  }

  // Desktop: Keep existing card layout with breathing space
  return (
    <div className="bg-white min-h-screen">
      <div className="container mx-auto px-6 py-8">
        {/* Desktop Glass Card */}
        <div 
          className="max-w-2xl mx-auto mb-8 p-8 rounded-3xl"
          style={{
            background: 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(0, 0, 0, 0.08)',
            boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.08)'
          }}
        >
          <div className="text-center">
            <Avatar className="w-24 h-24 mx-auto mb-4 rounded-3xl ring-2 ring-gray-100">
              <AvatarImage 
                src={profile.profile_photo_url || undefined}
                alt={profile.display_name || 'User'}
                className="rounded-3xl"
              />
              <AvatarFallback className="rounded-3xl bg-gray-100 text-gray-700 text-2xl font-semibold">
                {(profile.display_name || profile.username || 'U').charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            
            <h1 className="text-2xl font-bold text-gray-900 mb-1">
              {profile.display_name || profile.username || 'User'}
            </h1>
            
            {profile.username && (
              <p className="text-gray-500 mb-2">@{profile.username}</p>
            )}
            
            {profile.club_name && (
              <p className="text-gray-600 mb-6">⛳ {profile.club_name}</p>
            )}

            {/* Desktop Stats */}
            <div className="flex items-center justify-center gap-8 mb-6">
              <button
                onClick={() => onStatClick?.('handicap')}
                className="text-center hover:bg-gray-50 p-2 rounded-lg transition-colors"
              >
                <div className="text-2xl font-bold text-gray-900">
                  {stats.handicap || '--'}
                </div>
                <div className="text-sm text-gray-500">Handicap</div>
              </button>
              <button
                onClick={() => onStatClick?.('posts')}
                className="text-center hover:bg-gray-50 p-2 rounded-lg transition-colors"
              >
                <div className="text-2xl font-bold text-gray-900">{stats.posts}</div>
                <div className="text-sm text-gray-500">Posts</div>
              </button>
              <button
                onClick={() => onStatClick?.('followers')}
                className="text-center hover:bg-gray-50 p-2 rounded-lg transition-colors"
              >
                <div className="text-2xl font-bold text-gray-900">{stats.followers}</div>
                <div className="text-sm text-gray-500">Followers</div>
              </button>
              <button
                onClick={() => onStatClick?.('following')}
                className="text-center hover:bg-gray-50 p-2 rounded-lg transition-colors"
              >
                <div className="text-2xl font-bold text-gray-900">{stats.following}</div>
                <div className="text-sm text-gray-500">Following</div>
              </button>
            </div>

            {/* Desktop Action Buttons */}
            {!isOwnProfile && (
              <div className="flex items-center justify-center gap-3">
                <Button className="rounded-full px-6">
                  <UserPlus className="w-4 h-4 mr-2" />
                  Follow
                </Button>
                <Button variant="outline" className="rounded-full px-6">
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Message
                </Button>
              </div>
            )}
          </div>
        </div>

        {children}
      </div>
    </div>
  );
};

export default ResponsiveProfileLayout;
