import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, UserPlus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { toast } from 'sonner';
import { VerifiedBadge } from '@/components/ui/VerifiedBadge';
import { SuggestedItem } from '@/types/suggestedItem';

interface CompactSuggestedCardProps {
  item: SuggestedItem;
  onFollow?: (id: string) => void;
}

/**
 * CompactSuggestedCard - 60% smaller suggested profile card
 * 
 * Features:
 * - Avatar + name + follow button only
 * - Removed: home club, handicap, mutual friends, reason text
 * - Quick follow action
 */
export const CompactSuggestedCard: React.FC<CompactSuggestedCardProps> = ({
  item,
  onFollow,
}) => {
  const navigate = useNavigate();
  const { user } = useSupabaseSession();
  const [isFollowing, setIsFollowing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const isGolfer = item.type === 'golfer';

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
      navigate(`/profile/${(item as any).username}`);
    } else {
      navigate(`/business/${item.id}`);
    }
  };

  // Display name and avatar
  const displayName = isGolfer ? (item as any).display_name : (item as any).name;
  const avatarUrl = isGolfer ? (item as any).profile_photo_url : (item as any).logo_url;
  const isVerified = item.is_verified;

  return (
    <div
      className={cn(
        "flex-shrink-0 flex flex-col items-center gap-2 w-20 cursor-pointer",
        "select-none touch-manipulation"
      )}
      onClick={handleCardClick}
      role="button"
      tabIndex={0}
    >
      {/* Avatar with ring */}
      <div className="relative">
        <div className="w-16 h-16 rounded-full overflow-hidden ring-2 ring-border hover:ring-primary/50 transition-all">
          <SquircleAvatar
            size={64}
            src={avatarUrl}
            alt={displayName}
            className="w-full h-full"
          />
        </div>
        {isVerified && (
          <div className="absolute -bottom-0.5 -right-0.5 bg-primary rounded-full p-0.5">
            <Check className="h-2.5 w-2.5 text-primary-foreground" />
          </div>
        )}
      </div>

      {/* Name */}
      <p className="text-xs font-medium text-foreground text-center line-clamp-1 w-full">
        {displayName}
      </p>

      {/* Follow button - compact */}
      <button
        onClick={handleFollow}
        disabled={isLoading || isFollowing}
        className={cn(
          "flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-colors",
          isFollowing
            ? "bg-muted text-muted-foreground"
            : "bg-primary text-primary-foreground hover:bg-primary/90"
        )}
      >
        {isLoading ? (
          <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
        ) : isFollowing ? (
          <>
            <Check className="h-3 w-3" />
            <span>Following</span>
          </>
        ) : (
          <>
            <UserPlus className="h-3 w-3" />
            <span>Follow</span>
          </>
        )}
      </button>
    </div>
  );
};

export default CompactSuggestedCard;
