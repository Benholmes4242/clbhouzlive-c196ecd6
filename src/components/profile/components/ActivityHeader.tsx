
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
        <h2 className="text-lg font-semibold">Activity</h2>
        <span className="text-sm text-muted-foreground">
          {postsCount} posts
        </span>
      </div>
      {isOwnProfile && (
        <CreatePostDialog onPostCreated={onPostCreated} />
      )}
    </div>
  );
};

export default ActivityHeader;
