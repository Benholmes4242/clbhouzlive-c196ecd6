
import React from 'react';
import EnhancedSocialActivity from './EnhancedSocialActivity';

interface ActivityFeedProps {
  userId: string;
  isOwnProfile: boolean;
  profileDisplayName?: string;
}

const ActivityFeed: React.FC<ActivityFeedProps> = ({
  userId,
  isOwnProfile,
  profileDisplayName
}) => {
  return (
    <div className="p-4">
      <EnhancedSocialActivity
        userId={userId}
        isOwnProfile={isOwnProfile}
        profileDisplayName={profileDisplayName}
      />
    </div>
  );
};

export default ActivityFeed;
