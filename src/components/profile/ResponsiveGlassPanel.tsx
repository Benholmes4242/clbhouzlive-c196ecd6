import React from 'react';
import { MoreVertical, MessageSquare, UserPlus, Share } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

interface UserProfile {
  id: string;
  display_name?: string;
  username?: string;
  home_club?: string;
  profile_photo_url?: string;
  bio?: string;
  website?: string;
  eg_handicap_index?: number;
}

interface ResponsiveGlassPanelProps {
  profile: UserProfile | null;
  isOwnProfile: boolean;
  onEditProfile: () => void;
  stats: {
    posts: number;
    followers: number;
    following: number;
    courses: number;
  };
}

const ResponsiveGlassPanel: React.FC<ResponsiveGlassPanelProps> = ({
  profile,
  isOwnProfile,
  onEditProfile,
  stats
}) => {
  const displayDomain = (url: string) => {
    try {
      return new URL(url).hostname.replace('www.', '');
    } catch {
      return url;
    }
  };

  return (
    <section
      className="relative mx-4 rounded-2xl border border-white/35 bg-white/35 backdrop-blur-xl shadow-[0_10px_30px_rgba(0,0,0,0.15)]"
      style={{
        marginTop: 'calc(var(--panel-overlap) * -1)',
        padding: 'var(--panel-pad-y) var(--panel-pad-x)'
      }}
    >
      {/* Header block with 3-column grid layout */}
      <div
        className="grid items-center"
        style={{ gridTemplateColumns: `max-content 1fr var(--mini-w)` }}
      >
        {/* Left: kebab/menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="justify-self-start mr-2 sm:mr-3 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors">
              <MoreVertical className="w-5 h-5 text-white" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            {isOwnProfile ? (
              <DropdownMenuItem onClick={onEditProfile}>
                Edit Profile
              </DropdownMenuItem>
            ) : (
              <>
                <DropdownMenuItem>
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Message
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Follow
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Share className="w-4 h-4 mr-2" />
                  Share Profile
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Center: name + handle */}
        <div className="text-center">
          <h1 
            className="font-semibold leading-tight text-white line-clamp-1" 
            style={{ fontSize: 'var(--fs-display)' }}
          >
            {profile?.display_name || 'User'}
          </h1>
          <div 
            className="opacity-70 text-white/80 truncate max-w-[70%] mx-auto" 
            style={{ fontSize: 'var(--fs-handle)' }}
          >
            @{profile?.username || 'username'}
          </div>
        </div>

        {/* Right: mini card */}
        <div 
          className="justify-self-end rounded-lg border border-white/40 bg-white/20 backdrop-blur-sm shadow-sm overflow-hidden"
          style={{ 
            width: 'var(--mini-w)', 
            height: 'var(--mini-h)', 
            borderRadius: 'var(--mini-radius)' 
          }}
        >
          {profile?.profile_photo_url ? (
            <img
              src={profile.profile_photo_url}
              alt="Mini profile"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center">
              <span className="text-white font-bold text-xs">
                {profile?.display_name?.charAt(0).toUpperCase() || 'U'}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Club + Handicap row aligned to mini card top */}
      <div 
        className="mt-3 grid items-start"
        style={{ gridTemplateColumns: '1fr 1fr', columnGap: 'clamp(12px, 4vw, 28px)' }}
      >
        <div className="text-center sm:text-left">
          <div className="opacity-60 text-white/60" style={{ fontSize: 'var(--fs-label)' }}>
            Golf Club
          </div>
          <div className="text-white" style={{ fontSize: 'var(--fs-value)' }}>
            {profile?.home_club || 'No Club'}
          </div>
        </div>
        <div className="text-center sm:text-right">
          <div className="opacity-60 text-white/60" style={{ fontSize: 'var(--fs-label)' }}>
            Handicap
          </div>
          <div className="text-white" style={{ fontSize: 'var(--fs-value)' }}>
            {profile?.eg_handicap_index !== null && profile?.eg_handicap_index !== undefined 
              ? `${profile.eg_handicap_index > 0 ? '+' : ''}${profile.eg_handicap_index.toFixed(1)}`
              : 'Not set'
            }
          </div>
        </div>
      </div>

      {/* Bio + Website section */}
      {(profile?.bio || profile?.website) && (
        <div 
          className="mt-3 md:max-w-full"
          style={{ 
            maxWidth: 'min(100%, calc(100% - var(--mini-w) - var(--panel-pad-x)))'
          }}
        >
          {profile?.bio && (
            <p 
              className="line-clamp-2 text-white/90 leading-relaxed" 
              style={{ fontSize: 'var(--fs-bio)' }}
            >
              {profile.bio}
            </p>
          )}
          {profile?.website && (
            <a 
              className="underline opacity-80 focus:outline-none focus:ring-2 focus:ring-orange-500 rounded text-white/80 hover:text-white transition-colors"
              href={profile.website} 
              target="_blank" 
              rel="noreferrer"
              style={{ fontSize: 'var(--fs-bio)' }}
            >
              {displayDomain(profile.website)}
            </a>
          )}
        </div>
      )}

      {/* Slim stats row */}
      <div className="mt-4 grid grid-cols-4 text-center">
        <div className="py-2">
          <div className="font-semibold text-white" style={{ fontSize: 'var(--fs-value)' }}>
            {stats.posts}
          </div>
          <div className="opacity-60 text-white/60" style={{ fontSize: 'var(--fs-label)' }}>
            Posts
          </div>
        </div>
        <div className="py-2 border-l border-white/20">
          <div className="font-semibold text-white" style={{ fontSize: 'var(--fs-value)' }}>
            {stats.followers}
          </div>
          <div className="opacity-60 text-white/60" style={{ fontSize: 'var(--fs-label)' }}>
            Followers
          </div>
        </div>
        <div className="py-2 border-l border-white/20">
          <div className="font-semibold text-white" style={{ fontSize: 'var(--fs-value)' }}>
            {stats.following}
          </div>
          <div className="opacity-60 text-white/60" style={{ fontSize: 'var(--fs-label)' }}>
            Following
          </div>
        </div>
        <div className="py-2 border-l border-white/20">
          <div className="font-semibold text-white" style={{ fontSize: 'var(--fs-value)' }}>
            {stats.courses}
          </div>
          <div className="opacity-60 text-white/60" style={{ fontSize: 'var(--fs-label)' }}>
            Courses
          </div>
        </div>
      </div>
    </section>
  );
};

export default ResponsiveGlassPanel;