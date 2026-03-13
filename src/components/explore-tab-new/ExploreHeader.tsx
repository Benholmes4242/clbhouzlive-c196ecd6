import { memo } from 'react';
import { Search } from 'lucide-react';

interface RegionChip {
  slug: string | null;
  title: string;
}

interface ExploreHeaderProps {
  activeRegion: string | null;
  regions: RegionChip[];
  regionsLoading: boolean;
  onRegionChange: (slug: string | null) => void;
  onOpenSearch: () => void;
  embedded?: boolean;
}

function ExploreHeaderInner({
  activeRegion,
  regions,
  regionsLoading,
  onRegionChange,
  onOpenSearch,
  embedded = false,
}: ExploreHeaderProps) {
  return (
    <div
      className="sticky top-[55px] z-30 bg-background/95 backdrop-blur-xl border-b border-border/50"
      style={{
        paddingTop: embedded
          ? '24px'
          : 'max(env(safe-area-inset-top, 0px), 47px)',
      }}
    >
      {/* Search bar */}
      <div className="px-4 pb-2">
        <button
          type="button"
          onClick={onOpenSearch}
          aria-label="Search courses and videos"
          className="w-full flex items-center gap-2 h-10 px-3 rounded-xl bg-muted text-muted-foreground text-sm"
        >
          <Search className="h-4 w-4 shrink-0" />
          <span>Search courses & videos...</span>
        </button>
      </div>

      {/* Region chips */}
      <div role="tablist" aria-label="Filter by region" className="flex gap-2 px-4 pb-3 overflow-x-auto scrollbar-hide">
        {regions.map((region) => {
          const isActive = activeRegion === region.slug;
          return (
            <button
              key={region.slug ?? '__all'}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => onRegionChange(region.slug)}
              className="shrink-0 min-h-[36px] px-4 rounded-full text-sm font-semibold transition-colors"
              style={{
                backgroundColor: isActive ? 'hsl(var(--tab-sub-active))' : 'hsl(var(--muted))',
                color: isActive ? 'hsl(var(--tab-sub-active-foreground))' : 'hsl(var(--muted-foreground))',
              }}
            >
              {region.title}
            </button>
          );
        })}

        {regionsLoading && (
          <>
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="shrink-0 min-h-[36px] w-20 rounded-full bg-muted animate-pulse"
              />
            ))}
          </>
        )}
      </div>
    </div>
  );
}

export const ExploreHeader = memo(ExploreHeaderInner);
