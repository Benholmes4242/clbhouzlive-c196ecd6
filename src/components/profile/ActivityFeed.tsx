
import React from 'react';
import EnhancedSocialActivity from './EnhancedSocialActivity';
import { VideoAutoplayProvider } from '@/hooks/useVideoAutoplayManager';

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
    <VideoAutoplayProvider>
      <EnhancedSocialActivity
        userId={userId}
        isOwnProfile={isOwnProfile}
        profileDisplayName={profileDisplayName}
      />
    </VideoAutoplayProvider>
  );
};

export default ActivityFeed;
