import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProfileUserInfoBlockProps {
  displayName: string;
  username: string;
  bio?: string | null;
  homeClub?: string | null;
  homeClubCrest?: string | null;
  handicap?: number | null;
  websiteUrl?: string | null;
  location?: string | null;
  isPersonal: boolean;
  isOwnProfile: boolean;
  onClubClick?: () => void;
  onCustomiseClick?: () => void;
}

/**
 * ProfileUserInfoBlock - Compact user info per spec
 * - Username: 22-24px bold, centered
 * - Handle: 14px medium, secondary color
 * - Club + HCP as inline pill buttons
 * - Bio: Max 2 lines, centered, 15-16px
 */
const ProfileUserInfoBlock: React.FC<ProfileUserInfoBlockProps> = ({
  displayName,
  username,
  bio,
  homeClub,
  homeClubCrest,
  handicap,
  websiteUrl,
  location,
  isPersonal,
  isOwnProfile,
  onClubClick,
  onCustomiseClick,
}) => {
  const [bioExpanded, setBioExpanded] = useState(false);
  
  // Truncate bio to ~2 lines (~80 chars)
  const shouldTruncateBio = bio && bio.length > 80;
  const displayBio = shouldTruncateBio && !bioExpanded ? `${bio.slice(0, 80)}...` : bio;

  return (
    <section className="flex flex-col items-center text-center space-y-2">
      {/* Username - 22-24px bold */}
      <h1 className="text-[22px] md:text-[24px] font-bold text-foreground">
        {displayName}
      </h1>

      {/* Handle - 14px medium, secondary */}
      <p className="text-sm font-medium text-muted-foreground">
        @{username}
      </p>

      {/* Club + HCP Tiles (personal) or Location (business) */}
      {isPersonal ? (
        <div className="flex items-center justify-center gap-2 mt-1">
          {homeClub && (
            <button
              type="button"
              onClick={onClubClick}
              className={cn(
                'inline-flex items-center gap-2 px-3 py-2',
                'rounded-sq-pill',
                'bg-white/[0.08] border border-white/[0.1]',
                'text-[13px] font-medium text-foreground',
                'transition-all duration-150',
                'hover:bg-white/[0.12] active:scale-[0.98]'
              )}
            >
              {homeClubCrest && (
                <img 
                  src={homeClubCrest} 
                  alt="" 
                  className="w-6 h-6 rounded-sq-xs object-cover"
                />
              )}
              <span>{homeClub}</span>
            </button>
          )}
          
          {handicap !== null && handicap !== undefined && (
            <span
              className={cn(
                'inline-flex items-center px-3 py-2',
                'rounded-sq-pill',
                'bg-white/[0.08] border border-white/[0.1]',
                'text-[13px] font-medium text-foreground'
              )}
            >
              HCP {handicap.toFixed(1)}
            </span>
          )}
        </div>
      ) : (
        location && (
          <p className="text-sm font-medium text-muted-foreground mt-1">
            {location}
          </p>
        )
      )}

      {/* Bio - Max 2 lines, 15-16px */}
      {bio && (
        <div className="max-w-[320px] mt-2">
          <p className="text-[15px] leading-relaxed text-foreground/90">
            {displayBio}
          </p>
          {shouldTruncateBio && (
            <button
              onClick={() => setBioExpanded(!bioExpanded)}
              className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground mt-1 hover:text-foreground"
            >
              {bioExpanded ? (
                <>Less <ChevronUp className="w-3 h-3" /></>
              ) : (
                <>More <ChevronDown className="w-3 h-3" /></>
              )}
            </button>
          )}
        </div>
      )}

      {/* Customise profile - Only for own profile */}
      {isOwnProfile && onCustomiseClick && (
        <button
          className="text-sm font-medium text-muted-foreground hover:text-foreground underline-offset-2 hover:underline transition-colors mt-1"
          onClick={onCustomiseClick}
        >
          Customise profile
        </button>
      )}
    </section>
  );
};

export default ProfileUserInfoBlock;
