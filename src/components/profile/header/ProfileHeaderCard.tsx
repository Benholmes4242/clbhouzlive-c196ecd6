import React from 'react';
import { Globe, Pencil, Building2, MapPin, CheckCircle2 } from 'lucide-react';
import { BUSINESS_CATEGORIES, BusinessCategory } from '@/types/profile';
import { VerifiedBadge } from '@/components/ui/VerifiedBadge';
import CollegeStamp from '../CollegeStamp';
import { useFollowedColleges } from '@/features/tourhub/hooks/useCollegeMovers';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';

interface ProfileHeaderCardProps {
  displayName: string;
  username: string;
  // Personal profile fields
  homeClub?: string | null;
  handicap?: number | null;
  collegeNormalized?: string | null;
  // Business profile fields  
  websiteUrl?: string | null;
  location?: string | null;
  userType?: string | null;
  businessName?: string | null;
  businessCategory?: string | null;
  businessLocation?: string | null;
  isVerifiedBusiness?: boolean | null;
  isVerifiedGolfer?: boolean | null;
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
  collegeNormalized,
  websiteUrl,
  location,
  businessName,
  businessCategory,
  businessLocation,
  isVerifiedBusiness,
  isVerifiedGolfer,
  isPersonal,
  isOwnProfile,
  onCustomiseClick,
}) => {
  const { user } = useSupabaseSession();
  const { data: followedColleges } = useFollowedColleges(user?.id);

  // Determine the top followed college that isn't the attended one
  const followedFranchise = followedColleges?.find(
    f => f.normalized_name !== collegeNormalized
  )?.normalized_name ?? null;
  // Format website URL for display
  const formatWebsiteUrl = (url: string) => {
    return url.replace(/^https?:\/\//, '').replace(/\/$/, '');
  };
  
  // Ensure URL has protocol for href
  const getWebsiteHref = (url: string) => {
    return url.startsWith('http') ? url : `https://${url}`;
  };

  // Get business category label (categories are now stored as display strings)
  const getCategoryLabel = (category: string | null | undefined): string => {
    return category || '';
  };

  // Display name for business profiles uses business_name if available
  const effectiveDisplayName = !isPersonal && businessName ? businessName : displayName;
  
  // Location for business profiles
  const effectiveLocation = !isPersonal ? (businessLocation || location) : null;

  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-1.5 md:gap-2">
      {/* Row 1: Name + Verified Golfer badge */}
      <div className="flex items-center justify-center gap-1.5">
        <h1 className="text-xl md:text-2xl font-semibold tracking-tight profile-text-primary text-center">
          {effectiveDisplayName}
        </h1>
        {/* Verified golfer badge - frosted glass disk with green tick */}
        {isPersonal && isVerifiedGolfer && (
          <VerifiedBadge size="lg" placement="inline" />
        )}
      </div>

      {/* Row 2: Username + Business indicators */}
      <div className="flex flex-wrap items-center justify-center gap-2 text-sm profile-text-secondary">
        <span>@{username}</span>
        
        {!isPersonal && (
          <>
            <span className="inline-flex items-center gap-1 rounded-full border border-[rgba(31,36,40,0.10)] px-2 py-0.5 text-xs profile-text-tertiary">
              <Building2 className="w-3 h-3" />
              Business
            </span>
            {isVerifiedBusiness && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-600">
                <VerifiedBadge size="sm" placement="inline" className="mr-0.5" />
                Verified
              </span>
            )}
            {businessCategory && (
              <span className="rounded-full profile-pill-inactive px-2 py-0.5 text-xs">
                {getCategoryLabel(businessCategory)}
              </span>
            )}
          </>
        )}
      </div>

      {/* Row 3: Club (personal) or Location (business) */}
      {isPersonal && homeClub && (
        <div className="text-sm text-center">
          <span className="font-semibold profile-text-primary">{homeClub}</span>
        </div>
      )}
      
      {/* Row 3b: College stamps (personal only) */}
      {isPersonal && collegeNormalized && (
        <CollegeStamp normalizedName={collegeNormalized} className="justify-center" variant="alumni" />
      )}
      {isPersonal && !collegeNormalized && followedFranchise && (
        <CollegeStamp normalizedName={followedFranchise} className="justify-center" variant="supporter" />
      )}
      
      {!isPersonal && effectiveLocation && (
        <div className="flex items-center gap-1 text-sm text-center">
          <MapPin className="w-3.5 h-3.5 profile-text-secondary" />
          <span className="profile-text-secondary">{effectiveLocation}</span>
        </div>
      )}

      {/* Row 4: HCP pill centered + edit button on right (personal only) */}
      {isPersonal && handicap != null && (
        <div className="relative w-full flex justify-center items-center">
          <span className="profile-hcp-pill inline-flex items-center px-3 py-1 rounded-full text-[11px] md:text-xs font-semibold uppercase tracking-wide">
            HCP {handicap.toFixed(1)}
          </span>
          
          {isOwnProfile && onCustomiseClick && (
            <button
              type="button"
              onClick={onCustomiseClick}
              aria-label="Edit profile"
              className="profile-edit-button absolute right-0 inline-flex items-center justify-center h-7 w-7 rounded-full transition"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      )}

      {/* Edit button for business profiles without handicap */}
      {!isPersonal && isOwnProfile && onCustomiseClick && (
        <button
          type="button"
          onClick={onCustomiseClick}
          aria-label="Edit profile"
          className="inline-flex items-center gap-1 px-3 py-1 rounded-full profile-pill-inactive text-xs transition hover:bg-[var(--profile-pill-hover)]"
        >
          <Pencil className="h-3 w-3" />
          Edit profile
        </button>
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
