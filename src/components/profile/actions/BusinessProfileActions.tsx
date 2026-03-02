import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { UserPlus, UserCheck, ExternalLink, MoreVertical } from 'lucide-react';
import { useRelationshipStatus } from '@/hooks/useRelationshipStatus';
import { useProfileActions } from './useProfileActions';
import { analyticsEvents } from '@/utils/analyticsEvents';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
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
import { useBlockActions } from '@/hooks/useBlockActions';

interface BusinessProfileActionsProps {
  currentUserId: string;
  profileUserId: string;
  websiteUrl?: string | null;
  isMobile?: boolean;
}

/**
 * Action buttons for business profiles (Club, Brand, Creator)
 * Shows: Follow, Visit Website
 * Does NOT show: Add Friend (business profiles don't have friends)
 */
export const BusinessProfileActions: React.FC<BusinessProfileActionsProps> = ({
  currentUserId,
  profileUserId,
  websiteUrl,
  isMobile = false
}) => {
  const { data: relationship, isLoading } = useRelationshipStatus(profileUserId);
  const { loading: followLoading, handleFollow } = useProfileActions({
    targetUserId: profileUserId,
    currentUserId
  });
  const { loading: blockLoading, blockUser, unblockUser } = useBlockActions({ currentUserId });
  
  const [showBlockDialog, setShowBlockDialog] = useState(false);
  const [showUnblockDialog, setShowUnblockDialog] = useState(false);

  if (isLoading || !relationship) {
    return (
      <div className="flex gap-2">
        <Button disabled size="sm" className="flex-1">
          Loading...
        </Button>
      </div>
    );
  }

  // Handle blocked states
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
              <AlertDialogTitle>Unblock this account?</AlertDialogTitle>
              <AlertDialogDescription>
                This account will be able to interact with you again.
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
        You can't interact with this account.
      </div>
    );
  }

  const followButton = (
    <Button
      variant="secondary"
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

  const websiteButton = websiteUrl ? (
    <Button
      variant="outline"
      size="sm"
      onClick={() => {
        const url = websiteUrl.startsWith('http') ? websiteUrl : `https://${websiteUrl}`;
        window.open(url, '_blank', 'noopener,noreferrer');
      }}
      className={isMobile ? 'flex-1' : ''}
    >
      <ExternalLink className="w-4 h-4 mr-1" />
      Visit Website
    </Button>
  ) : null;

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
          Block account
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <>
      <div className={`flex gap-2 ${isMobile ? 'flex-col' : 'items-center'}`}>
        {followButton}
        {websiteButton}
        {moreMenu}
      </div>

      {/* Block Dialog */}
      <AlertDialog open={showBlockDialog} onOpenChange={setShowBlockDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Block this account?</AlertDialogTitle>
            <AlertDialogDescription>
              You won't see this account's posts, and they won't see yours.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => blockUser(profileUserId)} 
              className="bg-destructive text-destructive-foreground"
            >
              Block
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
