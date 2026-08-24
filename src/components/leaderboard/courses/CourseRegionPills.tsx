import React from 'react';
import { Globe } from 'lucide-react';
import CountryFlag from '@/components/ui/country-flag';
import { A } from '@/features/courses/components/holes/analytical/tokens';

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
        gap: 16,
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
              padding: '4px 2px',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: isActive ? 700 : 500,
              // Active was #0F172A - near-canvas slate, invisible on the dark
              // ground. Ink/mute from the analytical ramp instead.
              color: isActive ? A.INK : A.MUTE,
              letterSpacing: isActive ? '-0.01em' : 0,
              transition: 'color 0.15s ease',
              minHeight: 34,
            }}
            className="active:scale-[0.96]"
          >
            {region.country ? (
              <CountryFlag country={region.country} size="sm" className="shrink-0" />
            ) : region.id === 'row' ? (
              <span style={{ fontSize: 14 }}>🌏</span>
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