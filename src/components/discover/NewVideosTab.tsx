import { lazy, Suspense } from 'react';
import VideosFeedSkeleton from '@/components/videos-tab/VideosFeedSkeleton';

const VideosTabContent = lazy(() => import('@/components/videos-tab/VideosTabContent'));

export default function NewVideosTab() {
  return (
    <Suspense fallback={<VideosFeedSkeleton />}>
      <VideosTabContent embedded />
    </Suspense>
  );
}
