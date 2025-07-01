
import React from 'react';
import { Plus, User } from 'lucide-react';
import { StoryUser } from './types';

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
  
  console.log('Rendering story item:', { 
    user: story.user, 
    type: story.type, 
    hasAvatar: !!story.avatar,
    avatar: story.avatar 
  });

  return (
    <div className="flex flex-col items-center space-y-2 min-w-0">
      <div className="relative">
        {isYourProfile ? (
          <button
            type="button"
            onClick={onYourProfileClick}
            aria-label="View your profile"
            className="focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 rounded-full"
          >
            {hasProfile && story.avatar ? (
              // User has a profile photo - show with green ring
              <div className="w-16 h-16 rounded-full p-0.5 bg-gradient-to-tr from-green-500 to-green-700 hover:scale-105 transition-transform">
                <img
                  src={story.avatar}
                  alt={story.user}
                  className="w-full h-full rounded-full object-cover border-2 border-background"
                />
              </div>
            ) : (
              // User doesn't have a profile photo - show plus icon with green ring
              <div className="w-16 h-16 rounded-full p-0.5 bg-gradient-to-tr from-green-500 to-green-700 hover:scale-105 transition-transform flex items-center justify-center">
                <div className="w-full h-full bg-muted border-2 border-dashed border-gray-400 rounded-full flex items-center justify-center hover:bg-muted/80 transition-colors">
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
            className="focus:outline-none focus:ring-2 focus:ring-offset-2 rounded-full"
            style={{ '--tw-ring-color': '#b66b41' } as React.CSSProperties}
          >
            <div 
              className="w-16 h-16 rounded-full p-0.5 hover:scale-105 transition-transform"
              style={{ background: 'linear-gradient(to top right, #b66b41, #8b5a34)' }}
            >
              {story.avatar ? (
                <img
                  src={story.avatar}
                  alt={story.user}
                  className="w-full h-full rounded-full object-cover border-2 border-background"
                  onError={(e) => {
                    console.log('Image failed to load:', story.avatar);
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.nextElementSibling?.classList.remove('hidden');
                  }}
                />
              ) : null}
              <div className={`w-full h-full bg-muted rounded-full flex items-center justify-center border-2 border-background ${story.avatar ? 'hidden' : ''}`}>
                <User className="h-8 w-8 text-muted-foreground" />
              </div>
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
