/**
 * AvgStrip - Top-10 Average benchmark callout
 * 
 * Features:
 * - Category accent color background
 * - Monospace stat value
 * - Informational callout styling (not disabled-looking)
 */

import { memo } from 'react';
import { BarChartIcon } from './StatCategoryIcons';
import type { CategoryId } from './StatCategoryIcons';
import { CATEGORY_ACCENT_COLORS } from './constants';

interface AvgStripProps {
  average: string;
  unit: string;
  accentColor: CategoryId;
}

export const AvgStrip = memo(function AvgStrip({ average, unit, accentColor }: AvgStripProps) {
  const accent = CATEGORY_ACCENT_COLORS[accentColor];

  return (
    <div 
      className="flex items-center justify-center mx-5"
      style={{ 
        padding: '10px 14px',
        background: accent.bgLight,
        borderRadius: '10px',
        margin: '12px 20px',
        gap: '6px',
        transition: 'background 0.3s ease',
      }}
    >
      <BarChartIcon 
        size={14} 
        className="flex-shrink-0" 
        style={{ color: accent.textMuted, transition: 'color 0.3s ease' }} 
      />
      <p 
        className="m-0"
        style={{ fontSize: '12px', fontWeight: 500, color: 'rgba(0, 0, 0, 0.4)' }}
      >
        Top 10 average:
      </p>
      <span 
        style={{ 
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: '13px', 
          fontWeight: 700, 
          color: accent.primary,
          transition: 'color 0.3s ease',
        }}
      >
        {average} {unit}
      </span>
    </div>
  );
});
