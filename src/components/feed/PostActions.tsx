
import React from 'react';
import { Heart, MessageCircle, Share } from 'lucide-react';
import { Button } from '@/components/ui/button';
import FeedMuteToggle from './FeedMuteToggle';

interface PostActionsProps {
  stats: {
    likes: number;
    comments: number;
    shares: number;
  };
  isVideoPost?: boolean;
}

const PostActions = ({ stats, isVideoPost = false }: PostActionsProps) => {
  return (
    <div className="flex items-center justify-between w-full">
      <div className="flex items-center space-x-4">
        {/* Mute toggle button - positioned first (above like button) */}
        <FeedMuteToggle isVideoPost={isVideoPost} />
        
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
    </div>
  );
};

export default PostActions;
