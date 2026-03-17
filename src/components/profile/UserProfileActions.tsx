import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Check, UserPlus, Clock, UserCheck, X, MessageCircle, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useFollow } from '@/hooks/useFollow';
import { useFriendship } from '@/hooks/useFriendship';
import { getProfileType } from '@/types/profile';
import { trackBusinessEvent } from '@/analytics/businessAnalytics';

interface UserProfileActionsProps {
  targetUserId: string;
  currentUserId: string;
  isFollowing?: boolean; // Optional now, we'll use hook internally
  username: string;
  targetUserType?: string;
  currentUserType?: string;
  // Business profile fields
  profileType?: 'personal' | 'business';
  businessWebsite?: string | null;
}

const UserProfileActions: React.FC<UserProfileActionsProps> = ({
  targetUserId,
  currentUserId,
  username,
  targetUserType = 'individual',
  currentUserType = 'individual',
  profileType,
  businessWebsite
}) => {
  const navigate = useNavigate();
  
  // Determine if target is a business profile
  const isBusiness = profileType === 'business' || 
    (targetUserType && !['individual', 'personal'].includes(targetUserType));
  
  // Use the new hooks
  const { isFollowing: followState, busy: followBusy, toggle: toggleFollow, ensureInitial } = useFollow(targetUserId);
  
  // Only use friendship hook for personal profiles
  const { 
    status: friendStatus, 
    isLoading: friendLoading, 
    isUpdating: friendUpdating,
    sendRequest,
    cancelRequest,
    acceptRequest,
    declineRequest,
  } = useFriendship(isBusiness ? undefined : targetUserId);

  // Initialize follow state on mount
  useEffect(() => {
    ensureInitial();
  }, [ensureInitial]);

  // Check if target user follows the current user (only for personal profiles)
  const { data: targetUserFollowsMe = false } = useQuery({
    queryKey: ['userFollowsMe', targetUserId, currentUserId],
    queryFn: async () => {
      const { data } = await supabase
        .from('user_follows')
        .select('id')
        .eq('follower_id', targetUserId)
        .eq('following_id', currentUserId)
        .maybeSingle();
      
      return !!data;
    },
    enabled: !!targetUserId && !!currentUserId && !isBusiness,
  });

  const handleMessageClick = () => {
    if (isBusiness) {
      trackBusinessEvent(targetUserId, 'message_click');
    }
    navigate(`/messages?friend=${targetUserId}`);
  };

  const handleWebsiteClick = () => {
    if (businessWebsite) {
      trackBusinessEvent(targetUserId, 'website_click');
      const url = businessWebsite.startsWith('http') ? businessWebsite : `https://${businessWebsite}`;
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  const isLoading = followState === 'unknown' || (!isBusiness && friendLoading);
  const isUpdating = followBusy || (!isBusiness && friendUpdating);
  const following = followState === 'following';

  const renderFriendButton = () => {
    // No friend buttons for business profiles
    if (isBusiness) return null;
    
    switch (friendStatus) {
      case 'friends':
        return (
          <Button
            variant="chip-active"
            size="chip"
            disabled
            className="flex-shrink-0"
          >
            <UserCheck className="w-3 h-3 mr-1" />
            Friends
          </Button>
        );

      case 'request_sent':
        return (
          <Button
            variant="outline"
            size="chip"
            onClick={() => cancelRequest()}
            disabled={isUpdating}
            className="flex-shrink-0"
          >
            <Clock className="w-3 h-3 mr-1" />
            {friendUpdating ? 'Cancelling...' : 'Pending'}
          </Button>
        );

      case 'request_received':
        return (
          <>
            <Button
              variant="gradient"
              size="chip"
              onClick={() => acceptRequest()}
              disabled={isUpdating}
              className="flex-shrink-0"
            >
              <Check className="w-3 h-3 mr-1" />
              {friendUpdating ? '...' : 'Confirm'}
            </Button>
            <Button
              variant="outline"
              size="chip"
              onClick={() => declineRequest()}
              disabled={isUpdating}
              className="flex-shrink-0"
            >
              <X className="w-3 h-3 mr-1" />
              Decline
            </Button>
          </>
        );

      case 'blocked':
        return null;

      case 'none':
      default:
        return (
          <Button
            variant="outline"
            size="chip"
            onClick={() => sendRequest()}
            disabled={isUpdating}
            className="flex-shrink-0"
          >
            <UserPlus className="w-3 h-3 mr-1" />
            {friendUpdating ? '...' : 'Add Friend'}
          </Button>
        );
    }
  };

  // Don't show actions if blocked (only applicable for personal profiles)
  if (!isBusiness && friendStatus === 'blocked') {
    return null;
  }

  return (
    <div className="w-full overflow-x-auto scrollbar-hide">
      <div 
        className="flex items-center gap-2 min-w-max px-1 py-1"
        style={{ 
          scrollBehavior: 'smooth',
          WebkitOverflowScrolling: 'touch'
        }}
      >
        {/* Follow Button - shown for both personal and business */}
        <Button
          variant={following ? "chip-active" : "gradient"}
          size="chip"
          onClick={toggleFollow}
          disabled={isLoading || isUpdating}
          className="flex-shrink-0"
        >
          {following ? (
            <>
              <Check className="w-3 h-3 mr-1" />
              Following
            </>
          ) : (
            'Follow'
          )}
        </Button>

        {/* Friend Button(s) - only for personal profiles */}
        {renderFriendButton()}

        {/* Follows You Badge - only for personal profiles */}
        {!isBusiness && targetUserFollowsMe && (
          <div className="px-2 py-1 text-xs h-7 flex-shrink-0 bg-muted text-muted-foreground rounded-sq-sm flex items-center">
            Follows you
          </div>
        )}

        {/* Message Button */}
        <Button 
          variant="outline" 
          size="chip"
          onClick={handleMessageClick}
          className="flex-shrink-0"
        >
          <MessageCircle className="w-3 h-3 mr-1" />
          Message
        </Button>

        {/* Website Button - only for business profiles with website */}
        {isBusiness && businessWebsite && (
          <Button
            variant="outline"
            size="chip"
            onClick={handleWebsiteClick}
            className="flex-shrink-0"
          >
            <ExternalLink className="w-3 h-3 mr-1" />
            Website
          </Button>
        )}
      </div>
    </div>
  );
};

export default UserProfileActions;
