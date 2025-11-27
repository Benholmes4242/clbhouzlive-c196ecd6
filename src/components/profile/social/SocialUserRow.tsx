import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useRelationshipStatus } from '@/hooks/useRelationshipStatus';
import { useProfileActions } from '@/components/profile/actions/useProfileActions';
import { useFriendActions } from '@/hooks/useFriendActions';
import { SocialUser } from '@/hooks/useFollowersList';
import { buildImageThumbnailUrl } from '@/utils/mediaThumbs';
import { UserCheck, UserPlus } from 'lucide-react';

interface SocialUserRowProps {
  user: SocialUser;
  currentUserId: string | null;
}

export const SocialUserRow: React.FC<SocialUserRowProps> = ({ user, currentUserId }) => {
  const navigate = useNavigate();
  const isSelf = currentUserId === user.id;

  const { data: relationship, isLoading: relationshipLoading } = useRelationshipStatus(
    isSelf ? undefined : user.id
  );

  const { loading: followLoading, handleFollow } = useProfileActions({
    targetUserId: user.id,
    currentUserId: currentUserId || ''
  });

  const { loading: friendLoading, sendFriendRequest } = useFriendActions({
    currentUserId: currentUserId || ''
  });

  const handleRowClick = () => {
    navigate(`/profile/${user.username}`);
  };

  const handleFollowClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (relationship) {
      handleFollow(relationship.isFollowing);
    }
  };

  const handleFriendClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!relationship?.isFriend && !relationship?.hasPendingFriendRequestToThem) {
      sendFriendRequest(user.id);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div
      onClick={handleRowClick}
      className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50 cursor-pointer transition-colors"
    >
      {/* Avatar & Info */}
      <Avatar className="h-12 w-12 flex-shrink-0">
        <AvatarImage 
          src={user.avatarUrl ? buildImageThumbnailUrl(user.avatarUrl, { width: 128, height: 128 }) : undefined}
          alt={user.displayName}
          loading="lazy"
          decoding="async"
        />
        <AvatarFallback>{getInitials(user.displayName)}</AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-body-md font-semibold truncate">{user.displayName}</p>
          {relationship?.isFriend && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
              Friend
            </span>
          )}
        </div>
        <p className="text-body-sm text-muted-foreground truncate">@{user.username}</p>
        {(user.homeClub || user.handicapIndex !== null) && (
          <p className="text-body-sm text-muted-foreground truncate">
            {user.homeClub && <span>{user.homeClub}</span>}
            {user.homeClub && user.handicapIndex !== null && <span> • </span>}
            {user.handicapIndex !== null && <span>HCP {user.handicapIndex}</span>}
          </p>
        )}
      </div>

      {/* Action Buttons */}
      {!isSelf && currentUserId && relationship && !relationshipLoading && (
        <div className="flex gap-2 flex-shrink-0">
          {!relationship.hasBlockedThem && !relationship.isBlockedByThem && (
            <>
              <Button
                variant={relationship.isFollowing ? 'secondary' : 'default'}
                size="sm"
                onClick={handleFollowClick}
                disabled={followLoading}
                className="text-xs px-3 h-8"
              >
                {relationship.isFollowing ? (
                  <>
                    <UserCheck className="w-3 h-3 mr-1" />
                    Following
                  </>
                ) : (
                  <>
                    <UserPlus className="w-3 h-3 mr-1" />
                    Follow
                  </>
                )}
              </Button>

              {!relationship.isFriend && !relationship.hasPendingFriendRequestToThem && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleFriendClick}
                  disabled={friendLoading}
                  className="text-xs px-3 h-8"
                >
                  <UserPlus className="w-3 h-3 mr-1" />
                  Add
                </Button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};
