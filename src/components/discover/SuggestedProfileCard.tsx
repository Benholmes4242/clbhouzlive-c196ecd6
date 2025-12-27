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
 * Adds a non-breaking space between the last two words to prevent
 * the verified badge from wrapping alone onto a new line
 */
function addNbspBetweenLastTwoWords(name: string): string {
  const words = name.split(' ');
  if (words.length < 2) return name;
  const lastWord = words.pop()!;
  const secondLastWord = words.pop()!;
  return [...words, `${secondLastWord}\u00A0${lastWord}`].join(' ');
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

  // Display name - for businesses, add nbsp between last two words so badge doesn't orphan
  const rawName = isGolfer ? golferData!.display_name : businessData!.name;
  const displayName = isBusiness ? addNbspBetweenLastTwoWords(rawName) : rawName;

  // Avatar URL
  const avatarUrl = isGolfer ? golferData!.profile_photo_url : businessData!.logo_url;

  // Verified status
  const isVerified = item.is_verified;

  // Handicap display (golfers only)
  const showHandicap = isGolfer && golferData?.eg_handicap_index != null && golferData.show_handicap === true;
  const formattedHandicap = golferData?.eg_handicap_index != null 
    ? `HCP ${golferData.eg_handicap_index > 0 ? '+' : ''}${golferData.eg_handicap_index.toFixed(1)}`
    : null;

  return (
    <div
      className={cn(
        "relative flex-shrink-0 w-[185px] h-[220px] rounded-2xl overflow-hidden cursor-pointer",
        "bg-card/80 backdrop-blur-sm border border-border/40",
        "shadow-sm hover:shadow-md transition-all duration-200",
        "hover:scale-[1.02] active:scale-[0.98]"
      )}
      onClick={handleCardClick}
      style={{
        transition: 'all 0.2s ease-out',
      }}
    >
      {/* Card content - flex column */}
      <div className="flex flex-col h-full pt-3 pb-3 px-3">
        {/* Avatar - large, centered (~20% bigger: 56 → 68) */}
        <div className="relative flex justify-center mb-2">
          <SquircleAvatar
            size={68}
            src={avatarUrl}
            alt={rawName}
          />
        </div>

        {/* Text stack - tight gap, no reserved empty heights */}
        <div className="flex flex-col gap-0.5 items-center min-w-0">
          {/* Name + Verified badge inline - badge follows last character naturally */}
          <p className="text-sm font-semibold text-foreground text-center line-clamp-2 leading-snug w-full">
            <span>{displayName}</span>
            {isVerified && (
              <span className="inline-block align-middle ml-1">
                <VerifiedBadge size="sm" />
              </span>
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
