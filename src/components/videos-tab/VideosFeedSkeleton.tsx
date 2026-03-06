import { VideoCardSkeleton } from './VideoCardSkeleton';

export function VideosFeedSkeleton() {
  return (
    <div className="flex flex-col gap-4 px-4 pb-4">
      <VideoCardSkeleton />
      <VideoCardSkeleton />
      <VideoCardSkeleton />
    </div>
  );
}
