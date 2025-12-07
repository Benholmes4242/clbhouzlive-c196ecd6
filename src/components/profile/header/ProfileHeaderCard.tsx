import React from 'react';
import { Globe } from 'lucide-react';

interface ProfileHeaderCardProps {
  displayName: string;
  username: string;
  // Personal profile fields
  homeClub?: string | null;
  handicap?: number | null;
  // Business profile fields  
  websiteUrl?: string | null;
  location?: string | null;
  userType?: string | null;
  // Profile type
  isPersonal: boolean;
  isOwnProfile: boolean;
  onCustomiseClick?: () => void;
}

/**
 * ProfileHeaderCard - Two-column layout meta block
 * Left-aligned text to sit beside avatar
 */
const ProfileHeaderCard: React.FC<ProfileHeaderCardProps> = ({
  displayName,
  username,
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
    <section className="flex-1 flex flex-col items-center">
      {/* Name */}
      <h1 className="text-2xl font-semibold text-foreground text-center">
        {displayName}
      </h1>

      {/* Username + Handicap pill on one line */}
      <p className="mt-1 text-xs text-muted-foreground text-center flex items-center gap-2">
        <span>@{username}</span>
        {isPersonal && handicap != null && (
          <span className="inline-flex items-center rounded-full bg-muted px-2 py-1 text-[11px] font-medium text-foreground">
            HCP {handicap.toFixed(1)}
          </span>
        )}
      </p>

      {/* Club name (personal) or Location (business) */}
      {isPersonal && homeClub && (
        <p className="mt-1 text-sm text-muted-foreground text-center">
          {homeClub}
        </p>
      )}
      
      {!isPersonal && location && (
        <p className="mt-1 text-sm text-muted-foreground text-center">
          {location}
        </p>
      )}
      
      {/* Website - Business profiles */}
      {!isPersonal && websiteUrl && (
        <div className="mt-1 flex items-center justify-center gap-1.5 text-sm">
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

      {/* Customise profile link */}
      {isOwnProfile && onCustomiseClick && (
        <button
          type="button"
          onClick={onCustomiseClick}
          className="mt-2 text-sm font-medium text-primary underline text-center"
        >
          Customise profile
        </button>
      )}
    </section>
  );
};

export default ProfileHeaderCard;
