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
    <div className="flex-1 flex flex-col gap-1.5 md:gap-2">
      {/* Top row: Name + edit icon */}
      <div className="flex items-center gap-2 md:gap-3">
        <h1 className="text-xl md:text-2xl font-semibold tracking-tight text-foreground">
          {displayName}
        </h1>

        {isOwnProfile && onCustomiseClick && (
          <button
            type="button"
            onClick={onCustomiseClick}
            aria-label="Edit profile"
            className="ml-1 inline-flex items-center justify-center h-8 w-8 rounded-full bg-white/70 text-slate-600 hover:bg-white shadow-sm transition"
          >
            <Pencil className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Second row: username + HCP pill */}
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="text-slate-500">@{username}</span>
        {isPersonal && handicap != null && (
          <span className="inline-flex items-center px-3 py-1 rounded-full bg-slate-900/90 text-xs font-semibold uppercase tracking-wide text-white">
            HCP {handicap.toFixed(1)}
          </span>
        )}
      </div>

      {/* Club line (personal) or Location (business) */}
      {isPersonal && homeClub && (
        <div className="text-sm">
          <span className="font-semibold text-slate-800">{homeClub}</span>
          <span className="text-slate-500"> · Home Club</span>
        </div>
      )}
      
      {!isPersonal && location && (
        <div className="text-sm">
          <span className="font-semibold text-slate-800">{location}</span>
        </div>
      )}
      
      {/* Website - Business profiles */}
      {!isPersonal && websiteUrl && (
        <div className="flex items-center gap-1.5 text-sm">
          <Globe className="w-3.5 h-3.5 text-slate-500" />
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
    </div>
  );
};

export default ProfileHeaderCard;
