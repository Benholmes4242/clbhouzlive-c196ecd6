import { memo, useState } from 'react';
import { EXPLORE_MOODS, type ExploreMoodId } from '@/components/explore-tab-new/hooks/useExploreMood';
import RegionSheet from '@/components/explore-tab-new/RegionSheet';
import { useExploreRegionChips } from '@/components/explore-tab-new/hooks/useExploreRegionChips';
import { scrollPageToTop } from '@/lib/getScrollParent';
import { A } from '@/features/courses/components/holes/analytical/tokens';

interface DiscoverExploreShellRowProps {
  activeMood: ExploreMoodId;
  onMoodChange: (id: ExploreMoodId) => void;
  activeRegion: string | null;
  onRegionChange: (slug: string | null) => void;
}

/**
 * Row 2 of the Discover shell when main=explore. Canonical chip styling
 * (matches WatchMoodChips). Mood chips first, then a single trailing
 * 🌍 Region pill that opens RegionSheet for the full region picker.
 */
function DiscoverExploreShellRowInner({
  activeMood,
  onMoodChange,
  activeRegion,
  onRegionChange,
}: DiscoverExploreShellRowProps) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const { regions } = useExploreRegionChips();

  const activeRegionTitle = activeRegion
    ? regions.find((r) => r.slug === activeRegion)?.title ?? 'Region'
    : 'Region';
  const regionPillActive = activeRegion !== null;

  return (
    <div
      className="relative"
      style={{
        background: A.CANVAS,
        borderBottom: '0.5px solid rgba(255,255,255,0.06)',
      }}
    >
      <div
        role="tablist"
        aria-label="Filter Explore"
        className="flex gap-1.5 overflow-x-auto scrollbar-hide"
        style={{ padding: '8.5px 28px 8.5px 16px' }}
      >
        {EXPLORE_MOODS.map((m) => {
          const isActive = activeMood === m.id;
          return (
            <button
              key={m.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => {
                onMoodChange(m.id);
                scrollPageToTop('smooth');
              }}
              className="shrink-0 transition-colors active:scale-[0.97] flex items-center"
              style={{
                height: 30,
                padding: '0 11px',
                fontSize: 12,
                fontWeight: 600,
                borderRadius: 15,
                background: isActive ? 'rgba(255,255,255,0.10)' : 'transparent',
                border: isActive ? '1px solid rgba(255,255,255,0.55)' : '1px solid rgba(255,255,255,0.18)',
                color: isActive ? '#FFFFFF' : 'rgba(255,255,255,0.65)',
                letterSpacing: '-0.01em',
                gap: 5,
                whiteSpace: 'nowrap',
              }}
            >
              <span aria-hidden style={{ fontSize: 13 }}>{m.emoji}</span>
              <span>{m.label}</span>
            </button>
          );
        })}

        {/* Trailing Region pill — opens RegionSheet */}
        <button
          type="button"
          aria-label="Filter by region"
          aria-haspopup="dialog"
          onClick={() => setSheetOpen(true)}
          className="shrink-0 transition-colors active:scale-[0.97] flex items-center"
          style={{
            height: 30,
            padding: '0 11px',
            fontSize: 12,
            fontWeight: 600,
            borderRadius: 15,
            background: regionPillActive ? 'rgba(255,255,255,0.10)' : 'transparent',
            border: regionPillActive ? '1px solid rgba(255,255,255,0.55)' : '1px solid rgba(255,255,255,0.18)',
            color: regionPillActive ? '#FFFFFF' : 'rgba(255,255,255,0.65)',
            letterSpacing: '-0.01em',
            gap: 5,
            whiteSpace: 'nowrap',
          }}
        >
          <span aria-hidden style={{ fontSize: 13 }}>🌍</span>
          <span>{activeRegionTitle}</span>
          <span aria-hidden style={{ opacity: 0.6, marginLeft: 1 }}>›</span>
        </button>
      </div>

      <div
        aria-hidden
        className="pointer-events-none absolute top-0 right-0 h-full"
        style={{
          width: 28,
          background: `linear-gradient(to right, rgba(21,23,31,0) 0%, ${A.CANVAS} 100%)`,
        }}
      />

      <RegionSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        activeRegion={activeRegion}
        onSelect={onRegionChange}
      />
    </div>
  );
}

export const DiscoverExploreShellRow = memo(DiscoverExploreShellRowInner);
export default DiscoverExploreShellRow;
