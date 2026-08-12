import { FilterChips } from '@/components/ui/FilterChips';

const FONT_FAMILY =
  'SF Pro, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

const CHIPS = [
  { id: 'all', label: 'All' },
  { id: 'following', label: 'Following' },
  { id: 'your_courses', label: 'Your courses' },
  { id: 'bucket_list', label: 'Bucket list' },
  { id: 'trending', label: 'Trending' },
] as const;

interface Props {
  active: string;
  onChange: (id: string) => void;
}

export function HubChipBar({ active, onChange }: Props) {
  return (
    <div
      style={{
        position: 'sticky',
        marginTop: 24,
        top: 'var(--sat, 0px)',
        zIndex: 10,
        background: 'rgba(248,250,252,0.72)',
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
        padding: '8px 0 10px',
        fontFamily: FONT_FAMILY,
      }}
    >
      <FilterChips
        options={CHIPS}
        value={active}
        onChange={onChange}
        ariaLabel="Watch hub filter"
      />
    </div>
  );
}

export default HubChipBar;
