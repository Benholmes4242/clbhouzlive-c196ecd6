import React from 'react';
import { Camera, MapPin, BarChart3 } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
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

  const displayName = profile?.display_name || 'User';
  const username = profile?.username;
  const homeClub = profile?.home_club || 'No Club';
  const bio = profile?.bio;
  const handicap = profile?.eg_handicap_index;

  return (
    <div className={`
      relative z-20 bg-background/80 backdrop-blur-xl border border-border/30 rounded-2xl
      transition-all duration-500 ease-out
      ${isMobile 
        ? 'mx-4 p-6 -mt-20' // Mobile: overlap header by moving up
        : 'mx-auto max-w-2xl p-8 -mt-24' // Desktop: more overlap and wider
      }
      shadow-2xl shadow-black/20
    `}>
      {/* Profile Layout - Avatar left, Name/Username right */}
      <div className="flex items-start gap-6">
        {/* Larger Avatar */}
        <div className={`
          relative rounded-full overflow-hidden border-4 border-gray-200/20 flex-shrink-0
          ${isMobile ? 'w-24 h-24' : 'w-28 h-28'}
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
        
        {/* Name and Username - Left aligned */}
        <div className="flex-1 min-w-0">
          <h1 className={`font-bold text-foreground ${isMobile ? 'text-xl' : 'text-2xl'} leading-tight`}>
            {displayName}
          </h1>
          {username && (
            <p className={`text-muted-foreground ${isMobile ? 'text-base' : 'text-lg'} mt-1`}>
              @{username}
            </p>
          )}
          
          {/* Bio below name */}
          {bio && (
            <p className={`text-muted-foreground leading-relaxed mt-3 ${
              isMobile ? 'text-sm' : 'text-base'
            }`}>
              {bio}  
            </p>
          )}
        </div>
      </div>

      {/* Meta Info - Centered titles above values */}
      <div className="grid grid-cols-2 gap-6 mt-6">
        <div className="text-center p-4 rounded-lg bg-background/40">
          <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium mb-2">
            Home Club
          </p>
          <p className={`font-medium text-foreground ${isMobile ? 'text-sm' : 'text-base'}`}>
            {homeClub}
          </p>
        </div>
        
        <div className="text-center p-4 rounded-lg bg-background/40">
          <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium mb-2">
            Handicap
          </p>
          <p className={`font-medium text-foreground ${isMobile ? 'text-sm' : 'text-base'}`}>
            {handicap ? handicap.toFixed(1) : 'N/A'}
          </p>
        </div>
      </div>

      {/* Action Buttons - Only for own profile */}
      {isOwnProfile && (
        <div className={`grid gap-3 mt-6 ${isMobile ? 'grid-cols-1' : 'grid-cols-3'}`}>
          <Button
            variant="outline"
            size={isMobile ? "default" : "default"}
            onClick={onEditProfile}
            className="w-full bg-white border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 focus:ring-2 focus:ring-gray-300 focus:ring-offset-2"
          >
            Edit Profile
          </Button>
          <Button
            variant="outline"
            size={isMobile ? "default" : "default"}
            onClick={onMediaManager}
            className="w-full bg-white border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 focus:ring-2 focus:ring-gray-300 focus:ring-offset-2"
          >
            <Camera className="w-4 h-4 mr-2" />
            Media
          </Button>
          {hasImmersiveMedia && (
            <Button
              variant="outline"
              size={isMobile ? "default" : "default"}
              onClick={onPreviewImmersive}
              className="w-full bg-white border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 focus:ring-2 focus:ring-gray-300 focus:ring-offset-2"
            >
              Preview Profile
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default ResponsiveGlassCard;