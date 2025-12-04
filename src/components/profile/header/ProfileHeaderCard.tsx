import React, { useState } from 'react';
import { ChevronDown, ChevronUp, MapPin, Globe, Building2, User, Brush } from 'lucide-react';
import { cn } from '@/lib/utils';
import { splitName } from '@/utils/name';
import { ProfileOpenToPlayStatus } from '@/features/nearby/components/ProfileOpenToPlayStatus';
import ProfileAvatarRing from './ProfileAvatarRing';
import { Button } from '@/components/ui/button';

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
 * ProfileHeaderCard - Glass card with avatar, name, handle, bio
 * Personal: Shows home club, handicap, Top 100 ring on avatar
 * Business: Shows location, website, no ring on avatar
 */
// Avatar sizing constants for overlap calculations
const AVATAR_SIZE_MOBILE = 104; // px, matches ProfileAvatarRing 'lg'
const AVATAR_SIZE_DESKTOP = 124; // slightly larger on desktop
const AVATAR_OVERLAP_RATIO = 0.1; // 10% overlap with hero

// Mobile calculations
const AVATAR_OVERLAP_PX_MOBILE = AVATAR_SIZE_MOBILE * AVATAR_OVERLAP_RATIO; // ~10px
const AVATAR_VISIBLE_BELOW_MOBILE = AVATAR_SIZE_MOBILE - AVATAR_OVERLAP_PX_MOBILE; // ~94px
const CONTENT_TOP_PADDING_MOBILE = AVATAR_VISIBLE_BELOW_MOBILE + 16; // breathing room

// Desktop calculations  
const AVATAR_OVERLAP_PX_DESKTOP = AVATAR_SIZE_DESKTOP * AVATAR_OVERLAP_RATIO; // ~12px
const AVATAR_VISIBLE_BELOW_DESKTOP = AVATAR_SIZE_DESKTOP - AVATAR_OVERLAP_PX_DESKTOP; // ~112px
const CONTENT_TOP_PADDING_DESKTOP = AVATAR_VISIBLE_BELOW_DESKTOP + 20; // breathing room

