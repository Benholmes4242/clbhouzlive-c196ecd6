import React, { useState } from 'react';
import { MoreHorizontal, Bookmark, Link2, Share2, EyeOff, Flag, Trash2, Ban } from 'lucide-react';
import { toast } from '@/lib/toast';
import { supabase } from '@/integrations/supabase/client';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
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

interface LoopCardMenuProps {
  postId: string;
  userId?: string;
  authorUserId?: string | null;
  authorUsername?: string | null;
  onShare: () => void;
  isOwnPost?: boolean;
  onDelete?: () => void;
}

export const LoopCardMenu = React.memo(function LoopCardMenu({
  postId,
  userId,
  authorUserId,
  authorUsername,
  onShare,
  isOwnPost = false,
  onDelete,
}: LoopCardMenuProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const { blockUser, loading: blockLoading } = useBlockActions({ currentUserId: userId ?? '' });

  const handleCopyLink = async () => {
    const url = `${window.location.origin}/post/${postId}`;
    await navigator.clipboard.writeText(url);
    toast.success('Link copied');
  };

  const handleNotInterested = async () => {
    if (!userId) return;
    const { error } = await supabase.from('post_dismissals').insert({
      post_id: postId,
      user_id: userId,
    });
    if (error) {
      if (import.meta.env.DEV) console.error('[LoopCardMenu] Dismiss failed:', error);
    } else {
      toast.success("We'll show you less like this");
    }
  };

  const handleReport = async () => {
    if (!userId) return;
    const { error } = await supabase.from('post_reports').insert({
      post_id: postId,
      reporter_id: userId,
    });
    if (error) {
      if (import.meta.env.DEV) console.error('[LoopCardMenu] Report failed:', error);
    } else {
      toast.success('Report submitted');
    }
  };

  const handleSave = () => {
    toast.success('Saved');
  };

  const handleDelete = () => {
    if (!onDelete) return;
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = () => {
    setDeleteConfirmOpen(false);
    onDelete?.();
  };

  const handleBlockConfirm = async () => {
    if (!authorUserId) return;
    await blockUser(authorUserId);
    setConfirmOpen(false);
  };

  const canBlock = !isOwnPost && !!userId && !!authorUserId && authorUserId !== userId;
  const usernameLabel = authorUsername ? `@${authorUsername}` : 'this user';

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className="p-3 -mr-3 rounded-full hover:bg-muted transition-colors"
            aria-label="More options"
          >
            <MoreHorizontal className="w-5 h-5 text-muted-foreground" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onClick={handleSave} className="gap-2 text-sm">
            <Bookmark className="h-4 w-4" />
            Save
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleCopyLink} className="gap-2 text-sm">
            <Link2 className="h-4 w-4" />
            Copy Link
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onShare} className="gap-2 text-sm">
            <Share2 className="h-4 w-4" />
            Share
          </DropdownMenuItem>
          {isOwnPost && onDelete ? (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleDelete}
                className="gap-2 text-sm text-destructive focus:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </>
          ) : (
            <>
              <DropdownMenuItem onClick={handleNotInterested} className="gap-2 text-sm">
                <EyeOff className="h-4 w-4" />
                Not Interested
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleReport}
                className="gap-2 text-sm text-destructive focus:text-destructive"
              >
                <Flag className="h-4 w-4" />
                Report
              </DropdownMenuItem>
              {canBlock && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => setConfirmOpen(true)}
                    className="gap-2 text-sm text-destructive focus:text-destructive"
                  >
                    <Ban className="h-4 w-4" />
                    Block {usernameLabel}
                  </DropdownMenuItem>
                </>
              )}
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Block {usernameLabel}?</AlertDialogTitle>
            <AlertDialogDescription>
              They won't be able to see your posts or contact you, and their content
              will be hidden from your feed. You can unblock them from Settings.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={blockLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBlockConfirm}
              disabled={blockLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {blockLoading ? 'Blocking…' : 'Block'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this post?</AlertDialogTitle>
            <AlertDialogDescription>
              This can't be undone. The post will be removed from your profile and feeds.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
});
