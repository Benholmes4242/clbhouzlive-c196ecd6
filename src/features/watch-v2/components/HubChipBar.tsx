const FONT_FAMILY =
  'Geist, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

const CHIPS: { id: string; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'following', label: 'Following' },
  { id: 'your_courses', label: 'Your courses' },
  { id: 'bucket_list', label: 'Bucket list' },
  { id: 'trending', label: 'Trending' },
];

interface Props {
  active: string;
  onChange: (id: string) => void;
}

export function HubChipBar({ active, onChange }: Props) {
  return (
    <div
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 10,
        background: '#F8FAFC',
        padding: 0,
        borderBottom: '1px solid rgba(0,0,0,0.07)',
        fontFamily: FONT_FAMILY,
      }}
    >
      <div
        className="hide-scrollbar"
        style={{
          display: 'flex',
          gap: 8,
          overflowX: 'auto',
          padding: '0 16px',
          scrollbarWidth: 'none',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {CHIPS.map((c) => {
          const isActive = c.id === active;
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => onChange(c.id)}
              style={{
                flexShrink: 0,
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: 12.5,
                padding: '7px 14px',
                borderRadius: 999,
                background: isActive ? '#0F172A' : '#fff',
                color: isActive ? '#fff' : '#0F172A',
                border: isActive
                  ? 'none'
                  : '1px solid rgba(0,0,0,0.07)',
                fontFamily: FONT_FAMILY,
              }}
            >
              {c.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default HubChipBar;
