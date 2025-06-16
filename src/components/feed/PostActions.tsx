
import React from 'react';
import { Heart, MessageCircle, Share } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PostActionsProps {
  stats: {
    likes: number;
    comments: number;
    shares: number;
  };
}

const PostActions = ({ stats }: PostActionsProps) => {
  return (
    <div className="flex items-center space-x-4">
      <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-red-500">
        <Heart className="h-4 w-4 mr-1" />
        {stats.likes.toLocaleString()}
      </Button>
      <Button variant="ghost" size="sm" className="text-muted-foreground">
        <MessageCircle className="h-4 w-4 mr-1" />
        {stats.comments}
      </Button>
      <Button variant="ghost" size="sm" className="text-muted-foreground">
        <Share className="h-4 w-4 mr-1" />
        {stats.shares}
      </Button>
    </div>
  );
};

export default PostActions;
