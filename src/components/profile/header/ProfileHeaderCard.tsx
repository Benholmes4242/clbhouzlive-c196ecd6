import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Globe, Pencil } from 'lucide-react';
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
  // Last round data (optional)
  lastRound?: {
    course: string;
    scoreLabel: string;
    when: string;
  } | null;
}

/**
 * ProfileHeaderCard - Premium Golf style identity block
 * Clean, centered, Apple-like with tighter spacing
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
  lastRound,
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
    <section className="flex flex-col items-center text-center">
      {/* NAME */}
      <h1 className="mt-0 text-[24px] font-semibold tracking-tight text-slate-900">
        {displayName}
      </h1>

      {/* Handle + role pill on same line */}
      <div className="mt-1 flex items-center justify-center gap-2 text-sm text-muted-foreground">
        <span>@{username}</span>
        {isPersonal && (
          <span className="inline-flex items-center rounded-full bg-emerald-100/80 px-2.5 py-0.5 text-[11px] font-medium text-emerald-700">
            GOLFER
          </span>
        )}
      </div>

      {/* CLUB + HCP LINE - cohesive single line */}
      {isPersonal && (homeClub || handicap !== null && handicap !== undefined) && (
        <p className="mt-2 text-[13px] text-foreground/80">
          {homeClub}{homeClub && handicap !== null && handicap !== undefined ? ' · ' : ''}
          {handicap !== null && handicap !== undefined ? `HCP ${handicap.toFixed(1)}` : ''}
        </p>
      )}
      
      {/* Location - Business profiles */}
      {!isPersonal && location && (
        <p className="mt-2 text-[13px] text-foreground/80">
          {location}
        </p>
      )}
      
      {/* Website - Business profiles */}
      {!isPersonal && websiteUrl && (
        <div className="mt-1 flex items-center justify-center gap-1 text-[13px]">
          <Globe className="w-3 h-3 text-slate-600" />
          <a 
            href={getWebsiteHref(websiteUrl)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-foreground/80 hover:text-foreground transition-colors"
          >
            {formatWebsiteUrl(websiteUrl)}
          </a>
        </div>
      )}

      {/* BIO - narrower max width & nicer spacing */}
      {bio && (
        <div className="mt-2 mx-auto max-w-[320px]">
          <p className="text-[13px] leading-snug text-foreground/80">
            {displayBio}
          </p>
          {shouldTruncateBio && (
            <button
              onClick={() => setBioExpanded(!bioExpanded)}
              className="inline-flex items-center gap-1 text-[12px] text-slate-500 mt-1 hover:text-slate-700"
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

      {/* CUSTOMISE PROFILE - with icon */}
      {isOwnProfile && onCustomiseClick && (
        <button
          type="button"
          className="mt-2 inline-flex items-center gap-1 text-[12px] text-primary hover:text-primary/80"
          onClick={onCustomiseClick}
        >
          <Pencil className="h-3 w-3" />
          Customise profile
        </button>
      )}
      
      {/* LAST ROUND chip */}
      {lastRound && (
        <div className="mt-3 flex items-center justify-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-black/[0.04] px-3 py-1 text-[11px] text-foreground/80">
            <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500/90 text-[10px] text-white">
              ⛳
            </span>
            <span className="font-medium">
              Last round: {lastRound.course}
            </span>
            <span className="text-foreground/55">
              {lastRound.scoreLabel} · {lastRound.when}
            </span>
          </div>
        </div>
      )}
    </section>
  );
};

export default ProfileHeaderCard;