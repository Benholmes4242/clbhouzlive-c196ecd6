import React, { useEffect, useState } from 'react';
import { MoreVertical, MapPin, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

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

interface GlassProfileCardProps {
  profile: UserProfile | null;
  isOwnProfile: boolean;
  onEditProfile?: () => void;
  onMediaManager?: () => void;
  onPreviewImmersive?: () => void;
  hasImmersiveMedia?: boolean;
}

const GlassProfileCard: React.FC<GlassProfileCardProps> = ({
  profile,
  isOwnProfile,
  onEditProfile,
  onMediaManager,
  onPreviewImmersive,
  hasImmersiveMedia
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Entrance animation
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const displayName = profile?.display_name || 'User';
  const username = profile?.username;
  const homeClub = profile?.home_club;
  const handicap = profile?.eg_handicap_index;

  return (
    <div className={`
      glass-card rounded-2xl p-5 md:p-6 mx-auto
      max-w-[680px] w-[92vw] md:w-full
      transition-all duration-300 ease-out
      ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}
    `}>
      {/* Profile Info Row */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex-1">
          <h1 className="text-white font-semibold text-xl md:text-2xl leading-tight">
            {displayName}
          </h1>
          {username && (
            <p className="text-white/85 text-sm md:text-base mt-0.5">
              @{username}
            </p>
          )}
        </div>
        
        {/* Overflow Menu */}
        {isOwnProfile && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="text-white/70 hover:text-white hover:bg-white/10 p-2"
              >
                <MoreVertical size={20} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="glass-card border-white/20">
              <DropdownMenuItem onClick={onEditProfile} className="text-white hover:bg-white/10">
                Edit Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onMediaManager} className="text-white hover:bg-white/10">
                Media Manager
              </DropdownMenuItem>
              {hasImmersiveMedia && (
                <DropdownMenuItem onClick={onPreviewImmersive} className="text-white hover:bg-white/10">
                  Immersive Preview
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Meta Row */}
      <div className="flex items-center gap-4 text-white/70 text-sm">
        {homeClub && (
          <div className="flex items-center gap-1.5">
            <MapPin size={14} />
            <span>{homeClub}</span>
          </div>
        )}
        {handicap !== null && handicap !== undefined && (
          <div className="flex items-center gap-1.5">
            <Target size={14} />
            <span>{handicap.toFixed(1)}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default GlassProfileCard;