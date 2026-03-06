import React from 'react';
import VideoCardSkeleton from './VideoCardSkeleton';

const VideosFeedSkeleton: React.FC = () => (
  <div className="flex flex-col gap-4 px-4">
    <VideoCardSkeleton />
    <VideoCardSkeleton />
    <VideoCardSkeleton />
  </div>
);

export default VideosFeedSkeleton;
