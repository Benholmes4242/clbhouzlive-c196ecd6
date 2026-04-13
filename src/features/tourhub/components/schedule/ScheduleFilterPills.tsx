/**
 * ScheduleFilterPills - Flat underline tab bar matching dispatch style
 */

import { TOUR_COLORS } from '../../constants/colors';

export type ScheduleFilterType = 'all' | 'upcoming' | 'live' | 'completed';

interface FilterOption {
  value: ScheduleFilterType;
  label: string;
  hasLiveIndicator?: boolean;
}

interface ScheduleFilterPillsProps {
  activeFilter: ScheduleFilterType;
  onFilterChange: (filter: ScheduleFilterType) => void;
  counts: {
    all: number;
    live: number;
    upcoming: number;
    completed: number;
  };
}

export function ScheduleFilterPills({ 
  activeFilter, 
  onFilterChange, 
  counts 
}: ScheduleFilterPillsProps) {
  const options: FilterOption[] = [
    { value: 'all', label: 'All' },
    { value: 'upcoming', label: 'Upcoming' },
    { value: 'live', label: 'Live', hasLiveIndicator: true },
    { value: 'completed', label: 'Completed' },
  ];

  return (
    <div
      style={{ display: 'flex', borderBottom: '1px solid rgba(15,23,42,0.1)' }}
      role="tablist"
      aria-label="Filter tournaments"
    >
      {options.map((option) => {
        const isActive = activeFilter === option.value;
        const isLive = option.value === 'live';

        return (
          <button
            key={option.value}
            role="tab"
            aria-selected={isActive}
            onClick={() => onFilterChange(option.value)}
            style={{
              flex: 1,
              padding: '11px 0',
              fontSize: '12px',
              fontWeight: isActive ? 800 : 500,
              color: isActive ? '#0F172A' : '#94A3B8',
              background: 'transparent',
              border: 'none',
              borderBottom: isActive
                ? `2px solid ${isLive ? '#22C55E' : '#F7931E'}`
                : '2px solid transparent',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '5px',
              transition: 'all 0.15s',
            }}
            className="active:scale-[0.97] transition-transform"
          >
            {option.hasLiveIndicator && counts.live > 0 && (
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: isActive ? '#22C55E' : '#94A3B8', display: 'inline-block', flexShrink: 0 }} />
            )}
            {option.label}
            {option.hasLiveIndicator && counts.live > 0 && (
              <span style={{ fontSize: '10px', color: isActive ? '#22C55E' : '#94A3B8', fontWeight: 700 }}>
                {counts.live}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
