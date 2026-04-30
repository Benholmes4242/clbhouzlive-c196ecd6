import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { Button } from '@/components/ui/button';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useFollowState } from '@/hooks/useFollowState';
import { useToggleFollow } from '@/hooks/useToggleFollow';
import { toast } from 'sonner';
import { VerifiedBadge } from '@/components/ui/VerifiedBadge';
import { MutualFriendsAvatars, MutualFriend } from './MutualFriendsAvatars';
import { AnimatedNumber } from '@/components/ui/motion';
import { formatHcp } from '@/lib/formatHcp';

interface SuggestedGolferCardProps {
  golfer: {
    id: string;
    username: string;
    display_name: string;
    profile_photo_url: string | null;
    home_club?: string | null;
    is_verified?: boolean;
    eg_handicap_index?: number | null;
    show_handicap?: boolean;
    mutual_count?: number;
    mutual_friends?: MutualFriend[];
    reason?: 'similar_handicap' | 'plays_near' | 'mutuals' | 'recently_active' | 'suggested';
  };
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

export const SuggestedGolferCard: React.FC<SuggestedGolferCardProps> = ({
  golfer,
  onDismiss,
  onFollow,
}) => {
  const navigate = useNavigate();
  const { user } = useSupabaseSession();
  const [isDismissed, setIsDismissed] = useState(false);

  const { isFollowing: cached } = useFollowState({
    targetActorType: 'personal',
    targetActorId: golfer.id,
    viewerActorType: 'personal',
    viewerActorId: user?.id,
  });
  const isFollowing = cached ?? false;
  const toggle = useToggleFollow();
  const isLoading = toggle.isPending;

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDismissed(true);

    // Haptic feedback
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate([5]);
    }

    // Delay actual removal for animation
    setTimeout(() => {
      onDismiss?.(golfer.id);
    }, 200);
  };

  const handleFollow = (e: React.MouseEvent) => {
    e.stopPropagation();

    if (!user?.id) {
      toast.error('Please sign in to follow golfers');
      return;
    }

    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate([10]);
    }

    toggle.mutate(
      {
        targetActorType: 'personal',
        targetActorId: golfer.id,
        targetUserId: golfer.id,
        viewerActorType: 'personal',
        viewerActorId: user.id,
        viewerUserId: user.id,
        isFollowing,
      },
      {
        onSuccess: () => {
          if (!isFollowing) onFollow?.(golfer.id);
        },
        onError: () => toast.error('Failed to follow'),
      },
    );
  };

  const handleCardClick = () => {
    navigate(`/user/${golfer.username}`);
  };

  // Render reason with mutual friend avatars if available
  const renderReasonLabel = () => {
    // If mutuals reason and we have avatar data, show avatars + text
    if (golfer.reason === 'mutuals' && golfer.mutual_friends && golfer.mutual_friends.length > 0) {
      return (
        <div className="flex items-center gap-1.5 justify-center">
          <MutualFriendsAvatars friends={golfer.mutual_friends} maxDisplay={3} />
          <span className="text-[11px] text-muted-foreground">
            <AnimatedNumber value={golfer.mutual_count ?? 0} minCh={1} className="inline" /> {REASON_LABELS.mutuals}
          </span>
        </div>
      );
    }
    
    // Fallback to text-only
    if (golfer.reason === 'mutuals' && golfer.mutual_count) {
      return (
        <span className="text-[11px] text-muted-foreground text-center truncate w-full">
          <AnimatedNumber value={golfer.mutual_count} minCh={1} className="inline" /> {REASON_LABELS.mutuals}
        </span>
      );
    }
    
    const reasonLabel = golfer.reason ? REASON_LABELS[golfer.reason] : REASON_LABELS.suggested;
    
    return (
      <span className="text-[11px] text-muted-foreground text-center truncate w-full">
        {reasonLabel}
      </span>
    );
  };

  // Show handicap only if exists AND show_handicap is true
  const showHandicap = golfer.eg_handicap_index != null && golfer.show_handicap === true;
  const formattedHandicap = golfer.eg_handicap_index != null 
    ? `HCP ${formatHcp(golfer.eg_handicap_index)}`
    : null;

  return (
    <div
      className={cn(
        "relative flex-shrink-0 w-[140px] rounded-2xl overflow-hidden cursor-pointer",
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

      {/* Card content */}
      <div className="flex flex-col items-center pt-4 pb-3 px-3">
        {/* Avatar - large, centered */}
        <div className="relative mb-2">
          <SquircleAvatar
            size={64}
            src={golfer.profile_photo_url}
            alt={golfer.display_name}
          />
        </div>

        {/* Name + Verified badge inline */}
        <div className="flex items-center gap-1 justify-center w-full mt-1">
          <p className="text-sm font-semibold text-foreground text-center truncate">
            {golfer.display_name}
          </p>
          {golfer.is_verified && (
            <VerifiedBadge size="sm" />
          )}
        </div>

        {/* Home club - muted, single line, only if exists */}
        {golfer.home_club && (
          <p className="text-[11px] text-muted-foreground text-center truncate w-full mt-0.5">
            {golfer.home_club}
          </p>
        )}

        {/* Handicap - only if exists AND show_handicap is true */}
        {showHandicap && formattedHandicap && (
          <p className="text-[10px] text-muted-foreground/70 text-center truncate w-full mt-0.5">
            {formattedHandicap}
          </p>
        )}

        {/* Reason pill - muted, only show if no home_club to avoid crowding */}
        {!golfer.home_club && (
          <div className="mt-0.5">
            {renderReasonLabel()}
          </div>
        )}

        {/* Follow CTA - full width */}
        <Button
          size="sm"
          variant={isFollowing ? "secondary" : "default"}
          className={cn(
            "w-full mt-3 h-8 text-xs font-medium rounded-lg",
            isFollowing && "bg-muted text-muted-foreground"
          )}
          onClick={handleFollow}
          disabled={isLoading}
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

export default SuggestedGolferCard;
