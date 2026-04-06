import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import React, { Suspense, lazy } from 'react';
import { VideosFeedSkeleton } from '@/components/videos-tab/VideosFeedSkeleton';

const VideosTabContent = lazy(() => import('@/components/videos-tab/VideosTabContent'));

// Remove navigation body classes synchronously before first paint.
// This prevents the body.route-clubhouse .light * CSS cascade from
// resolving --foreground to the wrong value during the first render.
if (typeof document !== 'undefined') {
  document.body.classList.remove('route-clubhouse', 'route-hub');
}

export default function VideosSubpage() {
  const navigate = useNavigate();

  return (
    <div
      className="bg-background min-h-screen light"
      data-page-scope="videos"
      style={{
        '--background': '210 40% 98%',
        '--foreground': '210 13% 18%',
        '--card': '0 0% 100%',
        '--muted-foreground': '215.4 16.3% 46.9%',
      } as React.CSSProperties}
    >
      {/* Back header */}
      <div className="flex items-center gap-3 px-4" style={{ position: 'sticky', top: 0, zIndex: 29, paddingTop: 12, paddingBottom: 8, background: 'hsl(var(--background))', borderBottom: '1px solid hsl(var(--border) / 0.12)' }}>
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
        <VideosTabContent embedded hideStickyHeader />
      </Suspense>
    </div>
  );
}
