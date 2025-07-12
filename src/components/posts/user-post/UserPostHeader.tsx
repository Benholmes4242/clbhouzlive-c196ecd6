import React from 'react';
import { MoreHorizontal, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import LazyImage from '@/components/ui/lazy-image';

interface UserPostHeaderProps {
  displayName: string;
  timeAgo: string;
  profilePhotoUrl: string | null;
  username: string | null;
  isOwnPost: boolean;
  onProfileClick: () => void;
  onEditClick: () => void;
  onDeleteClick: () => void;
}

export const UserPostHeader: React.FC<UserPostHeaderProps> = ({
  displayName,
  timeAgo,
  profilePhotoUrl,
  username,
  isOwnPost,
  onProfileClick,
  onEditClick,
  onDeleteClick
}) => {
  return (
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center space-x-3">
        <LazyImage
          src={profilePhotoUrl || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face'}
          alt={displayName}
          className="w-16 h-16 rounded-[14px] border-2 border-gray-200 cursor-pointer hover:opacity-80 transition-opacity"
          width={64}
          height={64}
          onClick={onProfileClick}
        />
        <div>
          <div className="flex items-center space-x-1">
            <span 
              className="font-semibold text-sm cursor-pointer hover:text-gray-400 transition-colors"
              onClick={onProfileClick}
            >
              {displayName}
            </span>
          </div>
          <span className="text-xs text-muted-foreground">{timeAgo}</span>
        </div>
      </div>
      
      {isOwnPost && (
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="hover:bg-muted">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent 
            align="end" 
            className="w-48 bg-background border shadow-lg z-[100]"
            sideOffset={5}
            avoidCollisions={true}
          >
            <DropdownMenuItem 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onEditClick();
              }}
              className="cursor-pointer"
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit Post
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onDeleteClick();
              }}
              className="text-destructive cursor-pointer focus:text-destructive focus:bg-destructive/10"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Post
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
};