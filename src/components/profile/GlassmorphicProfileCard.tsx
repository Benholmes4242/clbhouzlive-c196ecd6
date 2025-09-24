import React from 'react';
import { Edit, Flag, MoreVertical, Globe } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface GlassmorphicProfileCardProps {
  profile: {
    profile_photo_url?: string;
    display_name?: string;
    username?: string;
    home_club?: string;
    bio?: string;
    website?: string;
    eg_handicap_index?: number;
  } | null;
  isOwnProfile: boolean;
  onEditProfile: () => void;
  statsData?: {
    postsCount: number;
    totalXP: number;
    followingCount: number;
    followersCount: number;
  };
}

const GlassmorphicProfileCard: React.FC<GlassmorphicProfileCardProps> = ({
  profile,
  isOwnProfile,
  onEditProfile,
  statsData
}) => {
  const isMobile = useIsMobile();

  const glassmorphicStyle = {
    background: 'rgba(255, 255, 255, 0.1)',
    backdropFilter: 'blur(20px) saturate(1.8)',
    WebkitBackdropFilter: 'blur(20px) saturate(1.8)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37), inset 0 1px 0 rgba(255, 255, 255, 0.3)',
  };

  return (
    <div 
      className="relative mx-4 md:mx-8 p-6 text-center rounded-2xl"
      style={glassmorphicStyle}
    >
      {/* Profile photo - overlapping top of card */}
      <div className="absolute -top-8 left-1/2 transform -translate-x-1/2">
        <div className="w-16 h-16 rounded-full overflow-hidden border-4 border-white/30">
          {profile?.profile_photo_url ? (
            <img
              src={profile.profile_photo_url}
              alt="Profile"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center">
              <span className="text-white font-bold text-lg">
                {profile?.display_name?.charAt(0).toUpperCase() || 'U'}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* More options button */}
      {isOwnProfile && (
        <div className="absolute top-4 right-4">
          <button className="p-2 rounded-full hover:bg-white/10 transition-colors">
            <MoreVertical className="w-5 h-5 text-white/60" />
          </button>
        </div>
      )}

      {/* Profile content */}
      <div className="pt-8 space-y-6">
        {/* Header section with name and handle */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-white">
            {profile?.display_name || 'User'}
          </h1>
          <p className="text-lg text-white/80">
            @{profile?.username || 'username'}
          </p>
        </div>

        {/* Home Club and Handicap row with mini profile card */}
        <div className="flex items-center justify-between">
          {/* Left side - Home Club */}
          <div className="text-left">
            <p className="text-sm text-white/60 font-medium">Sundridge Park</p>
            <p className="text-sm text-white/60">Golf Club</p>
          </div>

          {/* Right side - Handicap and mini profile card */}
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm text-white/60 font-medium">Handicap</p>
              <p className="text-2xl font-bold text-white">
                {profile?.eg_handicap_index || '4'}
              </p>
            </div>
            
            {/* Mini profile card */}
            <div className="w-16 h-20 rounded-lg overflow-hidden border border-white/20">
              {profile?.profile_photo_url ? (
                <img
                  src={profile.profile_photo_url}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/40" />
              )}
            </div>
          </div>
        </div>

        {/* Bio section */}
        <div className="text-left space-y-3">
          <p className="text-white/90 text-sm leading-relaxed">
            {profile?.bio || 'Love golf, traveller. Sundridge Park GC ⛳'}
          </p>
          
          {/* Website link */}
          {profile?.website && (
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-white/60" />
              <a 
                href={profile.website} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-white/80 text-sm hover:text-white transition-colors underline"
              >
                {profile.website.replace(/^https?:\/\//, '')}
              </a>
            </div>
          )}
          
          {/* Repeated bio line */}
          <p className="text-white/70 text-sm">
            Love golf, traveller. Sundridge Park GC
          </p>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-4 gap-4 pt-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-white">
              {statsData?.postsCount || '35'}
            </p>
            <p className="text-xs text-white/60">Posts</p>
          </div>
          <div className="text-center border-l border-white/20 pl-4">
            <p className="text-2xl font-bold text-white">
              {statsData?.totalXP?.toLocaleString() || '2,500'}
            </p>
            <p className="text-xs text-white/60">Total XP</p>
          </div>
          <div className="text-center border-l border-white/20 pl-4">
            <p className="text-2xl font-bold text-white">
              {statsData?.followingCount || '7'}
            </p>
            <p className="text-xs text-white/60">Following</p>
          </div>
          <div className="text-center border-l border-white/20 pl-4">
            <p className="text-2xl font-bold text-white">
              {statsData?.followersCount || '9'}
            </p>
            <p className="text-xs text-white/60">Followers</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GlassmorphicProfileCard;