/**
 * AvgStrip - Top-10 Average micro-stat strip
 * 
 * Features:
 * - SVG bar chart icon
 * - Neutral background (no green tint)
 * - Only visible when average > 0
 */

import { memo } from 'react';
import { BarChartIcon } from './StatCategoryIcons';

interface AvgStripProps {
  average: string;
  unit: string;
}

export const AvgStrip = memo(function AvgStrip({ average, unit }: AvgStripProps) {
  return (
    <div 
      className="flex items-center justify-center"
      style={{ 
        padding: '10px 16px',
        background: 'rgba(0,0,0,0.02)',
        borderTop: '1px solid rgba(0,0,0,0.05)',
        borderBottom: '1px solid rgba(0,0,0,0.05)',
        gap: '8px',
      }}
    >
      <BarChartIcon size={13} className="flex-shrink-0" style={{ color: 'rgba(11,18,32,0.42)' } as React.CSSProperties} />
      <p 
        className="m-0"
        style={{ fontSize: '13px', color: 'rgba(11,18,32,0.42)' }}
      >
        Top 10 average:{' '}
        <span style={{ fontWeight: 700, color: 'rgba(11,18,32,0.65)' }}>
          {average} {unit}
        </span>
      </p>
    </div>
  );
});
