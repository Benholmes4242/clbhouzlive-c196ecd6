import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { Suspense, lazy } from 'react';
import PageRoot from '@/components/layout/PageRoot';
import { VideosFeedSkeleton } from '@/components/videos-tab/VideosFeedSkeleton';
import ScrollToTopGlass from '@/components/common/ScrollToTopGlass';

const VideosTabContent = lazy(() => import('@/components/videos-tab/VideosTabContent'));

export default function VideosSubpage() {
  const navigate = useNavigate();

  return (
    <PageRoot className="bg-background min-h-screen" hasBottomNav={true}>
      {/* Back header */}
      <div
        className="flex items-center gap-3 px-4"
        style={{
          paddingTop: 12,
          paddingBottom: 8,
          position: 'sticky',
          top: '55px',
          zIndex: 21,
          background: 'hsl(var(--background))',
        }}
      >
        <button
          onClick={() => navigate(-1)}
          className="w-[36px] h-[36px] rounded-full flex items-center justify-center active:scale-[0.97] transition-transform"
          style={{ background: 'rgba(0,0,0,0.06)' }}
        >
          <ChevronLeft size={20} />
        </button>
        <span className="text-[18px] font-bold text-foreground">
          Videos
        </span>
        <div className="flex-1" />
      </div>

      {/* Full videos experience — reuses everything */}
      <Suspense fallback={<VideosFeedSkeleton />}>
        <VideosTabContent embedded />
      </Suspense>
      <ScrollToTopGlass />
    </PageRoot>
  );
}
