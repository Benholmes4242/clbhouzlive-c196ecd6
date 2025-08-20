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
      <div className="relative flex flex-col items-center mb-4">
        <div className={`
          relative rounded-full overflow-hidden border-4 border-primary/20
          ${isMobile ? 'w-20 h-20' : 'w-24 h-24'}
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
        
        {/* Name and Username */}
        <div className="text-center mt-3">
          <h1 className={`
            font-bold transition-colors duration-300
            ${glassMode === 'elevated' ? 'text-black' : 'text-white'}
            ${isMobile ? 'text-lg' : 'text-xl'}
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

      {/* Quick Info */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className={`
          flex flex-col items-center p-3 rounded-lg transition-colors duration-300
          ${glassMode === 'elevated' ? 'bg-black/5' : 'bg-white/10'}
        `}>
          <p className={`
            text-xs mb-1 transition-colors duration-300
            ${glassMode === 'elevated' ? 'text-black/60' : 'text-white/60'}
          `}>
            Home Club
          </p>
          <p className={`
            font-medium text-center transition-colors duration-300
            ${glassMode === 'elevated' ? 'text-black' : 'text-white'}
            ${isMobile ? 'text-xs' : 'text-sm'}
          `}>
            {homeClub}
          </p>
        </div>
        
        <div className={`
          flex flex-col items-center p-3 rounded-lg transition-colors duration-300
          ${glassMode === 'elevated' ? 'bg-black/5' : 'bg-white/10'}
        `}>
          <p className={`
            text-xs mb-1 transition-colors duration-300
            ${glassMode === 'elevated' ? 'text-black/60' : 'text-white/60'}
          `}>
            Handicap
          </p>
          <p className={`
            font-medium text-center transition-colors duration-300
            ${glassMode === 'elevated' ? 'text-black' : 'text-white'}
            ${isMobile ? 'text-xs' : 'text-sm'}
          `}>
            {handicap ? handicap.toFixed(1) : 'N/A'}
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      {isOwnProfile && (
        <div className={`grid gap-2 ${isMobile ? 'grid-cols-1' : 'grid-cols-2'}`}>
          <Button
            variant="outline"
            size={isMobile ? "sm" : "default"}
            onClick={onEditProfile}
            className="w-full"
          >
            Edit Profile
          </Button>
          <Button
            variant="default"
            size={isMobile ? "sm" : "default"}
            onClick={onMediaManager}
            className="w-full"
          >
            <Camera className="w-4 h-4 mr-2" />
            {isMobile ? 'Media' : 'Manage Media'}
          </Button>
        </div>
      )}

      {/* Preview Button for Own Profile with Media */}
      {isOwnProfile && hasImmersiveMedia && (
        <Button
          variant="secondary"
          size={isMobile ? "sm" : "default"}
          onClick={onPreviewImmersive}
          className="w-full mt-2"
        >
          Preview Profile
        </Button>
      )}
    </div>
    </>
  );
};

export default ResponsiveGlassCard;