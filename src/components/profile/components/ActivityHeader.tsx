
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { TrophyIcon } from '@heroicons/react/24/outline';
import CreatePostDialog from '@/components/posts/CreatePostDialog';

interface ActivityHeaderProps {
  postsCount: number;
  isOwnProfile: boolean;
  onPostCreated: () => void;
}

const ActivityHeader: React.FC<ActivityHeaderProps> = ({ postsCount, isOwnProfile, onPostCreated }) => {
  const navigate = useNavigate();

  return (
    <div className="mb-4">
      {isOwnProfile && (
        <div className="mb-4">
          <Button
            onClick={() => navigate('/achievements')}
            variant="outline"
            size="sm"
            className="text-white border-white/20 hover:bg-white/10"
          >
            <TrophyIcon className="w-4 h-4 mr-2" />
            Achievements
          </Button>
        </div>
      )}
      
      <div className="flex items-center gap-4">
        <h2 className="text-3xl font-bold text-white">Activity</h2>
        <span className="text-lg text-white/90">
          {postsCount} posts
        </span>
      </div>
    </div>
  );
};

export default ActivityHeader;
