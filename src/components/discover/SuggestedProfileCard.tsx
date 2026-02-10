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
    return null;
  })();

  return (
    <div
      className={cn(
        "suggested-profile-card",
        "relative flex-shrink-0 w-[140px] rounded-xl overflow-hidden cursor-pointer",
        "bg-card border border-border/50",
        "shadow-sm hover:shadow-md transition-shadow duration-200",
        "select-none touch-manipulation"
      )}
      onClick={handleCardClick}
      role="button"
      tabIndex={0}
    >
      {/* Card content - compact layout */}
      <div className="flex flex-col items-center pt-2.5 pb-2 px-2.5">
        {/* Avatar - centered, no ring */}
        <div className="relative flex justify-center mb-2">
          <SquircleAvatar
            size={56}
            src={avatarUrl}
            alt={displayName}
            hideRing
          />
        </div>

        {/* Name + Verified badge inline */}
        <div className="flex items-center justify-center gap-0.5 w-full min-w-0">
          <p className="text-[13px] font-semibold text-foreground text-center leading-tight truncate">
            {displayName}
          </p>
          {isVerified && (
            <span className="flex-shrink-0">
              <VerifiedBadge size="sm" />
            </span>
          )}
        </div>

        {/* Single secondary line - fixed height container for consistent button position */}
        <div className="h-4 flex items-center justify-center w-full">
          {secondaryLine && (
            <p className="text-[11px] text-muted-foreground text-center truncate w-full leading-tight">
              {secondaryLine}
            </p>
          )}
        </div>

        {/* Follow CTA - always at consistent position */}
        <Button
          size="sm"
          variant={isFollowing ? "secondary" : "ghost"}
          className={cn(
            "w-full h-[34px] text-xs font-medium rounded-lg border-0 mt-1",
            isFollowing 
              ? "bg-muted text-muted-foreground" 
              : "text-foreground hover:opacity-80"
          )}
          style={!isFollowing ? { backgroundColor: '#e2e8f0' } : undefined}
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
