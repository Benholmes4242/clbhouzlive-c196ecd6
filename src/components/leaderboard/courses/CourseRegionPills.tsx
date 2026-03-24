import React from 'react';

export type QuickRegion = 'global' | 'gb-i' | 'usa' | 'europe';

interface CourseRegionPillsProps {
  value: QuickRegion;
  onChange: (region: QuickRegion) => void;
}

const REGION_OPTIONS = [
  { id: 'global' as const, label: 'Global', flag: '🌍' },
  { id: 'gb-i' as const, label: 'GB&I', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿' },
  { id: 'usa' as const, label: 'USA', flag: '🇺🇸' },
  { id: 'europe' as const, label: 'Europe', flag: '🇪🇺' },
];

export const CourseRegionPills: React.FC<CourseRegionPillsProps> = ({ value, onChange }) => {
  return (
    <div
      style={{
        display: 'flex',
        gap: 8,
        overflowX: 'auto',
        scrollbarWidth: 'none',
      }}
    >
      {REGION_OPTIONS.map((region) => {
        const isActive = value === region.id;
        return (
          <button
            key={region.id}
            onClick={() => onChange(region.id)}
            style={{
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '7px 14px',
              borderRadius: 10,
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: 600,
              border: isActive
                ? '1.5px solid hsl(var(--foreground))'
                : '1.5px solid hsl(var(--border))',
              background: isActive ? 'hsl(var(--foreground))' : 'transparent',
              color: isActive ? 'white' : 'hsl(var(--muted-foreground))',
              transition: 'all 0.15s ease',
            }}
            className="active:scale-[0.96]"
          >
            <span style={{ fontSize: 14 }}>{region.flag}</span>
            <span>{region.label}</span>
          </button>
        );
      })}
    </div>
  );
};
