import React from 'react';
import { Globe } from 'lucide-react';
import CountryFlag from '@/components/ui/country-flag';
import { A } from '@/features/courses/components/holes/analytical/tokens';
import { Button } from '@/components/ui/button';

export type QuickRegion = 'global' | 'gb-i' | 'usa' | 'europe' | 'row';

interface CourseRegionPillsProps {
  value: QuickRegion;
  onChange: (region: QuickRegion) => void;
  appearance?: 'default' | 'archive';
}

const REGION_OPTIONS = [
  { id: 'global' as const, label: 'Global', country: null },
  { id: 'gb-i' as const, label: 'GB&I', country: 'Britain & Ireland' },
  { id: 'usa' as const, label: 'USA', country: 'USA' },
  { id: 'europe' as const, label: 'Europe', country: 'Continental Europe' },
  { id: 'row' as const, label: 'Rest of World', country: null },
];

export const CourseRegionPills: React.FC<CourseRegionPillsProps> = ({ value, onChange, appearance = 'default' }) => {
  if (appearance === 'archive') {
    // NO FLAGS HERE. These five are golf regions, not countries, and the rule is
    // already written down in src/features/courses/_shared/courseRankLabels.ts:
    // a Union Flag on GB&I misstates courses in the Republic of Ireland, and an
    // EU flag on Europe misstates Switzerland, Norway and Turkey. Global and Rest
    // of World were also showing two different globes in one row. The glyphs
    // cost 115px — more than the 'Rest of World' label itself — and were the
    // whole reason the row wrapped onto a second line. Measured at 12.5px/700:
    // with flags the row is 392px and wraps at 393, 375 and 320; without them it
    // is 277px and fits at all three.
    return (
      <div className="archive-region-row" role="group" aria-label="Course region">
        {REGION_OPTIONS.map((region) => (
          <Button key={region.id} type="button" variant="ghost"
            className="archive-control archive-region-choice" aria-pressed={value === region.id}
            onClick={() => onChange(region.id)} style={{ color: value === region.id ? A.INK : A.DIM }}>
            <span>{region.label}</span>
          </Button>
        ))}
      </div>
    );
  }
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