
import React from 'react';
import { Plus, User } from 'lucide-react';
import { StoryUser } from './types';
import HighQualityImage from '@/components/ui/high-quality-image';

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
    <div className="flex flex-col items-center space-y-1 min-w-0">
      <div className="relative">
        {isYourProfile ? (
          <button
            type="button"
            onClick={onYourProfileClick}
            aria-label="View your profile"
            className="focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 rounded-[18px]"
          >
            {hasProfile && story.avatar ? (
              // User has a profile photo - show with green ring
              <div className="w-20 h-20 rounded-[18px] p-0.5 bg-gradient-to-tr from-orange-500 to-orange-700 hover:opacity-80 transition-opacity">
                <HighQualityImage
                  src={story.avatar}
                  alt={story.user}
                  className="w-full h-full rounded-[15px] border-2 border-background"
                  width={80}
                  height={80}
                />
              </div>
            ) : (
              // User doesn't have a profile photo - show plus icon with green ring
              <div className="w-20 h-20 rounded-[18px] p-0.5 bg-gradient-to-tr from-orange-500 to-orange-700 hover:opacity-80 transition-opacity flex items-center justify-center">
                <div className="w-full h-full bg-muted border-2 border-dashed border-gray-400 rounded-[15px] flex items-center justify-center hover:bg-muted/80 transition-colors">
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
            className="focus:outline-none focus:ring-2 focus:ring-offset-2 rounded-[18px]"
            style={{ '--tw-ring-color': '#6e9277' } as React.CSSProperties}
          >
            <div 
              className="w-20 h-20 rounded-[18px] p-0.5 hover:opacity-80 transition-opacity"
              style={{ background: 'linear-gradient(to top right, #000000, #333333)' }}
            >
              {story.avatar ? (
                <HighQualityImage
                  src={story.avatar}
                  alt={story.user}
                  className="w-full h-full rounded-[15px] border-2 border-background"
                  width={80}
                  height={80}
                  onError={(e) => {
                    console.log('Image failed to load:', story.avatar);
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.nextElementSibling?.classList.remove('hidden');
                  }}
                />
              ) : null}
              <div className={`w-full h-full bg-muted rounded-[15px] flex items-center justify-center border-2 border-background ${story.avatar ? 'hidden' : ''}`}>
                <User className="h-8 w-8 text-muted-foreground" />
              </div>
            </div>
          </button>
        )}
      </div>
      <span className="text-xs text-center text-muted-foreground max-w-20 truncate">
        {story.user}
      </span>
    </div>
  );
};

export default StoryItem;
