
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
    <div className="flex flex-col items-center space-y-1 min-w-0">
      <div className="relative">
        {story.type === 'add' ? (
          <button
            type="button"
            onClick={onYourProfileClick}
            aria-label="Create or view your profile"
          >
            <div className="w-16 h-16 bg-muted border-2 border-dashed border-amber-700 rounded-full flex items-center justify-center hover:bg-muted/80 transition-colors">
              <Plus className="h-6 w-6 text-amber-700" />
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
                ? 'bg-gradient-to-tr from-green-500 to-green-700' 
                : story.type === 'suggested' 
                ? 'bg-gradient-to-tr from-blue-500 to-blue-700' 
                : ''
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
