import { memo, useState } from 'react';
import { EXPLORE_MOODS, type ExploreMoodId } from './hooks/useExploreMood';
import RegionSheet from './RegionSheet';
import { useExploreRegionChips } from './hooks/useExploreRegionChips';

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
        background: '#F8FAFC',
        borderBottom: '0.5px solid rgba(15,23,42,0.06)',
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
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="shrink-0 transition-colors active:scale-[0.97] flex items-center"
              style={{
                height: 30,
                padding: '0 11px',
                fontSize: 12,
                fontWeight: 600,
                borderRadius: 15,
                background: isActive ? 'rgba(247,147,30,0.12)' : 'transparent',
                border: isActive ? '1px solid #F7931E' : '1.5px solid hsl(var(--border))',
                color: isActive ? '#c97a10' : 'hsl(var(--muted-foreground))',
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
            background: regionPillActive ? 'rgba(247,147,30,0.12)' : 'transparent',
            border: regionPillActive ? '1px solid #F7931E' : '1.5px solid hsl(var(--border))',
            color: regionPillActive ? '#c97a10' : 'hsl(var(--muted-foreground))',
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
          background: 'linear-gradient(to right, rgba(248,250,252,0) 0%, #F8FAFC 100%)',
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
