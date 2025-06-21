
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Story } from './useStoryData';

interface StoryItemProps {
  story: Story;
  onYourProfileClick: () => void;
  onOtherProfileClick: (username: string) => void;
  hasProfile: boolean;
}

const StoryItem = ({ story, onYourProfileClick, onOtherProfileClick, hasProfile }: StoryItemProps) => {
  const handleClick = () => {
    if (story.type === 'your_profile') {
      onYourProfileClick();
    } else if (story.type === 'friend_profile' && story.username) {
      onOtherProfileClick(story.username);
    }
  };

  return (
    <div 
      className="flex flex-col items-center space-y-2 cursor-pointer hover:opacity-80 transition-opacity"
      onClick={handleClick}
    >
      <div className={`relative ${story.hasStory ? 'p-0.5 bg-gradient-to-tr from-yellow-400 to-pink-600 rounded-full' : ''}`}>
        <img
          src={story.image}
          alt={story.name}
          className="w-16 h-16 rounded-full object-cover border-2 border-background"
        />
        {story.type === 'your_profile' && !hasProfile && (
          <div className="absolute -bottom-1 -right-1">
            <Badge variant="destructive" className="text-xs px-1 py-0">
              Setup
            </Badge>
          </div>
        )}
      </div>
      <span className="text-xs text-center max-w-16 truncate">
        {story.name}
      </span>
    </div>
  );
};

export default StoryItem;
