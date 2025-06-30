
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';

interface Comment {
  id: string;
  username: string;
  displayName?: string;
  text: string;
  createdAt: string;
  userAvatar?: string;
}

interface InlineCommentPreviewProps {
  postId: string;
  comments?: Comment[];
  totalComments?: number;
  onViewAllComments?: () => void;
}

const InlineCommentPreview = ({ 
  postId, 
  comments = [], 
  totalComments = 0, 
  onViewAllComments 
}: InlineCommentPreviewProps) => {
  // Mock comments for demonstration
  const mockComments: Comment[] = [
    {
      id: '1',
      username: 'mikegolf',
      displayName: 'Mike Johnson',
      text: 'Great shot! What club did you use? 🏌️‍♂️',
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      userAvatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=32&h=32&fit=crop&crop=face'
    },
    {
      id: '2',
      username: 'sarahp',
      displayName: 'Sarah Parker',
      text: 'Amazing course! I need to play here 🔥',
      createdAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
      userAvatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=32&h=32&fit=crop&crop=face'
    }
  ];

  const displayComments = comments.length > 0 ? comments : mockComments;
  const previewComments = displayComments.slice(0, 2);
  const actualTotal = totalComments > 0 ? totalComments : displayComments.length;

  if (displayComments.length === 0) return null;

  return (
    <div className="space-y-2 pt-2">
      {previewComments.map((comment) => (
        <div key={comment.id} className="flex items-start space-x-2">
          <img
            src={comment.userAvatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=32&h=32&fit=crop&crop=face'}
            alt={comment.displayName || comment.username}
            className="w-6 h-6 rounded-full object-cover flex-shrink-0"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-1">
              <span className="font-semibold text-sm text-foreground">
                {comment.displayName || comment.username}
              </span>
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
              </span>
            </div>
            <p className="text-sm text-foreground break-words">{comment.text}</p>
          </div>
        </div>
      ))}
      
      {actualTotal > 2 && (
        <Button
          variant="ghost"
          size="sm"
          className="text-xs text-muted-foreground hover:text-foreground p-0 h-auto font-normal"
          onClick={onViewAllComments}
        >
          View all {actualTotal} comments
        </Button>
      )}
    </div>
  );
};

export default InlineCommentPreview;
