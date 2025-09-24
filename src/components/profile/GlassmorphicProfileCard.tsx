import React from 'react';
import { Edit, Flag } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import ProfileBioBlock from './ProfileBioBlock';
import ProfileStatsRow from './ProfileStatsRow';

interface GlassmorphicProfileCardProps {
  profile: {
    profile_photo_url?: string;
    display_name?: string;
    username?: string;
    home_club?: string;
    eg_handicap_index?: number;
    bio?: string;
    website?: string;
  } | null;
  isOwnProfile: boolean;
  onEditProfile: () => void;
  followersCount?: number;
  followingCount?: number;
  postsCount?: number;
  totalXp?: number;
  recentlyFollowedBy?: string[];
  children?: React.ReactNode;
}

const GlassmorphicProfileCard: React.FC<GlassmorphicProfileCardProps> = ({
  profile,
  isOwnProfile,
  onEditProfile,
  followersCount = 0,
  followingCount = 0,
  postsCount = 0,
  totalXp = 0,
  recentlyFollowedBy = [],
  children
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
      className="relative mx-4 md:mx-8 text-center"
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

      {/* Profile content */}
      <div className="pt-12 pb-6 space-y-4">
        {/* Name - large, bold */}
        <h2 className="text-2xl font-bold text-white">
          {profile?.display_name || 'User'}
        </h2>

        {/* Username row with edit button */}
        <div className="flex items-center justify-center gap-3">
          <p className="text-base text-white/80">
            @{profile?.username || 'username'}
          </p>
          
          {/* Edit Profile button - pill style, subtle */}
          {isOwnProfile && (
            <button
              onClick={onEditProfile}
              className="px-3 py-1 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white text-sm font-medium transition-all duration-300 flex items-center gap-1"
            >
              <Edit className="w-3 h-3" />
              Edit
            </button>
          )}
        </div>

        {/* Home Club and Handicap row */}
        <div className="flex items-center justify-between px-6">
          {/* Left side - Home Club */}
          <div className="text-left">
            <p className="text-xs text-white/60 uppercase tracking-wide mb-1">Home Club</p>
            <p className="text-sm font-medium text-white">
              {profile?.home_club || 'Sundridge Park Golf Club'}
            </p>
          </div>
          
          {/* Center spacing */}
          <div className="flex-1"></div>
          
          {/* Right side - Handicap and mini profile card */}
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-xs text-white/60 uppercase tracking-wide mb-1">Handicap</p>
              <p className="text-xl font-bold text-white">
                {profile?.eg_handicap_index !== null && profile?.eg_handicap_index !== undefined 
                  ? Math.round(profile.eg_handicap_index)
                  : '4'
                }
              </p>
            </div>
            
            {/* Mini Profile Card - scaled up with 3:4 aspect ratio */}
            <div className="w-20 h-24 rounded-lg bg-white/10 border border-white/20 flex flex-col items-center justify-center p-2">
              <div className="w-14 h-14 rounded-full overflow-hidden border border-white/30 mb-1">
                {profile?.profile_photo_url ? (
                  <img
                    src={profile.profile_photo_url}
                    alt="Mini profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center">
                    <span className="text-white font-bold text-sm">
                      {profile?.display_name?.charAt(0).toUpperCase() || 'U'}
                    </span>
                  </div>
                )}
              </div>
              <p className="text-xs text-white/70 font-medium truncate w-full text-center">
                {profile?.display_name?.split(' ')[0] || 'User'}
              </p>
            </div>
          </div>
        </div>

        {/* Bio Block */}
        <ProfileBioBlock
          bio={profile?.bio}
          website={profile?.website}
          recentlyFollowedBy={recentlyFollowedBy}
        />

        {/* Stats Row */}
        <ProfileStatsRow
          posts={postsCount}
          totalXp={totalXp}
          following={followingCount}
          followers={followersCount}
        />

        {/* Additional content like tabs */}
        {children}
      </div>
    </div>
  );
};

export default GlassmorphicProfileCard;