/**
 * ProfileStatStrip — variant-aware stat row for ProfileHubSheet.
 *
 *  full    → 4 columns: Rounds 30D · Low Index · Reviews · Courses
 *  limited → 2 columns centred: Reviews · Courses
 *
 * Edge-to-edge hairline rules top + bottom. Null fields render em-dash
 * (never silently disappear).
 */
import React from 'react';

const INK = '#0F172A';
const INK_FAINT = '#94A3B8';
const HAIRLINE = 'rgba(15,23,42,0.08)';
const HAIRLINE_SOFT = 'rgba(15,23,42,0.06)';

interface Cell {
  label: string;
  value: number | string | null;
  format?: (n: number) => string;
}

export interface ProfileStatStripProps {
  variant: 'full' | 'limited';
  rounds30d: number | null;
  /** Renamed from "Low Index" → labelled "BEST INDEX" in the strip. */
  lowIndex: number | null;
  reviewsCount: number | null;
  coursesPlayed: number | null;
}

function renderValue(value: number | string | null, format?: (n: number) => string): string {
  if (value === null || value === undefined) return '—';
  if (typeof value === 'number') return format ? format(value) : String(value);
  return value;
}

export function ProfileStatStrip({
  variant,
  rounds30d,
  lowIndex,
  reviewsCount,
  coursesPlayed,
}: ProfileStatStripProps) {
  const cells: Cell[] = variant === 'full'
    ? [
        { label: 'ROUNDS 30D', value: rounds30d },
        { label: 'BEST INDEX', value: lowIndex, format: (n) => (n < 0 ? `+${Math.abs(n).toFixed(1)}` : n.toFixed(1)) },
        { label: 'REVIEWS', value: reviewsCount },
        { label: 'COURSES', value: coursesPlayed },
      ]
    : [
        { label: 'REVIEWS', value: reviewsCount },
        { label: 'COURSES', value: coursesPlayed },
      ];

  return (
    <div
      style={{
        padding: '14px 8px',
        background: '#FFFFFF',
        border: `0.5px solid ${HAIRLINE}`,
        borderRadius: 14,
        display: 'grid',
        gridTemplateColumns: `repeat(${cells.length}, 1fr)`,
        justifyItems: 'stretch',
      }}
    >
      {cells.map((cell, i) => {
        const isNull = cell.value === null || cell.value === undefined;
        return (
          <div
            key={cell.label}
            style={{
              textAlign: 'center',
              borderRight: i < cells.length - 1 ? `0.5px solid ${HAIRLINE_SOFT}` : 'none',
            }}
          >
            <div
              style={{
                fontSize: 20,
                fontWeight: 700,
                color: isNull ? INK_FAINT : INK,
                lineHeight: 1.1,
                fontVariantNumeric: 'tabular-nums',
                fontFeatureSettings: '"kern" 1, "liga" 1',
              }}
            >
              {renderValue(cell.value, cell.format)}
            </div>
            <div
              style={{
                fontSize: 9.5,
                fontWeight: 700,
                color: INK_FAINT,
                letterSpacing: '0.10em',
                textTransform: 'uppercase' as const,
                marginTop: 6,
              }}
            >
              {cell.label}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default ProfileStatStrip;
