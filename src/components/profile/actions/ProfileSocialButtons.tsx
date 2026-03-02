import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { UserPlus, UserCheck, UserMinus, MoreVertical } from 'lucide-react';
import { useRelationshipStatus } from '@/hooks/useRelationshipStatus';
import { useFriendActions } from '@/hooks/useFriendActions';
import { useBlockActions } from '@/hooks/useBlockActions';
import { useProfileActions } from './useProfileActions';
import { analyticsEvents } from '@/utils/analyticsEvents';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface ProfileSocialButtonsProps {
  currentUserId: string;
  profileUserId: string;
  isMobile?: boolean;
}

export const ProfileSocialButtons: React.FC<ProfileSocialButtonsProps> = ({
  currentUserId,
  profileUserId,
  isMobile = false
}) => {
  const { data: relationship, isLoading } = useRelationshipStatus(profileUserId);
  const { loading: followLoading, handleFollow } = useProfileActions({
    targetUserId: profileUserId,
    currentUserId
  });
  const {
    loading: friendLoading,
    sendFriendRequest,
    acceptFriendRequest,
    declineFriendRequest,
    cancelFriendRequest,
    unfriend
  } = useFriendActions({ currentUserId });
  const { loading: blockLoading, blockUser, unblockUser } = useBlockActions({ currentUserId });

  const [showBlockDialog, setShowBlockDialog] = useState(false);
  const [showUnblockDialog, setShowUnblockDialog] = useState(false);
  const [showUnfriendDialog, setShowUnfriendDialog] = useState(false);

  if (isLoading || !relationship) {
    return (
      <div className="flex gap-2">
        <Button disabled size="sm" className="flex-1">
          Loading...
        </Button>
      </div>
    );
  }

  // A) Blocked states - override everything
  if (relationship.hasBlockedThem) {
    return (
      <>
        <div className="flex gap-2 items-center">
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setShowUnblockDialog(true)}
            disabled={blockLoading}
            className="flex-1"
          >
            Blocked
          </Button>
        </div>
        <AlertDialog open={showUnblockDialog} onOpenChange={setShowUnblockDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Unblock user?</AlertDialogTitle>
              <AlertDialogDescription>
                This user will be able to interact with you again.
              </AlertDialogDescription>
            </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                analyticsEvents.social.blockChanged({
                  targetUserId: profileUserId,
                  action: "unblock",
                  from: "profile",
                });
                unblockUser(profileUserId);
              }}
            >
              Unblock
            </AlertDialogAction>
          </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </>
    );
  }

  if (relationship.isBlockedByThem) {
    return (
      <div className="text-sm text-muted-foreground text-center py-2">
        You can't interact with this user.
      </div>
    );
  }

  // B) Friend pending request FROM them - show Accept/Decline
  if (relationship.hasPendingFriendRequestFromThem) {
    return (
      <div className="flex gap-2">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => {
            analyticsEvents.social.friendRequestResponded({
              targetUserId: profileUserId,
              from: "profile",
              action: "accepted",
            });
            acceptFriendRequest(profileUserId);
          }}
          disabled={friendLoading}
          className="flex-1"
        >
          <UserCheck className="w-4 h-4 mr-1" />
          Accept
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => {
            analyticsEvents.social.friendRequestResponded({
              targetUserId: profileUserId,
              from: "profile",
              action: "declined",
            });
            declineFriendRequest(profileUserId);
          }}
          disabled={friendLoading}
          className="flex-1"
        >
          Decline
        </Button>
      </div>
    );
  }

  // C) Normal state - Follow + Friend buttons
  const friendButton = (() => {
    if (relationship.isFriend) {
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="secondary" size="sm" className={isMobile ? 'flex-1' : ''}>
              <UserCheck className="w-4 h-4 mr-1" />
              Friends
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setShowUnfriendDialog(true)}>
              Unfriend
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    }

    if (relationship.hasPendingFriendRequestToThem) {
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="secondary" size="sm" disabled={friendLoading} className={isMobile ? 'flex-1' : ''}>
              <UserMinus className="w-4 h-4 mr-1" />
              Pending
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => cancelFriendRequest(profileUserId)}>
              Cancel request
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    }

    return (
      <Button
        variant="secondary"
        size="sm"
        onClick={() => {
          analyticsEvents.social.friendRequestSent({
            targetUserId: profileUserId,
            from: "profile",
          });
          sendFriendRequest(profileUserId);
        }}
        disabled={friendLoading}
        className={isMobile ? 'flex-1' : ''}
      >
        <UserPlus className="w-4 h-4 mr-1" />
        Add Friend
      </Button>
    );
  })();

  const followButton = (
    <Button
      variant={relationship.isFollowing ? 'secondary' : 'destructive'}
      size="sm"
      onClick={() => {
        analyticsEvents.social.followToggled({
          targetUserId: profileUserId,
          from: "profile",
          isFollowing: !relationship.isFollowing,
        });
        handleFollow(relationship.isFollowing);
      }}
      disabled={followLoading}
      className={isMobile ? 'flex-1' : ''}
    >
      {relationship.isFollowing ? (
        <>
          <UserCheck className="w-4 h-4 mr-1" />
          Following
        </>
      ) : (
        <>
          <UserPlus className="w-4 h-4 mr-1" />
          Follow
        </>
      )}
    </Button>
  );

  const moreMenu = (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm">
          <MoreVertical className="w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={() => {
            analyticsEvents.social.blockChanged({
              targetUserId: profileUserId,
              action: "block",
              from: "profile",
            });
            setShowBlockDialog(true);
          }}
          className="text-destructive"
        >
          Block user
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <>
      <div className={`flex gap-2 ${isMobile ? 'flex-col' : 'items-center'}`}>
        {followButton}
        {friendButton}
        {moreMenu}
      </div>

      {/* Unfriend Dialog */}
      <AlertDialog open={showUnfriendDialog} onOpenChange={setShowUnfriendDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove friend?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove this person from your friends list.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => unfriend(profileUserId)}>
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Block Dialog */}
      <AlertDialog open={showBlockDialog} onOpenChange={setShowBlockDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Block user?</AlertDialogTitle>
            <AlertDialogDescription>
              You won't see this user's posts, and they won't see yours.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => blockUser(profileUserId)} className="bg-destructive text-destructive-foreground">
              Block
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
