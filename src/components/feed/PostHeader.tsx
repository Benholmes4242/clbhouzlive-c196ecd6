
import React from 'react';
import { MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

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
  const navigate = useNavigate();

  const handleProfileClick = () => {
    navigate(`/profile/${user.username}`);
  };
  return (
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center space-x-3">
        <img
          src={user.avatar}
          alt={user.name}
          className="w-16 h-16 rounded-[14px] object-cover cursor-pointer hover:opacity-80 transition-opacity border-2 border-gray-200 hq-image"
          onClick={handleProfileClick}
        />
        <div>
          <div className="flex items-center space-x-1">
            <span 
              className="font-semibold text-sm cursor-pointer hover:text-gray-400 transition-colors"
              onClick={handleProfileClick}
            >
              {user.name}
            </span>
            {user.verified && (
              <div className="w-4 h-4 bg-green-600 rounded-full flex items-center justify-center">
                <div className="w-2 h-2 bg-white rounded-full" />
              </div>
            )}
            {type === 'youtube' && (
              <span className="text-xs bg-red-500 text-white px-2 py-0.5 rounded">YouTube</span>
            )}
          </div>
          <span className="text-xs text-muted-foreground">
            <span 
              className="cursor-pointer hover:text-foreground transition-colors"
              onClick={handleProfileClick}
            >
              {user.username}
            </span>
            {' • '}
            {timeAgo}
          </span>
        </div>
      </div>
      <Button variant="ghost" size="icon">
        <MoreHorizontal className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default PostHeader;
