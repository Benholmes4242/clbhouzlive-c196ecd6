
import React from 'react';
import { MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PostHeaderProps {
  user: {
    name: string;
    username: string;
    avatar: string;
    verified: boolean;
  };
  type: 'youtube' | 'friend' | 'post';
  timeAgo: string;
}

const PostHeader = ({ user, type, timeAgo }: PostHeaderProps) => {
  return (
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center space-x-3">
        <img
          src={user.avatar}
          alt={user.name}
          className="w-10 h-10 rounded-full object-cover"
        />
        <div>
          <div className="flex items-center space-x-1">
            <span className="font-semibold text-sm">{user.name}</span>
            {user.verified && (
              <div className="w-4 h-4 bg-green-600 rounded-full flex items-center justify-center">
                <div className="w-2 h-2 bg-white rounded-full" />
              </div>
            )}
            {type === 'youtube' && (
              <span className="text-xs bg-red-500 text-white px-2 py-0.5 rounded">YouTube</span>
            )}
          </div>
          <span className="text-xs text-muted-foreground">{user.username} • {timeAgo}</span>
        </div>
      </div>
      <Button variant="ghost" size="icon">
        <MoreHorizontal className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default PostHeader;
