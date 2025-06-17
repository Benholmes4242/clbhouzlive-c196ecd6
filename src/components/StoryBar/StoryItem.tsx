
import React from 'react';
import { Plus } from 'lucide-react';
import { StoryUser } from './types';

interface StoryItemProps {
  story: StoryUser;
  onYourProfileClick: () => void;
  onOtherProfileClick: (username: string) => void;
}

const StoryItem: React.FC<StoryItemProps> = ({ 
  story, 
  onYourProfileClick, 
  onOtherProfileClick 
}) => {
  return (
    <div className="flex flex-col items-center space-y-2 min-w-0">
      <div className="relative">
        {story.type === 'add' ? (
          <button
            type="button"
            onClick={onYourProfileClick}
            aria-label="Create or view your profile"
            className="focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 rounded-full"
          >
            <div className="w-16 h-16 bg-muted border-2 border-dashed border-amber-700 rounded-full flex items-center justify-center hover:bg-muted/80 transition-colors relative">
              <img
                src={story.avatar}
                alt={story.user}
                className="w-full h-full rounded-full object-cover opacity-70"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <Plus className="h-6 w-6 text-white drop-shadow-lg" />
              </div>
            </div>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => onOtherProfileClick(story.username)}
            aria-label={`View ${story.user}'s profile`}
            className="focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 rounded-full"
          >
            <div className={`w-16 h-16 rounded-full p-0.5 ${
              story.hasStory 
                ? 'bg-gradient-to-tr from-pink-500 via-red-500 to-yellow-500' 
                : story.type === 'suggested' 
                ? 'bg-gray-300' 
                : 'bg-gradient-to-tr from-green-500 to-green-700'
            } hover:scale-105 transition-transform`}>
              <img
                src={story.avatar}
                alt={story.user}
                className="w-full h-full rounded-full object-cover border-2 border-background"
              />
            </div>
          </button>
        )}
      </div>
      <span className="text-xs text-center text-muted-foreground max-w-16 truncate">
        {story.user}
      </span>
    </div>
  );
};

export default StoryItem;
