import React from 'react';
import { Globe, Pencil } from 'lucide-react';

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
 * ProfileHeaderCard - Centered meta block beside avatar
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
    <section className="flex-1 flex flex-col items-center space-y-1.5">
      {/* Top row: name + optional edit icon */}
      <div className="flex items-center gap-2">
        <h1 className="text-2xl font-semibold text-foreground text-center">
          {displayName}
        </h1>

        {isOwnProfile && onCustomiseClick && (
          <button
            type="button"
            onClick={onCustomiseClick}
            aria-label="Edit profile"
            className="inline-flex items-center justify-center rounded-full bg-muted border border-border/60 p-1.5 hover:bg-muted/80 transition"
          >
            <Pencil className="w-4 h-4 text-muted-foreground" />
          </button>
        )}
      </div>

      {/* Username + Handicap pill */}
      <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-muted-foreground">
        <span>@{username}</span>
        {isPersonal && handicap != null && (
          <span className="inline-flex items-center rounded-full bg-muted px-3 py-1 text-[11px] font-semibold text-foreground">
            HCP {handicap.toFixed(1)}
          </span>
        )}
      </div>

      {/* Club name (personal) or Location (business) */}
      {isPersonal && homeClub && (
        <p className="text-sm text-muted-foreground text-center">
          <span className="font-semibold text-foreground">{homeClub}</span>
        </p>
      )}
      
      {!isPersonal && location && (
        <p className="text-sm text-muted-foreground text-center">
          <span className="font-semibold text-foreground">{location}</span>
        </p>
      )}
      
      {/* Website - Business profiles */}
      {!isPersonal && websiteUrl && (
        <div className="flex items-center justify-center gap-1.5 text-sm">
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
    </section>
  );
};

export default ProfileHeaderCard;
