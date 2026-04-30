import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { Button } from '@/components/ui/button';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useFollowState } from '@/hooks/useFollowState';
import { useToggleFollow } from '@/hooks/useToggleFollow';
import { toast } from 'sonner';
import { VerifiedBadge } from '@/components/ui/VerifiedBadge';
import { SuggestedItem } from '@/types/suggestedItem';
import { MutualFriendsAvatars } from './MutualFriendsAvatars';
import { formatHcp } from '@/lib/formatHcp';

interface SuggestedProfileCardProps {
  item: SuggestedItem;
  onFollow?: (id: string) => void;
}

/**
 * For verified BUSINESS names, split into "leading" text + final word "tail".
 * We render the tail + badge inside a no-wrap span so the badge can never
 * wrap onto its own line without any text.
 */
function splitForVerifiedBadgePair(name: string): { leading: string; tail: string } {
  const words = name.trim().split(/\s+/);
  if (words.length <= 1) return { leading: name, tail: '' };
  const tail = words.pop()!;
  return { leading: `${words.join(' ')} `, tail };
}

const REASON_LABELS: Record<string, string> = {
  similar_handicap: 'Similar handicap',
  plays_near: 'Plays near you',
  mutuals: 'mutual friends',
  recently_active: 'Recently active',
  suggested: 'Suggested for you',
};

export const SuggestedProfileCard: React.FC<SuggestedProfileCardProps> = ({
  item,
  onFollow,
}) => {
  const navigate = useNavigate();
  const { user } = useSupabaseSession();

  const isGolfer = item.type === 'golfer';
  const isBusiness = item.type === 'business';

  const targetActorType: 'personal' | 'business' = isBusiness ? 'business' : 'personal';
  const { isFollowing: cached } = useFollowState({
    targetActorType,
    targetActorId: item.id,
    viewerActorType: 'personal',
    viewerActorId: user?.id,
  });
  const isFollowing = cached ?? false;
  const toggle = useToggleFollow();
  const isLoading = toggle.isPending;

  const handleFollow = (e: React.MouseEvent) => {
    e.stopPropagation();

    if (!user?.id) {
      toast.error('Please sign in to follow');
      return;
    }

    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate([10]);
    }

    toggle.mutate(
      {
        targetActorType,
        targetActorId: item.id,
        targetUserId: isGolfer ? item.id : undefined,
        viewerActorType: 'personal',
        viewerActorId: user.id,
        viewerUserId: user.id,
        isFollowing,
      },
      {
        onSuccess: () => {
          if (!isFollowing) onFollow?.(item.id);
        },
        onError: () => toast.error('Failed to follow'),
      },
    );
  };

  const handleCardClick = () => {
    if (isGolfer) {
      navigate(`/profile/${item.username}`);
    } else {
      navigate(`/business/${item.id}`);
    }
  };

  // Golfer-specific data
  const golferData = isGolfer ? item : null;
  const businessData = isBusiness ? item : null;

  // Display name
  const displayName = isGolfer ? golferData!.display_name : businessData!.name;

  // Avatar URL
  const avatarUrl = isGolfer ? golferData!.profile_photo_url : businessData!.logo_url;

  // Verified status
  const isVerified = item.is_verified;

  // For verified businesses, split name so last word + badge stay together
  const businessVerifiedNameParts =
    isBusiness && isVerified ? splitForVerifiedBadgePair(displayName) : null;

  // Handicap display (golfers only)
  const showHandicap = isGolfer && golferData?.eg_handicap_index != null && golferData.show_handicap === true;
  const formattedHandicap = golferData?.eg_handicap_index != null 
    ? `HCP ${formatHcp(golferData.eg_handicap_index)}`
    : null;

  // Reason text for golfers
  const reasonText = isGolfer
    ? golferData?.reason === 'mutuals' && golferData?.mutual_count
      ? `${golferData.mutual_count} mutual friend${golferData.mutual_count > 1 ? 's' : ''}`
      : REASON_LABELS[golferData?.reason ?? 'suggested']
    : null;

  // Secondary line: For golfers show club OR handicap (not both), for business show category OR location
  const secondaryLine = (() => {
    if (isGolfer) {
      // Prefer home club, fallback to handicap
      if (golferData?.home_club) return golferData.home_club;
      if (showHandicap && formattedHandicap) return formattedHandicap;
      return null;
    }
    // Business: always show "Business Profile" — raw category values are internal only
    return 'Business Profile';
  })();

  return (
    <div
      className={cn(
        "suggested-profile-card",
        "relative flex-shrink-0 min-w-[150px] w-[150px] rounded-2xl overflow-hidden cursor-pointer",
        "bg-white border border-gray-100",
        "shadow-sm hover:shadow-md transition-shadow duration-200",
        "select-none touch-manipulation",
        "snap-start"
      )}
      onClick={handleCardClick}
      role="button"
      tabIndex={0}
    >
      {/* Card content */}
      <div className="flex flex-col items-center p-4">
        {/* Avatar - centered */}
        <div className="relative flex justify-center mb-2.5">
          <img
            src={avatarUrl || ''}
            alt={displayName}
            className="w-14 h-14 rounded-xl object-cover bg-gray-100"
            onError={(e) => {
              e.currentTarget.src = '';
              e.currentTarget.style.background = '#e5e7eb';
            }}
          />
        </div>

        {/* Name + Verified badge inline */}
        <div className="flex items-center justify-center gap-0.5 w-full min-w-0">
          <p className="text-sm font-semibold text-center leading-tight truncate" style={{ color: '#111827' }}>
            {displayName}
          </p>
          {isVerified && (
            <span className="flex-shrink-0">
              <VerifiedBadge size="sm" />
            </span>
          )}
        </div>

        {/* Secondary line */}
        <div className="h-4 flex items-center justify-center w-full">
          {secondaryLine && (
            <p className="text-xs text-center truncate w-full leading-tight" style={{ color: '#6b7280' }}>
              {secondaryLine}
            </p>
          )}
        </div>

        {/* Follow CTA - Emerald green */}
        <Button
          size="sm"
          className={cn(
            "w-full h-[34px] text-xs font-medium rounded-full mt-2 border-0",
            isFollowing 
              ? "bg-gray-100 text-gray-500" 
              : "bg-emerald-600 hover:bg-emerald-700 text-white"
          )}
          onClick={handleFollow}
          disabled={isLoading || isFollowing}
        >
          {isLoading ? (
            <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
          ) : isFollowing ? (
            <>
              <Check className="w-3.5 h-3.5 mr-1" />
              Following
            </>
          ) : (
            'Follow'
          )}
        </Button>
      </div>
    </div>
  );
};

export default SuggestedProfileCard;
