
import React from 'react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';

interface StoryItemProps {
  id: string;
  username: string;
  displayName: string;
  avatar: string;
  isActive?: boolean;
  onClick?: () => void;
}

const StoryItem: React.FC<StoryItemProps> = ({
  id,
  username,
  displayName,
  avatar,
  isActive = false,
  onClick
}) => {
  const { user } = useSupabaseSession();
  const isCurrentUser = user?.id === id;

  return (
    <div 
      className="flex flex-col items-center space-y-2 cursor-pointer"
      onClick={onClick}
    >
      <Avatar
        className="w-16 h-16"
        isCurrentUser={isCurrentUser}
        showRing={true}
      >
        <AvatarImage 
          src={avatar} 
          alt={displayName || username}
          className="object-cover object-center"
        />
        <AvatarFallback className="bg-muted text-muted-foreground">
          {(displayName || username).charAt(0).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <span className="text-xs text-center truncate w-16">
        {displayName || username}
      </span>
    </div>
  );
};

export default StoryItem;
