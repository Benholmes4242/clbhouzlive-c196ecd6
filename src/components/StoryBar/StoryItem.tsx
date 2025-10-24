import React from 'react';
import { Plus, User } from 'lucide-react';
import { StoryUser } from './types';
import AvatarSquircle from '@/components/ui/AvatarSquircle';

interface StoryItemProps {
  story: StoryUser;
  onYourProfileClick: () => void;
  onOtherProfileClick: (username: string) => void;
  hasProfile?: boolean;
}

const StoryItem: React.FC<StoryItemProps> = ({ 
  story, 
  onYourProfileClick, 
  onOtherProfileClick,
  hasProfile = false
}) => {
  const isYourProfile = story.type === 'add';
  
  // Removed excessive logging for performance

  return (
    <div className="flex flex-col items-center space-y-1 min-w-0">
      <div className="relative">
        {isYourProfile ? (
          <button
            type="button"
            onClick={onYourProfileClick}
            aria-label="View your profile"
            className="focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
          >
            {hasProfile && story.avatar ? (
              // User has a profile photo - show with subtle ring
              <div className="hover:opacity-80 transition-opacity">
                <AvatarSquircle
                  size={80}
                  src={story.avatar}
                  alt={story.user}
                  ringColor="rgb(229, 231, 235)"
                  ringWidth={2}
                />
              </div>
            ) : (
              // User doesn't have a profile photo - show plus icon with circular ring
              <div className="w-20 h-20 rounded-full p-0.5 bg-gradient-to-tr from-gray-200 to-gray-300 hover:opacity-80 transition-opacity flex items-center justify-center">
                <div className="w-full h-full bg-muted border border-dashed border-gray-300 rounded-full flex items-center justify-center hover:bg-muted/80 transition-colors">
                  <Plus className="h-6 w-6 text-muted-foreground" />
                </div>
              </div>
            )}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => onOtherProfileClick(story.username)}
            aria-label={`View ${story.user}'s profile`}
            className="focus:outline-none focus:ring-2 focus:ring-offset-2"
            style={{ '--tw-ring-color': '#6e9277' } as React.CSSProperties}
          >
            <div className="hover:opacity-80 transition-opacity">
              {story.avatar ? (
                <AvatarSquircle
                  size={80}
                  src={story.avatar}
                  alt={story.user}
                  ringColor="rgb(209, 213, 219)"
                  ringWidth={2}
                />
              ) : (
                <div className="w-20 h-20 rounded-full p-0.5 bg-gradient-to-tr from-gray-400 to-gray-300">
                  <div className="w-full h-full bg-muted rounded-full flex items-center justify-center border border-background">
                    <User className="h-8 w-8 text-muted-foreground" />
                  </div>
                </div>
              )}
            </div>
          </button>
        )}
      </div>
      <span className="text-xs text-center text-white max-w-20 truncate">
        {story.user}
      </span>
    </div>
  );
};

export default StoryItem;
