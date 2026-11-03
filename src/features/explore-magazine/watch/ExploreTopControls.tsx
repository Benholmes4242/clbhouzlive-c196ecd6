/** HB2: one search/filter state feeds the in-flow row and IslandDock copy.
 * WatchFeed retains query/results/filter ownership; docking never adds reads.
 */
import { useEffect, useRef, useState } from 'react';
import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RailChips, type RailChipOption } from '@/components/ui/RailChips';
import { IslandDock } from '@/features/chrome-v2/IslandDock';

export function ExploreTopControls({ query, onQuery, options, value, onChange, ariaLabel, placeholder }: {
  query: string; onQuery: (value: string) => void; options: RailChipOption[];
  value: string; onChange: (value: string) => void; ariaLabel: string; placeholder: string; sticky?: boolean;
}) {
  const [opened, setOpened] = useState(() => !!query);
  const searchOpen = opened || !!query;
  const rowRef = useRef<HTMLDivElement>(null);
  const dockRowRef = useRef<HTMLDivElement>(null);
  const inPlaceInput = useRef<HTMLInputElement>(null);
  const dockInput = useRef<HTMLInputElement>(null);
  const focusDock = useRef(false);
  useEffect(() => {
    if (searchOpen) (focusDock.current ? dockInput : inPlaceInput).current?.focus();
  }, [searchOpen]);
  // ER1: the outer row owns overflow (including search); reveal only a clipped selection.
  useEffect(() => {
    for (const row of [rowRef.current, dockRowRef.current]) {
      const selected = row?.querySelector<HTMLElement>('[aria-selected="true"]');
      if (!row || !selected || searchOpen) continue;
      const bounds = row.getBoundingClientRect();
      const chip = selected.getBoundingClientRect();
      const delta = chip.right > bounds.right - 16 ? chip.right - bounds.right + 16
        : chip.left < bounds.left + 16 ? chip.left - bounds.left - 16 : 0;
      if (delta && typeof row.scrollBy === 'function') row.scrollBy({ left: delta, behavior: 'smooth' });
    }
  }, [value, searchOpen]);
  const renderRow = (docked: boolean, shown = true) => (
    <div ref={docked ? dockRowRef : rowRef} className="explore-top-controls" data-explore-controls={docked ? 'docked' : 'in-place'}>
      {searchOpen ? <>
        <label className="explore-search-field">
          <Search aria-hidden size={15} strokeWidth={2.4} />
          <input ref={docked ? dockInput : inPlaceInput} tabIndex={shown ? undefined : -1} type="search" value={query} onChange={(e) => onQuery(e.target.value)} placeholder={placeholder} aria-label={placeholder} />
        </label>
        <Button tabIndex={shown ? undefined : -1} variant="ghost" className="explore-search-cancel" onClick={() => { onQuery(''); setOpened(false); }}>Cancel</Button>
      </> : <>
        <Button tabIndex={shown ? undefined : -1} variant="ghost" size="icon" className="explore-search-button" aria-label={placeholder} onClick={() => { focusDock.current = docked; setOpened(true); }}>
          <Search aria-hidden size={15} strokeWidth={2.4} />
        </Button>
        <RailChips options={options} value={value} onChange={onChange} ariaLabel={ariaLabel} size="tile" />
      </>}
    </div>
  );
  return <>{renderRow(false)}<IslandDock anchorRef={rowRef}>{(shown) => renderRow(true, shown)}</IslandDock></>;
}