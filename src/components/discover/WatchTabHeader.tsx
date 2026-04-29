import { Search } from 'lucide-react';

interface WatchTabHeaderProps {
  onOpenSearch: () => void;
}

/**
 * Sticky search-bar header for the Watch tab in Discover.
 * Mirrors the LoopHeader (Friends) and ExploreHeader (Explore) minimal pattern
 * so all three Discover sub-tabs share the same scroll behavior.
 *
 * Sticky anchor: top: 45px (sits below the 44px Discover top tab strip).
 */
export function WatchTabHeader({ onOpenSearch }: WatchTabHeaderProps) {
  return (
    <div
      className="sticky bg-background"
      style={{
        top: '45px',
        zIndex: 20,
        borderBottom: '1px solid hsl(var(--border) / 0.12)',
      }}
    >
      <div className="px-4 pt-3 pb-3">
        <button
          type="button"
          onClick={onOpenSearch}
          className="flex items-center gap-2 w-full h-11 px-3 rounded-2xl bg-muted text-muted-foreground text-[15px]"
          aria-label="Search videos and clips"
        >
          <Search className="h-4 w-4 shrink-0" />
          <span>Search videos & clips…</span>
        </button>
      </div>
    </div>
  );
}
