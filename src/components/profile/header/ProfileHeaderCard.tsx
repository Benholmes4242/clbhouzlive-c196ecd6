import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProfileHeaderCardProps {
  displayName: string;
  username: string;
  bio?: string | null;
  profilePhotoUrl?: string | null;
  // Personal profile fields
  homeClub?: string | null;
  handicap?: number | null;
  // Business profile fields  
  websiteUrl?: string | null;
  location?: string | null;
  userType?: string | null;
  // Top 100 data for ring
  totalTop100Played?: number;
  // Profile type
  isPersonal: boolean;
  isOwnProfile: boolean;
  isMobile: boolean;
  onAvatarClick?: () => void;
  onCustomiseClick?: () => void;
}

/**
 * ProfileHeaderCard - Modern social app style (Strava/TikTok/LinkedIn)
 * Mobile: centered, Desktop: left-aligned
 * Tight vertical spacing for more room for achievements
 */
const ProfileHeaderCard: React.FC<ProfileHeaderCardProps> = ({
  displayName,
  username,
  bio,
  homeClub,
  handicap,
  websiteUrl,
  location,
  userType,
  isPersonal,
  isOwnProfile,
  isMobile,
  onCustomiseClick,
}) => {
  const [bioExpanded, setBioExpanded] = useState(false);
  
  // Format website URL for display
  const formatWebsiteUrl = (url: string) => {
    return url.replace(/^https?:\/\//, '').replace(/\/$/, '');
  };
  
  // Ensure URL has protocol for href
  const getWebsiteHref = (url: string) => {
    return url.startsWith('http') ? url : `https://${url}`;
  };
  
  const shouldTruncateBio = bio && bio.length > 120;
  const displayBio = shouldTruncateBio && !bioExpanded ? `${bio.slice(0, 120)}...` : bio;

  return (
    <section className="-mt-[45px] flex flex-col items-center px-4 text-center md:items-start md:text-left">
      {/* Name - smaller, social app style */}
      <h1 className="text-xl font-semibold text-foreground">
        {displayName}
      </h1>

      {/* Username + Handicap pill on one line */}
      <div className="mt-1 flex flex-wrap items-center justify-center gap-2 text-sm text-muted-foreground md:justify-start">
        <span>@{username}</span>

        {isPersonal && handicap != null && (
          <span className="inline-flex items-center rounded-full bg-muted px-3 py-1 text-xs font-medium text-foreground/80">
            HCP {handicap.toFixed(1)}
          </span>
        )}
      </div>

      {/* Club name on its own line (personal) or Location (business) */}
      {isPersonal && homeClub && (
        <p className="mt-1 text-sm text-foreground/80">
          {homeClub}
        </p>
      )}
      
      {!isPersonal && location && (
        <p className="mt-1 text-sm text-foreground/80">
          {location}
        </p>
      )}
      
      {/* Website - Business profiles */}
      {!isPersonal && websiteUrl && (
        <div className="mt-1 flex items-center gap-1.5 text-sm">
          <Globe className="w-3.5 h-3.5 text-muted-foreground" />
          <a 
            href={getWebsiteHref(websiteUrl)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:text-primary/80 transition-colors"
          >
            {formatWebsiteUrl(websiteUrl)}
          </a>
        </div>
      )}

      {/* Bio – max 2 lines + "Show more" toggle */}
      {bio && (
        <div className="mt-2 max-w-[320px] text-sm text-muted-foreground">
          <p className="leading-relaxed">
            {displayBio}
          </p>
          {shouldTruncateBio && (
            <button
              onClick={() => setBioExpanded(!bioExpanded)}
              className="inline-flex items-center gap-0.5 text-xs font-medium text-primary hover:text-primary/80 mt-1"
            >
              {bioExpanded ? (
                <>Show less <ChevronUp className="w-3 h-3" /></>
              ) : (
                <>Show more <ChevronDown className="w-3 h-3" /></>
              )}
            </button>
          )}
        </div>
      )}

      {/* Customise profile link */}
      {isOwnProfile && onCustomiseClick && (
        <button
          type="button"
          onClick={onCustomiseClick}
          className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-primary hover:text-primary/80"
        >
          <span className="underline">Customise profile</span>
        </button>
      )}
    </section>
  );
};

export default ProfileHeaderCard;
