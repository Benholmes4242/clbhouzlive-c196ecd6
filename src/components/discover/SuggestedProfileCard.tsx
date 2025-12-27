import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Check } from 'lucide-react';
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
  onDismiss?: (id: string) => void;
  onFollow?: (id: string) => void;
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
  onDismiss,
  onFollow,
}) => {
  const navigate = useNavigate();
  const { user } = useSupabaseSession();
  const [isFollowing, setIsFollowing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  const isGolfer = item.type === 'golfer';
  const isBusiness = item.type === 'business';

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDismissed(true);
    
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate([5]);
    }
    
    setTimeout(() => {
      onDismiss?.(item.id);
    }, 200);
  };

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
        "hover:scale-[1.02] active:scale-[0.98]",
        isDismissed && "opacity-0 scale-90 pointer-events-none"
      )}
      onClick={handleCardClick}
      style={{
        transition: 'all 0.2s ease-out',
      }}
    >
      {/* Dismiss X button - top right */}
      <button
        onClick={handleDismiss}
        className="absolute top-2 right-2 z-10 w-6 h-6 rounded-full bg-muted/80 backdrop-blur-sm flex items-center justify-center hover:bg-muted transition-colors"
        aria-label="Dismiss suggestion"
      >
        <X className="w-3.5 h-3.5 text-muted-foreground" />
      </button>

      {/* Card content - flex column with fixed height slots */}
      <div className="flex flex-col h-full pt-3 pb-3 px-3">
        {/* Avatar - large, centered */}
        <div className="relative flex justify-center mb-2">
          <SquircleAvatar
            size={56}
            src={avatarUrl}
            alt={displayName}
          />
        </div>

        {/* Text content area - flex-1 to push button to bottom */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Slot 1: Name + Verified badge - 2 lines, min-h reserved */}
          <div className="min-h-[36px] flex flex-col items-center justify-start">
            <div className="flex items-start gap-1 justify-center w-full">
              <p className="text-sm font-semibold text-foreground text-center line-clamp-2 leading-snug">
                {displayName}
              </p>
              {isVerified && (
                <VerifiedBadge size="sm" className="flex-shrink-0 mt-0.5" />
              )}
            </div>
          </div>

          {/* Slot 2: Home club (golfers) or "Business profile" (businesses) - reserved height */}
          <div className="min-h-[32px] flex items-start justify-center mt-0.5">
            {isGolfer && golferData?.home_club ? (
              <p className="text-[11px] text-muted-foreground text-center line-clamp-2 leading-snug w-full">
                {golferData.home_club}
              </p>
            ) : isBusiness ? (
              <p className="text-[11px] text-muted-foreground text-center line-clamp-1 w-full">
                Business profile
              </p>
            ) : isGolfer ? (
              // Empty placeholder for golfers without home club
              <div className="w-full" />
            ) : null}
          </div>

          {/* Slot 3: Handicap (golfers) or Location (businesses) - reserved height */}
          <div className="min-h-[16px] flex items-start justify-center mt-0.5">
            {isGolfer && showHandicap && formattedHandicap ? (
              <p className="text-[10px] text-muted-foreground/70 text-center line-clamp-1 w-full">
                {formattedHandicap}
              </p>
            ) : isBusiness && businessData?.location_label ? (
              <p className="text-[10px] text-muted-foreground/70 text-center line-clamp-1 w-full">
                {businessData.location_label}
              </p>
            ) : (
              // Empty placeholder to reserve space
              <div className="w-full" />
            )}
          </div>
        </div>

        {/* Follow CTA - pinned to bottom with mt-auto */}
        <Button
          size="sm"
          variant={isFollowing ? "secondary" : "default"}
          className={cn(
            "w-full mt-auto h-8 text-xs font-medium rounded-lg",
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
