/**
 * TileOptionsMenu - Three-dot overlay menu for grid tiles on own posts
 */

import React, { useState } from 'react';
import { MoreVertical, Trash2, Pencil } from 'lucide-react';
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

interface TileOptionsMenuProps {
  onDelete?: () => void;
  onEdit?: () => void;
  className?: string;
}

export const TileOptionsMenu: React.FC<TileOptionsMenuProps> = ({
  onDelete,
  onEdit,
  className,
}) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleMenuClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
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
      {/* Use div wrapper instead of button to avoid nested button warning */}
      <div 
        className={`absolute top-2 right-2 z-20 pointer-events-auto ${className}`}
        onClick={handleMenuClick}
      >
        <DropdownMenu>
          {/* Use div instead of button - DropdownMenuTrigger renders its own button via asChild */}
          <DropdownMenuTrigger asChild>
            <div
              role="button"
              tabIndex={0}
              className="w-7 h-7 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center hover:bg-black/70 transition-colors cursor-pointer"
              aria-label="Post options"
              onClick={handleMenuClick}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleMenuClick(e as any);
                }
              }}
            >
              <MoreVertical className="w-4 h-4 text-white" />
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent 
            align="end" 
            className="w-40 bg-background/95 backdrop-blur-sm border border-border shadow-xl z-[100]"
            sideOffset={5}
          >
            {onEdit && (
              <DropdownMenuItem 
                onClick={(e) => { e.stopPropagation(); onEdit(); }}
                className="cursor-pointer"
              >
                <Pencil className="h-4 w-4 mr-2" />
                Edit post
              </DropdownMenuItem>
            )}
            {onDelete && (
              <DropdownMenuItem 
                onClick={handleDeleteClick}
                className="text-destructive cursor-pointer focus:text-destructive focus:bg-destructive/10"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
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
              {isDeleting ? 'Deleting...' : 'Delete'}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default TileOptionsMenu;
