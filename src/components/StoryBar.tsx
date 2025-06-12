import React from 'react';
import { Plus } from 'lucide-react';
import { Link } from 'react-router-dom';

const StoryBar = () => {
  const stories = [
    {
      id: 'add',
      type: 'add',
      user: 'Your Profile',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
    },
    {
      id: 1,
      user: 'Rory McIlroy',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
      hasStory: true,
    },
    {
      id: 2,
      user: 'Golf Weekly',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face',
      hasStory: true,
    },
    {
      id: 3,
      user: 'PGA Tour',
      avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&h=150&fit=crop&crop=face',
      hasStory: true,
    },
    {
      id: 4,
      user: 'Local Pro',
      avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&h=150&fit=crop&crop=face',
      hasStory: true,
    },
  ];

  return (
    <div className="bg-background border-b border-border">
      <div className="container mx-auto px-4 py-4">
        <div className="flex space-x-4 overflow-x-auto scrollbar-hide">
          {stories.map((story) => (
            <div key={story.id} className="flex flex-col items-center space-y-1 min-w-0">
              <div className="relative">
                {story.type === 'add' ? (
                  <Link to="/create-profile">
                    <div className="w-16 h-16 bg-muted border-2 border-dashed border-amber-700 rounded-full flex items-center justify-center hover:bg-muted/80 transition-colors">
                      <Plus className="h-6 w-6 text-amber-700" />
                    </div>
                  </Link>
                ) : (
                  <div className={`w-16 h-16 rounded-full p-0.5 ${story.hasStory ? 'bg-gradient-to-tr from-green-500 to-green-700' : ''}`}>
                    <img
                      src={story.avatar}
                      alt={story.user}
                      className="w-full h-full rounded-full object-cover border-2 border-background"
                    />
                  </div>
                )}
              </div>
              <span className="text-xs text-center text-muted-foreground max-w-16 truncate">
                {story.user}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StoryBar;
