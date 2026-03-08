import { VideoCardSkeleton } from './VideoCardSkeleton';

export function VideosFeedSkeleton() {
  return (
    <div className="flex flex-col pb-4 pt-2">
      <VideoCardSkeleton />
      <VideoCardSkeleton />
      <VideoCardSkeleton />
    </div>
  );
}
