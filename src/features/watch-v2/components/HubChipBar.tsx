import { FilterChips } from '@/components/ui/FilterChips';
import { analyticsEvents } from '@/utils/analyticsEvents';

const FONT_FAMILY =
  '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';

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

/**
 * A NEW NAME, DELIBERATELY. These chips ask about AUDIENCE (all / following /
 * your courses / bucket list / trending). The retired
 * community_media_filter_selected asked about MEDIA TYPE on a control that no
 * longer exists, so it must never be inherited here — the two are not the same
 * question and one history must not be read as the other's.
 */
export function HubChipBar({ active, onChange }: Props) {
  const select = (id: string) => {
    if (id !== active) analyticsEvents.track('watch_audience_filter_changed', { filter: id, from: active });
    onChange(id);
  };

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
        onChange={select}
        ariaLabel="Watch hub filter"
      />
    </div>
  );
}

export default HubChipBar;
