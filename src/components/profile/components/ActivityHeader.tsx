
import React from 'react';
import CreatePostDialog from '@/components/posts/CreatePostDialog';

interface ActivityHeaderProps {
  postsCount: number;
  isOwnProfile: boolean;
  onPostCreated: () => void;
}

const ActivityHeader: React.FC<ActivityHeaderProps> = ({ postsCount, isOwnProfile, onPostCreated }) => {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        <h2 className="text-3xl font-bold text-white">Activity</h2>
        <span className="text-lg text-white/90">
          {postsCount} posts
        </span>
      </div>
    </div>
  );
};

export default ActivityHeader;
