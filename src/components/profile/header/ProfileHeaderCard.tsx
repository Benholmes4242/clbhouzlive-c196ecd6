import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Globe, Building2, User } from 'lucide-react';
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
 * Font weight hierarchy: name (semibold) → club/HCP (medium) → bio + customise (normal)
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
    <section className="-mt-[45px] flex flex-col items-center text-center space-y-2.5 md:space-y-3">
      {/* NAME – boldest */}
      <h1 className="text-3xl md:text-4xl font-semibold text-slate-900">
        {displayName}
      </h1>

      {/* USERNAME – same size family, not bold */}
      <div className="text-base md:text-lg text-slate-600">
        @{username}
      </div>

      {/* CLUB + HCP LINE – slightly less bold than name */}
      {subtitleLine && (
        <p className="text-base md:text-lg font-medium text-slate-800">
          {subtitleLine}
        </p>
      )}
      
      {/* Website - Business profiles */}
      {!isPersonal && websiteUrl && (
        <div className="flex items-center justify-center gap-1.5 text-base md:text-lg font-medium">
          <Globe className="w-5 h-5 text-slate-700" />
          <a 
            href={getWebsiteHref(websiteUrl)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-slate-800 hover:text-slate-600 transition-colors"
          >
            {formatWebsiteUrl(websiteUrl)}
          </a>
        </div>
      )}

      {/* BIO – lighter again */}
      {bio && (
        <div className="max-w-[420px]">
          <p className="text-base md:text-lg font-normal leading-snug text-slate-700">
            {displayBio}
          </p>
          {shouldTruncateBio && (
            <button
              onClick={() => setBioExpanded(!bioExpanded)}
              className="inline-flex items-center gap-0.5 text-sm font-normal text-slate-500 mt-1.5 hover:text-slate-700"
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

      {/* CUSTOMISE PROFILE – lightest */}
      {isOwnProfile && onCustomiseClick && (
        <button
          className="text-sm md:text-base font-normal text-slate-500 hover:text-slate-700 underline-offset-2 hover:underline transition-colors"
          onClick={onCustomiseClick}
        >
          Customise profile
        </button>
      )}
    </section>
  );
};

export default ProfileHeaderCard;