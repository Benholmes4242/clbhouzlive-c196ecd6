import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Globe, Building2, User, Brush } from 'lucide-react';
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
 * ProfileHeaderCard - Centered typography for name, handle, club, bio
 * Premium Golf style - clean, centered, Apple-like
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
  
  // Get user type badge label
  const getUserTypeBadge = () => {
    if (isPersonal) return 'Golfer';
    switch (userType) {
      case 'club': return 'Golf Club';
      case 'brand': return 'Brand';
      case 'creator': return 'Creator';
      default: return 'Business';
    }
  };
  
  // Build the subtitle line (e.g., "Sunningdale · HCP 4.3")
  const getSubtitleLine = () => {
    if (isPersonal) {
      const parts = [];
      if (homeClub) parts.push(homeClub);
      if (handicap !== null && handicap !== undefined) parts.push(`HCP ${handicap.toFixed(1)}`);
      return parts.length > 0 ? parts.join(' · ') : null;
    } else {
      // Business subtitle: location
      const parts = [];
      if (location) parts.push(location);
      return parts.length > 0 ? parts.join(' · ') : null;
    }
  };
  
  const subtitleLine = getSubtitleLine();
  const shouldTruncateBio = bio && bio.length > 120;
  const displayBio = shouldTruncateBio && !bioExpanded ? `${bio.slice(0, 120)}...` : bio;

  return (
    <div className="flex flex-col items-center text-center mt-2 space-y-2">
      {/* NAME */}
      <h1 className="text-[22px] font-semibold text-foreground">
        {displayName}
      </h1>

      {/* HANDLE + BADGE */}
      <div className="flex items-center gap-2 text-[14px] text-muted-foreground">
        @{username}
        <span className={cn(
          "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wide",
          isPersonal 
            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
            : "bg-blue-500/20 text-blue-400 border border-blue-500/30"
        )}>
          {isPersonal ? <User className="w-2.5 h-2.5" /> : <Building2 className="w-2.5 h-2.5" />}
          {getUserTypeBadge()}
        </span>
      </div>

      {/* CLUB + HCP LINE */}
      {subtitleLine && (
        <div className="text-[14px] text-muted-foreground">
          {subtitleLine}
        </div>
      )}
      
      {/* Website - Business profiles */}
      {!isPersonal && websiteUrl && (
        <div className="flex items-center justify-center gap-1.5 text-[14px]">
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

      {/* BIO */}
      {bio && (
        <div className="max-w-[320px]">
          <p className="text-[14px] text-muted-foreground leading-[1.35]">
            {displayBio}
          </p>
          {shouldTruncateBio && (
            <button
              onClick={() => setBioExpanded(!bioExpanded)}
              className="inline-flex items-center gap-0.5 text-xs text-primary mt-1 hover:text-primary/80"
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

      {/* CUSTOMISE PROFILE (OWN PROFILE ONLY) */}
      {isOwnProfile && onCustomiseClick && (
        <button
          className="flex items-center gap-1 text-[13px] mt-1 text-muted-foreground hover:text-foreground transition-colors"
          onClick={onCustomiseClick}
        >
          <Brush className="w-3.5 h-3.5" />
          Customise profile
        </button>
      )}
    </div>
  );
};

export default ProfileHeaderCard;
