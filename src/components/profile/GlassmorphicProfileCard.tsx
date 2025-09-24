import React from 'react';
import { Edit, Flag } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface GlassmorphicProfileCardProps {
  profile: {
    profile_photo_url?: string;
    display_name?: string;
    username?: string;
    home_club?: string;
    eg_handicap_index?: number;
  } | null;
  isOwnProfile: boolean;
  onEditProfile: () => void;
}

const GlassmorphicProfileCard: React.FC<GlassmorphicProfileCardProps> = ({
  profile,
  isOwnProfile,
  onEditProfile
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
      className="relative mx-4 md:mx-8 rounded-3xl px-5 sm:px-6 md:px-8 py-6 sm:py-7 md:py-8 mb-4 bg-white/10 backdrop-blur-2xl border border-white/20 shadow-[0_10px_40px_-10px_rgba(0,0,0,.35)] overflow-hidden"
    >
      {/* gradient fade overlay at the bottom */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-b from-transparent via-white/30 to-white" />
      
      {/* Profile photo - overlapping top of card */}
      <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 z-10">
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
      <div className="pt-6 space-y-3 relative z-10">
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

        {/* Home Club / Handicap row with profile photo card */}
        <div className="flex items-start gap-6 mt-4">
          {/* Left: info columns (home club, handicap) */}
          <div className="flex-1 grid grid-cols-2 gap-6">
            {/* Home Club block */}
            <div className="text-left">
              <div className="flex items-center gap-2 mb-1">
                <Flag className="w-4 h-4 text-white/60" />
                <p className="text-sm text-white/60 font-medium">Home Club</p>
              </div>
              <p className="text-base text-white font-semibold">
                {profile?.home_club || 'No Club'}
              </p>
            </div>

            {/* Handicap block */}
            <div className="text-right">
              <p className="text-sm text-white/60 font-medium mb-1">Handicap</p>
              <p className="text-base text-white font-semibold">
                {profile?.eg_handicap_index || '--'}
              </p>
            </div>
          </div>

          {/* Right: profile photo card */}
          <div className="hidden xs:block w-24 sm:w-28 md:w-32 shrink-0">
            <div className="rounded-2xl overflow-hidden border border-white/25 bg-white/10 backdrop-blur-xl shadow-[0_8px_30px_rgba(0,0,0,.15)]">
              {profile?.profile_photo_url ? (
                <img
                  src={profile.profile_photo_url}
                  alt={`${profile?.display_name} profile`}
                  className="w-full aspect-[4/5] object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="w-full aspect-[4/5] bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center">
                  <span className="text-white font-bold text-2xl">
                    {profile?.display_name?.charAt(0).toUpperCase() || 'U'}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GlassmorphicProfileCard;