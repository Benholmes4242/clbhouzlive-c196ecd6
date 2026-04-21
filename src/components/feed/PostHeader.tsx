
import React from 'react';
import { MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';

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
        {/* TODO(avatar-userid): userId not surfaced at this layer — colour hashes
            from alt. See src/lib/avatarFallback.ts. Follow-up: plumb user_id
            through the PostHeaderProps.user data source. */}
        <SquircleAvatar
          src={user.avatar}
          alt={user.name || 'Golfer'}
          size={64}
          hideRing
          onClick={handleProfileClick}
          className="cursor-pointer hover:opacity-80 transition-opacity"
        />
        <div>
          <div className="flex items-center space-x-1">
            <span 
              className="font-semibold text-sm cursor-pointer hover:text-gray-400 transition-colors"
              onClick={handleProfileClick}
            >
              {user.name || 'Golfer'}
            </span>
            {type === 'youtube' && (
              <span className="text-xs bg-red-500 text-white px-2 py-0.5 rounded">YouTube</span>
            )}
          </div>
          <span className="text-xs text-muted-foreground">
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
