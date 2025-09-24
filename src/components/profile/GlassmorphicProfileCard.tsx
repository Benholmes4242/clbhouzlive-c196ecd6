import React from 'react';
import { Edit, Flag } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface GlassmorphicProfileCardProps {
  profile: {
    profile_photo_url?: string;
    display_name?: string;
    username?: string;
    home_club?: string;
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
      className="relative mx-4 md:mx-8 rounded-3xl p-6 text-center"
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
      <div className="pt-6 space-y-2">
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

        {/* Home Club with golf flag icon */}
        <div className="flex items-center justify-center gap-2">
          <Flag className="w-4 h-4 text-white/60" />
          <p className="text-sm text-white/60">
            {profile?.home_club || 'No Club'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default GlassmorphicProfileCard;