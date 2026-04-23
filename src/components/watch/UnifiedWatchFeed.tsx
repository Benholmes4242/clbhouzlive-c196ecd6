import { useState, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { MapPin, MoreHorizontal } from 'lucide-react';
import { useWatchCategoryChips } from './hooks/useWatchCategoryChips';
import TrendingThisWeek from './TrendingThisWeek';
import LatestVideosRail from './LatestVideosRail';
import WatchAutoplay from './WatchAutoplay';
import WatchGrid from './WatchGrid';
import WatchSectionHeader from './WatchSectionHeader';
// WatchSectionDivider removed in Phase 4 — kicker + h1 already separate
// sections clearly; dividers fragmented the surface visually.
import WatchMoreCategoriesSheet from './WatchMoreCategoriesSheet';
import ContinueWatchingRail from './ContinueWatchingRail';
import LongPressTipBanner from './LongPressTipBanner';
import { WatchActionsProvider } from './context/WatchActionsContext';
import { useWatchFeed } from './hooks/useWatchFeed';
import { Skeleton } from '@/components/ui/skeleton';
import ScrollToTopGlass from '@/components/common/ScrollToTopGlass';
import { WatchOfTheWeekHero } from './proshop/WatchOfTheWeekHero';
import { CourseAnchoredRail } from './proshop/CourseAnchoredRail';
import { MostLovedRail } from './proshop/MostLovedRail';
import { WatchMoodChips } from './proshop/WatchMoodChips';
import { useWatchMood } from './proshop/hooks/useWatchMood';

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
        background: isActive ? 'rgba(247,147,30,0.12)' : 'transparent',
        // Phase 5c: 1px in both states (was 1px active / 1.5px inactive).
        // Eliminates the 0.5px width shift on toggle.
        border: isActive ? '1px solid hsl(var(--primary))' : '1px solid hsl(var(--border))',
        color: isActive ? '#c97a10' : 'hsl(var(--muted-foreground))',
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
  const navigate = useNavigate();
  const userId = session?.user?.id;
  const [activeTag, setActiveTag] = useState<string>('all');
  const [moreSheetOpen, setMoreSheetOpen] = useState(false);
  const gridRef = useRef<HTMLDivElement>(null);
  const { mood, setMood } = useWatchMood();

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
    <WatchActionsProvider>
    <div className="min-h-screen" style={{ background: 'hsl(var(--background))' }}>
      <LongPressTipBanner />

      {/* ── Pro Shop: mood chips at the top of the Watch tab ── */}
      <WatchMoodChips active={mood} onChange={setMood} />

      {/* ── Pro Shop: Watch of the Week editorial hero ── */}
      <WatchOfTheWeekHero />

      <ContinueWatchingRail userId={userId} />

      {/* ── Pro Shop: Course-anchored rail (top played course) ── */}
      <CourseAnchoredRail />

      {/* ── Section 1: Trending clips rail ── */}
      <TrendingThisWeek />

      {/* ── Section 2: Latest videos — hero + horizontal rail ── */}
      <LatestVideosRail />

      {/* ── Pro Shop: Most loved this week ── */}
      <MostLovedRail />

      {/* ── Section 3: More clips — chips + grid ──
          Phase 5g: explicit 24px paddingBottom guarantees clearance from
          the bottom nav even when PageRoot is bypassed. */}
      <div style={{ paddingBottom: 24 }}>
        <WatchSectionHeader
          eyebrow="Browse"
          title="More to explore"
          sub="Filter by category"
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
    </WatchActionsProvider>
  );
}
