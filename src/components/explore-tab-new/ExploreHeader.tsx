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
      className="sticky top-0 z-30 bg-background"
      style={{
        paddingTop: embedded
          ? '24px'
          : 'max(env(safe-area-inset-top, 0px), 12px)',
      }}
    >
      {/* Search bar */}
      <div className="px-3 pb-2">
        <button
          type="button"
          onClick={onOpenSearch}
          className="w-full flex items-center gap-2 h-10 px-3 rounded-xl bg-muted text-muted-foreground text-sm"
        >
          <Search className="h-4 w-4 shrink-0" />
          <span>Search courses & videos...</span>
        </button>
      </div>

      {/* Region chips */}
      <div className="flex gap-2 px-3 pb-3 overflow-x-auto scrollbar-hide">
        {regions.map((region) => {
          const isActive = activeRegion === region.slug;
          return (
            <button
              key={region.slug ?? '__all'}
              type="button"
              onClick={() => onRegionChange(region.slug)}
              className={`shrink-0 min-h-[36px] px-4 rounded-full text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-foreground text-background'
                  : 'bg-muted text-muted-foreground'
              }`}
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
