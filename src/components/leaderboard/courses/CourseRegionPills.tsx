import React from 'react';
import { Globe } from 'lucide-react';
import CountryFlag from '@/components/ui/country-flag';

export type QuickRegion = 'global' | 'gb-i' | 'usa' | 'europe' | 'row';

interface CourseRegionPillsProps {
  value: QuickRegion;
  onChange: (region: QuickRegion) => void;
}

const REGION_OPTIONS = [
  { id: 'global' as const, label: 'Global', country: null },
  { id: 'gb-i' as const, label: 'GB&I', country: 'Britain & Ireland' },
  { id: 'usa' as const, label: 'USA', country: 'USA' },
  { id: 'europe' as const, label: 'Europe', country: 'Continental Europe' },
  { id: 'row' as const, label: 'Rest of World', country: null },
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
            {region.country ? (
              <CountryFlag country={region.country} size="sm" className="shrink-0" />
            ) : (
              <Globe className="h-4 w-4 shrink-0" />
            )}
            <span>{region.label}</span>
          </button>
        );
      })}
    </div>
  );
};