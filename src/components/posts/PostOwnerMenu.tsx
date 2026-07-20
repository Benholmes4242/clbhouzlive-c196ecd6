/**
 * PostOwnerMenu — shared "…" owner menu used on every post surface
 * (grid tile, feed card header, fullscreen overlay top bar, Clubhouse rail).
 *
 * Self-wired: surfaces pass post identity only.
 *   • Edit  → usePostStudioStore().openPostStudioForEdit({ postId })
 *   • Delete → usePostDeletion().deletePost(postId, actorType, actorId)
 *   • Review-derived (sourceReviewId != null) → "Manage review"
 *     → navigate(`/courses/${reviewCourseId}/rate`) — no generic Delete.
 *
 * Renders nothing when isOwnPost is false. Non-owner Report/Hide/Block
 * is out of scope (see Track C decision 3); each surface keeps its
 * existing non-owner wiring.
 *
 * Promoted from src/components/grid/TileOptionsMenu.tsx — keeps the same
 * confirm dialog + stopPropagation guards so it stays safe inside tappable
 * cards.
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MoreHorizontal, MoreVertical, Trash2, Pencil, ExternalLink } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { usePostStudioStore } from '@/stores/usePostStudioStore';
import { usePostDeletion } from '@/hooks/usePostDeletion';

export interface PostOwnerMenuProps {
  postId: string;
  /** Caller-decided owner gate (personal ownership; business-admin gating is a follow-up). */
  isOwnPost: boolean;
  actorType?: 'personal' | 'business';
  actorId?: string;
  /** Non-null marks the post as review-derived — replaces Edit/Delete with "Manage review". */
  sourceReviewId?: string | null;
  /** Required for review-derived routing. Falls back to no-op if missing. */
  reviewCourseId?: string | null;
  /**
   * Visual variant — `overlay` matches the original TileOptionsMenu dark pill
   * used on media tiles + feed chrome. `inline` is a transparent neutral
   * trigger for light-surface cards (posts tab FeedCard header).
   */
  variant?: 'overlay' | 'inline';
  /**
   * When true, absolutely positions the trigger top-right of its parent
   * (grid tile usage — matches legacy TileOptionsMenu placement exactly).
   */
  floating?: boolean;
  className?: string;
}

export const PostOwnerMenu: React.FC<PostOwnerMenuProps> = ({
  postId,
  isOwnPost,
  actorType,
  actorId,
  sourceReviewId,
  reviewCourseId,
  variant = 'overlay',
  floating = false,
  className,
}) => {
  const navigate = useNavigate();
  const openPostStudioForEdit = usePostStudioStore((s) => s.openPostStudioForEdit);
  const { deletePost } = usePostDeletion();

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  if (!isOwnPost) return null;

  const isReviewDerived = !!sourceReviewId;

  const stopAll = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.stopPropagation();
    e.preventDefault();
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    openPostStudioForEdit({ postId });
  };

  const handleManageReview = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (reviewCourseId) {
      navigate(`/courses/${reviewCourseId}/rate`);
    }
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (isDeleting) return;
    setIsDeleting(true);
    try {
      await deletePost(postId, actorType, actorId);
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  // ── Trigger button ──────────────────────────────────────────────────
  const triggerOverlay = (
    <div
      role="button"
      tabIndex={0}
      className="w-7 h-7 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center hover:bg-black/70 transition-colors cursor-pointer"
      aria-label="Post options"
      onClick={stopAll}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') stopAll(e);
      }}
    >
      <MoreVertical className="w-4 h-4 text-white" />
    </div>
  );

  const triggerInline = (
    <div
      role="button"
      tabIndex={0}
      className="w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground hover:bg-muted/60 transition-colors cursor-pointer"
      aria-label="Post options"
      onClick={stopAll}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') stopAll(e);
      }}
    >
      <MoreHorizontal className="w-5 h-5" />
    </div>
  );

  const trigger = variant === 'inline' ? triggerInline : triggerOverlay;

  // Wrapper — floating (absolute) for grid tiles; otherwise inline.
  const wrapperClass = floating
    ? `absolute top-2 right-2 z-20 pointer-events-auto ${className ?? ''}`
    : `inline-flex items-center pointer-events-auto ${className ?? ''}`;

  return (
    <>
      <div className={wrapperClass} onClick={stopAll}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-44 bg-background/95 backdrop-blur-sm border border-border shadow-xl z-[100]"
            sideOffset={5}
          >
            {isReviewDerived ? (
              <DropdownMenuItem
                onClick={handleManageReview}
                disabled={!reviewCourseId}
                className="cursor-pointer"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Manage review
              </DropdownMenuItem>
            ) : (
              <>
                <DropdownMenuItem onClick={handleEdit} className="cursor-pointer">
                  <Pencil className="h-4 w-4 mr-2" />
                  Edit post
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={handleDeleteClick}
                  className="text-destructive cursor-pointer focus:text-destructive focus:bg-destructive/10"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent className="z-[10003]">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Post?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. Your post and all its media will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting…' : 'Delete'}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default PostOwnerMenu;
