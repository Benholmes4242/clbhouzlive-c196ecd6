import { useState, useRef, useMemo } from 'react';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { MapPin, MoreHorizontal } from 'lucide-react';
import { useWatchCategoryChips } from './hooks/useWatchCategoryChips';
import TrendingThisWeek from './TrendingThisWeek';
import LatestVideosRail from './LatestVideosRail';
import WatchAutoplay from './WatchAutoplay';
import WatchGrid from './WatchGrid';
import WatchSectionHeader from './WatchSectionHeader';
import WatchSectionDivider from './WatchSectionDivider';
import WatchMoreCategoriesSheet from './WatchMoreCategoriesSheet';
import { useWatchFeed } from './hooks/useWatchFeed';
import { Skeleton } from '@/components/ui/skeleton';
import ScrollToTopGlass from '@/components/common/ScrollToTopGlass';

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
        minHeight: 36,
        padding: '0 16px',
        fontSize: 13,
        fontWeight: 600,
        borderRadius: 20,
        background: isActive ? '#F7931E' : 'transparent',
        border: isActive ? '1px solid #F7931E' : '1.5px solid hsl(var(--border))',
        color: isActive ? '#ffffff' : 'hsl(var(--muted-foreground))',
      }}
    >
      {icon}
      {label}
    </button>
  );
}

interface UnifiedWatchFeedProps {
  embedded?: boolean;
}

// Categories surfaced as primary chips (always visible alongside For you / Nearby).
// Anything else from `useWatchCategoryChips` falls into the "More" overflow sheet.
const PRIMARY_CATEGORY_IDS = ['review'];

export default function UnifiedWatchFeed({ embedded = false }: UnifiedWatchFeedProps) {
  const { session } = useSupabaseSession();
  const userId = session?.user?.id;
  const [activeTag, setActiveTag] = useState<string>('all');
  const [moreSheetOpen, setMoreSheetOpen] = useState(false);
  const gridRef = useRef<HTMLDivElement>(null);

  const { data: categoryChips = [], isLoading: chipsLoading } = useWatchCategoryChips();

  const { primaryChips, overflowChips } = useMemo(() => {
    const primary = categoryChips.filter((c) => PRIMARY_CATEGORY_IDS.includes(c.id));
    const overflow = categoryChips.filter((c) => !PRIMARY_CATEGORY_IDS.includes(c.id));
    return { primaryChips: primary, overflowChips: overflow };
  }, [categoryChips]);

  // Active tag may live in the overflow sheet — surface its label on the More chip.
  const activeOverflowChip = overflowChips.find((c) => c.id === activeTag);

  const activeCategory = activeTag === 'all' || activeTag === 'near' ? undefined : activeTag;
  const activeFilter = activeTag === 'near' ? ('near' as const) : ('trending' as const);

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
    <div className="min-h-screen" style={{ background: '#F8FAFC' }}>
      {/* ── Section 1: Trending clips rail ── */}
      <TrendingThisWeek />

      <WatchSectionDivider />

      {/* ── Section 2: Latest videos — hero + horizontal rail ── */}
      <LatestVideosRail />

      <WatchSectionDivider />

      {/* ── Section 3: More clips — chips + grid ── */}
      <div>
        <WatchSectionHeader
          eyebrow="Shorts"
          title="More clips"
          paddingTop={4}
        />

        {/* Chip bar — 3 primary + More overflow */}
        <div
          className="flex gap-2 overflow-x-auto"
          style={{
            scrollbarWidth: 'none',
            padding: '0 16px 12px',
          }}
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
            ? [0].map((i) => (
                <Skeleton
                  key={i}
                  className="shrink-0 w-[78px] h-[36px] rounded-full"
                />
              ))
            : primaryChips.map((chip) => (
                <ChipButton
                  key={chip.id}
                  label={chip.label}
                  isActive={activeTag === chip.id}
                  onTap={() => setActiveTag(chip.id)}
                />
              ))}
          {overflowChips.length > 0 && (
            <ChipButton
              label={activeOverflowChip ? activeOverflowChip.label : 'More'}
              icon={<MoreHorizontal size={14} />}
              isActive={!!activeOverflowChip}
              onTap={() => setMoreSheetOpen(true)}
            />
          )}
        </div>

        <WatchAutoplay
          posts={posts}
          gridRef={gridRef as React.RefObject<HTMLDivElement>}
        />
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

      <WatchMoreCategoriesSheet
        open={moreSheetOpen}
        onOpenChange={setMoreSheetOpen}
        categories={overflowChips}
        activeTag={activeTag}
        onSelect={(id) => setActiveTag(id)}
      />

      <ScrollToTopGlass />
    </div>
  );
}
