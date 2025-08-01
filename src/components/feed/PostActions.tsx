
import React from 'react';
import { MessageCircle, Share } from 'lucide-react';
import { Button } from '@/components/ui/button';
import FeedMuteToggle from './FeedMuteToggle';
import { QuickReactionButton } from '@/components/clubhouse/QuickReactionButton';
import { usePostReactions } from '@/hooks/usePostReactions';

interface PostActionsProps {
  postId: string;
  stats: {
    likes: number;
    comments: number;
    shares: number;
  };
  isVideoPost?: boolean;
}

const PostActions = ({ postId, stats, isVideoPost = false }: PostActionsProps) => {
  const { getPostReactions, getUserReaction, handleReaction } = usePostReactions();
  
  const reactions = getPostReactions(postId);
  const userReaction = getUserReaction(postId);

  return (
    <div className="flex items-center justify-between w-full">
      <div className="flex items-center space-x-4">
        {/* Mute toggle button - positioned first (above like button) */}
        <FeedMuteToggle isVideoPost={isVideoPost} />
        
        {/* Quick Reaction Button with long-hold functionality */}
        <QuickReactionButton
          postId={postId}
          reactions={reactions}
          userReaction={userReaction}
          onReact={handleReaction}
          className="text-muted-foreground"
        />
        
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
