import { useState, useRef, Suspense, lazy } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { MapPin, ChevronRight } from 'lucide-react';
import { useWatchCategoryChips } from './hooks/useWatchCategoryChips';
import TrendingThisWeek from './TrendingThisWeek';
import WatchAutoplay from './WatchAutoplay';
import WatchGrid from './WatchGrid';
import { useWatchFeed } from './hooks/useWatchFeed';
import { VideosFeedSkeleton } from '@/components/videos-tab/VideosFeedSkeleton';
import { Skeleton } from '@/components/ui/skeleton';

const VideosTabContent = lazy(() => import('@/components/videos-tab/VideosTabContent'));

interface ChipButtonProps {
  label: string;
  icon?: React.ReactNode;
  isActive: boolean;
  onTap: () => void;
}

function ChipButton({ label, icon, isActive, onTap }: ChipButtonProps) {
  return (
    <button
      onClick={onTap}
      className="shrink-0 flex items-center gap-1.5 active:scale-[0.97] transition-transform"
      style={{
        minHeight: 34,
        padding: '0 14px',
        fontSize: 13,
        fontWeight: 600,
        borderRadius: 20,
        background: isActive ? 'rgba(247,147,30,0.12)' : 'transparent',
        border: isActive ? '1px solid #F7931E' : '1.5px solid hsl(var(--border))',
        color: isActive ? '#c97a10' : 'hsl(var(--muted-foreground))',
      }}
    >
      {icon}
      {label}
    </button>
  );
}

function SectionHeader({
  title,
  onSeeAll,
}: {
  title: string;
  onSeeAll?: () => void;
}) {
  return (
    <div className="flex items-center justify-between px-4 pb-2" style={{ paddingTop: 18 }}>
      <span className="text-[15px] font-semibold text-foreground">
        {title}
      </span>
      {onSeeAll && (
        <button
          onClick={onSeeAll}
          className="flex items-center gap-1 active:scale-[0.97] transition-transform"
          style={{ fontSize: 13, fontWeight: 600, color: '#F7931E' }}
        >
          See all
          <ChevronRight size={14} strokeWidth={2.5} />
        </button>
      )}
    </div>
  );
}

interface UnifiedWatchFeedProps {
  embedded?: boolean;
}

export default function UnifiedWatchFeed({ embedded = false }: UnifiedWatchFeedProps) {
  const navigate = useNavigate();
  const { session } = useSupabaseSession();
  const userId = session?.user?.id;
  const [activeTag, setActiveTag] = useState<string>('all');
  const gridRef = useRef<HTMLDivElement>(null);

  const { data: categoryChips = [], isLoading: chipsLoading } = useWatchCategoryChips();

  const activeCategory = (activeTag === 'all' || activeTag === 'near') ? undefined : activeTag;
  const activeFilter = activeTag === 'near' ? 'near' as const : 'trending' as const;

  const {
    posts,
    isLoading,
    isError,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    refetch,
  } = useWatchFeed({
    userId,
    filter: activeFilter,
    category: activeCategory,
  });

  return (
    <div className="bg-background min-h-screen">
      {/* ── Chip filter row ── */}
      <div style={{ padding: '12px 0 4px' }}>
        <div
          className="flex gap-2 overflow-x-auto px-4"
          style={{ scrollbarWidth: 'none' }}
        >
          <ChipButton
            label="For you"
            isActive={activeTag === 'all'}
            onTap={() => setActiveTag('all')}
          />
          <ChipButton
            label="Nearby"
            icon={<MapPin size={13} />}
            isActive={activeTag === 'near'}
            onTap={() => setActiveTag('near')}
          />
          {chipsLoading
            ? [0, 1, 2].map(i => <Skeleton key={i} className="shrink-0 w-[72px] h-[34px] rounded-full" />)
            : categoryChips.map(chip => (
                <ChipButton
                  key={chip.id}
                  label={chip.label}
                  isActive={activeTag === chip.id}
                  onTap={() => setActiveTag(chip.id)}
                />
              ))
          }
        </div>
      </div>

      {/* ── Section 1: Trending clips strip ── */}
      <div>
        <TrendingThisWeek />
      </div>

      {/* ── Section 2: Latest videos (first 3 cards) ── */}
      <div>
        <SectionHeader title="Latest videos" onSeeAll={() => navigate('/watch/videos')} />
        <Suspense fallback={<VideosFeedSkeleton />}>
          <VideosTabContent embedded={embedded} hideStickyHeader limitCards={3} />
        </Suspense>
      </div>

      {/* ── Section 3: More clips — 2-col grid ── */}
      <div>
        <SectionHeader title="More clips" onSeeAll={() => navigate('/watch/clips')} />
        <WatchAutoplay posts={posts} gridRef={gridRef as React.RefObject<HTMLDivElement>} />
        <WatchGrid
          posts={posts}
          isLoading={isLoading}
          isError={isError}
          hasNextPage={hasNextPage}
          isFetchingNextPage={isFetchingNextPage}
          fetchNextPage={fetchNextPage}
          refetch={refetch}
          gridRef={gridRef as React.RefObject<HTMLDivElement>}
          userId={userId}
        />
      </div>
    </div>
  );
}
