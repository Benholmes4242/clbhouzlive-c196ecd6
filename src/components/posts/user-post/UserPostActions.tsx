import React from 'react';
import { Heart, MessageCircle, Share } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface UserPostActionsProps {
  onLike?: () => void;
  onComment?: () => void;
  onShare?: () => void;
}

export const UserPostActions: React.FC<UserPostActionsProps> = ({
  onLike,
  onComment,
  onShare
}) => {
  return (
    <div className="flex items-center space-x-4 pt-2 border-t">
      <Button 
        variant="ghost" 
        size="sm" 
        className="text-muted-foreground hover:text-red-500"
        onClick={onLike}
      >
        <Heart className="h-4 w-4 mr-1" />
        Like
      </Button>
      <Button 
        variant="ghost" 
        size="sm" 
        className="text-muted-foreground"
        onClick={onComment}
      >
        <MessageCircle className="h-4 w-4 mr-1" />
        Comment
      </Button>
      <Button 
        variant="ghost" 
        size="sm" 
        className="text-muted-foreground"
        onClick={onShare}
      >
        <Share className="h-4 w-4 mr-1" />
        Share
      </Button>
    </div>
  );
};