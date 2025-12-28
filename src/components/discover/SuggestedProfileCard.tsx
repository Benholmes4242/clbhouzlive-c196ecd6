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
        "relative flex-shrink-0 w-[185px] h-[220px] rounded-2xl overflow-hidden cursor-pointer",
        "bg-card/80 backdrop-blur-sm border border-border/40",
        "shadow-sm select-none touch-manipulation"
      )}
      onClick={handleCardClick}
      role="button"
      tabIndex={0}
    >
      {/* Card content - flex column */}
      <div className="flex flex-col h-full pt-3 pb-3 px-3">
        {/* Avatar - large, centered (~20% bigger: 56 → 68) */}
        <div className="relative flex justify-center mb-2">
          <SquircleAvatar
            size={68}
            src={avatarUrl}
            alt={displayName}
          />
        </div>

        {/* Text stack - tight gap, no reserved empty heights */}
        <div className="flex flex-col gap-0.5 items-center min-w-0">
          {/* Name + Verified badge inline - keep badge attached to last word for businesses */}
          <p className="text-sm font-semibold text-foreground text-center line-clamp-2 leading-snug w-full">
            {businessVerifiedNameParts ? (
              <>
                {businessVerifiedNameParts.leading}
                <span className="whitespace-nowrap">
                  {businessVerifiedNameParts.tail}
                  <span className="inline-block align-middle ml-1">
                    <VerifiedBadge size="sm" />
                  </span>
                </span>
              </>
            ) : (
              <>
                <span>{displayName}</span>
                {isVerified && (
                  <span className="inline-block align-middle ml-1">
                    <VerifiedBadge size="sm" />
                  </span>
                )}
              </>
            )}
          </p>

          {/* Golfer: Home club (2 lines) OR Business: "Business Profile" */}
          {isGolfer && golferData?.home_club && (
            <p className="text-[11px] text-muted-foreground text-center line-clamp-2 leading-snug w-full">
              {golferData.home_club}
            </p>
          )}
          {isBusiness && (
            <p className="text-[11px] text-muted-foreground text-center line-clamp-1 w-full">
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

          {/* Golfer: Reason row (always reserve height for uniform cards) */}
          {isGolfer && (
            <p className="text-[10px] text-muted-foreground/60 text-center line-clamp-1 w-full mt-0.5">
              {reasonText || <span className="opacity-0">placeholder</span>}
            </p>
          )}
        </div>

        {/* Spacer pushes button to bottom */}
        <div className="flex-1" />

        {/* Follow CTA - pinned to bottom */}
        <Button
          size="sm"
          variant={isFollowing ? "secondary" : "default"}
          className={cn(
            "w-full h-8 text-xs font-medium rounded-lg",
            isFollowing && "bg-muted text-muted-foreground"
          )}
          onClick={handleFollow}
          disabled={isLoading || isFollowing}
        >
          {isLoading ? (
            <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
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
