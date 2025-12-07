import React from 'react';
import { Globe } from 'lucide-react';

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
 * ProfileHeaderCard - Two-column layout meta block
 * Left-aligned text to sit beside avatar
 */
const ProfileHeaderCard: React.FC<ProfileHeaderCardProps> = ({
  displayName,
  username,
  bio,
  homeClub,
  handicap,
  websiteUrl,
  location,
  isPersonal,
  isOwnProfile,
  onCustomiseClick,
}) => {
  // Format website URL for display
  const formatWebsiteUrl = (url: string) => {
    return url.replace(/^https?:\/\//, '').replace(/\/$/, '');
  };
  
  // Ensure URL has protocol for href
  const getWebsiteHref = (url: string) => {
    return url.startsWith('http') ? url : `https://${url}`;
  };

  return (
    <section className="flex flex-col justify-center items-start">
      {/* Name */}
      <h1 className="text-2xl font-semibold leading-tight text-foreground">
        {displayName}
      </h1>

      {/* Username + Handicap pill on one line */}
      <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
        <span>@{username}</span>

        {isPersonal && handicap != null && (
          <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-foreground/70">
            HCP {handicap.toFixed(1)}
          </span>
        )}
      </div>

      {/* Club name on its own line (personal) or Location (business) */}
      {isPersonal && homeClub && (
        <p className="mt-1 text-sm text-muted-foreground">
          {homeClub}
        </p>
      )}
      
      {!isPersonal && location && (
        <p className="mt-1 text-sm text-muted-foreground">
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

      {/* Bio – max 2 lines with ellipsis */}
      {bio && (
        <p className="mt-1.5 max-w-[260px] text-sm text-muted-foreground leading-snug line-clamp-2">
          {bio}
        </p>
      )}

      {/* Customise profile link */}
      {isOwnProfile && onCustomiseClick && (
        <button
          type="button"
          onClick={onCustomiseClick}
          className="mt-2 text-sm text-primary underline hover:text-primary/80"
        >
          Customise profile
        </button>
      )}
    </section>
  );
};

export default ProfileHeaderCard;
