import React from 'react';
import { Camera, MapPin, BarChart3 } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAdaptiveGlass } from '@/hooks/useAdaptiveGlass';
import { Button } from '@/components/ui/button';

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
  const { glassMode, glassStyles, sentinelRef } = useAdaptiveGlass();

  const displayName = profile?.display_name || 'User';
  const username = profile?.username;
  const homeClub = profile?.home_club || 'No Club';
  const bio = profile?.bio;
  const handicap = profile?.eg_handicap_index;

  return (
    <>
      {/* Invisible sentinel for background sampling */}
      <div
        ref={sentinelRef}
        className="fixed pointer-events-none z-0"
        style={{ 
          opacity: 0,
          top: isMobile ? '180px' : '200px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '100px',
          height: '100px'
        }}
      />
      
      <div 
        className={`
          relative z-20 rounded-2xl transition-all duration-500 ease-out
          ${isMobile 
            ? 'mx-4 p-4 scale-90' // Mobile: smaller scale, tighter margins
            : 'mx-auto max-w-md p-6 scale-100' // Desktop: centered with breathing space
          }
        `}
        style={{
          ...glassStyles,
          background: `var(--glass-bg)`,
          backdropFilter: `var(--glass-blur) saturate(180%)`,
          WebkitBackdropFilter: `var(--glass-blur) saturate(180%)`,
          border: `var(--glass-border)`,
          boxShadow: `var(--glass-shadow)`,
          color: `var(--glass-text)`,
        }}
        data-glass-mode={glassMode}
      >
{/* Profile Photo with Enhanced Blur Background */}
      <div className="relative flex items-center mb-4">
        {/* Larger Avatar positioned to half overlap header */}
        <div className={`
          relative rounded-full overflow-hidden
          ${isMobile ? 'w-32 h-32' : 'w-40 h-40'}
          flex-shrink-0
        `}>
          {/* Blur background behind photo */}
          {profile?.profile_photo_url && (
            <div 
              className="absolute inset-0 scale-110 blur-md opacity-60"
              style={{
                backgroundImage: `url(${profile.profile_photo_url})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }}
            />
          )}
          <img
            src={profile?.profile_photo_url || '/placeholder.svg'}
            alt={displayName}
            className="relative w-full h-full object-cover"
          />
        </div>
        
        {/* Name and Username to the right of avatar */}
        <div className="ml-4 flex-1">
          <h1 className={`
            font-bold transition-colors duration-300
            ${glassMode === 'elevated' ? 'text-black' : 'text-white'}
            ${isMobile ? 'text-xl' : 'text-2xl'}
          `}>
            {displayName}
          </h1>
          {username && (
            <p className={`
              transition-colors duration-300
              ${glassMode === 'elevated' ? 'text-black/70' : 'text-white/70'}
              ${isMobile ? 'text-sm' : 'text-base'}
            `}>
              @{username}
            </p>
          )}
        </div>
      </div>

      {/* Bio */}
      {bio && (
        <div className="mb-4">
          <p className={`
            text-center leading-relaxed transition-colors duration-300
            ${glassMode === 'elevated' ? 'text-black/80' : 'text-white/80'}
            ${isMobile ? 'text-sm' : 'text-base'}
          `}>
            {bio}
          </p>
        </div>
      )}

      {/* Home Club & Handicap in two columns */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="text-center">
          <p className={`
            text-xs mb-1 transition-colors duration-300
            ${glassMode === 'elevated' ? 'text-gray-600' : 'text-white/60'}
          `}>
            Home Club
          </p>
          <p className={`
            font-normal text-center transition-colors duration-300
            ${glassMode === 'elevated' ? 'text-gray-900' : 'text-white'}
            ${isMobile ? 'text-sm' : 'text-base'}
          `}>
            {homeClub}
          </p>
        </div>
        
        <div className="text-center">
          <p className={`
            text-xs mb-1 transition-colors duration-300
            ${glassMode === 'elevated' ? 'text-gray-600' : 'text-white/60'}
          `}>
            Handicap
          </p>
          <p className={`
            font-semibold text-center transition-colors duration-300
            ${glassMode === 'elevated' ? 'text-gray-900' : 'text-white'}
            ${isMobile ? 'text-sm' : 'text-base'}
          `}>
            {handicap ? handicap.toFixed(1) : 'N/A'}
          </p>
        </div>
      </div>

      {/* Action Buttons with gray styling */}
      {isOwnProfile && (
        <div className={`grid gap-2 ${isMobile ? 'grid-cols-1' : 'grid-cols-3'}`}>
          <Button
            variant="outline"
            size={isMobile ? "sm" : "default"}
            onClick={onEditProfile}
            className="w-full bg-white border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400"
          >
            Edit Profile
          </Button>
          <Button
            variant="outline"
            size={isMobile ? "sm" : "default"}
            onClick={onMediaManager}
            className="w-full bg-white border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400"
          >
            {isMobile ? 'Media' : 'Immersive Media'}
          </Button>
          {hasImmersiveMedia && (
            <Button
              variant="outline"
              size={isMobile ? "sm" : "default"}
              onClick={onPreviewImmersive}
              className="w-full bg-white border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400"
            >
              Immersive Preview
            </Button>
          )}
        </div>
      )}
    </div>
    </>
  );
};

export default ResponsiveGlassCard;