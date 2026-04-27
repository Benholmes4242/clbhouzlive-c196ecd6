/**
 * VerdictPill — shared score+tier display for review surfaces.
 * Used by SuccessScreen (full); compact variant reserved for future Post-step adoption.
 */

import React from 'react';
import { Star } from 'lucide-react';
import { getScoreTier } from '@/utils/getScoreTier';

interface VerdictPillProps {
  rating: number;
  compact?: boolean;
  className?: string;
}

export function VerdictPill({ rating, compact = false, className = '' }: VerdictPillProps) {
  const tier = getScoreTier(rating);
  const formatted = rating === 10 ? '10' : rating.toFixed(1);

  const scoreSize = compact ? 16 : 22;
  const slashSize = compact ? 11 : 13;
  const tierSize = compact ? 11 : 13;
  const starSize = compact ? 12 : 16;

  return (
    <div
      className={className}
      style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}
    >
      <Star
        style={{
          width: starSize,
          height: starSize,
          color: '#F7931E',
          fill: '#F7931E',
          marginRight: 2,
          position: 'relative',
          top: 1,
          flexShrink: 0,
        }}
      />
      <span
        style={{
          fontSize: scoreSize,
          fontWeight: 900,
          color: '#0F172A',
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {formatted}
      </span>
      <span style={{ fontSize: slashSize, color: '#94a3b8' }}>/10</span>
      <span
        style={{
          fontSize: tierSize,
          fontWeight: 700,
          color: '#0F172A',
          marginLeft: 4,
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
        }}
      >
        {tier.label}
      </span>
    </div>
  );
}
