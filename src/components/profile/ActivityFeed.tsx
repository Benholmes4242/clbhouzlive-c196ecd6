
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
    <EnhancedSocialActivity
      userId={userId}
      isOwnProfile={isOwnProfile}
      profileDisplayName={profileDisplayName}
    />
  );
};

export default ActivityFeed;
