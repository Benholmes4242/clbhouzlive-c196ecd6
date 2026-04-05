import { useState, Suspense, lazy } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import WatchGridSkeleton from './WatchGridSkeleton';
import { VideosFeedSkeleton } from '@/components/videos-tab/VideosFeedSkeleton';
import { WatchInnerToggle, type WatchInnerMode } from './WatchInnerToggle';

const WatchPageContent = lazy(() => import('./WatchPageContent'));
const VideosTabContent = lazy(() => import('@/components/videos-tab/VideosTabContent'));

interface WatchTabContentProps {
  embedded?: boolean;
}

export default function WatchTabContent({ embedded = false }: WatchTabContentProps) {
  const [mode, setMode] = useState<WatchInnerMode>('clips');
  const [activeTag, setActiveTag] = useState<string>('all');

  return (
    <div className="bg-background min-h-screen">
      <WatchInnerToggle
        mode={mode}
        onModeChange={setMode}
        activeTag={activeTag}
        onTagChange={setActiveTag}
      />
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={mode}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15, ease: 'easeOut' }}
        >
          {mode === 'clips' ? (
            <Suspense fallback={<WatchGridSkeleton />}>
              <WatchPageContent embedded={embedded} showShotOfWeek showSortFilter={false} activeTag={activeTag} />
            </Suspense>
          ) : (
            <Suspense fallback={<VideosFeedSkeleton />}>
              <VideosTabContent embedded={embedded} />
            </Suspense>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
