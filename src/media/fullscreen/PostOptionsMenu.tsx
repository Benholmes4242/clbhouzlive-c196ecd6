/**
 * PostOptionsMenu - Three-dot menu for own posts in fullscreen viewer
 */

import React, { useState } from 'react';
import { MoreVertical, Pencil, Trash2 } from 'lucide-react';
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
import { Button } from '@/components/ui/button';

interface PostOptionsMenuProps {
  onEdit?: () => void;
  onDelete?: () => void;
  className?: string;
}

export const PostOptionsMenu: React.FC<PostOptionsMenuProps> = ({
  onEdit,
  onDelete,
  className,
}) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isDeleting) return;
    setIsDeleting(true);
    
    try {
      await onDelete?.();
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className={`w-10 h-10 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center hover:bg-black/50 transition-colors ${className}`}
            aria-label="Post options"
          >
            <MoreVertical className="w-5 h-5 text-white" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent 
          align="end" 
          className="w-48 bg-background/95 backdrop-blur-sm border border-border shadow-xl z-[10002]"
          sideOffset={5}
        >
          {onEdit && (
            <DropdownMenuItem 
              onClick={onEdit}
              className="cursor-pointer"
            >
              <Pencil className="h-4 w-4 mr-2" />
              Edit Post
            </DropdownMenuItem>
          )}
          {onDelete && (
            <DropdownMenuItem 
              onClick={handleDeleteClick}
              className="text-destructive cursor-pointer focus:text-destructive focus:bg-destructive/10"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Post
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

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
              {isDeleting ? 'Deleting...' : 'Delete'}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default PostOptionsMenu;
