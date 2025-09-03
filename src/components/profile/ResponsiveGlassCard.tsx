import React from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { ProfileActionsMenu } from './ProfileActionsMenu';

interface UserProfile {
  id: string;
  display_name?: string;
  username?: string;
  home_club?: string;
  profile_photo_url?: string;
  bio?: string;
  eg_handicap_index?: number;
  is_public?: boolean;
}

interface ResponsiveGlassCardProps {
  profile: UserProfile | null;
  isOwnProfile: boolean;
  hasImmersiveMedia: boolean;
  onPreviewImmersive?: () => void;
  onEditProfile?: () => void;
  onMediaManager?: () => void;
}

const ResponsiveGlassCard: React.FC<ResponsiveGlassCardProps> = ({
  profile,
  isOwnProfile,
  hasImmersiveMedia,
  onPreviewImmersive,
  onEditProfile,
  onMediaManager
}) => {
  const isMobile = useIsMobile();

  const displayName = profile?.display_name || 'User';
  const username = profile?.username;
  const homeClub = profile?.home_club || 'No Club';
  const bio = profile?.bio;
  const handicap = profile?.eg_handicap_index;

  return (
    <div 
      className={`
        relative z-20 rounded-2xl transition-all duration-500 ease-out
        border border-white/35 bg-white/35 backdrop-blur-xl
        shadow-[0_10px_30px_rgba(0,0,0,0.15)]
        ${isMobile 
          ? 'w-[90%] px-5 py-4' 
          : 'w-[80%] max-w-[800px] px-8 py-6'
        }
      `}
    >
      {/* Name + Handle + Owner Kebab */}
      <div className="flex items-center justify-center gap-2 relative">
        <h1 className={`font-semibold text-gray-900 ${isMobile ? 'text-2xl' : 'text-3xl'}`}>
          {displayName}
        </h1>
        {isOwnProfile && (
          <ProfileActionsMenu
            onEditProfile={onEditProfile}
            onMediaManager={onMediaManager}
            onImmersivePreview={onPreviewImmersive}
          />
        )}
      </div>
      <p className={`mt-1 text-gray-700 ${isMobile ? 'text-sm' : 'text-base'}`}>
        @{username}
      </p>

      {/* Club + Handicap */}
      <div className={`grid grid-cols-2 gap-4 ${isMobile ? 'mt-4' : 'mt-5'}`}>
        <div className="text-center">
          <div className={`text-gray-700 ${isMobile ? 'text-xs' : 'text-sm'}`}>
            Home Club
          </div>
          <div className={`mt-1 font-medium text-gray-900 ${isMobile ? 'text-base' : 'text-lg'}`}>
            {homeClub}
          </div>
        </div>
        <div className="text-center">
          <div className={`text-gray-700 ${isMobile ? 'text-xs' : 'text-sm'}`}>
            Handicap
          </div>
          <div className={`mt-1 font-medium text-gray-900 ${isMobile ? 'text-base' : 'text-lg'}`}>
            {handicap ? handicap.toFixed(1) : 'N/A'}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResponsiveGlassCard;