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

  if (isMobile) {
    return (
      <div className="relative">
        {/* Avatar with ring */}
        <div className="flex justify-center mb-4">
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

        {/* Name & handle block */}
        <div className="text-center mb-3">
          <h1 className="text-2xl font-semibold text-foreground leading-tight">
            {displayName}
          </h1>
          <div className="flex items-center justify-center gap-2 mt-1">
            <span className="text-muted-foreground">@{username}</span>
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
          {isOwnProfile && <ProfileOpenToPlayStatus />}
        </div>

        {/* Subtitle line */}
        {subtitleLine && (
          <div className="text-center text-sm text-muted-foreground mb-3">
            {subtitleLine}
          </div>
        )}
        
        {/* Website - Business profiles */}
        {!isPersonal && websiteUrl && (
          <div className="flex items-center justify-center gap-1.5 text-sm mb-3">
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

        {/* Bio with show more */}
        {bio && (
          <div className="text-center px-4 mb-3">
            <p className="text-sm text-muted-foreground leading-relaxed">
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
        
        {/* Customise profile button - own profile only */}
        {isOwnProfile && onCustomiseClick && (
          <div className="flex justify-center mt-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={onCustomiseClick}
              className="text-muted-foreground hover:text-foreground text-xs gap-1.5"
            >
              <Brush className="w-3.5 h-3.5" />
              Customise profile
            </Button>
          </div>
        )}
      </div>
    );
  }

  // Desktop layout
  return (
    <div className="flex flex-col items-center relative">
      {/* Overhanging avatar with ring */}
      <div
        className="absolute z-10"
        style={{
          right: '80px',
          top: '-48px',
        }}
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

      {/* Name + handle + badge block */}
      <div
        className="text-center"
        style={{
          width: 'calc(100% - var(--mini-w) - 8px)',
          marginLeft: '0',
          marginRight: 'calc(var(--mini-w) + 8px)',
          marginTop: '24px'
        }}
      >
        <h1 className="font-semibold leading-tight text-foreground" style={{ fontSize: 'var(--fs-display)' }}>
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
        <div 
          className="mt-2 text-base text-muted-foreground"
          style={{
            width: 'calc(100% - var(--mini-w) - 8px)',
            marginRight: 'calc(var(--mini-w) + 8px)',
            textAlign: 'center'
          }}
        >
          {subtitleLine}
        </div>
      )}

      {/* Bio section */}
      <div 
        className="mt-4"
        style={{
          width: 'calc(100% - var(--mini-w) - 8px)',
          marginRight: 'calc(var(--mini-w) + 8px)'
        }}
      >
        <div className="text-center">
          {bio && (
            <div className="mb-3">
              <p className="text-base text-muted-foreground line-clamp-2 leading-relaxed">
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
            <div className="flex items-center justify-center gap-1.5 text-sm text-muted-foreground mt-2">
              <MapPin className="w-3.5 h-3.5" />
              {location}
            </div>
          )}
          
          {/* Customise profile button - own profile only */}
          {isOwnProfile && onCustomiseClick && (
            <div className="mt-4">
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
    </div>
  );
};

export default ProfileHeaderCard;