const ProfileHeaderCard: React.FC<ProfileHeaderCardProps> = ({
  displayName,
  username,
  bio,
  profilePhotoUrl,
  homeClub,
  handicap,
  websiteUrl,
  location,
  userType,
  totalTop100Played = 0,
  isPersonal,
  isOwnProfile,
  isMobile,
  onAvatarClick,
  onCustomiseClick,
}) => {
  const [bioExpanded, setBioExpanded] = useState(false);
  const { first, last } = splitName(displayName);
  
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
  
  // Build the subtitle line (e.g., "Plays at Sunningdale · HCP 4.3")
  const getSubtitleLine = () => {
    if (isPersonal) {
      const parts = [];
      if (homeClub) parts.push(`Plays at ${homeClub}`);
      if (handicap !== null && handicap !== undefined) parts.push(`HCP ${handicap.toFixed(1)}`);
      return parts.length > 0 ? parts.join(' · ') : null;
    } else {
      // Business subtitle: type + location
      const parts = [];
      if (location) parts.push(location);
      return parts.length > 0 ? parts.join(' · ') : null;
    }
  };
  
  const subtitleLine = getSubtitleLine();
  const shouldTruncateBio = bio && bio.length > 120;
  const displayBio = shouldTruncateBio && !bioExpanded ? `${bio.slice(0, 120)}...` : bio;

  // ===== MOBILE LAYOUT =====
  if (isMobile) {
    return (
      <div
        className="relative px-4 pb-6 text-center"
        style={{ paddingTop: CONTENT_TOP_PADDING_MOBILE }}
      >
        {/* Avatar: overlaps hero by ~10%, positioned above content */}
        <div
          className="absolute left-1/2 -translate-x-1/2 z-20"
          style={{ top: -AVATAR_OVERLAP_PX_MOBILE }}
        >
          <ProfileAvatarRing
            photoUrl={profilePhotoUrl}
            displayName={displayName}
            totalTop100Played={isPersonal ? totalTop100Played : 0}
            isPersonal={isPersonal}
            isOwnProfile={isOwnProfile}
            size="lg"
            onClick={onAvatarClick}
            animateOnFirstView={true}
          />
        </div>

        {/* Main text content – always below avatar */}
        <div className="space-y-2">
          {/* Name & handle */}
          <div>
            <h1 className="text-xl font-semibold text-foreground leading-tight">
              {displayName}
            </h1>
            <div className="mt-1 flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <span>@{username}</span>
              <span className={cn(
                "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wide",
                isPersonal 
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                  : "bg-blue-500/20 text-blue-300 border border-blue-500/30"
              )}>
                {isPersonal ? <User className="w-2.5 h-2.5" /> : <Building2 className="w-2.5 h-2.5" />}
                {getUserTypeBadge()}
              </span>
            </div>
            {isOwnProfile && <div className="mt-1"><ProfileOpenToPlayStatus /></div>}
          </div>

          {/* Subtitle line */}
          {subtitleLine && (
            <div className="text-xs text-muted-foreground">{subtitleLine}</div>
          )}

          {/* Website – business profiles only */}
          {!isPersonal && websiteUrl && (
            <a
              href={getWebsiteHref(websiteUrl)}
              target="_blank"
              rel="noopener noreferrer"
              className="mx-auto inline-flex items-center gap-1 text-xs text-primary hover:text-primary/80"
            >
              <Globe className="h-3 w-3" />
              <span>{formatWebsiteUrl(websiteUrl)}</span>
            </a>
          )}

          {/* Bio */}
          {bio && (
            <div className="mx-auto max-w-[280px] text-xs leading-relaxed text-muted-foreground">
              {displayBio}
              {shouldTruncateBio && (
                <button
                  type="button"
                  onClick={() => setBioExpanded(!bioExpanded)}
                  className="ml-1 inline-flex items-center gap-0.5 text-xs text-primary hover:text-primary/80"
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

          {/* Customise profile */}
          {isOwnProfile && onCustomiseClick && (
            <button
              type="button"
              onClick={onCustomiseClick}
              className="mx-auto mt-2 inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-foreground shadow-sm backdrop-blur-md hover:bg-white/10 transition-colors"
            >
              <Brush className="h-3 w-3" />
              <span>Customise profile</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  // ===== DESKTOP LAYOUT =====
  return (
    <div
      className="relative mx-auto max-w-2xl px-8 pb-8 text-center"
      style={{ paddingTop: CONTENT_TOP_PADDING_DESKTOP }}
    >
      {/* Overhanging avatar – overlaps hero by ~10% */}
      <div
        className="absolute left-1/2 -translate-x-1/2 z-20"
        style={{ top: -AVATAR_OVERLAP_PX_DESKTOP }}
      >
        <ProfileAvatarRing
          photoUrl={profilePhotoUrl}
          displayName={displayName}
          totalTop100Played={isPersonal ? totalTop100Played : 0}
          isPersonal={isPersonal}
          isOwnProfile={isOwnProfile}
          size="lg"
          onClick={onAvatarClick}
        />
      </div>

      {/* Main text content */}
      <div className="space-y-3">
        {/* Name + handle + badge */}
        <div>
          <h1 className="text-2xl font-semibold leading-tight text-foreground">
            {displayName}
          </h1>
          <div className="flex items-center justify-center gap-2 mt-1">
            <span className="text-base text-muted-foreground">@{username}</span>
            <span className={cn(
              "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium uppercase tracking-wide",
              isPersonal 
                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                : "bg-blue-500/20 text-blue-300 border border-blue-500/30"
            )}>
              {isPersonal ? <User className="w-3 h-3" /> : <Building2 className="w-3 h-3" />}
              {getUserTypeBadge()}
            </span>
          </div>
        </div>

        {/* Subtitle line */}
        {subtitleLine && (
          <div className="text-base text-muted-foreground">{subtitleLine}</div>
        )}

        {/* Bio */}
        {bio && (
          <div className="max-w-md mx-auto">
            <p className="text-base text-muted-foreground leading-relaxed">
              {displayBio}
            </p>
            {shouldTruncateBio && (
              <button
                onClick={() => setBioExpanded(!bioExpanded)}
                className="inline-flex items-center gap-0.5 text-sm text-primary mt-1 hover:text-primary/80"
              >
                {bioExpanded ? (
                  <>Show less <ChevronUp className="w-3.5 h-3.5" /></>
                ) : (
                  <>Show more <ChevronDown className="w-3.5 h-3.5" /></>
                )}
              </button>
            )}
          </div>
        )}
        
        {/* Website - Business profiles */}
        {!isPersonal && websiteUrl && (
          <div className="flex items-center justify-center gap-1.5 text-base">
            <Globe className="w-4 h-4 text-muted-foreground" />
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
        
        {/* Location - Business profiles (if not in subtitle) */}
        {!isPersonal && location && !subtitleLine?.includes(location) && (
          <div className="flex items-center justify-center gap-1.5 text-sm text-muted-foreground">
            <MapPin className="w-3.5 h-3.5" />
            {location}
          </div>
        )}
        
        {/* Customise profile button - own profile only */}
        {isOwnProfile && onCustomiseClick && (
          <div className="mt-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onCustomiseClick}
              className="text-muted-foreground hover:text-foreground text-sm gap-1.5"
            >
              <Brush className="w-4 h-4" />
              Customise profile
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfileHeaderCard;