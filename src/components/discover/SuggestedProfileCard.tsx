import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { toast } from 'sonner';
import { VerifiedBadge } from '@/components/ui/VerifiedBadge';
import { SuggestedItem } from '@/types/suggestedItem';
import { MutualFriendsAvatars } from './MutualFriendsAvatars';

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
  const [isFollowing, setIsFollowing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const isGolfer = item.type === 'golfer';
  const isBusiness = item.type === 'business';

  const handleFollow = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!user?.id) {
      toast.error('Please sign in to follow');
      return;
    }
    
    setIsLoading(true);
    
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate([10]);
    }
    
    try {
      if (isGolfer) {
        const { error } = await supabase
          .from('user_follows')
          .insert({
            follower_id: user.id,
            following_id: item.id,
          });
        
        if (error) throw error;
      } else {
        // Follow business account
        const { error } = await supabase
          .from('business_follows')
          .insert({
            follower_id: user.id,
            business_id: item.id,
          });
        
        if (error) throw error;
      }
      
      setIsFollowing(true);
      onFollow?.(item.id);
    } catch (error) {
      console.error('Follow error:', error);
      toast.error('Failed to follow');
    } finally {
      setIsLoading(false);
    }
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
    ? `HCP ${golferData.eg_handicap_index > 0 ? '+' : ''}${golferData.eg_handicap_index.toFixed(1)}`
    : null;

  // Reason text for golfers
  const reasonText = isGolfer
    ? golferData?.reason === 'mutuals' && golferData?.mutual_count
      ? `${golferData.mutual_count} mutual friend${golferData.mutual_count > 1 ? 's' : ''}`
      : REASON_LABELS[golferData?.reason ?? 'suggested']
    : null;

  return (
    <div
      className={cn(
        "suggested-profile-card",
        "relative flex-shrink-0 w-[180px] h-[240px] rounded-2xl overflow-hidden cursor-pointer",
        "bg-card border border-border/50",
        "shadow-sm hover:shadow-md transition-shadow duration-200",
        "select-none touch-manipulation"
      )}
      onClick={handleCardClick}
      role="button"
      tabIndex={0}
    >
      {/* Card content - flex column with fixed height */}
      <div className="flex flex-col h-full pt-4 pb-3 px-3">
        {/* Avatar - centered (fixed height section) */}
        <div className="relative flex justify-center mb-3">
          <SquircleAvatar
            size={64}
            src={avatarUrl}
            alt={displayName}
          />
        </div>

        {/* Text stack - flexible section that grows to fill space */}
        <div className="flex flex-col flex-1 items-center min-w-0">
          {/* Name + Verified badge inline */}
          <p className={cn(
            "text-sm font-semibold text-foreground text-center leading-tight w-full",
            isGolfer ? "truncate" : "line-clamp-2"
          )}>
            {businessVerifiedNameParts ? (
              <>
                {businessVerifiedNameParts.leading}
                <span className="whitespace-nowrap inline-flex items-center">
                  {businessVerifiedNameParts.tail}
                  <span className="inline-flex items-center ml-1 -translate-y-[1px]">
                    <VerifiedBadge size="sm" />
                  </span>
                </span>
              </>
            ) : (
              <>
                <span>{displayName}</span>
                {isVerified && (
                  <span className="inline-flex items-center ml-1 -translate-y-[1px]">
                    <VerifiedBadge size="sm" />
                  </span>
                )}
              </>
            )}
          </p>

          {/* Golfer: Home club (1 line, truncate) OR Business: "Business Profile" */}
          {isGolfer && golferData?.home_club && (
            <p className="text-[11px] text-muted-foreground text-center truncate w-full mt-0.5">
              {golferData.home_club}
            </p>
          )}
          {isBusiness && (
            <p className="text-[11px] text-muted-foreground text-center line-clamp-1 w-full mt-0.5">
              Business Profile
            </p>
          )}

          {/* Golfer: Handicap (1 line) OR Business: Location (1 line) */}
          {isGolfer && showHandicap && formattedHandicap && (
            <p className="text-[10px] text-muted-foreground/70 text-center line-clamp-1 w-full">
              {formattedHandicap}
            </p>
          )}
          {isBusiness && businessData?.location_label && (
            <p className="text-[10px] text-muted-foreground/70 text-center line-clamp-1 w-full">
              {businessData.location_label}
            </p>
          )}

          {/* Spacer to push reason to bottom of info section */}
          <div className="flex-1" />

          {/* Golfer: Reason row with optional mutual friend avatars - anchored to bottom of info section */}
          {isGolfer && (
            <div className="flex items-center justify-center gap-1.5 w-full">
              {golferData?.mutual_friends && golferData.mutual_friends.length > 0 && (
                <MutualFriendsAvatars friends={golferData.mutual_friends} maxDisplay={3} />
              )}
              <p className="text-[10px] text-muted-foreground/60 text-center line-clamp-1">
                {reasonText || <span className="opacity-0">placeholder</span>}
              </p>
            </div>
          )}
        </div>

        {/* Follow CTA - fixed at bottom */}
        <Button
          size="sm"
          variant={isFollowing ? "secondary" : "default"}
          className={cn(
            "w-full h-9 text-sm font-semibold rounded-xl mt-3",
            isFollowing 
              ? "bg-muted text-muted-foreground" 
              : "bg-[#e2e8f0] text-[#1e293b] hover:bg-[#cbd5e1]"
          )}
          onClick={handleFollow}
          disabled={isLoading || isFollowing}
        >
          {isLoading ? (
            <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          ) : isFollowing ? (
            <>
              <Check className="w-4 h-4 mr-1.5" />
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
