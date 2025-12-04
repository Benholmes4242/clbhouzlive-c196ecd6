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
    <div className="px-6 pt-3 pb-4 text-center">
      <div className="space-y-1.5">
        {/* NAME */}
        <h1 className="text-[22px] font-semibold leading-tight text-foreground">
          {displayName}
        </h1>

        {/* HANDLE + BADGE */}
        <div className="flex items-center justify-center gap-2 text-[13px] text-muted-foreground">
          <span>@{username}</span>
          <span className={cn(
            "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium",
            isPersonal 
              ? "bg-emerald-500/10 text-emerald-600"
              : "bg-blue-500/10 text-blue-600"
          )}>
            {isPersonal ? <User className="h-3 w-3" /> : <Building2 className="h-3 w-3" />}
            {getUserTypeBadge()}
          </span>
        </div>

        {/* CLUB + HCP LINE */}
        {subtitleLine && (
          <p className="text-[13px] text-muted-foreground leading-snug">
            {subtitleLine}
          </p>
        )}
        
        {/* Website - Business profiles */}
        {!isPersonal && websiteUrl && (
          <div className="flex items-center justify-center gap-1.5 text-[13px]">
            <Globe className="h-3.5 w-3.5 text-muted-foreground" />
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
          <p className="text-[13px] leading-snug text-muted-foreground max-w-[320px] mx-auto">
            {displayBio}
            {shouldTruncateBio && (
              <button
                onClick={() => setBioExpanded(!bioExpanded)}
                className="inline-flex items-center gap-0.5 text-xs text-primary ml-1 hover:text-primary/80"
              >
                {bioExpanded ? (
                  <>less <ChevronUp className="w-3 h-3" /></>
                ) : (
                  <>more <ChevronDown className="w-3 h-3" /></>
                )}
              </button>
            )}
          </p>
        )}

        {/* CUSTOMISE PROFILE (OWN PROFILE ONLY) */}
        {isOwnProfile && onCustomiseClick && (
          <button
            className="inline-flex items-center gap-1 text-[12px] text-muted-foreground hover:text-foreground transition-colors"
            onClick={onCustomiseClick}
          >
            <Brush className="h-[13px] w-[13px]" />
            Customise profile
          </button>
        )}
      </div>
    </div>
  );
};

export default ProfileHeaderCard;
