/** EXPLORE_TOP_1/2 (tile chips): local search chrome only; WatchFeed retains query/results/filter ownership. */
import { useEffect, useRef, useState } from 'react';
import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RailChips, type RailChipOption } from '@/components/ui/RailChips';

export function ExploreTopControls({ query, onQuery, options, value, onChange, ariaLabel, placeholder, sticky }: {
  query: string; onQuery: (value: string) => void; options: RailChipOption[];
  value: string; onChange: (value: string) => void; ariaLabel: string; placeholder: string; sticky: boolean;
}) {
  const [opened, setOpened] = useState(() => !!query);
  const searchOpen = opened || !!query;
  const rowRef = useRef<HTMLDivElement>(null);
  // ER1: the outer row owns overflow (including search); reveal only a clipped selection.
  useEffect(() => {
    const row = rowRef.current;
    const selected = row?.querySelector<HTMLElement>('[aria-selected="true"]');
    if (!row || !selected || searchOpen) return;
    const bounds = row.getBoundingClientRect();
    const chip = selected.getBoundingClientRect();
    const delta = chip.right > bounds.right - 16 ? chip.right - bounds.right + 16
      : chip.left < bounds.left + 16 ? chip.left - bounds.left - 16 : 0;
    if (delta && typeof row.scrollBy === 'function') row.scrollBy({ left: delta, behavior: 'smooth' });
  }, [value, searchOpen]);
  return (
    <div ref={rowRef} className={`explore-top-controls${sticky ? ' explore-top-sticky' : ''}`}>
      {searchOpen ? <>
        <label className="explore-search-field">
          <Search aria-hidden size={15} strokeWidth={2.4} />
          <input autoFocus type="search" value={query} onChange={(e) => onQuery(e.target.value)} placeholder={placeholder} aria-label={placeholder} />
        </label>
        <Button variant="ghost" className="explore-search-cancel" onClick={() => { onQuery(''); setOpened(false); }}>Cancel</Button>
      </> : <>
        <Button variant="ghost" size="icon" className="explore-search-button" aria-label={placeholder} onClick={() => setOpened(true)}>
          <Search aria-hidden size={15} strokeWidth={2.4} />
        </Button>
        <RailChips options={options} value={value} onChange={onChange} ariaLabel={ariaLabel} size="tile" />
      </>}
    </div>
  );
}