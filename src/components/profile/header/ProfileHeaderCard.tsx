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
    <div className="flex-1 flex flex-col items-center justify-center gap-1.5 md:gap-2">
      {/* Row 1: Name + edit icon */}
      <div className="flex items-center justify-center gap-2 md:gap-3">
        <h1 className="text-xl md:text-2xl font-semibold tracking-tight text-foreground">
          {displayName}
        </h1>

        {isOwnProfile && onCustomiseClick && (
          <button
            type="button"
            onClick={onCustomiseClick}
            aria-label="Edit profile"
            className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-white/80 text-slate-600 hover:bg-white shadow-sm transition"
          >
            <Pencil className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Row 2: Username */}
      <div className="text-sm text-slate-500 text-center">
        @{username}
      </div>

      {/* Row 3: Club (personal) or Location (business) */}
      {isPersonal && homeClub && (
        <div className="text-sm text-center">
          <span className="font-semibold text-slate-800">{homeClub}</span>
        </div>
      )}
      {!isPersonal && location && (
        <div className="text-sm text-center">
          <span className="font-semibold text-slate-800">{location}</span>
        </div>
      )}

      {/* Row 4: HCP pill (own line - personal only) */}
      {isPersonal && handicap != null && (
        <div className="flex justify-center">
          <span className="inline-flex items-center px-3 py-1 rounded-full bg-slate-800 text-[11px] md:text-xs font-semibold uppercase tracking-wide text-white">
            HCP {handicap.toFixed(1)}
          </span>
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
