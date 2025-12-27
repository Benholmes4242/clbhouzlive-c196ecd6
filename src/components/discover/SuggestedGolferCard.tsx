import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Check, BadgeCheck, Trophy, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { toast } from 'sonner';

interface SuggestedGolferCardProps {
  golfer: {
    id: string;
    username: string;
    display_name: string;
    profile_photo_url: string | null;
    home_club?: string | null;
    is_verified?: boolean;
    has_top100?: boolean;
    is_new?: boolean;
    mutual_count?: number;
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
  const [isFollowing, setIsFollowing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

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

  const handleFollow = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!user?.id) {
      toast.error('Please sign in to follow golfers');
      return;
    }
    
    setIsLoading(true);
    
    // Haptic feedback
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate([10]);
    }
    
    try {
      const { error } = await supabase
        .from('user_follows')
        .insert({
          follower_id: user.id,
          following_id: golfer.id,
        });
      
      if (error) throw error;
      
      setIsFollowing(true);
      onFollow?.(golfer.id);
    } catch (error) {
      console.error('Follow error:', error);
      toast.error('Failed to follow');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCardClick = () => {
    navigate(`/user/${golfer.username}`);
  };

  // Get reason label
  const reasonLabel = golfer.reason 
    ? golfer.reason === 'mutuals' && golfer.mutual_count
      ? `${golfer.mutual_count} ${REASON_LABELS.mutuals}`
      : REASON_LABELS[golfer.reason]
    : REASON_LABELS.suggested;

  // Determine which badge to show (priority: verified > top100 > new)
  const badge = golfer.is_verified 
    ? { icon: BadgeCheck, label: 'Verified', color: 'text-blue-500' }
    : golfer.has_top100
    ? { icon: Trophy, label: 'Top 100', color: 'text-amber-500' }
    : golfer.is_new
    ? { icon: Sparkles, label: 'New', color: 'text-emerald-500' }
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
          
          {/* Badge pill - attached to avatar */}
          {badge && (
            <div 
              className={cn(
                "absolute -bottom-1 left-1/2 -translate-x-1/2",
                "flex items-center gap-0.5 px-1.5 py-0.5 rounded-full",
                "bg-background border border-border/60 shadow-sm",
                "text-[9px] font-medium whitespace-nowrap"
              )}
            >
              <badge.icon className={cn("w-2.5 h-2.5", badge.color)} />
              <span className="text-muted-foreground">{badge.label}</span>
            </div>
          )}
        </div>

        {/* Name - centered */}
        <p className="text-sm font-semibold text-foreground text-center truncate w-full mt-1">
          {golfer.display_name}
        </p>

        {/* Reason pill - muted, one line */}
        <p className="text-[11px] text-muted-foreground text-center truncate w-full mt-0.5">
          {reasonLabel}
        </p>

        {/* Follow CTA - full width */}
        <Button
          size="sm"
          variant={isFollowing ? "secondary" : "default"}
          className={cn(
            "w-full mt-3 h-8 text-xs font-medium rounded-lg",
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

export default SuggestedGolferCard;
