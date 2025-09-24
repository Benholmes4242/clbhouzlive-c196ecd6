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
      className="relative mx-4 md:mx-8 p-6 rounded-xl mb-4"
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
      <div className="pt-6">
        {/* Name and handle centered */}
        <div className="text-center space-y-1 mb-6">
          <h2 className="text-2xl font-bold text-slate-900">
            {profile?.display_name || 'User'}
          </h2>
          <p className="text-base text-slate-600">
            @{profile?.username || 'username'}
          </p>
        </div>

        {/* Home club and handicap row */}
        <div className="flex items-center justify-between">
          {/* Home Club on left */}
          <div className="text-left">
            <p className="text-lg font-semibold text-slate-900">
              {profile?.home_club?.split(' ').slice(0, -2).join(' ') || 'Sundridge Park'}
            </p>
            <p className="text-sm text-slate-600">
              {profile?.home_club?.split(' ').slice(-2).join(' ') || 'Golf Club'}
            </p>
          </div>

          {/* Mini profile photo card on right */}
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-lg font-semibold text-slate-900">Handicap</p>
              <p className="text-2xl font-bold text-slate-900">
                {profile?.eg_handicap_index ?? 4}
              </p>
            </div>
            <div className="w-20 h-24 rounded-xl overflow-hidden border-2 border-white/30 shadow-lg">
              {profile?.profile_photo_url ? (
                <img
                  src={profile.profile_photo_url}
                  alt="Profile"
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
          </div>
        </div>

        {/* Edit button for own profile */}
        {isOwnProfile && (
          <div className="flex justify-center mt-4">
            <button
              onClick={onEditProfile}
              className="px-4 py-2 rounded-full bg-white/20 hover:bg-white/30 border border-white/20 text-slate-700 text-sm font-medium transition-all duration-300 flex items-center gap-2"
            >
              <Edit className="w-4 h-4" />
              Edit Profile
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default GlassmorphicProfileCard;