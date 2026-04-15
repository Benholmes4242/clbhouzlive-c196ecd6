import React from 'react';

export type FeedFilter = 'all' | 'trending' | 'new_for_you';

interface FeedFilterChipsProps {
  activeFilter: FeedFilter;
  onFilterChange: (filter: FeedFilter) => void;
}

const TABS = [
  { id: 'all',         label: 'All' },
  { id: 'trending',    label: 'Trending' },
  { id: 'new_for_you', label: 'New for You' },
];

const FeedFilterChips: React.FC<FeedFilterChipsProps> = ({ activeFilter, onFilterChange }) => {
  return (
    <div style={{ display: 'flex', borderBottom: '0.5px solid rgba(15,23,42,0.07)', background: '#ffffff' }}>
      {TABS.map(t => (
        <button
          key={t.id}
          onClick={() => onFilterChange(t.id as FeedFilter)}
          style={{
            flex: 1,
            padding: '10px 4px 9px',
            fontSize: '13px',
            fontWeight: activeFilter === t.id ? 800 : 500,
            color: activeFilter === t.id ? '#0F172A' : '#94A3B8',
            background: 'transparent',
            border: 'none',
            borderBottom: activeFilter === t.id ? '2px solid #F7931E' : '2px solid transparent',
            cursor: 'pointer',
            whiteSpace: 'nowrap' as const,
            textAlign: 'center' as const,
          }}
          className="active:opacity-70 transition-opacity"
        >
          {t.label}
        </button>
      ))}
    </div>
  );
};

export default FeedFilterChips;
